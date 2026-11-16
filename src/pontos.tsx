import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
// 1. Consulta os pontos publicados no Firestore.
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getDatabase } from '@/firebase';
import { parseStopDocument } from '@/validacoes';
import type { BusStop } from '@/tipos';

export function subscribeStops(onData: (stops: BusStop[]) => void, onError: (error: Error) => void) {
  const publishedStops = query(collection(getDatabase(), 'stops'), where('published', '==', true));
  return onSnapshot(publishedStops, { includeMetadataChanges: true }, snapshot => {
    // Aguarde o servidor para não confundir um cache vazio com um banco vazio.
    if (snapshot.metadata.fromCache && snapshot.empty) return;
    try {
      const stops = snapshot.docs.map(doc => parseStopDocument(doc.id, doc.data()));
      onData(stops.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    } catch (error) { onError(error instanceof Error ? error : new Error('Dados inválidos no Firestore.')); }
  }, error => onError(new Error(error.code === 'permission-denied'
    ? 'O Firestore recusou a leitura. Publique as regras do arquivo firebase/firestore.rules.'
    : 'Não foi possível consultar o Firebase. Confira a conexão e a configuração do projeto.')));
}

// 2. Entrega pontos, busca, carregamento e erros para a tela inicial.

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

type PontosContexto = {
  allStops: BusStop[];
  indice: { stop: BusStop; texto: string }[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const PontosContext = createContext<PontosContexto | null>(null);

export function StopsProvider({ children }: { children: ReactNode }) {
  const [allStops, setAllStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout>;
    const fail = (cause: Error) => {
      if (!active) return;
      clearTimeout(timeout);
      setError(cause.message);
      setLoading(false);
    };
    const start = setTimeout(() => {
      setLoading(true);
      setError(null);
      timeout = setTimeout(() => fail(new Error('O Firebase demorou a responder. Confira a conexão e tente novamente.')), 12000);
      try {
        unsubscribe = subscribeStops(stops => {
          if (!active) return;
          clearTimeout(timeout);
          setAllStops(stops);
          setLoading(false);
          setError(null);
        }, fail);
      } catch (cause) { fail(cause instanceof Error ? cause : new Error('Falha ao configurar o Firebase.')); }
    }, 0);
    return () => {
      active = false;
      clearTimeout(start);
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, [revision]);

  const indice = useMemo(() => allStops.map(stop => ({
    stop,
    texto: normalize(`${stop.name} ${stop.address} ${stop.city} ${stop.tags.join(' ')}`),
  })), [allStops]);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  return (
    <PontosContext value={{ allStops, indice, loading, error, reload }}>
      {children}
    </PontosContext>
  );
}

export function useStops(query: string) {
  const contexto = useContext(PontosContext);
  if (!contexto) throw new Error('useStops precisa de StopsProvider.');
  const { allStops, indice, loading, error, reload } = contexto;
  const stops = useMemo(() => {
    const search = normalize(query);
    if (!search) return allStops;
    return indice.filter(item => item.texto.includes(search)).map(item => item.stop);
  }, [allStops, indice, query]);
  return { stops, allStops, loading, error, total: stops.length, reload };
}
