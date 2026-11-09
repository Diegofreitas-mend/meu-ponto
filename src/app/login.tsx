import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CampoSenha } from '@/components/CampoSenha';
import { getSessionAuth } from '@/firebase';
import { useAuth } from '@/sessao';
import { authStyles as styles, welcomeStyles as layout } from '@/styles';
import { colors } from '@/tema';
import { authErrorMessage, validateAuthForm } from '@/validacoes';

export default function LoginScreen() {
  // Campos, mensagens e bloqueio de envio duplicado.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const { user, ready, error: sessionError, retry, setNotice } = useAuth();
  const disabled = busy || !ready || !!sessionError;
  const wide = useWindowDimensions().width >= 900;

  async function login() {
    if (locked.current || !ready || sessionError) return;
    const validation = validateAuthForm({ email, password });
    if (validation) { setError(validation); return; }
    locked.current = true; setBusy(true); setError(null); setNotice(null);
    try {
      await signInWithEmailAndPassword(getSessionAuth(), email.trim(), password);
      setPassword(''); router.replace('/inicio');
    } catch (cause) { setError(authErrorMessage(cause)); }
    finally { locked.current = false; setBusy(false); }
  }

  if (ready && user && !busy) return <Redirect href="/inicio" />;

  // O mesmo formulário abre em / e /login. Estilos ficam em src/styles.ts.
  return <SafeAreaView style={layout.root}>
    <KeyboardAvoidingView style={layout.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[layout.content, wide && layout.contentWide]}>
        <View style={[layout.panel, wide && layout.panelWide]}>
          <View style={[layout.hero, wide && layout.heroWide]}>
            <Image source={require('@/assets/brand/meu-ponto-logo.png')} style={layout.logo} resizeMode="contain" accessibilityLabel="Meu Ponto. Informação trazendo conforto." />
            {wide && <View style={layout.brandInfo}>
              <View style={layout.journey} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
                <View style={layout.journeyDot} />
                <View style={layout.journeyLine} />
                <View style={layout.journeyBus}><Ionicons name="bus-outline" size={28} color="#FFFFFF" /></View>
                <View style={layout.journeyLine} />
                <Ionicons name="location" size={28} color="#FACC15" />
              </View>
              <Text style={layout.brandTitle}>Antes de sair,{ '\n' }conheça sua parada.</Text>
              <Text style={layout.brandDescription}>Consulte a estrutura e a acessibilidade dos pontos de ônibus. Viaje com mais informação.</Text>
            </View>}
            {wide && <View style={layout.location}><Ionicons name="location-outline" size={17} color="#FFFFFF" /><Text style={layout.featureText}>Feito para quem se move por Fortaleza.</Text></View>}
          </View>
          <View style={[layout.body, wide && layout.bodyWide]}>
            <Text style={layout.eyebrow}>BEM-VINDO AO MEU PONTO</Text>
            <Text style={layout.title}>Entre na sua conta</Text>
            <Text style={layout.description}>Bom ter você por aqui. Vamos começar?</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput accessibilityLabel="E-mail" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={email} onChangeText={setEmail} maxLength={254} editable={!busy} placeholder="voce@exemplo.com" placeholderTextColor={colors.textSecondary} style={styles.input} />
            </View>
            <CampoSenha label="Senha" value={password} onChangeText={setPassword} disabled={busy} />
            <Pressable accessibilityRole="button" accessibilityLabel="Esqueci minha senha" onPress={() => router.push('/recuperar-senha')} disabled={busy} style={styles.forgot}>
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </Pressable>
            {(error || sessionError) && <View accessibilityRole="alert" style={styles.error}>
              <Text style={styles.errorText}>{error ?? sessionError}</Text>
              {sessionError && <Pressable accessibilityRole="button" onPress={retry} style={styles.back}><Text style={styles.linkText}>Tentar novamente</Text></Pressable>}
            </View>}
            <Pressable accessibilityRole="button" accessibilityLabel="Entrar" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={() => void login()}
              style={({ pressed }) => [layout.primaryButton, disabled && styles.disabled, pressed && styles.pressed]}>
              {busy || !ready ? <ActivityIndicator color={colors.onPrimary} /> : <><Text style={layout.primaryText}>Entrar</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></>}
            </Pressable>
            <View style={layout.signupRow}><Text style={layout.signupText}>Ainda não tem conta?</Text><Pressable accessibilityRole="button" accessibilityLabel="Criar conta" disabled={busy} onPress={() => router.push('/cadastro')} style={layout.signupLink}><Text style={styles.linkText}>Criar conta</Text></Pressable></View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
