import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarBusca, textoDoPonto, correspondeBusca, lerLugares, buscarLugares } from '../src/busca.ts';

test('Busca encontra termos em qualquer ordem, sem acentos e inclui linhas', () => {
  const texto = textoDoPonto({ name: 'Praça São José', address: 'Rua das Flores, 20', city: 'Fortaleza', tags: ['Acessível'], lines: ['075'] });
  assert.equal(correspondeBusca(texto, '  flores SÃO 075 '), true);
  assert.equal(correspondeBusca(texto, 'bairro inexistente'), false);
  assert.equal(correspondeBusca(texto, ''), true);
  assert.equal(normalizarBusca('São   José, 20'), 'sao jose 20');
});

test('Endereços preservam a ordem longitude/latitude e descartam coordenadas inválidas', () => {
  const properties = { name: 'Beira Mar', city: 'Fortaleza', state: 'Ceará' };
  const places = lerLugares({ features: [
    { geometry: { coordinates: [-38.5, -3.7] }, properties },
    { geometry: { coordinates: ['-38.5', -3.7] }, properties },
    { geometry: { coordinates: [-38.5, 91] }, properties },
    { geometry: { coordinates: 'invalid' }, properties }, null,
  ] });
  assert.equal(places.length, 1);
  assert.equal(places[0].latitude, -3.7);
  assert.equal(places[0].longitude, -38.5);
  assert.equal(places[0].endereco, 'Fortaleza · Ceará');
  assert.deepEqual(lerLugares({ features: [] }), []);
  assert.throws(() => lerLugares({}));
});

test('Consulta de endereço codifica o texto, repassa cancelamento e informa falha do serviço', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.signal, controller.signal);
    assert.match(decodeURIComponent(url), /Rua & Praça Fortaleza/);
    assert.match(url, /%26/);
    return { ok: true, json: async () => ({ features: [] }) };
  });
  assert.deepEqual(await buscarLugares('Rua & Praça', controller.signal), []);
  globalThis.fetch.mock.mockImplementation(async () => ({ ok: false }));
  await assert.rejects(buscarLugares('Centro', controller.signal), /indisponível/);
});

const feature = (properties) => ({ geometry: { coordinates: [-38.55, -3.74] }, properties });

test('Aceita imóvel sem name e preserva o número retornado pelo serviço', () => {
  const [lugar] = lerLugares({ features: [feature({ street: 'Rua de Teste', housenumber: '732', city: 'Fortaleza' })] });
  assert.equal(lugar.nome, 'Rua de Teste, 732');
  assert.equal(lugar.numero, '732');
  assert.equal(lugar.aviso, undefined);
});

test('Endereço com número não mapeado refaz busca pela rua e avisa a aproximação', async (t) => {
  const consultas = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    const params = new URL(url).searchParams;
    consultas.push(params.get('q'));
    assert.equal(params.get('bbox'), '-38.85,-3.95,-38.35,-3.65');
    return { ok: true, json: async () => ({ features: consultas.length === 1 ? [] : [feature({ name: 'Rua Azevedo Bolão', city: 'Fortaleza' })] }) };
  });
  const lugares = await buscarLugares('Rua Azevedo Bolão 732', new AbortController().signal);
  assert.deepEqual(consultas, ['Rua Azevedo Bolão 732 Fortaleza', 'Rua Azevedo Bolão Fortaleza']);
  assert.equal(lugares.length, 1);
  assert.match(lugares[0].aviso, /Número 732 não localizado/);
});

test('Número exato dispensa fallback e cidade explícita não é duplicada', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(new URL(url).searchParams.get('q'), 'Rua 24 de Maio, 123, Fortaleza');
    return { ok: true, json: async () => ({ features: [feature({ street: 'Rua 24 de Maio', housenumber: '123' })] }) };
  });
  const lugares = await buscarLugares('Rua 24 de Maio, 123, Fortaleza', new AbortController().signal);
  assert.equal(globalThis.fetch.mock.callCount(), 1);
  assert.equal(lugares[0].aviso, undefined);
});

test('Número diferente não é apresentado como imóvel exato e cancelamento impede fallback', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    return { ok: true, json: async () => ({ features: [feature({ street: 'Rua de Teste', housenumber: '999' })] }) };
  });
  await assert.rejects(buscarLugares('Rua de Teste 123', controller.signal), /cancelada/);
  assert.equal(globalThis.fetch.mock.callCount(), 1);
});
