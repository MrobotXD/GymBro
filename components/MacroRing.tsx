import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/lib/ThemeContext';
import { fonts } from '@/lib/theme';

interface Props {
  current: number;
  target: number;
  label: string;
  color: string;
  unit?: string;
  size?: number;
}

export default function MacroRing({ current, target, label, color, unit = 'g', size = 70 }: Props) {
  const { colors } = useTheme();
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(current / Math.max(target, 1), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.dot} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${circumference}`} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { color }]}>{current}</Text>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.target, { color: colors.textTertiary }]}>{target}{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 3 },
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.bold, fontSize: 14 },
  label: { fontFamily: fonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  target: { fontFamily: fonts.regular, fontSize: 10 },
});
