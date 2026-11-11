import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CampoSenha } from '@/components/CampoSenha';
import { getSessionAuth } from '@/firebase';
import { useAuth } from '@/sessao';
import { authStyles as styles } from '@/styles';
import { colors } from '@/tema';
import { authErrorMessage, validateAuthForm } from '@/validacoes';

export default function RegisterScreen() {
  // 1. Dados digitados. A senha existe somente na memória do formulário.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const { user, ready, error: sessionError, retry, refreshSession, setNotice } = useAuth();
  const disabled = busy || !ready || !!sessionError;

  // 2. Cria a conta no Authentication e salva o nome no usuário.
  async function register() {
    if (locked.current || !ready || sessionError) return;
    const validation = validateAuthForm({ name, email, password, confirmation });
    if (validation) { setError(validation); return; }
    locked.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const credential = await createUserWithEmailAndPassword(getSessionAuth(), email.trim(), password);
      try { await updateProfile(credential.user, { displayName: name.trim() }); }
      catch { setNotice('Sua conta foi criada, mas não foi possível salvar seu nome. Seu acesso já está disponível.'); }
      refreshSession();
      setPassword('');
      setConfirmation('');
      router.replace('/inicio');
    } catch (cause) { setError(authErrorMessage(cause)); }
    finally { locked.current = false; setBusy(false); }
  }

  if (ready && user && !busy) return <Redirect href="/inicio" />;

  // 3. Parte visual. Login e cadastro compartilham os mesmos estilos.
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao início" onPress={() => router.replace('/')} disabled={busy} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} /><Text style={styles.linkText}>Início</Text>
          </Pressable>
          <View style={styles.brand}><Image source={require('@/assets/brand/meu-ponto-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Meu Ponto" /></View>
          <Text style={styles.title}>Vamos criar sua conta?</Text>
          <Text style={styles.subtitle}>Faça parte de uma cidade mais bem informada.</Text>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput accessibilityLabel="Nome" autoComplete="name" textContentType="name" autoCapitalize="words" value={name} onChangeText={setName} maxLength={80} editable={!busy} placeholder="Como podemos chamar você?" placeholderTextColor={colors.textSecondary} style={styles.input} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput accessibilityLabel="E-mail" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} maxLength={254} editable={!busy} placeholder="voce@exemplo.com" placeholderTextColor={colors.textSecondary} style={styles.input} />
            </View>
            <CampoSenha label="Senha" value={password} onChangeText={setPassword} disabled={busy} newPassword />
            <Text style={styles.hint}>Use pelo menos 8 caracteres. Não compartilhe sua senha.</Text>
            <CampoSenha label="Confirmar senha" value={confirmation} onChangeText={setConfirmation} disabled={busy} confirmation />

            {(error || sessionError) && <View accessibilityRole="alert" style={styles.error}>
              <Text style={styles.errorText}>{error ?? sessionError}</Text>
              {sessionError && <Pressable accessibilityRole="button" onPress={retry} style={styles.back}><Text style={styles.linkText}>Tentar novamente</Text></Pressable>}
            </View>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={() => void register()} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed]}>
              {busy || !ready ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Criar conta</Text>}
            </Pressable>
          </View>

          <Text style={styles.switchText}>Já tem uma conta?</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.replace('/login')} style={styles.secondaryButton}><Text style={styles.linkText}>Entrar na minha conta</Text></Pressable>
          <Text style={styles.footer}>Seu próximo ponto começa com informação.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
