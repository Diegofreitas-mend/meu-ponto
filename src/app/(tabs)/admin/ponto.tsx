// Cadastro e edição de ponto. Sem "excluir": despublique para tirar o ponto do app.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { buscarPonto, mensagemErroAdmin, salvarPonto } from '@/admin';
import { ETIQUETAS_PONTO, formularioDoPonto, validarPonto, type FormularioPonto } from '@/admin-validacoes';
import { adminStyles as styles } from '@/styles';
import { colors } from '@/tema';

export default function AdminPonto() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pontoId = typeof id === 'string' && id ? id : null;
  const [formulario, setFormulario] = useState<FormularioPonto>(formularioDoPonto());
  const [carregando, setCarregando] = useState(!!pontoId);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // 1. Na edição, carrega o ponto atual.
  useEffect(() => {
    if (!pontoId) return;
    let ativo = true;
    buscarPonto(pontoId)
      .then(ponto => {
        if (!ativo) return;
        if (ponto) setFormulario(formularioDoPonto(ponto));
        else setErro('Ponto não encontrado.');
      })
      .catch(causa => { if (ativo) setErro(mensagemErroAdmin(causa)); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [pontoId]);

  const alterar = <Campo extends keyof FormularioPonto>(campo: Campo, valor: FormularioPonto[Campo]) =>
    setFormulario(anterior => ({ ...anterior, [campo]: valor }));

  function alternarTag(tag: string) {
    alterar('tags', formulario.tags.includes(tag) ? formulario.tags.filter(item => item !== tag) : [...formulario.tags, tag]);
  }

  // 2. Valida e grava em stops.
  async function salvar() {
    const resultado = validarPonto(formulario);
    if ('erro' in resultado) { setErro(resultado.erro); return; }
    setSalvando(true);
    setErro(null);
    try {
      await salvarPonto(pontoId, resultado.dados);
      router.back();
    } catch (causa) { setErro(mensagemErroAdmin(causa)); }
    finally { setSalvando(false); }
  }

  if (carregando) return <View style={styles.center}><ActivityIndicator color={colors.primary} accessibilityLabel="Carregando ponto" /></View>;

  // Etiquetas antigas do ponto continuam selecionáveis mesmo que não estejam nas tags atuais.
  const opcoesTags = [...new Set([...ETIQUETAS_PONTO, ...formulario.tags])];
  const campo = (rotulo: string, chave: 'name' | 'address' | 'city' | 'latitude' | 'longitude' | 'lines', extra?: object) => (
    <>
      <Text style={styles.label}>{rotulo}</Text>
      <TextInput style={styles.input} value={formulario[chave]} onChangeText={valor => alterar(chave, valor)}
        editable={!salvando} accessibilityLabel={rotulo} placeholderTextColor={colors.textSecondary} {...extra} />
    </>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{pontoId ? 'Editar ponto' : 'Novo ponto'}</Text>
      <View style={styles.card}>
        {campo('Nome', 'name', { maxLength: 120 })}
        {campo('Endereço', 'address', { maxLength: 200 })}
        {campo('Cidade', 'city', { maxLength: 80, placeholder: 'Fortaleza/CE' })}
        {campo('Latitude', 'latitude', { keyboardType: 'numbers-and-punctuation', placeholder: '-3.7275' })}
        {campo('Longitude', 'longitude', { keyboardType: 'numbers-and-punctuation', placeholder: '-38.5275' })}
        <Text style={styles.hint}>Sem coordenadas o ponto não aparece no mapa.</Text>
        {campo('Linhas de ônibus', 'lines', { placeholder: '026, 051, 072', autoCapitalize: 'characters' })}
        <Text style={styles.hint}>Separe as linhas por vírgula.</Text>

        <Text style={styles.label}>Etiquetas do ponto</Text>
        <Text style={styles.hint}>Aparecem no card. “Acessível” e “Com cobertura” alimentam os filtros do Início e do Mapa.</Text>
        <View style={styles.row}>
          {opcoesTags.map(tag => {
            const marcada = formulario.tags.includes(tag);
            return (
              <Pressable key={tag} accessibilityRole="checkbox" accessibilityState={{ checked: marcada }} disabled={salvando}
                onPress={() => alternarTag(tag)} style={[styles.chip, marcada && styles.chipOn]}>
                <Text style={styles.chipText}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spread}>
          <Text style={[styles.label, { flex: 1 }]}>Boa condição confirmada (selo verde no card)</Text>
          <Switch value={formulario.condition === 'good'} onValueChange={valor => alterar('condition', valor ? 'good' : 'unknown')}
            disabled={salvando} accessibilityLabel="Boa condição confirmada" />
        </View>
        <View style={styles.spread}>
          <Text style={styles.label}>Publicado no app</Text>
          <Switch value={formulario.published} onValueChange={valor => alterar('published', valor)}
            disabled={salvando} accessibilityLabel="Publicado no app" />
        </View>
        <Text style={styles.hint}>Para retirar um ponto do app, desmarque “Publicado”. As avaliações são mantidas.</Text>
      </View>

      {erro && <Text accessibilityRole="alert" style={styles.error}>{erro}</Text>}
      <Pressable accessibilityRole="button" disabled={salvando} onPress={() => void salvar()} style={[styles.button, salvando && styles.disabled]}>
        {salvando ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>Salvar ponto</Text>}
      </Pressable>
    </ScrollView>
  );
}
