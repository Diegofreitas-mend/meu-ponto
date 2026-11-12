import { Ionicons } from '@expo/vector-icons';
import { createElement } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { MapaCanvasProps } from './MapaCanvas';
import { mapStyles as styles } from '@/styles';
import { Brand } from '@/tema';

export function MapaCanvas({ stops, selectedStop, region, onSelectStop }: MapaCanvasProps) {
  const lat = selectedStop?.latitude ?? region.latitude;
  const lng = selectedStop?.longitude ?? region.longitude;
  const delta = selectedStop ? 0.008 : 0.04;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <View style={styles.webMapWrapper}>
      {createElement('iframe', {
        src,
        title: 'Mapa de pontos de ônibus em Fortaleza',
        style: { border: 0, width: '100%', height: '100%' },
        loading: 'lazy',
      })}
      {stops.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.webPinsStrip}>
          {stops.map(stop => {
            const active = selectedStop?.id === stop.id;
            return (
              <Pressable
                key={stop.id}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ponto ${stop.name}`}
                onPress={() => onSelectStop(stop)}
                style={[styles.webPinPill, active && styles.webPinPillSelected]}
              >
                <Ionicons name="location" size={18} color={active ? '#FFFFFF' : Brand.colors.green} />
                <Text style={[styles.webPinText, active && styles.webPinTextSelected]}>{stop.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}