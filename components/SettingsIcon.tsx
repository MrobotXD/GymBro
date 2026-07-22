import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/lib/theme';

interface Props {
  size?: number;
}

export default function SettingsIcon({ size = 18 }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="options-outline" size={size} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
