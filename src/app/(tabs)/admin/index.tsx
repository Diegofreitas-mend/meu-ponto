// Menu do painel administrativo.
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { adminStyles as styles } from '@/styles';
import { colors } from '@/tema';

const opcoes: { rota: Href; titulo: string; descricao: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { rota: '/admin/usuarios', titulo: 'Usuários', descricao: 'Criar contas, bloquear e definir quem é admin.', icone: 'people-outline' },
  { rota: '/admin/pontos', titulo: 'Pontos', descricao: 'Cadastrar, editar, publicar e despublicar pontos.', icone: 'location-outline' },
];

export default function AdminMenu() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Escolha o que deseja gerenciar.</Text>
      {opcoes.map(opcao => (
        <Pressable key={opcao.titulo} accessibilityRole="button" onPress={() => router.push(opcao.rota)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}><Ionicons name={opcao.icone} size={24} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{opcao.titulo}</Text>
              <Text style={styles.cardText}>{opcao.descricao}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
