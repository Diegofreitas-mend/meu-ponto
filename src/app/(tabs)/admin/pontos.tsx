// Lista todos os pontos (publicados ou não). Tocar em um ponto abre a edição.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { observarTodosPontos } from '@/admin';
import type { PontoAdmin } from '@/admin-validacoes';
import { adminStyles as styles } from '@/styles';
import { colors } from '@/tema';

const normalizar = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function AdminPontos() {
  const [pontos, setPontos] = useState<PontoAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => observarTodosPontos(lista => { setPontos(lista); setErro(null); }, falha => setErro(falha.message)), []);

  const termo = normalizar(busca.trim());
  const visiveis = (pontos ?? []).filter(ponto => !termo || normalizar(`${ponto.name} ${ponto.address} ${ponto.city}`).includes(termo));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.push('/admin/ponto')} style={styles.button}>
        <Text style={styles.buttonText}>Novo ponto</Text>
      </Pressable>
      <TextInput style={styles.input} value={busca} onChangeText={setBusca} placeholder="Buscar por nome, endereço ou cidade"
        placeholderTextColor={colors.textSecondary} accessibilityLabel="Buscar ponto" />
      {erro && <Text accessibilityRole="alert" style={styles.error}>{erro}</Text>}
      {!pontos && !erro && <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando pontos" />}
      {pontos && !visiveis.length && <Text style={styles.subtitle}>Nenhum ponto encontrado.</Text>}
      {visiveis.map(ponto => (
        <Pressable key={ponto.id} accessibilityRole="button" accessibilityLabel={`Editar ${ponto.name}`}
          onPress={() => router.push({ pathname: '/admin/ponto', params: { id: ponto.id } })}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={styles.spread}>
            <Text style={[styles.cardTitle, { flex: 1 }]}>{ponto.name}</Text>
            <View style={[styles.badge, ponto.published ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={styles.badgeText}>{ponto.published ? 'Publicado' : 'Não publicado'}</Text>
            </View>
          </View>
          <Text style={styles.cardText}>{[ponto.address, ponto.city].filter(Boolean).join(' · ') || 'Sem endereço'}</Text>
          {ponto.latitude === null && <Text style={styles.hint}>Sem coordenadas: não aparece no mapa.</Text>}
        </Pressable>
      ))}
    </ScrollView>
  );
}
