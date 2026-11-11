import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthForm, authErrorMessage } from '../src/validacoes.ts';

test('Cadastro exige nome, e-mail, senha mínima e confirmação', () => {
  const valid = { name: 'Pessoa de teste', email: 'test@example.com', password: 'SenhaLonga123!', confirmation: 'SenhaLonga123!' };
  assert.equal(validateAuthForm(valid), null);
  assert.ok(validateAuthForm({ ...valid, name: ' ' }));
  assert.ok(validateAuthForm({ ...valid, email: 'email-invalido' }));
  assert.ok(validateAuthForm({ ...valid, password: '1234567', confirmation: '1234567' }));
  assert.ok(validateAuthForm({ ...valid, confirmation: 'OutraSenha' }));
});
test('Login preserva senha existente e permite e-mail com espaços externos', () => {
  assert.equal(validateAuthForm({ email: ' test@example.com ', password: '123456' }), null);
  assert.ok(validateAuthForm({ email: 'test@example.com', password: '' }));
});
test('Falhas de login não distinguem usuário inexistente de senha incorreta', () => {
  assert.equal(authErrorMessage({ code: 'auth/user-not-found' }), authErrorMessage({ code: 'auth/wrong-password' }));
  assert.equal(authErrorMessage({ code: 'auth/invalid-credential' }), authErrorMessage({ code: 'auth/wrong-password' }));
  assert.match(authErrorMessage({ code: 'auth/configuration-not-found' }), /Authentication/);
  assert.equal(authErrorMessage(new Error('detalhe interno')), 'Não foi possível concluir. Tente novamente em instantes.');
});
