// Regras de recuperação, independentes do Firebase para facilitar os testes.
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const EXPIRY_MS = 10 * 60 * 1000;
export const COOLDOWN_MS = 60 * 1000;
export const WINDOW_MS = 60 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function digest(secret, value) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function createChallenge(secret) {
  const id = randomBytes(24).toString('hex');
  const code = String(randomInt(100000, 1000000));
  return { id, code, codeHash: digest(secret, `${id}:${code}`) };
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function nextRate(previous, now, limit, cooldown = 0) {
  const active = previous && now < previous.windowStart + WINDOW_MS;
  const state = active ? previous : { windowStart: now, count: 0, lastSentAt: 0 };
  if (state.count >= limit || (state.count > 0 && now - state.lastSentAt < cooldown)) return null;
  return { windowStart: state.windowStart, count: state.count + 1, lastSentAt: now };
}

// A transação grava o resultado antes de responder; lançar erro nela desfaria a tentativa.
export function checkCode(challenge, secret, id, code, now) {
  if (!challenge || challenge.used || now >= challenge.expiresAt.toMillis() || challenge.attempts >= MAX_ATTEMPTS) {
    return { accepted: false, attempts: challenge?.attempts ?? 0 };
  }
  const expected = Buffer.from(challenge.codeHash ?? '', 'hex');
  const received = Buffer.from(digest(secret, `${id}:${code}`), 'hex');
  const matches = expected.length === received.length && timingSafeEqual(expected, received);
  return { accepted: matches && !!challenge.uid, attempts: challenge.attempts + 1 };
}

// Executada em transação: grava tentativas erradas e impede dois usos concorrentes.
export async function consumeChallenge(db, ref, emailLimit, secret, id, code, now) {
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const challenge = snapshot.data();
    if (!challenge) return null;
    const latest = await transaction.get(emailLimit(challenge.emailKey));
    if (latest.data()?.latestChallenge !== id) return null;
    const result = checkCode(challenge, secret, id, code, now);
    if (!result.accepted) {
      transaction.update(ref, { attempts: result.attempts });
      return null;
    }
    transaction.update(ref, { used: true, codeHash: null });
    return { uid: challenge.uid, email: challenge.email };
  });
}
