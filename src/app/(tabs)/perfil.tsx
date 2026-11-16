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
import { useAdmin } from '@/admin';
import { getSessionAuth } from '@/firebase';
import { authErrorMessage } from '@/validacoes';

const colors = { ...Brand.themes.light, ...Brand.home };
export default function ProfileScreen() {
  const { user, ready, error: sessionError, retry, notice, setNotice } = useAuth();
  const { admin } = useAdmin();
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
  const initials = (user?.displayName || user?.email || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const created = user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const memberSince = created && Number.isFinite(created.getTime()) ? created.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : null;
  const shortcuts = [
    { title: 'Explorar o mapa', description: 'Encontre pontos e consulte a região.', icon: 'map-outline', route: '/mapa' },
    { title: 'Avaliar um ponto', description: 'Compartilhe como foi sua experiência.', icon: 'star-outline', route: '/avaliacao' },
    { title: 'Alertas da comunidade', description: 'Veja os relatos sobre os pontos.', icon: 'notifications-outline', route: '/alertas' },
  ] as const;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Seu perfil</Text>
        <Text style={styles.subtitle}>Sua conta e seus caminhos no Meu Ponto.</Text>
        {!ready ? <ActivityIndicator color={colors.primary} accessibilityLabel="Recuperando sessão" /> : <>
          <View style={styles.card}>
            <View style={styles.avatar}>{user && !sessionError ? <Text style={styles.initials}>{initials || 'MP'}</Text> : <Ionicons name="person-outline" size={36} color={colors.primary} />}</View>
            {sessionError ? <>
              <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text>
              <Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable>
            </> : user ? <>
              <Text style={styles.name}>{user.displayName || 'Sua conta'}</Text>
              <Text style={styles.description}>{user.email}</Text>
              <Text style={styles.caption}>● Conta conectada{admin ? ' · Administrador' : ' · Comunidade Meu Ponto'}</Text>
              {notice && <Text accessibilityRole="alert" style={styles.description}>{notice}</Text>}
            </> : <>
              <Text style={styles.name}>Faça parte do caminho.</Text>
              <Text style={styles.description}>Crie sua conta para avaliar pontos e ajudar a comunidade a viajar melhor.</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.button}><Text style={styles.buttonText}>Entrar na minha conta</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/cadastro')} style={styles.secondary}><Text style={styles.secondaryText}>Criar conta</Text></Pressable>
            </>}
          </View>
          {user && !sessionError && <>
            <Text style={styles.sectionTitle}>Dados da conta</Text>
            <View style={styles.info}>
              <View style={styles.row}><Ionicons name="person-outline" size={22} color={colors.primary} /><View style={styles.grow}><Text style={styles.label}>Nome</Text><Text style={styles.value}>{user.displayName || 'Não informado'}</Text></View></View>
              <View style={styles.row}><Ionicons name="mail-outline" size={22} color={colors.primary} /><View style={styles.grow}><Text style={styles.label}>E-mail</Text><Text selectable style={styles.value}>{user.email || 'Não informado'}</Text></View></View>
              {memberSince && <View style={styles.row}><Ionicons name="calendar-outline" size={22} color={colors.primary} /><View style={styles.grow}><Text style={styles.label}>Na comunidade desde</Text><Text style={styles.value}>{memberSince}</Text></View></View>}
            </View>
          </>}
          <Text style={styles.sectionTitle}>Explore e contribua</Text>
          {shortcuts.map(item => <Pressable key={item.route} accessibilityRole="button" onPress={() => router.navigate(item.route)} style={[styles.action, styles.row]}>
            <View style={styles.actionIcon}><Ionicons name={item.icon} size={22} color={colors.primary} /></View>
            <View style={styles.grow}><Text style={styles.value}>{item.title}</Text><Text style={styles.label}>{item.description}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>)}
          {user && !sessionError && <>
            {admin && <Pressable accessibilityRole="button" onPress={() => router.push('/admin')} style={styles.button}><Text style={styles.buttonText}>Painel administrativo</Text></Pressable>}
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} onPress={() => void logout()} disabled={busy} style={[styles.secondary, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryText}>Sair da conta</Text>}
            </Pressable>
          </>}
        </>}
        <Text style={styles.footer}>Meu Ponto · Uma comunidade em movimento.{'\n'}Cada avaliação ajuda a melhorar a próxima espera.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
