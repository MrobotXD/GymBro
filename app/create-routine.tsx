import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { EXERCISE_CATALOG } from '@/lib/groq';
import { searchExercise, ExerciseResult } from '@/lib/exercisedb';
import { savePlan, setActivePlan } from '@/lib/storage';
import { WorkoutPlan } from '@/lib/types';

const GITHUB_RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';

const MUSCLE_LABELS: Record<string, string> = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', piernas: 'Piernas',
  gluteos: 'Glúteos', pantorrillas: 'Pantorrillas', core: 'Core',
};

interface RoutineExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

function ExerciseGif({ name }: { name: string }) {
  const { colors, isDark } = useTheme();
  const [gif, setGif] = useState<ExerciseResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    searchExercise(name).then(r => {
      if (!cancelled) { setGif(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [name]);

  if (loading) return <View style={[s.gif, { backgroundColor: colors.inputBg }]}><ActivityIndicator size="small" color={colors.accent} /></View>;
  if (!gif?.gifUrl) return <View style={[s.gif, { backgroundColor: colors.inputBg }]}><Ionicons name="barbell-outline" size={20} color={colors.textTertiary} /></View>;
  return <Image source={{ uri: gif.gifUrl }} style={[s.gif, { backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }]} resizeMode="contain" />;
}

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [routineName, setRoutineName] = useState('Mi rutina');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const allMuscles = Object.keys(EXERCISE_CATALOG);

  const filteredExercises = (() => {
    const groups = filterMuscle ? [filterMuscle] : allMuscles;
    const items: { name: string; muscle: string }[] = [];
    for (const g of groups) {
      for (const name of EXERCISE_CATALOG[g] || []) {
        items.push({ name, muscle: g });
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  })();

  const addExercise = (name: string, muscle: string) => {
    if (exercises.find(e => e.name === name)) return;
    setExercises(prev => [...prev, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name, muscleGroup: muscle, sets: 3, reps: '10-12', restSeconds: 60,
    }]);
    setShowCatalog(false);
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      const msg = 'Agrega al menos un ejercicio';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }
    const planId = Date.now().toString(36);
    const plan: WorkoutPlan = {
      id: planId,
      name: routineName || 'Mi rutina',
      description: 'Rutina personalizada',
      level: 'intermedio',
      goal: 'mantener',
      daysPerWeek: 1,
      weeks: 4,
      days: [{
        id: `${planId}_d0`,
        dayNumber: 1,
        name: routineName || 'Mi rutina',
        focus: [...new Set(exercises.map(e => MUSCLE_LABELS[e.muscleGroup] || e.muscleGroup))].join(', '),
        completed: false,
        exercises: exercises.map((e, j) => ({
          id: `${planId}_d0_e${j}`,
          name: e.name,
          muscleGroup: e.muscleGroup,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          weight: '',
          notes: '',
        })),
      }],
      createdAt: new Date().toISOString(),
      currentWeek: 1,
      currentDay: 0,
    };
    await savePlan(plan);
    await setActivePlan(plan.id);
    router.back();
  };

  if (showCatalog) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.handleRow}><View style={[styles.dragHandle, { backgroundColor: colors.textTertiary }]} /></View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setShowCatalog(false)} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>Ejercicios</Text>
          <Text style={[styles.countBadge, { color: colors.textTertiary }]}>{exercises.length} agregados</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilterMuscle(null)}
            style={[styles.filterChip, { backgroundColor: !filterMuscle ? colors.accentDim : 'transparent', borderColor: !filterMuscle ? colors.accent : colors.separator }]}
          >
            <Text style={[styles.filterText, { color: !filterMuscle ? colors.accent : colors.textSecondary }]}>Todos</Text>
          </TouchableOpacity>
          {allMuscles.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setFilterMuscle(filterMuscle === m ? null : m)}
              style={[styles.filterChip, { backgroundColor: filterMuscle === m ? colors.accentDim : 'transparent', borderColor: filterMuscle === m ? colors.accent : colors.separator }]}
            >
              <Text style={[styles.filterText, { color: filterMuscle === m ? colors.accent : colors.textSecondary }]}>{MUSCLE_LABELS[m]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.catalogContent}>
          {filteredExercises.map((item, idx) => {
            const added = exercises.some(e => e.name === item.name);
            return (
              <TouchableOpacity
                key={`${item.muscle}_${item.name}`}
                onPress={() => addExercise(item.name, item.muscle)}
                disabled={added}
                style={[styles.catalogRow, { borderBottomColor: colors.separator, opacity: added ? 0.4 : 1 }]}
                activeOpacity={0.6}
              >
                <ExerciseGif name={item.name} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.catalogName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.catalogMuscle, { color: colors.textTertiary }]}>{MUSCLE_LABELS[item.muscle]}</Text>
                </View>
                {added ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                ) : (
                  <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.handleRow}><View style={[styles.dragHandle, { backgroundColor: colors.textTertiary }]} /></View>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Crear rutina</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={8}>
          <Text style={[styles.saveText, { color: colors.accent }]}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.nameCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TextInput
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="Nombre de la rutina"
            placeholderTextColor={colors.textTertiary}
            style={[styles.nameInput, { color: colors.text }]}
          />
        </View>

        {exercises.length > 0 && (
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {exercises.map((ex, i) => (
              <View key={ex.id} style={[styles.exRow, i < exercises.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
                <ExerciseGif name={ex.name} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: colors.text }]}>{ex.name}</Text>
                  <Text style={[styles.exMeta, { color: colors.textTertiary }]}>{ex.sets}x{ex.reps} · {ex.restSeconds}s</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(ex.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowCatalog(true)}
          style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          activeOpacity={0.7}
        >
          <Ionicons name="add-outline" size={20} color={colors.accent} />
          <Text style={[styles.addBtnText, { color: colors.text }]}>Agregar ejercicio</Text>
        </TouchableOpacity>

        {exercises.length === 0 && (
          <View style={styles.emptyHint}>
            <Ionicons name="barbell-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Agrega ejercicios del catálogo para armar tu rutina</Text>
          </View>
        )}
      </ScrollView>

      {exercises.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleSave} style={[styles.primaryBtn, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Guardar rutina ({exercises.length} ejercicios)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  gif: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  dragHandle: { width: 36, height: 5, borderRadius: 2.5, opacity: 0.35 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 12 },
  navTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 17, letterSpacing: -0.2 },
  countBadge: { fontFamily: fonts.regular, fontSize: 13 },
  saveText: { fontFamily: fonts.semibold, fontSize: 16 },

  searchRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },

  filterRow: { paddingHorizontal: spacing.xl, gap: 6, paddingBottom: spacing.md },
  filterChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  filterText: { fontFamily: fonts.medium, fontSize: 12 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 120 },
  catalogContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },

  nameCard: { borderRadius: radius.card, borderWidth: 0.5, overflow: 'hidden', padding: 14 },
  nameInput: { fontFamily: fonts.semibold, fontSize: 16 },

  listCard: { borderRadius: radius.card, borderWidth: 0.5, overflow: 'hidden' },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  exName: { fontFamily: fonts.semibold, fontSize: 14 },
  exMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },

  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5 },
  catalogName: { fontFamily: fonts.semibold, fontSize: 14 },
  catalogMuscle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg, borderRadius: radius.card, borderWidth: 1 },
  addBtnText: { fontFamily: fonts.semibold, fontSize: 14 },

  emptyHint: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.xl },

  bottomBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: Platform.OS === 'web' ? spacing.lg : 34 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: fonts.semibold, fontSize: 17, color: '#fff', letterSpacing: -0.2 },
});
