import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import MacroRing from '@/components/MacroRing';
import FireIcon from '@/components/FireIcon';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { WorkoutPlan } from '@/lib/types';
import { getPlans, getActivePlanId, getProfile, getDailyNutrition } from '@/lib/storage';
import { calculateMacroTargets } from '@/lib/groq';
import { UserProfile } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets, setTargets] = useState({ calories: 2500, protein: 150, carbs: 300, fat: 70 });

  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('es', { weekday: 'long' });
  const dateFmt = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long' });

  useFocusEffect(useCallback(() => {
    (async () => {
      const [prof, plans, activeId, daily] = await Promise.all([
        getProfile(), getPlans(), getActivePlanId(), getDailyNutrition(today),
      ]);
      setProfile(prof);
      if (prof) {
        const t = calculateMacroTargets(prof);
        setTargets(t);
      }
      if (activeId) {
        const found = plans.find(p => p.id === activeId);
        setPlan(found || null);
      } else {
        setPlan(null);
      }
      if (daily) {
        const tot = daily.entries.reduce((a, e) => ({
          calories: a.calories + e.calories, protein: a.protein + e.protein,
          carbs: a.carbs + e.carbs, fat: a.fat + e.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setMacros(tot);
      } else {
        setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    })();
  }, []));

  const completedDays = plan ? plan.days.filter(d => d.completed).length : 0;
  const totalDays = plan ? plan.days.length : 0;
  const nextDay = plan?.days.find(d => !d.completed);
  const streak = completedDays;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Home" subtitle={`${dayName}, ${dateFmt}`} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {greeting()}, {profile?.name || 'Bro'}
            </Text>
            {!profile ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={[styles.setupBanner, { backgroundColor: colors.accentDim }]}>
                <Text style={[styles.setupText, { color: colors.accent }]}>Configura tu perfil para empezar</Text>
                <Ionicons name="chevron-forward-outline" size={14} color={colors.accent} />
              </TouchableOpacity>
            ) : !plan ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/workout')} style={[styles.setupBanner, { backgroundColor: colors.accentDim }]}>
                <Text style={[styles.setupText, { color: colors.accent }]}>Crea tu primer plan de entrenamiento</Text>
                <Ionicons name="chevron-forward-outline" size={14} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </GlassCard>
        </Animated.View>

        {/* Quick stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{completedDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Sesiones</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <FireIcon active={streak > 0} size={26} />
            <Text style={[styles.statNum, { color: streak > 0 ? '#ff9500' : colors.textTertiary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Racha</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0}%</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Progreso</Text>
          </GlassCard>
        </Animated.View>

        {/* Today's workout */}
        {plan && nextDay && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard onPress={() => router.push('/(tabs)/workout')}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing.md }]}>Entreno de hoy</Text>
              <View style={styles.todayContent}>
                <View style={[styles.dayCircle, { borderColor: colors.accent, backgroundColor: colors.accentDim }]}>
                  <Text style={[styles.dayCircleText, { color: colors.accent }]}>D{nextDay.dayNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.todayName, { color: colors.text }]}>{nextDay.name}</Text>
                  <Text style={[styles.todayFocus, { color: colors.textTertiary }]}>{nextDay.exercises.length} ejercicios · {nextDay.focus}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={16} color={colors.textTertiary} />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Plan progress */}
        {plan && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <GlassCard>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing.sm }]}>Plan activo</Text>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              <Text style={[styles.planMeta, { color: colors.textTertiary }]}>{plan.level} · {plan.daysPerWeek} dias/sem · {plan.goal.replace('_', ' ')}</Text>
              <View style={styles.progressRow}>
                <View style={[styles.progressBg, { backgroundColor: colors.dot }]}>
                  <View style={[styles.progressFill, { width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%`, backgroundColor: colors.accent }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textTertiary }]}>{completedDays}/{totalDays}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Today's nutrition */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <GlassCard onPress={() => router.push('/(tabs)/nutrition')}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing.sm }]}>Nutricion hoy</Text>
            <View style={styles.macroRow}>
              <View style={styles.calCol}>
                <Text style={[styles.calNum, { color: colors.text }]}>{macros.calories}</Text>
                <Text style={[styles.calLabel, { color: colors.textTertiary }]}>/{targets.calories} kcal</Text>
              </View>
              <View style={styles.ringsRow}>
                <MacroRing current={macros.protein} target={targets.protein} label="P" color={colors.protein} size={48} />
                <MacroRing current={macros.carbs} target={targets.carbs} label="C" color={colors.carbs} size={48} />
                <MacroRing current={macros.fat} target={targets.fat} label="G" color={colors.fat} size={48} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.actionsRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/workout')} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="barbell-outline" size={17} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.text }]}>Entrenar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition')} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="camera-outline" size={17} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.text }]}>Escanear</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 110 },
  greeting: { fontFamily: fonts.bold, fontSize: 20, marginBottom: 4 },
  setupBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  setupText: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center' as any, paddingVertical: spacing.lg },
  statNum: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  todayContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dayCircleText: { fontFamily: fonts.bold, fontSize: 14 },
  todayName: { fontFamily: fonts.semibold, fontSize: 15 },
  todayFocus: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  planName: { fontFamily: fonts.semibold, fontSize: 15, marginBottom: 2 },
  planMeta: { fontFamily: fonts.regular, fontSize: 12, textTransform: 'capitalize', marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg: { flex: 1, height: 5, borderRadius: 2.5, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 2.5 },
  progressText: { fontFamily: fonts.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  macroRow: { flexDirection: 'row', alignItems: 'center' },
  calCol: { flex: 1 },
  calNum: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -1 },
  calLabel: { fontFamily: fonts.regular, fontSize: 12, marginTop: -2 },
  ringsRow: { flexDirection: 'row', gap: 10 },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg, borderRadius: radius.card, borderWidth: 1 },
  actionText: { fontFamily: fonts.semibold, fontSize: 14 },
});
