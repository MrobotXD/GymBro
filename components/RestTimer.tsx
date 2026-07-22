import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, radius, spacing } from '@/lib/theme';

interface Props {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({ seconds, onComplete, onSkip }: Props) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState(seconds);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 0, duration: seconds * 1000, useNativeDriver: false }).start();
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.container, { backgroundColor: colors.accentDim, borderColor: colors.cardBorder }]}>
      <View style={styles.content}>
        <Ionicons name="timer-outline" size={18} color={colors.accent} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Descanso</Text>
        <Text style={[styles.time, { color: colors.text }]}>{mins}:{secs.toString().padStart(2, '0')}</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={[styles.skipText, { color: colors.accent }]}>Saltar</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.dot }]}>
        <Animated.View style={[styles.bar, { width: barWidth, backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 10 },
  label: { fontFamily: fonts.medium, fontSize: 14, flex: 1 },
  time: { fontFamily: fonts.bold, fontSize: 22, fontVariant: ['tabular-nums'] },
  skipText: { fontFamily: fonts.medium, fontSize: 13, paddingLeft: 12 },
  barBg: { height: 3 },
  bar: { height: 3 },
});
