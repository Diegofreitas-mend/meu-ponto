export type PontoAdmin = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  lines: string[];
  tags: string[];
  published: boolean;
  condition: 'unknown' | 'good';
};

export type FormularioPonto = {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  lines: string;
  tags: string[];
  published: boolean;
  condition: 'unknown' | 'good';
};

export type DadosPonto = Omit<PontoAdmin, 'id'>;

export const ETIQUETAS_PONTO: readonly string[] = ['Acessível', 'Com cobertura', 'Limpo', 'Bem iluminado', 'Bem conservado', 'Seguro'];

const textoLivre = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '');
const listaDeTextos = (valor: unknown) =>
  Array.isArray(valor) ? [...new Set(valor.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))] : [];
const numeroOuNulo = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null);

export function lerPontoAdmin(id: string, dados: Record<string, unknown>): PontoAdmin {
  const geo = dados.location && typeof dados.location === 'object' ? (dados.location as Record<string, unknown>) : null;
  return {
    id,
    name: textoLivre(dados.name) || '(sem nome)',
    address: textoLivre(dados.address),
    city: textoLivre(dados.city),
    latitude: numeroOuNulo(dados.latitude ?? geo?.latitude),
    longitude: numeroOuNulo(dados.longitude ?? geo?.longitude),
    lines: listaDeTextos(dados.lines),
    tags: listaDeTextos(dados.tags),
    published: dados.published === true,
    condition: dados.condition === 'good' ? 'good' : 'unknown',
  };
}

export function formularioDoPonto(ponto?: PontoAdmin): FormularioPonto {
  return {
    name: ponto?.name === '(sem nome)' ? '' : ponto?.name ?? '',
    address: ponto?.address ?? '',
    city: ponto?.city ?? '',
    latitude: ponto?.latitude === null || ponto?.latitude === undefined ? '' : String(ponto.latitude),
    longitude: ponto?.longitude === null || ponto?.longitude === undefined ? '' : String(ponto.longitude),
    lines: ponto?.lines.join(', ') ?? '',
    tags: ponto?.tags ?? [],
    published: ponto?.published ?? false,
    condition: ponto?.condition ?? 'unknown',
  };
}

function lerCoordenada(valor: string): number | null | undefined {
  const texto = valor.trim().replace(',', '.');
  if (!texto) return null;
  if (!/^-?\d+(\.\d+)?$/.test(texto)) return undefined;
  return Number(texto);
}

export function validarPonto(formulario: FormularioPonto): { erro: string } | { dados: DadosPonto } {
  const name = formulario.name.trim();
  const address = formulario.address.trim();
  const city = formulario.city.trim();
  if (name.length < 2 || name.length > 120) return { erro: 'Informe o nome do ponto com 2 a 120 caracteres.' };
  if (address.length < 2 || address.length > 200) return { erro: 'Informe o endereço com 2 a 200 caracteres.' };
  if (city.length < 2 || city.length > 80) return { erro: 'Informe a cidade com 2 a 80 caracteres.' };

  const latitude = lerCoordenada(formulario.latitude);
  const longitude = lerCoordenada(formulario.longitude);
  if (latitude === undefined || longitude === undefined) return { erro: 'Use números nas coordenadas, por exemplo -3.7275.' };
  if ((latitude === null) !== (longitude === null)) return { erro: 'Preencha latitude e longitude, ou deixe as duas vazias.' };
  if (latitude !== null && (latitude < -90 || latitude > 90)) return { erro: 'A latitude deve estar entre -90 e 90.' };
  if (longitude !== null && (longitude < -180 || longitude > 180)) return { erro: 'A longitude deve estar entre -180 e 180.' };

  const lines = [...new Set(formulario.lines.split(/[,;\n]/).map(item => item.trim()).filter(Boolean))];
  if (lines.length > 30) return { erro: 'Informe no máximo 30 linhas.' };
  if (lines.some(item => item.length > 20)) return { erro: 'Cada linha pode ter no máximo 20 caracteres.' };

  const tags = [...new Set(formulario.tags.map(item => item.trim()).filter(Boolean))];
  if (tags.length > 10) return { erro: 'Selecione no máximo 10 etiquetas.' };

  return { dados: { name, address, city, latitude, longitude, lines, tags, published: formulario.published, condition: formulario.condition } };
}

export const ADMINS_INICIAIS: readonly string[] = ['mauroavpaz@gmail.com'];

export function ehAdminInicial(email: string | null | undefined): boolean {
  return !!email && ADMINS_INICIAIS.includes(email.trim().toLowerCase());
}

export type StatusUsuario = 'ativo' | 'bloqueado';
export type UsuarioCadastrado = { uid: string; nome: string; email: string; status: StatusUsuario };

export function lerUsuario(uid: string, dados: Record<string, unknown>): UsuarioCadastrado {
  return {
    uid,
    nome: textoLivre(dados.nome),
    email: textoLivre(dados.email),
    status: dados.status === 'bloqueado' ? 'bloqueado' : 'ativo',
  };
}

export type FormularioUsuario = { nome: string; email: string; senha: string };

export function validarUsuario(formulario: FormularioUsuario): string | null {
  const nome = formulario.nome.trim();
  if (nome.length < 2 || nome.length > 80) return 'Informe o nome com 2 a 80 caracteres.';
  const email = formulario.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return 'Informe um e-mail válido.';
  if (formulario.senha.length < 8) return 'A senha temporária precisa ter pelo menos 8 caracteres.';
  return null;
}
