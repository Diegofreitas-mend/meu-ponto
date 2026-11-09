import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCode, consumeChallenge, COOLDOWN_MS, createChallenge, digest, EXPIRY_MS, MAX_ATTEMPTS, nextRate, normalizeEmail, WINDOW_MS } from '../recovery.mjs';

const secret = 'test-only-secret-not-used-in-production';
const now = 1000000;
function fixture() {
  const generated = createChallenge(secret);
  const data = {
    uid: 'test-user', email: 'test@example.com', emailKey: 'email-hash',
    codeHash: generated.codeHash, attempts: 0, used: false,
    expiresAt: { toMillis: () => now + EXPIRY_MS },
  };
  return { ...generated, data };
}

test('código criptográfico tem 6 dígitos, id opaco e hash vinculado ao desafio', () => {
  const a = createChallenge(secret);
  const b = createChallenge(secret);
  assert.match(a.code, /^\d{6}$/);
  assert.match(a.id, /^[a-f0-9]{48}$/);
  assert.notEqual(a.id, b.id);
  assert.equal(a.codeHash, digest(secret, `${a.id}:${a.code}`));
  assert.notEqual(a.codeHash, digest(secret, `${b.id}:${a.code}`));
});

test('email é normalizado; entradas inválidas são rejeitadas', () => {
  assert.equal(normalizeEmail(' TEST@Example.com '), 'test@example.com');
  for (const value of [null, {}, 'sem-arroba', 'a @example.com', `${'a'.repeat(255)}@example.com`]) assert.equal(normalizeEmail(value), null);
});

test('limites exigem 60s entre envios e até 3 por hora, inclusive no instante limite', () => {
  let state = nextRate(null, now, 3, COOLDOWN_MS);
  assert.equal(nextRate(state, now + COOLDOWN_MS - 1, 3, COOLDOWN_MS), null);
  state = nextRate(state, now + COOLDOWN_MS, 3, COOLDOWN_MS);
  state = nextRate(state, now + 2 * COOLDOWN_MS, 3, COOLDOWN_MS);
  assert.equal(state.count, 3);
  assert.equal(nextRate(state, now + 3 * COOLDOWN_MS, 3, COOLDOWN_MS), null);
  assert.equal(nextRate(state, now + WINDOW_MS, 3, COOLDOWN_MS).count, 1);
});

test('código expirado, inexistente, consumido ou conta fictícia nunca é aceito', () => {
  const f = fixture();
  assert.equal(checkCode(f.data, secret, f.id, f.code, now).accepted, true);
  for (const data of [null, { ...f.data, used: true }, { ...f.data, uid: null }, { ...f.data, attempts: MAX_ATTEMPTS }]) {
    assert.equal(checkCode(data, secret, f.id, f.code, now).accepted, false);
  }
  assert.equal(checkCode(f.data, secret, f.id, f.code, now + EXPIRY_MS).accepted, false);
  assert.equal(checkCode(f.data, 'wrong-secret', f.id, f.code, now).accepted, false);
});

// Armazenamento de teste: simula commits atômicos, sem conectar ao banco real.
function store(f) {
  const documents = new Map([['challenge', { ...f.data }], ['limit', { latestChallenge: f.id }]]);
  let queue = Promise.resolve();
  const db = { runTransaction(callback) {
    const job = queue.then(async () => {
      const writes = [];
      const result = await callback({
        get: async ref => ({ data: () => documents.get(ref) }),
        update: (ref, changes) => writes.push([ref, changes]),
      });
      for (const [ref, changes] of writes) documents.set(ref, { ...documents.get(ref), ...changes });
      return result;
    });
    queue = job.catch(() => {});
    return job;
  } };
  const consume = code => consumeChallenge(db, 'challenge', () => 'limit', secret, f.id, code, now);
  return { documents, consume };
}

test('tentativas erradas são persistidas e bloqueiam a sexta, mesmo com código correto', async () => {
  const f = fixture(); const s = store(f);
  const wrong = f.code === '111111' ? '222222' : '111111';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    assert.equal(await s.consume(wrong), null);
    assert.equal(s.documents.get('challenge').attempts, attempt);
  }
  assert.equal(await s.consume(f.code), null);
});

test('duas confirmações simultâneas só podem consumir o código uma vez', async () => {
  const f = fixture(); const s = store(f);
  const results = await Promise.all([s.consume(f.code), s.consume(f.code)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(s.documents.get('challenge').codeHash, null);
  assert.equal(await s.consume(f.code), null);
});

test('o reenvio invalida o desafio anterior', async () => {
  const f = fixture(); const s = store(f);
  s.documents.set('limit', { latestChallenge: 'new-challenge' });
  assert.equal(await s.consume(f.code), null);
});
