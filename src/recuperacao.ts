// O app solicita as operações. Somente as Cloud Functions podem conferir o código.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

export type ResetChallenge = { challengeId: string; expiresInSeconds: number; resendAfterSeconds: number };

export async function requestResetCode(email: string) {
  const call = httpsCallable<{ email: string }, ResetChallenge>(getFunctions(getFirebaseApp(), 'southamerica-east1'), 'requestPasswordResetCode');
  return (await call({ email: email.trim() })).data;
}

export async function resetWithCode(challengeId: string, code: string, newPassword: string) {
  const call = httpsCallable<{ challengeId: string; code: string; newPassword: string }, { success: boolean }>(getFunctions(getFirebaseApp(), 'southamerica-east1'), 'resetPasswordWithCode');
  return (await call({ challengeId, code, newPassword })).data;
}

export function recoveryError(error: unknown) {
  const failure = error as { code?: string; message?: string; details?: { requestNewCode?: boolean } } | null;
  if (failure?.code === 'functions/invalid-argument' || failure?.code === 'functions/resource-exhausted') {
    return failure.message ?? 'Confira os dados e tente novamente.';
  }
  if (failure?.details?.requestNewCode) return 'Não foi possível confirmar a alteração. Tente entrar com a nova senha; se precisar, solicite outro código.';
  return 'A recuperação está indisponível. Verifique sua conexão e tente novamente mais tarde.';
}

export function needsNewCode(error: unknown) {
  return !!(error as { details?: { requestNewCode?: boolean } } | null)?.details?.requestNewCode;
}
