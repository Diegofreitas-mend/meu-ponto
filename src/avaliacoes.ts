
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type QuerySnapshot,
} from 'firebase/firestore';
import { getDatabase, getSessionAuth } from '@/firebase';

type NovaAvaliacao = {
  pontoId: string;
  usuarioId: string;
  nota: number;
  tags: string[];
  descricao: string;
};

export type ResumoAvaliacoes = {
  media: number | null;
  quantidade: number;
};

export type AlertaAvaliacao = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

const problemas: Record<string, string> = {
  'Sujo': 'Problema de limpeza',
  'Sem iluminação': 'Falta de iluminação',
  'Sem cobertura': 'Falta de cobertura',
  'Falta de acessibilidade': 'Problema de acessibilidade',
  'Estrutura danificada': 'Estrutura danificada',
  'Insegurança': 'Relato de insegurança',
  'Assento danificado': 'Assento danificado',
  'Sinalização ruim': 'Problema de sinalização',
};

function referenciaAvaliacao(pontoId: string, usuarioId: string) {
  return doc(getDatabase(), 'stops', pontoId, 'reviews', usuarioId);
}

export async function verificarAvaliacao(
  pontoId: string,
  usuarioId: string,
): Promise<boolean> {
  const resultado = await getDoc(referenciaAvaliacao(pontoId, usuarioId));
  return resultado.exists();
}

export async function enviarAvaliacao(dados: NovaAvaliacao): Promise<void> {
  await setDoc(referenciaAvaliacao(dados.pontoId, dados.usuarioId), {
    stopId: dados.pontoId,
    userId: dados.usuarioId,
    rating: dados.nota,
    tags: dados.tags,
    description: dados.descricao,
    createdAt: serverTimestamp(),
  });
}

type Ouvinte = {
  atualizar: (dados: DadosAvaliacoes) => void;
  falhar: (erro: FirestoreError) => void;
};
type ConsultaAvaliacoes = {
  ouvintes: Set<Ouvinte>;
  dados?: DadosAvaliacoes;
  cancelar: () => void;
};
const consultas = new Map<string, ConsultaAvaliacoes>();
type DadosAvaliacoes = { resumo: ResumoAvaliacoes; alertas: AlertaAvaliacao[] };

function observarAvaliacoes(pontoId: string, atualizar: Ouvinte['atualizar'], falhar: Ouvinte['falhar']) {
  const chave = JSON.stringify([getSessionAuth().currentUser?.uid, pontoId]);
  const ouvinte = { atualizar, falhar };
  let consulta = consultas.get(chave);

  if (!consulta) {
    const nova: ConsultaAvaliacoes = { ouvintes: new Set([ouvinte]), cancelar: () => {} };
    consultas.set(chave, nova);
    try {
      nova.cancelar = onSnapshot(collection(getDatabase(), 'stops', pontoId, 'reviews'), snapshot => {
        if (consultas.get(chave) !== nova) return;
        const dados = processarAvaliacoes(snapshot);
        nova.dados = dados;
        nova.ouvintes.forEach(item => item.atualizar(dados));
      }, erro => {
        if (consultas.get(chave) !== nova) return;
        consultas.delete(chave);
        nova.dados = undefined;
        nova.ouvintes.forEach(item => item.falhar(erro));
      });
    } catch (erro) {
      consultas.delete(chave);
      throw erro;
    }
    consulta = nova;
  } else {
    consulta.ouvintes.add(ouvinte);
    if (consulta.dados) atualizar(consulta.dados);
  }

  const atual = consulta;
  return () => {
    if (!atual.ouvintes.delete(ouvinte)) return;
    if (atual.ouvintes.size === 0) {
      if (consultas.get(chave) === atual) consultas.delete(chave);
      atual.cancelar();
    }
  };
}

export function observarResumoAvaliacoes(
  pontoId: string,
  aoAtualizar: (resumo: ResumoAvaliacoes) => void,
  aoErro: (erro: Error) => void,
): () => void {
  return observarAvaliacoes(
    pontoId,
    dados => aoAtualizar(dados.resumo),
    (erro) => {
      aoErro(
        new Error(
          erro.code === 'permission-denied'
            ? 'Sem permissão para consultar as avaliações deste ponto.'
            : 'Não foi possível consultar as avaliações.',
        ),
      );
    },
  );
}


export function observarAlertasAvaliacoes(
  pontoId: string,
  aoAtualizar: (alertas: AlertaAvaliacao[]) => void,
  aoErro: (erro: Error) => void,
): () => void {
  return observarAvaliacoes(
    pontoId,
    dados => aoAtualizar(dados.alertas),
    () => aoErro(new Error('Não foi possível consultar os relatos.')),
  );
}

function processarAvaliacoes(snapshot: QuerySnapshot): DadosAvaliacoes {
  let soma = 0;
  let quantidade = 0;
  const alertas: AlertaAvaliacao[] = [];

  snapshot.forEach((documento) => {
    const dados = documento.data();
    const nota = dados.rating;
    if (typeof nota === 'number' && Number.isInteger(nota) && nota >= 1 && nota <= 5) {
      soma += nota;
      quantidade += 1;
    }
    const tags = Array.isArray(dados.tags) ? dados.tags : [];

    const negativas = tags.filter(
      (tag): tag is string =>
        typeof tag === 'string' &&
        Object.prototype.hasOwnProperty.call(problemas, tag),
    );

    if (negativas.length === 0) return;

    const data = dados.createdAt?.toDate?.();
    const createdAt = data instanceof Date && Number.isFinite(data.getTime())
      ? data.toISOString()
      : new Date(0).toISOString();

    const descricao = typeof dados.description === 'string'
      ? dados.description.trim()
      : '';

    const titulo = negativas.length === 1
      ? problemas[negativas[0]]
      : 'Problemas relatados na parada';

    const lista = negativas.join(', ');
    const mensagem = `Problemas relatados: ${lista}.`;
    const texto = descricao
      ? `${mensagem}\nDescrição: ${descricao}`
      : mensagem;

    alertas.push({
      id: documento.id,
      title: titulo,
      message: texto,
      createdAt,
    });
  });

  return { resumo: { media: quantidade > 0 ? soma / quantidade : null, quantidade }, alertas };
}
