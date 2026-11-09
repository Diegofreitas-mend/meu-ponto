// Campo usado em login e cadastro. O olho alterna a visibilidade da senha.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/tema';
import { authStyles as styles } from '@/styles';

export function CampoSenha({ label, value, onChangeText, disabled, confirmation = false, newPassword = false }: {
  label: string; value: string; onChangeText: (value: string) => void; disabled: boolean; confirmation?: boolean; newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordBox}>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} editable={!disabled}
        secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
        autoComplete={newPassword || confirmation ? 'new-password' : 'current-password'}
        textContentType={newPassword || confirmation ? 'newPassword' : 'password'}
        placeholder={confirmation ? 'Repita sua senha' : newPassword ? 'Crie uma senha' : 'Sua senha'} placeholderTextColor={colors.textSecondary}
        style={styles.passwordInput} />
      <Pressable disabled={disabled} onPress={() => setVisible(previous => !previous)}
        accessibilityRole="button" accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
        style={styles.eye}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.primary} /></Pressable>
    </View>
  </View>;
}
