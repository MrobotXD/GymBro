import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing } from '@/lib/theme';

const MONTHS = ['Ene', 'Feb', 'Mar'];
const WEEKS = 4;
const DAYS = 7;

const SEED = [
  [0.1,0.8,0.2,0.5,0.9,0.1,0.3, 0.6,0.1,0.4,0.7,0.2,0.8,0.1, 0.3,0.9,0.5,0.1,0.6,0.2,0.4, 0.7,0.3,0.1,0.8,0.5,0.2,0.9],
  [0.5,0.2,0.7,0.1,0.4,0.8,0.3, 0.1,0.6,0.9,0.2,0.5,0.1,0.7, 0.4,0.1,0.3,0.8,0.6,0.1,0.5, 0.2,0.9,0.4,0.1,0.7,0.3,0.6],
  [0.3,0.6,0.1,0.4,0.2,0.7,0.5, 0.8,0.1,0.3,0.6,0.9,0.2,0.4, 0.1,0.5,0.7,0.3,0.1,0.8,0.6, 0.4,0.2,0.9,0.1,0.5,0.3,0.7],
];

export default function HeatmapCalendar() {
  const { colors } = useTheme();

  const getDotColor = (val: number): string => {
    if (val > 0.7) return colors.dotBright;
    if (val > 0.4) return colors.dotActive;
    if (val > 0.15) return colors.textTertiary;
    return colors.dot;
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthsRow}>
        {MONTHS.map((month, mi) => (
          <View key={month} style={styles.monthCol}>
            <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{month}</Text>
            <View style={styles.grid}>
              {Array.from({ length: WEEKS }).map((_, wi) => (
                <View key={wi} style={styles.weekCol}>
                  {Array.from({ length: DAYS }).map((_, di) => (
                    <View
                      key={di}
                      style={[styles.dot, { backgroundColor: getDotColor(SEED[mi][wi * DAYS + di]) }]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm },
  monthsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  monthCol: { flex: 1, gap: spacing.sm },
  monthLabel: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
  grid: { flexDirection: 'row', justifyContent: 'center', gap: 3 },
  weekCol: { gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 1.5 },
});
