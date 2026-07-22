import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';

interface Props {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  right?: React.ReactNode;
}

export default function Header({ title, subtitle, onAdd, right }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 14 }]}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {onAdd && (
          <TouchableOpacity onPress={onAdd} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="add-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
