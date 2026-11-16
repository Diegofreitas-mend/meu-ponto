import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const estado = { uid: 'usuario-a', consultas: [], falharInicio: false };
globalThis.__avaliacoesTeste = estado;

const modulos = {
  '@/firebase': `
    export const getDatabase = () => ({});
    export const getSessionAuth = () => ({ currentUser: { uid: globalThis.__avaliacoesTeste.uid } });
  `,
  'firebase/firestore': `
    export const collection = (_, ...partes) => partes.join('/');
    export const doc = collection;
    export const getDoc = async () => ({ exists: () => false });
    export const serverTimestamp = () => null;
    export const setDoc = async () => {};
    export function onSnapshot(caminho, atualizar, falhar) {
      const estado = globalThis.__avaliacoesTeste;
      if (estado.falharInicio) throw new Error('Falha na configuração');
      const consulta = { caminho, atualizar, falhar, cancelamentos: 0 };
      estado.consultas.push(consulta);
      return () => { consulta.cancelamentos++; };
    }
  `,
};

const loader = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (modulos[specifier]) {
      return { url: `data:text/javascript,${encodeURIComponent(modulos[specifier])}`, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { observarResumoAvaliacoes, observarAlertasAvaliacoes } = await import('../src/avaliacoes.ts');
loader.deregister();

function snapshot(dados) {
  const resultado = {
    leituras: 0,
    forEach: callback => dados.forEach((item, index) => callback({
      id: String(index),
      data: () => { resultado.leituras++; return item; },
    })),
  };
  return resultado;
}

test('Cards, detalhes e alertas compartilham uma leitura e liberam a conexão no último consumidor', () => {
  const antes = estado.consultas.length;
  const resumos = [];
  const alertas = [];
  const falhar = erro => assert.fail(erro.message);
  const pararCard = observarResumoAvaliacoes('ponto-1', valor => resumos.push(valor), falhar);
  const pararDetalhes = observarResumoAvaliacoes('ponto-1', valor => resumos.push(valor), falhar);
  const pararAlertas = observarAlertasAvaliacoes('ponto-1', valor => alertas.push(valor), falhar);
  assert.equal(estado.consultas.length - antes, 1);
  const consulta = estado.consultas.at(-1);
  const documentos = snapshot([{ rating: 2, tags: ['Sem cobertura'] }, { rating: 4 }]);
  consulta.atualizar(documentos);
  assert.equal(documentos.leituras, 2);
  assert.deepEqual(resumos, [{ media: 3, quantidade: 2 }, { media: 3, quantidade: 2 }]);
  assert.equal(alertas[0][0].title, 'Falta de cobertura');
  pararCard();
  pararCard();
  pararDetalhes();
  assert.equal(consulta.cancelamentos, 0);
  pararAlertas();
  assert.equal(consulta.cancelamentos, 1);
  consulta.atualizar(snapshot([{ rating: 5 }]));
  assert.equal(resumos.length, 2);
});

test('Novo consumidor recebe o resultado existente sem outra consulta e nova montagem refaz a leitura', () => {
  const antes = estado.consultas.length;
  const parar = observarResumoAvaliacoes('ponto-2', () => {}, assert.fail);
  const antiga = estado.consultas.at(-1);
  antiga.atualizar(snapshot([{ rating: 5 }]));
  let resumo;
  const pararNovo = observarResumoAvaliacoes('ponto-2', valor => { resumo = valor; }, assert.fail);
  assert.deepEqual(resumo, { media: 5, quantidade: 1 });
  assert.equal(estado.consultas.length - antes, 1);
  parar();
  pararNovo();
  const pararRemontado = observarResumoAvaliacoes('ponto-2', valor => { resumo = valor; }, assert.fail);
  assert.equal(estado.consultas.length - antes, 2);
  antiga.atualizar(snapshot([{ rating: 1 }]));
  assert.equal(resumo.media, 5);
  pararRemontado();
});

test('Permissões e resultados permanecem separados entre usuários', () => {
  const antes = estado.consultas.length;
  let primeiro;
  const pararPrimeiro = observarResumoAvaliacoes('ponto-3', valor => { primeiro = valor; }, assert.fail);
  estado.consultas.at(-1).atualizar(snapshot([{ rating: 4 }]));
  estado.uid = 'usuario-b';
  let segundo;
  let erro;
  const pararSegundo = observarResumoAvaliacoes('ponto-3', valor => { segundo = valor; }, valor => { erro = valor; });
  assert.equal(estado.consultas.length - antes, 2);
  assert.equal(segundo, undefined);
  estado.consultas.at(-1).falhar({ code: 'permission-denied' });
  assert.match(erro.message, /Sem permissão/);
  assert.equal(primeiro.media, 4);
  pararPrimeiro();
  pararSegundo();
  estado.uid = 'usuario-a';
});

test('Falha ao iniciar a conexão permite nova tentativa', () => {
  estado.falharInicio = true;
  assert.throws(() => observarResumoAvaliacoes('ponto-4', () => {}, assert.fail), /configuração/);
  estado.falharInicio = false;
  const parar = observarResumoAvaliacoes('ponto-4', () => {}, assert.fail);
  assert.equal(estado.consultas.at(-1).caminho, 'stops/ponto-4/reviews');
  parar();
});

test('Erro do servidor permite reconectar e a limpeza antiga preserva a consulta nova', () => {
  const antes = estado.consultas.length;
  const pararAntiga = observarResumoAvaliacoes('ponto-5', () => {}, () => {});
  estado.consultas.at(-1).falhar({ code: 'unavailable' });
  const pararNova = observarResumoAvaliacoes('ponto-5', () => {}, assert.fail);
  assert.equal(estado.consultas.length - antes, 2);
  pararAntiga();
  const pararCompartilhada = observarResumoAvaliacoes('ponto-5', () => {}, assert.fail);
  assert.equal(estado.consultas.length - antes, 2);
  pararNova();
  pararCompartilhada();
  assert.equal(estado.consultas.at(-1).cancelamentos, 1);
});
