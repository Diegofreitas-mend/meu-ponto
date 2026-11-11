// Backend: nunca importe este arquivo no app. Chaves de envio ficam no Secret Manager.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { consumeChallenge, COOLDOWN_MS, createChallenge, digest, EXPIRY_MS, nextRate, normalizeEmail, WINDOW_MS } from './recovery.mjs';

initializeApp();
const db = getFirestore();
const auth = getAuth();
const resendKey = defineSecret('RESEND_API_KEY');
const resetSecret = defineSecret('PASSWORD_RESET_SECRET');
const sender = defineString('PASSWORD_RESET_FROM');
const webApiKey = defineString('FIREBASE_WEB_API_KEY');
const options = { region: 'southamerica-east1', maxInstances: 3, concurrency: 20, timeoutSeconds: 30, memory: '256MiB' };
const challenges = db.collection('_passwordResetChallenges');
const limits = db.collection('_passwordResetLimits');
const invalidCode = () => new HttpsError('invalid-argument', 'Código inválido, expirado ou já utilizado. Confira o e-mail ou solicite outro código.');

export const requestPasswordResetCode = onCall({ ...options, secrets: [resendKey, resetSecret] }, async request => {
  const email = normalizeEmail(request.data?.email);
  if (!email) throw new HttpsError('invalid-argument', 'Informe um e-mail válido.');
  const now = Date.now();
  const secret = resetSecret.value();
  const challenge = createChallenge(secret);
  const emailKey = digest(secret, `email:${email}`);
  const emailLimit = limits.doc(`email-${emailKey}`);
  // O IP vem da plataforma, não de um campo controlado pelo cliente.
  const ipLimit = limits.doc(`ip-${digest(secret, `ip:${request.rawRequest.ip ?? 'unknown'}`)}`);

  // As mesmas cotas e a mesma resposta se aplicam a e-mails sem conta.
  await db.runTransaction(async transaction => {
    const [emailSnapshot, ipSnapshot] = await transaction.getAll(emailLimit, ipLimit);
    const emailRate = nextRate(emailSnapshot.data(), now, 3, COOLDOWN_MS);
    const ipRate = nextRate(ipSnapshot.data(), now, 10);
    if (!emailRate || !ipRate) throw new HttpsError('resource-exhausted', 'Aguarde antes de solicitar outro código. São permitidos até 3 envios por hora para o mesmo e-mail.');
    const expiresAt = Timestamp.fromMillis(now + WINDOW_MS);
    transaction.set(emailLimit, { ...emailRate, latestChallenge: challenge.id, expiresAt });
    transaction.set(ipLimit, { ...ipRate, expiresAt });
  });

  let uid = null;
  try {
    const user = await auth.getUserByEmail(email);
    // Contas exclusivamente sociais usam a recuperação do seu próprio provedor.
    if (!user.disabled && user.providerData.some(provider => provider.providerId === 'password')) uid = user.uid;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw new HttpsError('unavailable', 'Não foi possível solicitar o código agora. Tente novamente mais tarde.');
  }
  await challenges.doc(challenge.id).set({
    uid, email, emailKey, codeHash: challenge.codeHash, attempts: 0, used: false,
    expiresAt: Timestamp.fromMillis(now + EXPIRY_MS),
  });

  if (uid) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${resendKey.value()}`, 'Content-Type': 'application/json', 'Idempotency-Key': `password-reset/${challenge.id}` },
        body: JSON.stringify({
          from: sender.value(), to: [email], subject: 'Seu código de recuperação — Meu Ponto',
          text: `Seu código do Meu Ponto é: ${challenge.code}\n\nEle vale por 10 minutos e só pode ser usado uma vez. Digite-o no aplicativo para definir sua nova senha.\n\nNão compartilhe este código. Se você não solicitou a recuperação, ignore este e-mail.`,
          html: `<div style="font-family:Arial,sans-serif;color:#15345b;max-width:480px;padding:24px"><h2>Recupere sua conta</h2><p>Digite este código no Meu Ponto:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb">${challenge.code}</p><p>Ele vale por <b>10 minutos</b> e só pode ser usado uma vez.</p><p>Não compartilhe este código. Se você não solicitou a recuperação, ignore este e-mail.</p></div>`,
        }),
      });
      // Não registre corpo da resposta, e-mail, código nem senha nos logs.
      if (!response.ok) logger.error('Falha no envio de recuperação', { status: response.status });
    } catch { logger.error('Serviço de e-mail indisponível durante recuperação'); }
  }
  return { challengeId: challenge.id, expiresInSeconds: EXPIRY_MS / 1000, resendAfterSeconds: COOLDOWN_MS / 1000 };
});

export const resetPasswordWithCode = onCall({ ...options, secrets: [resetSecret] }, async request => {
  const { challengeId, code, newPassword } = request.data ?? {};
  if (typeof challengeId !== 'string' || !/^[a-f0-9]{48}$/.test(challengeId) || typeof code !== 'string' || !/^\d{6}$/.test(code)) throw invalidCode();
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    throw new HttpsError('invalid-argument', 'Use uma senha com 8 a 128 caracteres.');
  }
  const ref = challenges.doc(challengeId);
  const accepted = await consumeChallenge(db, ref, key => limits.doc(`email-${key}`), resetSecret.value(), challengeId, code, Date.now());
  if (!accepted) throw invalidCode();

  try {
    const user = await auth.getUser(accepted.uid);
    if (user.disabled || user.email?.toLowerCase() !== accepted.email) throw new Error('account-changed');
    // Gera o código interno do Firebase sem enviar link; ele nunca é devolvido ao app.
    // A confirmação REST mantém a política de senha configurada no Firebase Authentication.
    const link = await auth.generatePasswordResetLink(accepted.email);
    const oobCode = new URL(link).searchParams.get('oobCode');
    if (!oobCode) throw new Error('missing-action-code');
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${encodeURIComponent(webApiKey.value())}`, {
      method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode, newPassword }),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      if (/WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET_REQUIREMENTS/.test(failure.error?.message ?? '')) {
        throw new HttpsError('invalid-argument', 'A senha não atende à política de segurança da conta. Use uma senha mais forte e solicite um novo código.', { requestNewCode: true });
      }
      throw new Error('password-reset-rejected');
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Não foi possível concluir a recuperação de senha');
    throw new HttpsError('unavailable', 'Não foi possível confirmar a alteração. Tente entrar com a nova senha; se precisar, solicite outro código.', { requestNewCode: true });
  }
  // Apaga também o e-mail do desafio concluído; TTL remove os demais posteriormente.
  await ref.delete().catch(() => logger.warn('Limpeza de desafio pendente'));
  return { success: true };
});
