import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { searchExercise, ExerciseResult } from '@/lib/exercisedb';

interface Props {
  exerciseName: string;
  size?: number;
}

export default function ExerciseAnimation({ exerciseName, size = 150 }: Props) {
  const { colors, isDark } = useTheme();
  const [exercise, setExercise] = useState<ExerciseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    searchExercise(exerciseName).then(result => {
      if (cancelled) return;
      setExercise(result);
      setLoading(false);
      if (!result) setError(true);
    });

    return () => { cancelled = true; };
  }, [exerciseName]);

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.placeholder, { width: size, height: size, backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (error || !exercise?.gifUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.placeholder, { width: size, height: size, backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.fallbackIcon, { color: colors.accent }]}>🏋️</Text>
          <Text style={[styles.fallbackName, { color: colors.textSecondary }]} numberOfLines={2}>
            {exerciseName}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size + 30 }]}>
      <View style={[styles.gifWrapper, { width: size, height: size, borderColor: colors.cardBorder, backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
        <Image
          source={{ uri: exercise.gifUrl }}
          style={{ width: size - 8, height: size - 8, borderRadius: radius.md - 2 }}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.muscleLabel, { color: colors.accent }]} numberOfLines={1}>
        {exercise.target}{exercise.secondaryMuscles?.length > 0 ? ` · ${exercise.secondaryMuscles.join(' · ')}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  placeholder: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: { fontFamily: fonts.regular, fontSize: 11 },
  fallbackIcon: { fontSize: 32 },
  fallbackName: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center', paddingHorizontal: 12 },
  gifWrapper: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
    marginTop: 4,
  },
});
