// O app abre no acesso. As abas só ficam disponíveis depois da autenticação.
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/sessao';
import { welcomeStyles as styles } from '@/styles';
import { colors } from '@/tema';

function AppNavigation() {
  const { user, ready } = useAuth();
  useEffect(() => { if (ready) void SplashScreen.hideAsync(); }, [ready]);
  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.primary} accessibilityLabel="Restaurando sessão" /></View>;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="recuperar-senha" />
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <ThemeProvider value={DefaultTheme}><AuthProvider><AppNavigation /></AuthProvider></ThemeProvider>;
}
