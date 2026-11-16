import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { gerarResumoIA, observarAvaliacoesParaIA, type DadosResumoIA } from '@/ia';
import { useAuth } from '@/sessao';
import { colors } from '@/tema';

export function ResumoInteligente({ pontoId }: { pontoId: string }) {
  const { user } = useAuth();
  const [consulta, setConsulta] = useState<{ dados?: DadosResumoIA; erro?: string }>({});
  const [resultado, setResultado] = useState<{
    origem: string;
    texto?: string;
    erro?: string;
  } | null>(null);
  const [gerando, setGerando] = useState(false);
  const ativo = useRef(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    ativo.current = true;
    return () => { ativo.current = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    return observarAvaliacoesParaIA(pontoId,
      dados => setConsulta({ dados }),
      () => setConsulta({ erro: 'Não foi possível carregar as avaliações para o resumo.' }));
  }, [pontoId, user, tentativa]);

  const dados = consulta.dados;
  const origem = JSON.stringify([user?.uid, pontoId, dados]);
  const atual = resultado?.origem === origem ? resultado : null;

  async function gerar() {
    if (!dados || gerando) return;
    setGerando(true);
    setResultado(null);
    try {
      const texto = await gerarResumoIA(pontoId, dados);
      if (ativo.current) setResultado({ origem, texto });
    } catch (error) {
      if (ativo.current) {
        setResultado({ origem, erro: error instanceof Error ? error.message : 'Resumo indisponível.' });
      }
    } finally {
      if (ativo.current) setGerando(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
        <Text style={styles.title}>Resumo das avaliações</Text>
      </View>
      {!user ? <Text style={styles.text}>Entre na sua conta para consultar o resumo com IA.</Text>
        : consulta.erro ? <>
          <Text accessibilityRole="alert" style={styles.text}>{consulta.erro}</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
            setConsulta({});
            setTentativa(valor => valor + 1);
          }}><Text style={styles.buttonText}>Recarregar avaliações</Text></Pressable>
        </> : !dados ? <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando avaliações para IA" />
        : dados.avaliacoes.length === 0 ? <Text style={styles.text}>Ainda sem avaliações.</Text>
        : <>
          {atual?.texto && <Text style={styles.text} accessibilityLiveRegion="polite">{atual.texto}</Text>}
          <Text style={styles.caption}>
            {dados.parcial ? 'Amostra de ' : 'Baseado em '}{dados.avaliacoes.length} {dados.avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}.
            {' '}Resumo por IA. As condições podem mudar.
          </Text>
          {!atual?.texto && <Pressable accessibilityRole="button" disabled={gerando}
            accessibilityState={{ disabled: gerando, busy: gerando }} onPress={gerar}
            style={[styles.button, gerando && styles.disabled]}>
            {gerando && <ActivityIndicator color={colors.onPrimary} />}
            <Text style={styles.buttonText}>{gerando ? 'Gerando resumo…' : 'Resumir com Gemini'}</Text>
          </Pressable>}
          {atual?.erro && <Text accessibilityRole="alert" style={styles.error}>{atual.erro}</Text>}
        </>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, marginVertical: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  text: { fontSize: 16, lineHeight: 25, color: colors.text },
  caption: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  disabled: { opacity: 0.65 },
  error: { fontSize: 14, lineHeight: 21, color: colors.danger },
});
