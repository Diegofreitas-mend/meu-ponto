import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CampoSenha } from '@/components/CampoSenha';
import { needsNewCode, recoveryError, requestResetCode, resetWithCode } from '@/recuperacao';
import type { ResetChallenge } from '@/recuperacao';
import { authStyles as styles, recoveryStyles as recovery } from '@/styles';
import { colors } from '@/tema';
import { isValidEmail, validateAuthForm } from '@/validacoes';

export default function RecoverPasswordScreen() {
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState<ResetChallenge | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = useRef(false);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expired = !!challenge && now >= expiresAt;

  useEffect(() => {
    if (success) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [success]);

  async function sendCode() {
    if (locked.current || seconds > 0) return;
    if (!isValidEmail(email)) { setError('Informe um e-mail válido.'); return; }
    locked.current = true; setBusy(true); setError(null);
    try {
      const result = await requestResetCode(email);
      const time = Date.now();
      setChallenge(result); setNow(time);
      setResendAt(time + result.resendAfterSeconds * 1000);
      setExpiresAt(time + result.expiresInSeconds * 1000);
      setCode(''); setPassword(''); setConfirmation('');
    } catch (cause) { setError(recoveryError(cause)); }
    finally { locked.current = false; setBusy(false); }
  }

  async function changePassword() {
    if (locked.current || !challenge) return;
    if (expired) { setError('O código expirou. Solicite um novo para continuar.'); return; }
    if (!/^\d{6}$/.test(code)) { setError('Digite os 6 números recebidos por e-mail.'); return; }
    const validation = validateAuthForm({ email, password, confirmation });
    if (validation) { setError(validation); return; }
    if (password.length > 128) { setError('Use uma senha com até 128 caracteres.'); return; }
    locked.current = true; setBusy(true); setError(null);
    try {
      await resetWithCode(challenge.challengeId, code, password);
      setCode(''); setPassword(''); setConfirmation(''); setSuccess(true);
    } catch (cause) {
      setError(recoveryError(cause));
      if (needsNewCode(cause)) {
        setChallenge(null); setCode(''); setPassword(''); setConfirmation('');
      }
    } finally { locked.current = false; setBusy(false); }
  }

  return <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao login" disabled={busy} onPress={() => router.replace('/login')} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} /><Text style={styles.linkText}>Voltar ao login</Text>
        </Pressable>
        <View style={recovery.icon}><Ionicons name={success ? 'checkmark-circle-outline' : 'mail-outline'} size={32} color={colors.primary} /></View>
        <Text style={styles.title}>{success ? 'Senha atualizada!' : challenge ? 'Confira seu e-mail' : 'Esqueceu sua senha?'}</Text>
        <Text style={styles.subtitle}>{success ? 'Agora você pode entrar com sua nova senha.' : challenge ? 'Se houver uma conta com acesso por senha, enviaremos um código de 6 números. Confira também o spam.' : 'Informe o e-mail da sua conta para receber um código de recuperação.'}</Text>

        {success ? <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.primaryButton}><Text style={styles.primaryText}>Ir para o login</Text></Pressable> : <View style={styles.card}>
          {challenge ? <>
            <Text style={recovery.email}>{email.trim()}</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Código de recuperação</Text>
              <TextInput accessibilityLabel="Código de recuperação" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" autoCorrect={false} editable={!busy} maxLength={6}
                placeholder="000000" placeholderTextColor={colors.textSecondary} style={[styles.input, recovery.code]} />
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.hint}>{expired ? 'O código expirou. Solicite um novo abaixo.' : 'O código vale por 10 minutos. O reenvio invalida o anterior.'}</Text>
            <CampoSenha label="Nova senha" value={password} onChangeText={setPassword} disabled={busy} newPassword />
            <Text style={styles.hint}>Use pelo menos 8 caracteres.</Text>
            <CampoSenha label="Confirmar nova senha" value={confirmation} onChangeText={setConfirmation} disabled={busy} confirmation />
          </> : <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput accessibilityLabel="E-mail de recuperação" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              value={email} onChangeText={setEmail} maxLength={254} editable={!busy} placeholder="voce@exemplo.com" placeholderTextColor={colors.textSecondary} style={styles.input} />
          </View>}

          {error && <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
          <Pressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy || (!challenge && seconds > 0) || expired }}
            disabled={busy || (!challenge && seconds > 0) || expired} onPress={() => void (challenge ? changePassword() : sendCode())}
            style={({ pressed }) => [styles.primaryButton, (busy || expired || (!challenge && seconds > 0)) && styles.disabled, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>{challenge ? 'Salvar nova senha' : seconds > 0 ? `Aguarde ${seconds}s` : 'Enviar código'}</Text>}
          </Pressable>
          {challenge && <>
            <Pressable accessibilityRole="button" disabled={busy || seconds > 0} onPress={() => void sendCode()} style={recovery.action}>
              <Text style={[styles.linkText, (busy || seconds > 0) && styles.disabled]}>{seconds > 0 ? `Reenviar código em ${seconds}s` : 'Reenviar código'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setChallenge(null); setError(null); setCode(''); setPassword(''); setConfirmation(''); }} style={recovery.action}>
              <Text style={styles.linkText}>Usar outro e-mail</Text>
            </Pressable>
          </>}
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
