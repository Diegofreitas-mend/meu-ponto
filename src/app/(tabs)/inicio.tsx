// Tela inicial: conteúdo e ações ficam aqui; aparência em src/styles.ts.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStops } from '@/pontos';
import { homeStyles as styles } from '@/styles';
import { colors } from '@/tema';
import type { BusStop } from '@/tipos';

type StopFilter = 'all' | 'accessible' | 'covered' | 'alerts';
const filters = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'accessible', label: 'Acessível', icon: 'accessibility-outline' },
  { id: 'covered', label: 'Com cobertura', icon: 'umbrella-outline' },
  { id: 'alerts', label: 'Com alertas', icon: 'alert-circle-outline' },
] as const;
const normalizeTag = (tag: string) => tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const ratingLabel = (stop: BusStop) => stop.rating === null ? 'Sem avaliações' : stop.rating.toFixed(1).replace('.', ',');

export default function HomeScreen() {
  // A consulta usa somente documentos publicados no Firebase, sem dados fictícios.
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StopFilter>('all');
  const [selected, setSelected] = useState<BusStop | null>(null);
  const { stops, loading, error, reload } = useStops(query);
  const visibleStops = stops.filter(stop => {
    if (filter === 'accessible') return stop.tags.some(tag => normalizeTag(tag) === 'acessivel');
    if (filter === 'covered') return stop.tags.some(tag => normalizeTag(tag) === 'com cobertura');
    if (filter === 'alerts') return stop.alerts.length > 0;
    return true;
  });
  const total = visibleStops.length;
  const alerts = visibleStops.flatMap(stop => stop.alerts.map(alert => ({ stop, alert })));

  function status(stop: BusStop) {
    if (stop.status === 'good') return { text: 'Boa condição', color: colors.success, background: colors.successSurface };
    if (stop.status === 'alert') return { text: 'Tem um alerta', color: colors.warning, background: colors.warningSurface };
    return { text: 'Estrutura não informada', color: colors.textSecondary, background: colors.iconSurface };
  }

  function renderStop(stop: BusStop) {
    const condition = status(stop);
    return (
      <Pressable key={stop.id} accessibilityRole="button" accessibilityLabel={`Ver ponto ${stop.name}`}
        accessibilityHint={`${stop.city}. ${condition.text}. Abre os detalhes do ponto.`}
        onPress={() => setSelected(stop)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.row}>
          <View style={styles.busIcon}><Ionicons name="bus-outline" size={24} color={colors.primary} /></View>
          <View style={styles.grow}>
            <Text style={styles.city}>{stop.city}</Text>
            <Text style={styles.stopName}>{stop.name}</Text>
          </View>
          {stop.rating !== null && <View style={styles.rating}>
            <Ionicons name="star" size={14} color={colors.warning} /><Text style={styles.ratingText}>{ratingLabel(stop)}</Text>
          </View>}
        </View>
        <Text style={styles.address}>{stop.address}</Text>
        {stop.rating === null && <Text style={styles.reviewNote}>Ainda sem avaliações</Text>}
        {stop.lines.length > 0 && <View style={styles.lines}>
          <Text style={styles.lineLabel}>Linhas</Text>
          {stop.lines.slice(0, 3).map(line => <Text key={line} style={styles.lineNumber}>{line}</Text>)}
          {stop.lines.length > 3 && <Text style={styles.lineLabel}>+{stop.lines.length - 3}</Text>}
        </View>}
        {stop.tags.length > 0 && <View style={styles.tags}>
          {stop.tags.slice(0, 3).map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>}
        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: condition.background }]}>
            <View style={[styles.statusDot, { backgroundColor: condition.color }]} />
            <Text style={[styles.badgeText, { color: condition.color }]}>{condition.text}</Text>
          </View>
          <View style={styles.detailsLink}><Text style={styles.linkText}>Ver detalhes</Text><Ionicons name="arrow-forward" size={15} color={colors.primary} /></View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.header}>
            <Image source={require('@/assets/brand/meu-ponto-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Meu Ponto. Informação trazendo conforto." />
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => router.navigate('/perfil')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
              <Ionicons name="person-outline" size={22} color="white" />
            </Pressable>
          </View>
          <View style={styles.heroIntro}>
            <Text style={styles.title}>Encontre seu ponto.</Text>
            <Text style={styles.subtitle}>Consulte o endereço e as condições da parada.</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
            <TextInput accessibilityLabel="Buscar pontos por nome, rua, cidade ou característica" placeholder="Nome do ponto, rua ou bairro" placeholderTextColor={colors.textSecondary}
              value={query} onChangeText={setQuery} maxLength={200} returnKeyType="search" style={styles.input} />
            {query.length > 0 && <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Limpar busca" style={styles.clear}><Ionicons name="close" size={20} color={colors.textSecondary} /></Pressable>}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {filters.map(item => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Filtrar: ${item.label}`}
                accessibilityState={{ selected: filter === item.id }} aria-selected={filter === item.id} onPress={() => setFilter(item.id)}
                style={({ pressed }) => [styles.filter, filter === item.id && styles.filterActive, pressed && styles.pressed]}>
                <Ionicons name={item.icon} size={16} color={filter === item.id ? 'white' : colors.textSecondary} />
                <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <View style={styles.grow}>
              <Text style={styles.sectionTitle}>{query.trim() ? 'Resultado da busca' : 'Pontos de ônibus'}</Text>
              {!loading && !error && <Text style={styles.caption}>{total} {total === 1 ? 'ponto encontrado' : 'pontos encontrados'}</Text>}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Atualizar pontos" disabled={loading} onPress={reload} style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {visibleStops.map(renderStop)}
          {loading && <View style={styles.empty} accessibilityRole="progressbar" accessibilityLabel="Carregando pontos"><ActivityIndicator color={colors.primary} /><Text style={styles.emptyText}>Buscando os pontos…</Text></View>}
          {error && <View accessibilityRole="alert" style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={reload} style={styles.actionButton}><Text style={styles.actionText}>Tentar novamente</Text></Pressable>
          </View>}
          {!loading && !error && visibleStops.length === 0 && <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="bus-outline" size={30} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>{query.trim() || filter !== 'all' ? 'Nenhum ponto encontrado' : 'Ainda não há pontos cadastrados'}</Text>
            <Text style={styles.emptyText}>{query.trim() || filter !== 'all' ? 'Tente outra busca ou remova os filtros.' : 'Quando um ponto for cadastrado, ele aparecerá aqui.'}</Text>
            {(query.trim() || filter !== 'all') && <Pressable accessibilityRole="button" onPress={() => { setQuery(''); setFilter('all'); }} style={styles.actionButton}><Text style={styles.actionText}>{filter === 'all' ? 'Limpar busca' : 'Limpar filtros'}</Text></Pressable>}
          </View>}

          {!loading && !error && visibleStops.length > 0 && <>
            {alerts.length > 0 ? <>
              <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Relatos da comunidade</Text></View>
              {alerts.map(({ stop, alert }) => <Pressable key={alert.id} accessibilityRole="button" accessibilityLabel={`Ver relato sobre ${stop.name}`} onPress={() => setSelected(stop)} style={({ pressed }) => [styles.alertCard, pressed && styles.pressed]}>
                <View style={styles.row}><Ionicons name="alert-circle-outline" size={20} color={colors.warning} /><Text style={styles.alertTitle}>{alert.title}</Text></View>
                <Text style={styles.alertText}>{alert.message}</Text>
                <View style={styles.alertFooter}><Text style={styles.alertPlace}>{stop.name}</Text><Text style={styles.alertDate}>{new Date(alert.createdAt).toLocaleDateString('pt-BR')}</Text></View>
              </Pressable>)}
            </> : <View style={styles.noAlerts}><Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textSecondary} /><Text style={styles.noAlertsText}>Ainda não há relatos nos pontos listados.</Text></View>}
          </>}
        </View>
      </ScrollView>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}><View accessibilityViewIsModal style={styles.modal}>
          <ScrollView>{selected && <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected.name}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={() => setSelected(null)} style={styles.clear}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <Text style={styles.address}>{selected.address} · {selected.city}</Text>
            <View style={styles.modalInfo}><Ionicons name="star-outline" size={20} color={colors.primary} /><Text style={styles.modalText}>{ratingLabel(selected)}{selected.reviews > 0 ? ` · ${selected.reviews} avaliações` : ''}</Text></View>
            <Text style={styles.modalText}>Linhas: {selected.lines.length ? selected.lines.join(' · ') : 'Não informadas'}</Text>
            {selected.tags.length > 0 && <View style={styles.tags}>{selected.tags.map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>}
            {selected.alerts.map(alert => <View key={alert.id} style={styles.alertCard}><Text style={styles.alertTitle}>{alert.title}</Text><Text style={styles.alertText}>{alert.message}</Text></View>)}
          </>}</ScrollView>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}
