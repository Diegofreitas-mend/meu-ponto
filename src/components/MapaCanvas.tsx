import { useEffect, useRef } from 'react';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { mapStyles as styles } from '@/styles';
import { Brand } from '@/tema';
import type { BusStop } from '@/tipos';

export type MapRegion = Region;

export type MapaCanvasProps = {
  stops: BusStop[];
  selectedStop: BusStop | null;
  region: MapRegion;
  showsUserLocation: boolean;
  onSelectStop: (stop: BusStop) => void;
};

export function MapaCanvas({ stops, selectedStop, region, showsUserLocation, onSelectStop }: MapaCanvasProps) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, Brand.motion.standard);
  }, [region]);

  return (
    <MapView
      ref={mapRef}
      style={styles.canvas}
      initialRegion={region}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
    >
      {stops.map(stop => {
        if (stop.latitude === null || stop.longitude === null) return null;
        const isSelected = selectedStop?.id === stop.id;
        return (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
            description={stop.address}
            pinColor={isSelected ? Brand.colors.blue : Brand.colors.green}
            onPress={() => onSelectStop(stop)}
          />
        );
      })}
      {selectedStop && selectedStop.latitude !== null && selectedStop.longitude !== null && (
        <Circle
          center={{ latitude: selectedStop.latitude, longitude: selectedStop.longitude }}
          radius={90}
          strokeColor={Brand.colors.blue}
          strokeWidth={2}
          fillColor="#2563EB22"
        />
      )}
    </MapView>
  );
}