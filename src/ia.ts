import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { getDatabase, getFirebaseApp, getSessionAuth } from '@/firebase';
import {
  instrucaoResumo,
  limiteAvaliacoesIA,
  prepararAvaliacoes,
  validarTextoResumo,
  type AvaliacaoParaIA,
} from '@/ia-dados';

export type DadosResumoIA = {
  avaliacoes: AvaliacaoParaIA[];
  parcial: boolean;
};

export function observarAvaliacoesParaIA(
  pontoId: string,
  atualizar: (dados: DadosResumoIA) => void,
  falhar: () => void,
): () => void {
  // Sem orderBy por data para incluir também documentos legados sem createdAt.
  const consulta = query(collection(getDatabase(), 'stops', pontoId, 'reviews'),
    limit(limiteAvaliacoesIA + 1));
  return onSnapshot(consulta, snapshot => atualizar({
    avaliacoes: prepararAvaliacoes(snapshot.docs.slice(0, limiteAvaliacoesIA).map(doc => doc.data())),
    parcial: snapshot.size > limiteAvaliacoesIA,
  }), falhar);
}

type ResumoEmCache = { texto: string; expiraEm: number };
const cache = new Map<string, ResumoEmCache>();
const pendentes = new Map<string, Promise<string>>();
const duracaoCache = 10 * 60 * 1000;

export function mensagemErroIA(erro: unknown): string {
  const codigo = erro && typeof erro === 'object' && 'code' in erro ? String(erro.code) : '';
  // O SDK encapsula erros HTTP em AI/fetch-error.
  const detalhe = erro instanceof Error ? erro.message : '';
  const causa = `${codigo} ${detalhe}`;
  if (/permission-denied|api-not-enabled|403|USER_PROJECT_DENIED/.test(causa)) {
    return 'O serviço de IA precisa ser habilitado ou autorizado no Firebase.';
  }
  if (/quota|429|resource-exhausted/i.test(causa)) {
    return 'O limite de uso da IA foi atingido. Tente novamente mais tarde.';
  }
  return 'Não foi possível gerar o resumo agora. Confira sua conexão e tente novamente.';
}

export async function gerarResumoIA(pontoId: string, dados: DadosResumoIA): Promise<string> {
  const usuario = getSessionAuth().currentUser;
  if (!usuario) throw new Error('Entre na sua conta para consultar o resumo.');
  if (dados.avaliacoes.length === 0) throw new Error('Este ponto ainda não possui avaliações válidas.');

  const modelo = process.env.EXPO_PUBLIC_FIREBASE_AI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  const chave = JSON.stringify([usuario.uid, pontoId, modelo, dados]);
  const existente = cache.get(chave);
  if (existente && existente.expiraEm > Date.now()) return existente.texto;
  const pendente = pendentes.get(chave);
  if (pendente) return pendente;

  const pedido = (async () => {
    try {
      const { getAI, getGenerativeModel, GoogleAIBackend, FinishReason } = await import('firebase/ai');
      const ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        model: modelo,
        systemInstruction: instrucaoResumo,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }, { timeout: 30000 });
      const { response } = await model.generateContent(JSON.stringify(dados));
      if (response.candidates?.[0]?.finishReason !== FinishReason.STOP) {
        throw new Error('Resposta bloqueada ou incompleta.');
      }
      const texto = validarTextoResumo(response.text());
      if (cache.size >= 20) cache.delete(cache.keys().next().value!);
      cache.set(chave, { texto, expiraEm: Date.now() + duracaoCache });
      return texto;
    } catch (erro) {
      throw new Error(mensagemErroIA(erro));
    } finally {
      pendentes.delete(chave);
    }
  })();
  pendentes.set(chave, pedido);
  return pedido;
}
