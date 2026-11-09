import { placeholderStyles as styles } from '@/styles';
import { Text, View } from 'react-native';

export function EmBreve({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>Em breve</Text>
    </View>
  );
}
