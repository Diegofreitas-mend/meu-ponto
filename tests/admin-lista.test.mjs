import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMINS_INICIAIS, ehAdminInicial, lerUsuario } from '../src/admin-validacoes.ts';

test('Lista de admins iniciais do app é igual à das regras do Firestore', () => {
  const regras = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
  const trecho = regras.match(/function adminsIniciais\(\)\s*\{\s*return\s*\[([^\]]*)\]/);
  assert.ok(trecho, 'Função adminsIniciais() não encontrada em firebase/firestore.rules.');
  const nasRegras = [...trecho[1].matchAll(/'([^']+)'/g)].map(item => item[1]).sort();
  assert.deepEqual([...ADMINS_INICIAIS].sort(), nasRegras);
  assert.ok(nasRegras.every(email => email === email.toLowerCase()), 'Use e-mails em minúsculas na lista.');
});

test('Reconhece admin inicial sem diferenciar maiúsculas', () => {
  assert.equal(ehAdminInicial(` ${ADMINS_INICIAIS[0].toUpperCase()} `), true);
  assert.equal(ehAdminInicial('outra@pessoa.com'), false);
  assert.equal(ehAdminInicial(null), false);
});

test('Lê perfil de usuário com status padrão ativo', () => {
  assert.deepEqual(lerUsuario('u1', { nome: ' Ana ', email: 'ana@teste.com' }), { uid: 'u1', nome: 'Ana', email: 'ana@teste.com', status: 'ativo' });
  assert.equal(lerUsuario('u2', { status: 'bloqueado' }).status, 'bloqueado');
});
