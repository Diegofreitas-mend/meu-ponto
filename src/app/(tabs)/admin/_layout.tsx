// Área administrativa: só abre para quem tem o claim admin. As regras e Functions conferem de novo.
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAdmin } from '@/admin';
import { adminStyles as styles } from '@/styles';
import { colors } from '@/tema';

export default function AdminLayout() {
  const { admin, verificando } = useAdmin();
  if (verificando) return <View style={styles.center}><ActivityIndicator color={colors.primary} accessibilityLabel="Verificando acesso" /></View>;
  if (!admin) return <Redirect href="/perfil" />;
  return (
    <Stack screenOptions={{ headerShown: true, headerTintColor: colors.primary, headerTitleStyle: { color: colors.text } }}>
      <Stack.Screen name="index" options={{ title: 'Painel administrativo' }} />
      <Stack.Screen name="usuarios" options={{ title: 'Usuários' }} />
      <Stack.Screen name="pontos" options={{ title: 'Pontos' }} />
      <Stack.Screen name="ponto" options={{ title: 'Ponto' }} />
    </Stack>
  );
}
