
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAlertasAvaliacoes } from '@/use-alertas-avaliacoes';
import { useStops } from '@/pontos';
import { alertStyles as styles } from '@/styles';
import { colors } from '@/tema';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return 'Data não disponível';
  }

  return date.toLocaleDateString('pt-BR');
}

export default function AlertsScreen() {
  const [query, setQuery] = useState('');
  const { stops, loading, error, reload } = useStops('');
  const { reviewAlerts, reviewErrors } = useAlertasAvaliacoes(stops);

  const allAlerts = useMemo(() => {
    return stops
      .flatMap(stop => {
        const existentes = stop.alerts.map(alert => ({
          ...alert,
          id: `original-${alert.id}`,
          stopId: stop.id,
          stopName: stop.name,
          address: stop.address,
          city: stop.city,
        }));

        const avaliacoes = (reviewAlerts[stop.id] || []).map(alert => ({
          ...alert,
          id: `avaliacao-${alert.id}`,
          stopId: stop.id,
          stopName: stop.name,
          address: stop.address,
          city: stop.city,
        }));

        return [...existentes, ...avaliacoes];
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [stops, reviewAlerts]);

  const indice = useMemo(() => allAlerts.map(alert => ({
    alert,
    texto: normalize(`${alert.stopName} ${alert.address} ${alert.city} ${alert.title} ${alert.message}`),
  })), [allAlerts]);

  const visibleAlerts = useMemo(() => {
    const search = normalize(query);

    if (!search) return allAlerts;

    return indice.filter(item => item.texto.includes(search)).map(item => item.alert);
  }, [allAlerts, indice, query]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.root}
    >
      <FlatList
        data={!loading && !error ? visibleAlerts : []}
        keyExtractor={alert => JSON.stringify([alert.stopId, alert.id])}
        renderItem={({ item: alert }) => (
          <View style={styles.body}>
            <View
              style={styles.card}
            >
              <View style={styles.row}>
                <View style={styles.busIcon}>
                  <Ionicons
                    name="bus-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.grow}>
                  <Text style={styles.city}>
                    {alert.city}
                  </Text>

                  <Text style={styles.stopName}>
                    {alert.stopName}
                  </Text>
                </View>
              </View>

              <Text style={styles.address}>
                {alert.address}
              </Text>

              <View style={styles.alertInfo}>
                <Ionicons
                  name="alert-circle-outline"
                  size={21}
                  color={colors.warning}
                />

                <Text style={styles.alertTitle}>
                  {alert.title}
                </Text>
              </View>

              <Text style={styles.alertMessage}>
                {alert.message}
              </Text>

              <View style={styles.cardFooter}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />

                <Text style={styles.date}>
                  {formatDate(alert.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.header}>
                <Image
                  source={require('@/assets/brand/meu-ponto-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="Logo do aplicativo"
                />
              </View>

              <View style={styles.heroIntro}>
                <View style={styles.titleRow}>
                  <Ionicons
                    name="notifications-outline"
                    size={28}
                    color="#FFFFFF"
                  />

                  <Text style={styles.title}>
                    Alertas
                  </Text>
                </View>

                <Text style={styles.subtitle}>
                  Acompanhe os relatos sobre as paradas de ônibus.
                </Text>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.search}>
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={colors.primary}
                />

                <TextInput
                  accessibilityLabel="Buscar alertas"
                  placeholder="Buscar por parada ou alerta"
                  placeholderTextColor={colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                  maxLength={200}
                  returnKeyType="search"
                  style={styles.input}
                />

                {query.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpar busca"
                    onPress={() => setQuery('')}
                    style={styles.clear}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionHead}>
                <View style={styles.grow}>
                  <Text style={styles.sectionTitle}>
                    Alertas das paradas
                  </Text>

                  <Text style={styles.caption}>
                    {loading
                      ? 'Carregando alertas...'
                      : error || reviewErrors.length > 0
                        ? 'Alguns alertas não puderam ser consultados'
                        : `${visibleAlerts.length} ${
                            visibleAlerts.length === 1
                              ? 'alerta encontrado'
                              : 'alertas encontrados'
                          }`}
                  </Text>
                </View>
              </View>

              {loading && (
                <View style={styles.empty}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                  />

                  <Text style={styles.emptyText}>
                    Buscando alertas no Firebase...
                  </Text>
                </View>
              )}

              {!loading && error && (
                <View style={styles.empty}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={32}
                    color={colors.warning}
                  />

                  <Text style={styles.emptyTitle}>
                    Erro ao carregar alertas
                  </Text>

                  <Text style={styles.emptyText}>
                    {error}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={reload}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>
                      Tentar novamente
                    </Text>
                  </Pressable>
                </View>
              )}

            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.body}>
            {!loading &&
              !error &&
              visibleAlerts.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons
                    name={
                      query.trim()
                        ? 'search-outline'
                        : 'checkmark-circle-outline'
                    }
                    size={32}
                    color={colors.primary}
                  />

                  <Text style={styles.emptyTitle}>
                    {query.trim()
                      ? 'Nenhum alerta encontrado'
                      : 'Nenhum alerta registrado'}
                  </Text>

                  <Text style={styles.emptyText}>
                    {query.trim()
                      ? 'Tente pesquisar por outra parada ou ocorrência.'
                      : 'Não existem alertas registrados nas paradas publicadas no momento.'}
                  </Text>

                  {query.trim().length > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setQuery('')}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>
                        Limpar busca
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
          </View>
        }
      />

    </SafeAreaView>
  );
}
