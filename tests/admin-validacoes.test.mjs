import test from 'node:test';
import assert from 'node:assert/strict';
import { ETIQUETAS_PONTO, formularioDoPonto, lerPontoAdmin, validarPonto, validarUsuario } from '../src/admin-validacoes.ts';

const base = { ...formularioDoPonto(), name: 'Praça do Ferreira', address: 'Rua Floriano Peixoto', city: 'Fortaleza/CE' };

test('Ponto válido com coordenadas em vírgula e linhas repetidas', () => {
  const resultado = validarPonto({ ...base, latitude: '-3,7275', longitude: '-38.5275', lines: '026, 051;026\n072', tags: ['Seguro', 'Seguro'] });
  assert.ok('dados' in resultado);
  assert.equal(resultado.dados.latitude, -3.7275);
  assert.deepEqual(resultado.dados.lines, ['026', '051', '072']);
  assert.deepEqual(resultado.dados.tags, ['Seguro']);
  assert.equal(resultado.dados.published, false);
});

test('Ponto sem coordenadas é aceito; coordenada pela metade não', () => {
  const semCoordenadas = validarPonto(base);
  assert.ok('dados' in semCoordenadas && semCoordenadas.dados.latitude === null && semCoordenadas.dados.longitude === null);
  assert.ok('erro' in validarPonto({ ...base, latitude: '-3.7' }));
});

test('Ponto rejeita dados inválidos', () => {
  assert.ok('erro' in validarPonto({ ...base, name: 'A' }));
  assert.ok('erro' in validarPonto({ ...base, latitude: '91', longitude: '0' }));
  assert.ok('erro' in validarPonto({ ...base, latitude: 'abc', longitude: '0' }));
  assert.ok('erro' in validarPonto({ ...base, lines: 'X'.repeat(21) }));
});

test('Leitura tolerante de ponto cadastrado no Console', () => {
  const ponto = lerPontoAdmin('p1', { name: ' Ponto ', location: { latitude: -3, longitude: -38 }, lines: ['1', 2, '1'], published: true });
  assert.equal(ponto.name, 'Ponto');
  assert.equal(ponto.latitude, -3);
  assert.deepEqual(ponto.lines, ['1']);
  assert.equal(ponto.condition, 'unknown');
  assert.equal(lerPontoAdmin('p2', {}).name, '(sem nome)');
  assert.equal(formularioDoPonto(lerPontoAdmin('p2', {})).name, '');
});

test('Etiquetas do ponto incluem as usadas pelos filtros', () => {
  const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const etiquetas = ETIQUETAS_PONTO.map(normalizar);
  assert.ok(etiquetas.includes('acessivel'));
  assert.ok(etiquetas.includes('com cobertura'));
});

test('Valida nova conta', () => {
  assert.equal(validarUsuario({ nome: 'Ana', email: 'ana@teste.com', senha: '12345678' }), null);
  assert.ok(validarUsuario({ nome: 'Ana', email: 'ana', senha: '12345678' }));
  assert.ok(validarUsuario({ nome: 'Ana', email: 'ana@teste.com', senha: '123' }));
});
