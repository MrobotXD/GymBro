import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { FormStepper } from '@/components/FormField';
import MuscleMap from '@/components/MuscleMap';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { getProfile, savePlan, setActivePlan } from '@/lib/storage';
import { generateWorkoutPlan } from '@/lib/groq';
import { Level, Goal } from '@/lib/types';

const EQUIPMENT_OPTIONS = [
  { id: 'peso_corporal', label: 'Peso corporal', icon: 'body-outline' },
  { id: 'mancuernas', label: 'Mancuernas', icon: 'barbell-outline' },
  { id: 'barra', label: 'Barra', icon: 'remove-outline' },
  { id: 'kettlebells', label: 'Kettlebells', icon: 'flame-outline' },
  { id: 'bandas', label: 'Bandas', icon: 'link-outline' },
  { id: 'maquinas', label: 'Máquinas', icon: 'cog-outline' },
  { id: 'barra_dominadas', label: 'Dominadas', icon: 'arrow-up-outline' },
  { id: 'banco', label: 'Banco', icon: 'bed-outline' },
  { id: 'poleas', label: 'Poleas', icon: 'swap-vertical-outline' },
  { id: 'trx', label: 'TRX', icon: 'git-branch-outline' },
];

const MUSCLE_OPTIONS = [
  { id: 'pecho', label: 'Pecho', icon: 'fitness-outline' },
  { id: 'espalda', label: 'Espalda', icon: 'body-outline' },
  { id: 'hombros', label: 'Hombros', icon: 'triangle-outline' },
  { id: 'biceps', label: 'Bíceps', icon: 'arm-outline' as any },
  { id: 'triceps', label: 'Tríceps', icon: 'hand-left-outline' },
  { id: 'core', label: 'Core / Abs', icon: 'grid-outline' },
  { id: 'piernas', label: 'Piernas', icon: 'walk-outline' },
  { id: 'gluteos', label: 'Glúteos', icon: 'ellipse-outline' },
];

const LEVELS: { value: Level; label: string; desc: string; icon: string }[] = [
  { value: 'principiante', label: 'Principiante', desc: 'Menos de 6 meses', icon: 'leaf-outline' },
  { value: 'intermedio', label: 'Intermedio', desc: '6 meses - 2 años', icon: 'flash-outline' },
  { value: 'avanzado', label: 'Avanzado', desc: 'Más de 2 años', icon: 'flame-outline' },
];

const GOALS: { value: Goal; label: string; desc: string; icon: string }[] = [
  { value: 'ganar_musculo', label: 'Ganar músculo', desc: 'Hipertrofia y volumen', icon: 'trending-up-outline' },
  { value: 'perder_grasa', label: 'Perder grasa', desc: 'Definición y corte', icon: 'flame-outline' },
  { value: 'fuerza', label: 'Fuerza', desc: 'Máxima fuerza', icon: 'barbell-outline' },
  { value: 'resistencia', label: 'Resistencia', desc: 'Aguante muscular', icon: 'pulse-outline' },
  { value: 'mantener', label: 'Mantener', desc: 'Mantener forma actual', icon: 'shield-outline' },
];

const TOTAL_STEPS = 4;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CreatePlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['peso_corporal']);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [level, setLevel] = useState<Level>('intermedio');
  const [goal, setGoal] = useState<Goal>('ganar_musculo');
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(60);
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(e => e !== id) : [...list, id]);
  };

  const handleNext = () => { if (step < TOTAL_STEPS - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); else router.back(); };
  const canAdvance = step === 0 ? selectedEquipment.length > 0 : step === 1 ? selectedMuscles.length > 0 : true;

  const handleGenerate = async () => {
    btnScale.value = withSequence(withSpring(0.95, { damping: 15 }), withSpring(1, { damping: 15 }));
    setLoading(true);
    try {
      const profile = await getProfile();
      const equipLabels = selectedEquipment.map(id => EQUIPMENT_OPTIONS.find(e => e.id === id)?.label || id);
      const muscleLabels = selectedMuscles.map(id => MUSCLE_OPTIONS.find(m => m.id === id)?.label || id);
      const plan = await generateWorkoutPlan({
        name: profile?.name || 'Bro', age: profile?.age || 25, weight: profile?.weight || 75, height: profile?.height || 175,
        level, goal, equipment: equipLabels, daysPerWeek: days, minutesPerSession: minutes, targetMuscles: muscleLabels,
      });
      await savePlan(plan);
      await setActivePlan(plan.id);
      router.back();
    } catch (err: any) {
      const msg = err.message || 'No se pudo generar el plan.';
      if (Platform.OS === 'web') window.alert(msg);
      else require('react-native').Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  const stepTitles = [
    { title: 'Equipamiento', subtitle: 'Selecciona lo que tienes disponible' },
    { title: 'Músculos', subtitle: 'Elige los grupos que quieres trabajar' },
    { title: 'Nivel y objetivo', subtitle: 'Personaliza tu plan' },
    { title: 'Duración', subtitle: 'Ajusta días y tiempo por sesión' },
  ];

  // iOS grouped-list row for multi-select
  const renderGroupedList = (
    items: { id: string; label: string; icon: string }[],
    selected: string[],
    onToggle: (id: string) => void,
  ) => (
    <Animated.View entering={FadeInRight.duration(250)} style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {items.map((item, idx) => {
        const sel = selected.includes(item.id);
        const isLast = idx === items.length - 1;
        return (
          <Animated.View key={item.id} entering={FadeInDown.delay(idx * 30).duration(200)}>
            <TouchableOpacity
              onPress={() => onToggle(item.id)}
              activeOpacity={0.6}
              style={[styles.groupedRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}
            >
              <View style={[styles.groupedIcon, { backgroundColor: sel ? colors.accentDim : colors.inputBg }]}>
                <Ionicons name={item.icon as any} size={18} color={sel ? colors.accent : colors.textSecondary} />
              </View>
              <Text style={[styles.groupedLabel, { color: colors.text }]}>{item.label}</Text>
              {sel ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.separator }]} />
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </Animated.View>
  );

  // iOS grouped-list row for single-select
  const renderRadioList = (
    items: { value: string; label: string; desc: string; icon: string }[],
    selected: string,
    onSelect: (v: string) => void,
    baseDelay: number,
  ) => (
    <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {items.map((item, idx) => {
        const sel = selected === item.value;
        const isLast = idx === items.length - 1;
        return (
          <Animated.View key={item.value} entering={FadeInDown.delay(baseDelay + idx * 40).duration(250)}>
            <TouchableOpacity
              onPress={() => onSelect(item.value)}
              activeOpacity={0.6}
              style={[styles.groupedRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}
            >
              <View style={[styles.groupedIcon, { backgroundColor: sel ? colors.accentDim : colors.inputBg }]}>
                <Ionicons name={item.icon as any} size={18} color={sel ? colors.accent : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupedLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.groupedDesc, { color: colors.textTertiary }]}>{item.desc}</Text>
              </View>
              {sel ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.separator }]} />
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Drag handle */}
      <View style={styles.handleRow}>
        <View style={[styles.dragHandle, { backgroundColor: colors.textTertiary }]} />
      </View>

      {/* Nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handleBack} hitSlop={8}>
          <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={28} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{stepTitles[step].title}</Text>
        <Text style={[styles.stepBadge, { color: colors.textTertiary }]}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      {/* Progress */}
      <View style={[styles.progressBar, { backgroundColor: colors.inputBg }]}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{stepTitles[step].subtitle}</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 && renderGroupedList(EQUIPMENT_OPTIONS, selectedEquipment, id => toggle(selectedEquipment, setSelectedEquipment, id))}
        {step === 1 && (
          <Animated.View entering={FadeInRight.duration(250)}>
            <MuscleMap selected={selectedMuscles} onToggle={id => toggle(selectedMuscles, setSelectedMuscles, id)} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight.duration(250)} style={styles.stepContent}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>NIVEL</Text>
            {renderRadioList(LEVELS, level, v => setLevel(v as Level), 0)}
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, marginTop: spacing.xl }]}>OBJETIVO</Text>
            {renderRadioList(GOALS, goal, v => setGoal(v as Goal), 150)}
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight.duration(250)} style={styles.stepContent}>
            <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.stepperCell, { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
                <FormStepper label="Días por semana" value={days} min={2} max={6} unit="días" onValueChange={setDays} />
              </View>
              <View style={styles.stepperCell}>
                <FormStepper label="Minutos por sesión" value={minutes} min={20} max={120} step={5} unit="min" onValueChange={setMinutes} />
              </View>
            </View>

            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.summaryCell}>
                  <Ionicons name="sparkles" size={16} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumen</Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>
                      {selectedEquipment.length} equipos · {selectedMuscles.length} músculos · {LEVELS.find(l => l.value === level)?.label}
                    </Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>
                      {GOALS.find(g => g.value === goal)?.label} · {days}d/sem · {minutes}min
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomBar}>
        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canAdvance}
            style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: canAdvance ? 1 : 0.35 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Continuar</Text>
          </TouchableOpacity>
        ) : (
          <AnimatedTouchable
            onPress={handleGenerate}
            disabled={loading}
            style={[styles.primaryBtn, btnAnimStyle, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
            activeOpacity={0.8}
          >
            {loading ? (
              <Text style={styles.primaryBtnText}>Generando...</Text>
            ) : (
              <Text style={styles.primaryBtnText}>Generar plan con IA</Text>
            )}
          </AnimatedTouchable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  dragHandle: { width: 36, height: 5, borderRadius: 2.5, opacity: 0.35 },

  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 12 },
  navTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 17, letterSpacing: -0.2 },
  stepBadge: { fontFamily: fonts.regular, fontSize: 13 },

  progressBar: { height: 2, marginHorizontal: spacing.xl, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: 2, borderRadius: 1 },

  subtitle: { fontFamily: fonts.regular, fontSize: 13, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },

  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  stepContent: {},

  // iOS grouped-table card
  groupedCard: { borderRadius: radius.card, borderWidth: 0.5, overflow: 'hidden' },
  groupedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  groupedIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  groupedLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 16, letterSpacing: -0.2 },
  groupedDesc: { fontFamily: fonts.regular, fontSize: 13, marginTop: 1 },
  emptyCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },

  sectionHeader: { fontFamily: fonts.regular, fontSize: 13, textTransform: 'uppercase', letterSpacing: -0.1, paddingHorizontal: spacing.lg, marginBottom: 6 },

  stepperCell: { paddingVertical: 14, paddingHorizontal: 16 },

  summaryCell: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16 },
  summaryTitle: { fontFamily: fonts.semibold, fontSize: 15, marginBottom: 3, letterSpacing: -0.2 },
  summaryLine: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },

  bottomBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: Platform.OS === 'web' ? spacing.lg : 34 },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: fonts.semibold, fontSize: 17, color: '#fff', letterSpacing: -0.2 },
});
