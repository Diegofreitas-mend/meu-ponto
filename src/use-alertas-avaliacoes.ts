import { useEffect, useMemo, useState } from 'react';
import { observarAlertasAvaliacoes, type AlertaAvaliacao } from '@/avaliacoes';
import type { BusStop } from '@/tipos';

type RelatosPorPonto = Record<string, { alertas: AlertaAvaliacao[]; erro: boolean }>;

export function useAlertasAvaliacoes(pontos: BusStop[]) {
  const chave = useMemo(() => JSON.stringify(pontos.map(ponto => ponto.id).sort()), [pontos]);
  const [resultado, setResultado] = useState<{ chave: string; pontos: RelatosPorPonto } | null>(null);

  useEffect(() => {
    let ativo = true;
    const ids: string[] = JSON.parse(chave);

    function atualizar(pontoId: string, alertas: AlertaAvaliacao[], erro: boolean) {
      if (!ativo) return;
      setResultado(anterior => ({
        chave,
        pontos: {
          ...(anterior?.chave === chave ? anterior.pontos : {}),
          [pontoId]: { alertas, erro },
        },
      }));
    }

    const cancelar = ids.map(pontoId => observarAlertasAvaliacoes(
      pontoId,
      alertas => atualizar(pontoId, alertas, false),
      () => atualizar(pontoId, [], true),
    ));

    return () => {
      ativo = false;
      cancelar.forEach(parar => parar());
    };
  }, [chave]);

  return useMemo(() => {
    const pontos = resultado?.chave === chave ? resultado.pontos : {};
    const reviewAlerts = Object.fromEntries(
      Object.entries(pontos).map(([id, ponto]) => [id, ponto.alertas]),
    );
    const reviewErrors = Object.keys(pontos).filter(id => pontos[id].erro);
    return { reviewAlerts, reviewErrors };
  }, [resultado, chave]);
}
