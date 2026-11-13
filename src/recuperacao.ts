import { sendPasswordResetEmail } from 'firebase/auth';
import { getSessionAuth } from './firebase';

export async function sendResetLink(email: string) {
  await sendPasswordResetEmail(getSessionAuth(), email.trim());
}

export function recoveryError(error: unknown) {
  const failure = error as { code?: string; message?: string };
  if (failure?.code === 'auth/invalid-email') return 'Informe um e-mail válido.';
  if (failure?.code === 'auth/user-not-found') return 'Não encontramos uma conta com este e-mail.';
  if (failure?.code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  return 'A recuperação está indisponível. Verifique sua conexão e tente novamente mais tarde.';
}