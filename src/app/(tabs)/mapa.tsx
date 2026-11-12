import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapaCanvas, type MapRegion } from '@/components/MapaCanvas';
import { useStops } from '@/pontos';
import { homeStyles, mapStyles as styles } from '@/styles';
import { Brand, colors } from '@/tema';
import type { BusStop } from '@/tipos';

type StopFilter = 'all' | 'accessible' | 'covered' | 'alerts';

const filters = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'accessible', label: 'Acessível', icon: 'accessibility-outline' },
  { id: 'covered', label: 'Com cobertura', icon: 'umbrella-outline' },
  { id: 'alerts', label: 'Com alertas', icon: 'alert-circle-outline' },
] as const;

const FORTALEZA_REGION: MapRegion = {
  latitude: -3.745,
  longitude: -38.523,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const normalizeTag = (tag: string) => tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const ratingLabel = (stop: BusStop) => (stop.rating === null ? 'Sem avaliações' : stop.rating.toFixed(1).replace('.', ','));

export default function MapScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StopFilter>('all');
  const [selected, setSelected] = useState<BusStop | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [region, setRegion] = useState<MapRegion>(FORTALEZA_REGION);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const { stops, loading, error, reload } = useStops(query);

  const filteredStops = stops.filter(stop => {
    if (filter === 'accessible') return stop.tags.some(tag => normalizeTag(tag) === 'acessivel');
    if (filter === 'covered') return stop.tags.some(tag => normalizeTag(tag) === 'com cobertura');
    if (filter === 'alerts') return stop.alerts.length > 0;
    return true;
  });

  const mappedStops = filteredStops.filter(
    (stop): stop is BusStop & { latitude: number; longitude: number } =>
      stop.latitude !== null && stop.longitude !== null,
  );
  const unmappedCount = filteredStops.length - mappedStops.length;

  useEffect(() => {
    let active = true;
    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (permission.status !== 'granted') {
          setLocationDenied(true);
          return;
        }
        setLocationDenied(false);
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        const coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setUserCoords(coords);
        setRegion({ ...coords, latitudeDelta: 0.025, longitudeDelta: 0.025 });
      } catch {
        if (active) setLocationDenied(true);
      }
    }
    void loadLocation();
    return () => { active = false; };
  }, []);

  function handleSelectStop(stop: BusStop) {
    setSelected(stop);
    if (stop.latitude !== null && stop.longitude !== null) {
      setRegion({
        latitude: stop.latitude,
        longitude: stop.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }
  }

  function centerOnUser() {
    if (userCoords) {
      setRegion({ ...userCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    } else {
      setRegion(FORTALEZA_REGION);
    }
  }

  function statusInfo(stop: BusStop) {
    if (stop.status === 'good') return { text: 'Boa condição', color: colors.success, background: colors.successSurface };
    if (stop.status === 'alert') return { text: 'Tem um alerta', color: colors.warning, background: colors.warningSurface };
    return { text: 'Estrutura não informada', color: colors.textSecondary, background: colors.iconSurface };
  }

  const activeStop = selected && mappedStops.some(stop => stop.id === selected.id) ? selected : null;

  return (
    <View style={styles.root}>
      <MapaCanvas
        stops={mappedStops}
        selectedStop={activeStop}
        region={region}
        showsUserLocation={userCoords !== null}
        onSelectStop={handleSelectStop}
      />

      <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={styles.overlayTop}>
        <View style={styles.topContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.primary} />
            <TextInput
              accessibilityLabel="Buscar pontos no mapa por nome, rua ou bairro"
              placeholder="Buscar ponto, rua ou bairro"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              maxLength={200}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {filters.map(item => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar mapa: ${item.label}`}
                accessibilityState={{ selected: filter === item.id }}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, filter === item.id && styles.chipActive]}
              >
                <Ionicons name={item.icon} size={16} color={filter === item.id ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.controlsRow}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Brand.colors.green }]} />
                <Text style={styles.legendText}>Ponto ({mappedStops.length})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Brand.colors.blue }]} />
                <Text style={styles.legendText}>Selecionado</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={userCoords ? 'Centralizar na minha localização' : 'Centralizar em Fortaleza'}
              onPress={centerOnUser}
              style={styles.locateButton}
            >
              <Ionicons name={userCoords ? 'locate' : 'navigate-outline'} size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View pointerEvents="box-none" style={styles.overlayBottom}>
        <View style={styles.bottomContainer}>
          {locationDenied && (
            <View style={styles.noticeBanner}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.noticeText}>
                Localização não autorizada. Exibindo o mapa de Fortaleza para consulta manual.
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.noticeBanner}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.noticeText}>Carregando pontos no mapa…</Text>
            </View>
          )}

          {error && (
            <View accessibilityRole="alert" style={styles.sheetCard}>
              <Text style={homeStyles.emptyText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={reload} style={[homeStyles.actionButton, { marginTop: 12 }]}>
                <Text style={homeStyles.actionText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && mappedStops.length === 0 && (
            <View style={styles.sheetCard}>
              <Text style={styles.sheetTitle}>Nenhum ponto geolocalizado encontrado</Text>
              <Text style={styles.sheetAddress}>
                {unmappedCount > 0
                  ? `Existem ${unmappedCount} ponto(s) cadastrado(s) sem latitude e longitude no banco.`
                  : 'Tente remover os filtros ou buscar por outro bairro.'}
              </Text>
              {(query.trim() || filter !== 'all') && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setQuery(''); setFilter('all'); }}
                  style={[homeStyles.actionButton, { marginTop: 12 }]}
                >
                  <Text style={homeStyles.actionText}>Limpar filtros</Text>
                </Pressable>
              )}
            </View>
          )}

          {activeStop && (() => {
            const condition = statusInfo(activeStop);
            return (
              <View style={styles.sheetCard}>
                <View style={styles.sheetHeader}>
                  <View style={homeStyles.grow}>
                    <Text style={homeStyles.city}>{activeStop.city}</Text>
                    <Text style={styles.sheetTitle}>{activeStop.name}</Text>
                    <Text style={styles.sheetAddress}>{activeStop.address}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fechar resumo do ponto"
                    onPress={() => setSelected(null)}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.sheetActions}>
                  <View style={[homeStyles.badge, { backgroundColor: condition.background }]}>
                    <View style={[homeStyles.statusDot, { backgroundColor: condition.color }]} />
                    <Text style={[homeStyles.badgeText, { color: condition.color }]}>{condition.text}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver detalhes completos de ${activeStop.name}`}
                    onPress={() => setDetailsOpen(true)}
                    style={styles.primarySmallButton}
                  >
                    <Text style={styles.primarySmallText}>Ver detalhes</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </View>
      </View>

      <Modal visible={detailsOpen && activeStop !== null} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
        <View style={homeStyles.modalBackdrop}>
          <View accessibilityViewIsModal style={homeStyles.modal}>
            <ScrollView>
              {activeStop && (
                <>
                  <View style={homeStyles.modalHeader}>
                    <Text style={homeStyles.modalTitle}>{activeStop.name}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={() => setDetailsOpen(false)} style={homeStyles.clear}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                  </View>
                  <Text style={homeStyles.address}>{activeStop.address} · {activeStop.city}</Text>
                  <View style={homeStyles.modalInfo}>
                    <Ionicons name="star-outline" size={20} color={colors.primary} />
                    <Text style={homeStyles.modalText}>
                      {ratingLabel(activeStop)}{activeStop.reviews > 0 ? ` · ${activeStop.reviews} avaliações` : ''}
                    </Text>
                  </View>
                  <Text style={homeStyles.modalText}>
                    Linhas: {activeStop.lines.length ? activeStop.lines.join(' · ') : 'Não informadas'}
                  </Text>
                  {activeStop.tags.length > 0 && (
                    <View style={homeStyles.tags}>
                      {activeStop.tags.map(tag => <Text key={tag} style={homeStyles.tag}>{tag}</Text>)}
                    </View>
                  )}
                  {activeStop.alerts.map(alert => (
                    <View key={alert.id} style={homeStyles.alertCard}>
                      <Text style={homeStyles.alertTitle}>{alert.title}</Text>
                      <Text style={homeStyles.alertText}>{alert.message}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}