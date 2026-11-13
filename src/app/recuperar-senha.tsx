import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendResetLink, recoveryError } from '@/recuperacao';
import { authStyles as styles, recoveryStyles as recovery } from '@/styles';
import { colors } from '@/tema';
import { isValidEmail } from '@/validacoes';

export default function RecoverPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const locked = useRef(false);

  async function sendLink() {
    if (locked.current) return;
    if (!isValidEmail(email)) { setError('Informe um e-mail válido.'); return; }
    locked.current = true; setBusy(true); setError(null);
    try {
      await sendResetLink(email);
      setSuccess(true);
    } catch (cause) { 
      setError(recoveryError(cause)); 
    } finally { 
      locked.current = false; setBusy(false); 
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao login" disabled={busy} onPress={() => router.replace('/login')} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.linkText}>Voltar ao login</Text>
          </Pressable>
          <View style={recovery.icon}>
            <Ionicons name={success ? 'checkmark-circle-outline' : 'mail-outline'} size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>{success ? 'E-mail enviado!' : 'Esqueceu sua senha?'}</Text>
          <Text style={styles.subtitle}>
            {success 
              ? 'Enviamos um link de recuperação para o seu e-mail. Clique nele para criar uma nova senha.' 
              : 'Informe o e-mail da sua conta para receber o link de redefinição de senha.'}
          </Text>

          {success ? (
            <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Ir para o login</Text>
            </Pressable>
          ) : (
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput accessibilityLabel="E-mail" autoComplete="email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  value={email} onChangeText={setEmail} maxLength={254} editable={!busy} placeholder="voce@exemplo.com" placeholderTextColor={colors.textSecondary} style={styles.input} />
              </View>
              {error && <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => void sendLink()} style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.pressed]}>
                {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Enviar link</Text>}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}