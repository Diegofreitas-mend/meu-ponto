// Barra inferior: adicione ou altere as abas neste arquivo.
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/tema';

const tabs = [
  { name: 'inicio', label: 'Início', icon: 'home-outline' },
  { name: 'mapa', label: 'Mapa', icon: 'map-outline' },
  { name: 'avaliacao', label: 'Avaliar', icon: 'add-circle-outline' },
  { name: 'alertas', label: 'Alertas', icon: 'notifications-outline' },
  { name: 'perfil', label: 'Perfil', icon: 'person-outline' },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: Brand.home.background },
      tabBarActiveTintColor: Brand.colors.blue,
      tabBarInactiveTintColor: Brand.home.textSecondary,
      tabBarHideOnKeyboard: true,
      tabBarLabelPosition: 'below-icon',
      tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
      tabBarIconStyle: { height: 28 },
      tabBarStyle: {
        backgroundColor: Brand.home.background,
        borderTopColor: Brand.home.cardBorder,
        height: 76 + insets.bottom,
        paddingTop: 8,
        paddingBottom: Math.max(8, insets.bottom),
      },
    }}>
      {tabs.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{
          title: tab.label,
          tabBarAccessibilityLabel: tab.name === 'avaliacao' ? 'Adicionar avaliação' : tab.label,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused && tab.name === 'inicio' ? 'home' : tab.icon}
              size={size} color={typeof color === 'string' ? color : Brand.home.textSecondary} />
          ),
        }} />
      ))}
    </Tabs>
  );
}
