import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { radius, spacing, fonts } from '@/lib/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export default function GlassButton({ title, onPress, variant = 'primary', disabled, loading, style, small }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  const bgColor = isPrimary
    ? colors.card
    : isGhost
    ? 'transparent'
    : colors.card;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          borderRadius: radius.md,
          paddingVertical: small ? 8 : 14,
          paddingHorizontal: small ? spacing.lg : spacing.xxl,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          backgroundColor: bgColor,
          borderWidth: isGhost ? 0 : 1,
          borderColor: colors.cardBorder,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <Text style={{
          fontFamily: fonts.semibold,
          fontSize: small ? 13 : 15,
          color: isPrimary ? colors.text : colors.textSecondary,
        }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
