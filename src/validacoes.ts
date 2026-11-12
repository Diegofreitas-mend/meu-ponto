import type { BusStop } from './tipos';

// ----- FORMULARIOS DE LOGIN E CADASTRO -----
export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/user-not-found': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/wrong-password': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/email-already-in-use': 'Não foi possível criar a conta com esse e-mail. Tente entrar ou recuperar sua senha.',
    'auth/weak-password': 'A senha não atende à política de segurança. Escolha uma senha mais forte.',
    'auth/password-does-not-meet-requirements': 'A senha não atende à política de segurança do projeto. Use uma senha mais forte.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
    'auth/network-request-failed': 'Sem conexão com o serviço. Verifique sua internet e tente novamente.',
    'auth/user-disabled': 'Não foi possível acessar esta conta. Entre em contato com o suporte.',
    'auth/operation-not-allowed': 'O acesso por e-mail e senha ainda não está habilitado no Firebase.',
    'auth/configuration-not-found': 'Ative o Firebase Authentication e o provedor E-mail/senha no Console.',
    'auth/invalid-api-key': 'A configuração do Firebase não é válida. Confira o arquivo .env.local.',
  };
  return messages[code] ?? 'Não foi possível concluir. Tente novamente em instantes.';
}

export function validateAuthForm({ email, password, name, confirmation }: {
  email: string; password: string; name?: string; confirmation?: string;
}): string | null {
  if (name !== undefined && (name.trim().length < 2 || name.trim().length > 80)) return 'Informe seu nome com 2 a 80 caracteres.';
  if (!isValidEmail(email)) return 'Informe um e-mail válido.';
  if (!password) return 'Informe sua senha.';
  if (confirmation !== undefined) {
    if (password.length < 8) return 'Crie uma senha com pelo menos 8 caracteres.';
    if (password !== confirmation) return 'As senhas não são iguais.';
  }
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254;
}

// ----- DOCUMENTOS RECEBIDOS DO FIRESTORE -----

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Campo inválido no Firestore: ${field}.`);
  return value.trim();
}
function strings(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error('Lista inválida no Firestore.');
  return [...new Set(value as string[])];
}
function coordinates(id: string, value: Record<string, unknown>): { latitude: number | null; longitude: number | null } {
  const geo = value.location && typeof value.location === 'object' ? (value.location as Record<string, unknown>) : null;
  const rawLat = value.latitude ?? geo?.latitude ?? null;
  const rawLng = value.longitude ?? geo?.longitude ?? null;
  if (rawLat === null && rawLng === null) return { latitude: null, longitude: null };
  if (
    typeof rawLat !== 'number' || !Number.isFinite(rawLat) || rawLat < -90 || rawLat > 90 ||
    typeof rawLng !== 'number' || !Number.isFinite(rawLng) || rawLng < -180 || rawLng > 180
  ) {
    throw new Error(`Coordenadas inválidas no ponto ${id}.`);
  }
  return { latitude: rawLat, longitude: rawLng };
}

export function parseStopDocument(id: string, value: Record<string, unknown>): BusStop {
  const rating = value.rating ?? null;
  const reviews = value.reviewCount ?? 0;
  if ((rating !== null && (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5)) || typeof reviews !== 'number' || !Number.isSafeInteger(reviews) || reviews < 0 || (reviews === 0) !== (rating === null)) {
    throw new Error(`Nota ou quantidade de avaliações inválida no ponto ${id}.`);
  }
  if (value.condition !== undefined && !['unknown', 'good'].includes(String(value.condition))) throw new Error(`Condição inválida no ponto ${id}.`);
  const { latitude, longitude } = coordinates(id, value);
  const rawAlerts = value.alerts ?? [];
  if (!Array.isArray(rawAlerts)) throw new Error(`Alertas inválidos no ponto ${id}.`);
  const alerts = rawAlerts.map((item: unknown, index) => {
    if (!item || typeof item !== 'object') throw new Error(`Alerta inválido no ponto ${id}.`);
    const alert = item as Record<string, unknown>;
    const createdAt = text(alert.createdAt, 'alerts.createdAt');
    if (!Number.isFinite(Date.parse(createdAt))) throw new Error(`Data inválida no ponto ${id}.`);
    return { id: `${id}-${index}`, title: text(alert.title, 'alerts.title'), message: text(alert.message, 'alerts.message'), createdAt };
  });
  return { id, name: text(value.name, 'name'), address: text(value.address, 'address'), city: text(value.city, 'city'),
    latitude, longitude, rating, reviews, tags: strings(value.tags), lines: strings(value.lines), alerts,
    status: alerts.length ? 'alert' : value.condition === 'good' ? 'good' : 'unknown' };
}
