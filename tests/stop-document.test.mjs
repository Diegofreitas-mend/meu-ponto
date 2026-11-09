import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStopDocument } from '../src/validacoes.ts';

const record = { name: 'Ponto de teste', address: 'Rua de teste', city: 'Cidade de teste' };
test('Documento mínimo não inventa nota ou boa condição', () => {
  const stop = parseStopDocument('test', record);
  assert.equal(stop.rating, null);
  assert.equal(stop.reviews, 0);
  assert.equal(stop.status, 'unknown');
  assert.deepEqual(stop.alerts, []);
});
test('Converte avaliações e alertas cadastrados', () => {
  const stop = parseStopDocument('test', { ...record, rating: 4.5, reviewCount: 2, condition: 'good', tags: ['Acessível', 'Acessível'], alerts: [{ title: 'Relato', message: 'Mensagem', createdAt: '2026-11-09T12:00:00Z' }] });
  assert.equal(stop.rating, 4.5);
  assert.equal(stop.reviews, 2);
  assert.equal(stop.status, 'alert');
  assert.deepEqual(stop.tags, ['Acessível']);
});
test('Rejeita documentos incompletos ou inconsistentes', () => {
  assert.throws(() => parseStopDocument('test', {}));
  assert.throws(() => parseStopDocument('test', { ...record, rating: 5 }));
  assert.throws(() => parseStopDocument('test', { ...record, rating: 6, reviewCount: 1 }));
  assert.throws(() => parseStopDocument('test', { ...record, tags: [123] }));
  assert.throws(() => parseStopDocument('test', { ...record, alerts: [{ title: 'Relato', message: 'Mensagem', createdAt: 'invalid' }] }));
});
