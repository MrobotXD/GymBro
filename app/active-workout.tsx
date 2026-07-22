import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import RestTimer from '@/components/RestTimer';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { WorkoutDay, ExerciseSet, WorkoutPlan } from '@/lib/types';
import { getPlans, savePlan } from '@/lib/storage';
import { awardWorkoutXP, getRank, getNextRank } from '@/lib/ranks';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [day, setDay] = useState<WorkoutDay | null>(null);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[][]>([]);
  const [showRest, setShowRest] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    (async () => {
      const plans = await getPlans();
      const p = plans.find(p => p.id === planId);
      if (!p) return;
      setPlan(p);
      const d = p.days.find(d => d.id === dayId);
      if (!d) return;
      setDay(d);
      setSets(d.exercises.map(ex => Array.from({ length: ex.sets }, (_, i) => ({ setNumber: i + 1, reps: parseInt(ex.reps) || 10, weight: 0, completed: false }))));
    })();
  }, [planId, dayId]);

  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);


  if (!day || sets.length === 0) return null;

  const ex = day.exercises[currentExIndex];
  const curSets = sets[currentExIndex];
  const toggleSet = (i: number) => {
    const u = [...sets]; const s = { ...u[currentExIndex][i] }; s.completed = !s.completed; u[currentExIndex] = [...u[currentExIndex]]; u[currentExIndex][i] = s; setSets(u);
    if (s.completed && i < curSets.length - 1) setShowRest(true);
  };
  const updateVal = (i: number, f: 'reps' | 'weight', d: number) => { const u = [...sets]; const s = { ...u[currentExIndex][i] }; (s as any)[f] = Math.max(0, (s as any)[f] + d); u[currentExIndex] = [...u[currentExIndex]]; u[currentExIndex][i] = s; setSets(u); };
  const finishWorkout = async () => {
    if (!plan || !day || finishing) return;
    setFinishing(true);
    try {
      const u = { ...plan };
      const di = u.days.findIndex(d => d.id === dayId);
      if (di >= 0) u.days[di] = { ...u.days[di], completed: true, completedAt: new Date().toISOString() };
      await savePlan(u);

      const completedExCount = day.exercises.length;
      const allSetsCompleted = sets.flat().every(s => s.completed);
      const xpResult = await awardWorkoutXP(completedExCount, allSetsCompleted);

      const msg = `+${xpResult.total} XP ganados\n${xpResult.breakdown.map(b => `  ${b.reason}: +${b.xp}`).join('\n')}`;
      if (Platform.OS === 'web') {
        window.alert(`¡Entrenamiento completado!\n\n${msg}`);
        router.back();
      } else {
        Alert.alert('¡Entrenamiento completado!', msg, [{ text: 'Genial', onPress: () => router.back() }]);
      }
    } finally {
      setFinishing(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const total = sets.flat().length;
  const done = sets.flat().filter(s => s.completed).length;
  const allDone = done === total;

  const handleFinishPress = () => {
    if (finishing) return;
    if (allDone) {
      finishWorkout();
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('¿Terminar el entreno sin completar todas las series?')) finishWorkout();
    } else {
      Alert.alert('Terminar?', '¿Terminar el entreno sin completar todas las series?', [
        { text: 'No', style: 'cancel' },
        { text: 'Si', onPress: finishWorkout },
      ]);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="close-outline" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.timerText, { color: colors.text }]}>{fmt(elapsed)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accentDim, borderColor: colors.cardBorder }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>{done}/{total}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => { if (currentExIndex > 0) { setCurrentExIndex(currentExIndex - 1); setShowRest(false); } }} disabled={currentExIndex === 0} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="chevron-back-outline" size={16} color={currentExIndex === 0 ? colors.textTertiary : colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>{currentExIndex + 1} / {day.exercises.length}</Text>
          <TouchableOpacity onPress={() => { if (currentExIndex < day.exercises.length - 1) { setCurrentExIndex(currentExIndex + 1); setShowRest(false); } }} disabled={currentExIndex === day.exercises.length - 1} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="chevron-forward-outline" size={16} color={currentExIndex === day.exercises.length - 1 ? colors.textTertiary : colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.animArea}>
          <ExerciseAnimation exerciseName={ex.name} size={180} />
        </View>

        <Text style={[styles.exName, { color: colors.text }]}>{ex.name}</Text>
        <Text style={[styles.exMuscle, { color: colors.textTertiary }]}>{ex.muscleGroup.replace('_', ' ')}</Text>
        {ex.notes && <Text style={[styles.exNotes, { color: colors.textTertiary }]}>{ex.notes}</Text>}

        {showRest && <RestTimer seconds={ex.restSeconds} onComplete={() => setShowRest(false)} onSkip={() => setShowRest(false)} />}

        <GlassCard>
          <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.th, styles.cSet, { color: colors.textTertiary }]}>Serie</Text>
            <Text style={[styles.th, styles.cReps, { color: colors.textTertiary }]}>Reps</Text>
            <Text style={[styles.th, styles.cWeight, { color: colors.textTertiary }]}>Peso</Text>
            <Text style={[styles.th, styles.cDone]} />
          </View>
          {curSets.map((set, i) => (
            <View key={i} style={[styles.tRow, set.completed && { opacity: 0.4 }]}>
              <Text style={[styles.tCell, styles.cSet, { color: colors.text }]}>{set.setNumber}</Text>
              <View style={[styles.cReps, styles.stepper]}>
                <TouchableOpacity onPress={() => updateVal(i, 'reps', -1)} style={[styles.sBtn, { backgroundColor: colors.inputBg }]}><Text style={[styles.sBtnT, { color: colors.textSecondary }]}>-</Text></TouchableOpacity>
                <Text style={[styles.sVal, { color: colors.text }]}>{set.reps}</Text>
                <TouchableOpacity onPress={() => updateVal(i, 'reps', 1)} style={[styles.sBtn, { backgroundColor: colors.inputBg }]}><Text style={[styles.sBtnT, { color: colors.textSecondary }]}>+</Text></TouchableOpacity>
              </View>
              <View style={[styles.cWeight, styles.stepper]}>
                <TouchableOpacity onPress={() => updateVal(i, 'weight', -2.5)} style={[styles.sBtn, { backgroundColor: colors.inputBg }]}><Text style={[styles.sBtnT, { color: colors.textSecondary }]}>-</Text></TouchableOpacity>
                <Text style={[styles.sVal, { color: colors.text }]}>{set.weight}</Text>
                <TouchableOpacity onPress={() => updateVal(i, 'weight', 2.5)} style={[styles.sBtn, { backgroundColor: colors.inputBg }]}><Text style={[styles.sBtnT, { color: colors.textSecondary }]}>+</Text></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => toggleSet(i)} style={styles.cDone}>
                <Ionicons name={set.completed ? 'checkmark-circle-outline' : 'ellipse-outline'} size={20} color={set.completed ? colors.success : colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        <GlassCard>
          <Text style={[styles.listTitle, { color: colors.textSecondary }]}>Ejercicios</Text>
          {day.exercises.map((e, i) => {
            const eDone = sets[i]?.every(s => s.completed);
            const cur = i === currentExIndex;
            return (
              <TouchableOpacity key={e.id} onPress={() => { setCurrentExIndex(i); setShowRest(false); }} style={[styles.miniRow, cur && { backgroundColor: colors.inputBg, borderRadius: radius.sm, marginHorizontal: -8, paddingHorizontal: 8 }]}>
                <View style={[styles.miniDot, { backgroundColor: eDone ? colors.success : cur ? colors.accent : colors.dot }]} />
                <Text style={[styles.miniName, { color: eDone ? colors.textTertiary : colors.text }, eDone && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{e.name}</Text>
                <Text style={[styles.miniSets, { color: colors.textTertiary }]}>{e.sets}x{e.reps}</Text>
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        <TouchableOpacity onPress={handleFinishPress} disabled={finishing} style={[styles.finishBtn, { backgroundColor: allDone ? colors.accent : colors.card, borderWidth: allDone ? 0 : 1, borderColor: colors.cardBorder, opacity: finishing ? 0.6 : 1 }]} activeOpacity={0.7}>
          <Text style={[styles.finishBtnText, { color: allDone ? '#fff' : colors.text }]}>{finishing ? 'Guardando...' : allDone ? 'Completar entreno' : 'Terminar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: { fontFamily: fonts.bold, fontSize: 17, fontVariant: ['tabular-nums'] },
  badge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 100 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  navText: { fontFamily: fonts.semibold, fontSize: 13 },
  animArea: { alignItems: 'center', justifyContent: 'center', height: 220 },
  exName: { fontFamily: fonts.bold, fontSize: 20, textAlign: 'center' },
  exMuscle: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center', textTransform: 'capitalize' },
  exNotes: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, marginBottom: 4 },
  th: { fontFamily: fonts.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  tRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  tCell: { fontFamily: fonts.semibold, fontSize: 14 },
  cSet: { width: 44, textAlign: 'center' as any },
  cReps: { flex: 1 },
  cWeight: { flex: 1 },
  cDone: { width: 36, alignItems: 'center' as any, justifyContent: 'center' as any },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sBtnT: { fontFamily: fonts.bold, fontSize: 13 },
  sVal: { fontFamily: fonts.bold, fontSize: 14, minWidth: 28, textAlign: 'center' },
  listTitle: { fontFamily: fonts.semibold, fontSize: 13, marginBottom: 6 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  miniDot: { width: 7, height: 7, borderRadius: 3.5 },
  miniName: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  miniSets: { fontFamily: fonts.regular, fontSize: 11 },
  finishBtn: { alignItems: 'center', paddingVertical: 16, borderRadius: radius.md },
  finishBtnText: { fontFamily: fonts.bold, fontSize: 15 },
});
