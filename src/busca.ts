import type { BusStop } from './tipos';

export const normalizarBusca = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function textoDoPonto(stop: BusStop) {
  return normalizarBusca(`${stop.name} ${stop.address} ${stop.city} ${stop.tags.join(' ')} ${stop.lines.join(' ')}`);
}

export function correspondeBusca(texto: string, query: string) {
  return normalizarBusca(query).split(' ').filter(Boolean).every(term => texto.includes(term));
}

export type Lugar = { id: string; nome: string; endereco: string; latitude: number; longitude: number; numero?: string; aviso?: string };

export function lerLugares(data: unknown): Lugar[] {
  const features = (data as { features?: unknown[] } | null)?.features;
  if (!Array.isArray(features)) throw new Error('Resposta de endereços inválida.');
  return features.flatMap((feature: unknown, index) => {
    if (!feature || typeof feature !== 'object') return [];
    const { geometry, properties } = feature as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };
    if (!Array.isArray(geometry?.coordinates)) return [];
    const [longitude, latitude] = geometry.coordinates;
    const p = properties;
    if (!p || typeof latitude !== 'number' || typeof longitude !== 'number'
      || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];
    const rua = typeof p.street === 'string' ? p.street.trim() : '';
    const numero = typeof p.housenumber === 'string' ? p.housenumber.trim() : undefined;
    const nome = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : [rua, numero].filter(Boolean).join(', ');
    if (!nome) return [];
    return [{ id: `${p.osm_id ?? index}-${latitude}-${longitude}`, nome,
      ...(numero ? { numero } : {}),
      endereco: [...new Set([p.street, p.district, p.city, p.state].filter((v): v is string => typeof v === 'string'))].join(' · '),
      latitude, longitude }];
  });
}

export async function buscarLugares(query: string, signal: AbortSignal): Promise<Lugar[]> {
  const texto = query.trim().replace(/\s+/g, ' ');
  if (texto.length < 3) return [];
  const semCidade = texto.replace(/[,\s]+fortaleza(?:[\s,/-]+(?:ce|ceará|ceara|brasil))*\s*$/i, '').trim();
  const partes = semCidade.match(/^(.+?)[,\s]+(?:n[º°o.]?\s*)?(\d+[a-z]?)$/i);
  const numero = partes?.[2];

  async function consultar(termo: string) {
    // A cidade no texto ajuda a relevância; o limite geográfico evita ruas homônimas de outros estados.
    if (signal.aborted) throw new Error('Busca cancelada.');
    const busca = /\bfortaleza\b/i.test(termo) ? termo : `${termo} Fortaleza`;
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(busca)}&lat=-3.745&lon=-38.523&bbox=-38.85,-3.95,-38.35,-3.65&limit=5`, { signal });
    if (!response.ok) throw new Error('Serviço de endereços indisponível.');
    return lerLugares(await response.json());
  }

  const resultados = await consultar(texto);
  if (!numero) return resultados;
  const exatos = resultados.filter(item => item.numero?.toLowerCase() === numero.toLowerCase());
  if (exatos.length) return exatos;
  // Muitos números não estão mapeados no OSM. Localize a rua, sem simular a posição do imóvel.
  const ruas = await consultar(partes![1]);
  return ruas.map(item => ({ ...item, aviso: `Número ${numero} não localizado. Resultado aproximado na rua; não indica o imóvel.` }));
}
