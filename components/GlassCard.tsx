import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { radius, spacing } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  onPress?: () => void;
}

export default function GlassCard({ children, style, noPadding, onPress }: Props) {
  const { colors } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: noPadding ? 0 : spacing.lg,
    ...((style as any) || {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
