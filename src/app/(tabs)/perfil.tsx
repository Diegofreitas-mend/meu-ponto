// Perfil: mostra a conta conectada ou os botoes de login/cadastro.
import { profileStyles as styles } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/tema';
import { useAuth } from '@/sessao';
import { getSessionAuth } from '@/firebase';
import { authErrorMessage } from '@/validacoes';

const colors = { ...Brand.themes.light, ...Brand.home };
export default function ProfileScreen() {
  const { user, ready, error: sessionError, retry, notice, setNotice } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  async function logout() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try { await signOut(getSessionAuth()); setNotice(null); }
    catch (cause) { setError(authErrorMessage(cause)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Seu perfil</Text>
    {!ready ? <ActivityIndicator color={colors.primary} accessibilityLabel="Recuperando sessão" /> : <View style={styles.card}>
      <View style={styles.avatar}><Ionicons name="person-outline" size={36} color={colors.primary} /></View>
      {sessionError ? <><Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text><Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable></> : user ? <>
        <Text style={styles.name}>{user.displayName || 'Sua conta'}</Text>
        <Text style={styles.description}>{user.email}</Text>
        <Text style={styles.caption}>Conectado ao Meu Ponto</Text>
        {notice && <Text accessibilityRole="alert" style={styles.description}>{notice}</Text>}
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} onPress={() => void logout()} disabled={busy} style={[styles.secondary, busy && styles.disabled]}>{busy ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryText}>Sair da conta</Text>}</Pressable>
      </> : <>
        <Text style={styles.name}>Seu lugar na comunidade.</Text>
        <Text style={styles.description}>Entre ou crie sua conta para acessar seu perfil.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.button}><Text style={styles.buttonText}>Entrar</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/cadastro')} style={styles.secondary}><Text style={styles.secondaryText}>Criar conta</Text></Pressable>
      </>}
    </View>}
  </ScrollView></SafeAreaView>;
}
