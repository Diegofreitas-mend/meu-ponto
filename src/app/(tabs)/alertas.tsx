import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { alertStyles as styles } from '@/styles';
import { colors } from '@/tema';
import type { BusStop } from '@/tipos';


type MockStop = Pick<BusStop, 'id' | 'name' | 'address' | 'city' | 'alerts'>;

const mockStops: MockStop[] = [
  {
    id: 'ponto-01',
    name: 'Parada da Av. Bezerra de Menezes',
    address: 'Av. Bezerra de Menezes',
    city: 'Fortaleza - CE',
    alerts: [
      {
        id: 'alerta-01',
        title: 'Cobertura danificada',
        message: 'A cobertura da parada apresenta danos e precisa de manutenção.',
        createdAt: '2026-11-12T09:00:00',
      },
    ],
  },
  {
    id: 'ponto-02',
    name: 'Parada da Av. da Universidade',
    address: 'Av. da Universidade',
    city: 'Fortaleza - CE',
    alerts: [
      {
        id: 'alerta-02',
        title: 'Iluminação insuficiente',
        message: 'Usuários relataram pouca iluminação na parada durante a noite.',
        createdAt: '2026-11-11T18:30:00',
      },
    ],
  },
  {
    id: 'ponto-03',
    name: 'Parada da Av. 13 de Maio',
    address: 'Av. 13 de Maio',
    city: 'Fortaleza - CE',
    alerts: [
      {
        id: 'alerta-03',
        title: 'Falta de cobertura',
        message: 'A parada não possui proteção adequada contra sol e chuva.',
        createdAt: '2026-11-10T14:15:00',
      },
    ],
  },
  {
    id: 'ponto-04',
    name: 'Parada da Av. Washington Soares',
    address: 'Av. Washington Soares',
    city: 'Fortaleza - CE',
    alerts: [
      {
        id: 'alerta-04',
        title: 'Estrutura danificada',
        message: 'O banco da parada está danificado, dificultando o uso.',
        createdAt: '2026-11-09T10:20:00',
      },
    ],
  },
];

const mockAlerts = mockStops.flatMap(stop =>
  stop.alerts.map(alert => ({
    ...alert,
    stopId: stop.id,
    stopName: stop.name,
    address: stop.address,
    city: stop.city,
  }))
);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(value: string): string {
  const [date] = value.split('T');
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export default function AlertsScreen() {
  const [query, setQuery] = useState('');

  const visibleAlerts = mockAlerts.filter(alert => {
    const search = normalize(query);
    const content = normalize(
      `${alert.stopName} ${alert.address} ${alert.city} ${alert.title} ${alert.message}`
    );
    return content.includes(search);
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
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
              <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
              <Text style={styles.title}>Alertas</Text>
            </View>
            <Text style={styles.subtitle}>
              Acompanhe os relatos sobre as paradas de ônibus.
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
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
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <View style={styles.sectionHead}>
            <View style={styles.grow}>
              <Text style={styles.sectionTitle}>Alertas das paradas</Text>
              <Text style={styles.caption}>
                {visibleAlerts.length}{' '}
                {visibleAlerts.length === 1
                  ? 'alerta encontrado'
                  : 'alertas encontrados'}
              </Text>
            </View>
          </View>

          {visibleAlerts.map(alert => (
            <View key={alert.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.busIcon}>
                  <Ionicons name="bus-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.grow}>
                  <Text style={styles.city}>{alert.city}</Text>
                  <Text style={styles.stopName}>{alert.stopName}</Text>
                </View>
              </View>

              <Text style={styles.address}>{alert.address}</Text>

              <View style={styles.alertInfo}>
                <Ionicons name="alert-circle-outline" size={21} color={colors.warning} />
                <Text style={styles.alertTitle}>{alert.title}</Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>

              <View style={styles.cardFooter}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.date}>{formatDate(alert.createdAt)}</Text>
              </View>
            </View>
          ))}

          {visibleAlerts.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color={colors.primary} />
              <Text style={styles.emptyTitle}>Nenhum alerta encontrado</Text>
              <Text style={styles.emptyText}>
                Tente pesquisar por outra parada ou ocorrência.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuery('')}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>Limpar busca</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.mockNotice}>
            Dados demonstrativos para apresentação.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
