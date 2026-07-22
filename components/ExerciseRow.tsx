import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '@/lib/theme';
import { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  index: number;
  onPress?: () => void;
  completed?: boolean;
}

export default function ExerciseRow({ exercise, index, onPress, completed }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, completed && styles.completed]}
    >
      <View style={[styles.number, completed && styles.numberCompleted]}>
        {completed ? (
          <Ionicons name="checkmark" size={14} color={colors.success} />
        ) : (
          <Text style={styles.numberText}>{index + 1}</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, completed && styles.nameCompleted]}>{exercise.name}</Text>
        <Text style={styles.details}>
          {exercise.sets} series x {exercise.reps} reps
          {exercise.weight ? ` · ${exercise.weight}` : ''}
        </Text>
      </View>

      <View style={styles.rest}>
        <Ionicons name="timer-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.restText}>{exercise.restSeconds}s</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completed: {
    opacity: 0.5,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCompleted: {
    backgroundColor: colors.successDim,
  },
  numberText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
  },
  details: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textTertiary,
  },
});
