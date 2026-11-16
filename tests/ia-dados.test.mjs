import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararAvaliacoes, validarTextoResumo } from '../src/ia-dados.ts';

test('O prompt recebe apenas os campos necessários, com contatos comuns removidos', () => {
  const resultado = prepararAvaliacoes([{
    rating: 2, tags: ['Sujo'], description: 'Contato pessoa@teste.com e (85) 99999-1234',
    userId: 'privado', email: 'outro@teste.com', createdAt: 'data',
  }]);
  assert.deepEqual(resultado, [{ nota: 2, tags: ['Sujo'],
    relato: 'Contato [e-mail removido] e [número removido]' }]);
});

test('Aceita avaliações legadas sem tags, descrição ou data e ignora notas inválidas', () => {
  const resultado = prepararAvaliacoes([{ rating: 3 }, { rating: 0 }, { rating: 6 },
    { rating: 2.5 }, { rating: '4' }, {}]);
  assert.deepEqual(resultado, [{ nota: 3, tags: [], relato: '' }]);
});

test('Limita a quantidade e o tamanho dos dados enviados ao Gemini', () => {
  const resultado = prepararAvaliacoes(Array.from({ length: 60 }, () => ({
    rating: 4, tags: Array(10).fill('a'.repeat(40)), description: 'x'.repeat(1000),
  })));
  assert.equal(resultado.length, 50);
  assert.equal(resultado[0].tags.length, 5);
  assert.equal(resultado[0].tags[0].length, 30);
  assert.equal(resultado[0].relato.length, 500);
});

test('Resumo vazio ou excessivo é rejeitado e a saída ocupa um parágrafo', () => {
  assert.throws(() => validarTextoResumo('  '));
  assert.throws(() => validarTextoResumo('x'.repeat(1501)));
  assert.equal(validarTextoResumo(' Há relatos.\n\n Faltam dados. '), 'Há relatos. Faltam dados.');
});
