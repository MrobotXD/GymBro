import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { WorkoutPlan, WorkoutDay } from '@/lib/types';
import { getPlans, getActivePlanId } from '@/lib/storage';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();
  return { lastDay, startDow };
}

function getDayKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getDayKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const { lastDay, startDow } = getMonthDays(year, month);
  const todayKey = getDayKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  useFocusEffect(useCallback(() => {
    (async () => {
      const [plans, activeId] = await Promise.all([getPlans(), getActivePlanId()]);
      if (activeId) {
        const found = plans.find(p => p.id === activeId);
        setPlan(found || null);
      } else {
        setPlan(null);
      }
    })();
  }, []));

  const schedule = buildSchedule(plan, year, month, lastDay);
  const selectedSchedule = schedule[selectedDate];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Calendario" subtitle="Tu agenda de entrenos" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {MONTHS_ES[month]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.weekRow}>
              {DAYS_ES.map(d => (
                <View key={d} style={styles.dayCell}>
                  <Text style={[styles.dayHeader, { color: colors.textTertiary }]}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`e${i}`} style={styles.dayCell} />;
                const key = getDayKey(year, month, day);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const info = schedule[key];
                const hasWorkout = !!info;
                const isCompleted = info?.completed;
                const isRest = info?.isRest;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dayCell]}
                    onPress={() => setSelectedDate(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: colors.accent },
                      isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.accent },
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        { color: isSelected ? '#fff' : isToday ? colors.accent : colors.text },
                      ]}>{day}</Text>
                    </View>
                    {hasWorkout && !isRest && (
                      <View style={[styles.dayDot, { backgroundColor: isCompleted ? colors.success : colors.accent }]} />
                    )}
                    {isRest && (
                      <View style={[styles.dayDot, { backgroundColor: colors.textTertiary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Selected day detail */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard>
            <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
              {formatDateEs(selectedDate)}
            </Text>

            {!selectedSchedule && (
              <View style={styles.restCard}>
                <Text style={styles.restIcon}>😴</Text>
                <Text style={[styles.restTitle, { color: colors.text }]}>Día de descanso</Text>
                <Text style={[styles.restSub, { color: colors.textTertiary }]}>
                  Recupera y vuelve más fuerte
                </Text>
              </View>
            )}

            {selectedSchedule?.isRest && (
              <View style={styles.restCard}>
                <Text style={styles.restIcon}>🧘</Text>
                <Text style={[styles.restTitle, { color: colors.text }]}>Descanso programado</Text>
                <Text style={[styles.restSub, { color: colors.textTertiary }]}>
                  Tu cuerpo necesita recuperarse
                </Text>
              </View>
            )}

            {selectedSchedule && !selectedSchedule.isRest && (
              <View>
                <View style={styles.workoutHeader}>
                  <View style={[styles.dayBadge, {
                    backgroundColor: selectedSchedule.completed ? colors.successDim : colors.accentDim,
                    borderColor: selectedSchedule.completed ? colors.success : colors.accent,
                  }]}>
                    <Text style={[styles.dayBadgeText, {
                      color: selectedSchedule.completed ? colors.success : colors.accent,
                    }]}>D{selectedSchedule.day.dayNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.workoutName, { color: colors.text }]}>{selectedSchedule.day.name}</Text>
                    <Text style={[styles.workoutFocus, { color: colors.textTertiary }]}>
                      {selectedSchedule.day.exercises.length} ejercicios · {selectedSchedule.day.focus}
                    </Text>
                  </View>
                  {selectedSchedule.completed && (
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                  )}
                </View>

                {selectedSchedule.day.exercises.map((ex, i) => (
                  <View key={i} style={[styles.exRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.exName, { color: colors.text }]}>{ex.name}</Text>
                    <Text style={[styles.exSets, { color: colors.textTertiary }]}>{ex.sets}×{ex.reps}</Text>
                  </View>
                ))}

                {!selectedSchedule.completed && selectedDate === todayKey && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/active-workout', params: { planId: plan?.id, dayId: selectedSchedule.day.id } })}
                    style={[styles.startBtn, { backgroundColor: colors.accent }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="play-outline" size={16} color="#fff" />
                    <Text style={styles.startBtnText}>Empezar entreno</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>Pendiente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>Completado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>Descanso</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface DaySchedule {
  day: WorkoutDay;
  completed: boolean;
  isRest: boolean;
}

function buildSchedule(plan: WorkoutPlan | null, year: number, month: number, lastDay: number): Record<string, DaySchedule> {
  const map: Record<string, DaySchedule> = {};
  if (!plan) return map;

  const createdDate = new Date(plan.createdAt);
  const daysPerWeek = plan.daysPerWeek;
  let dayIdx = 0;
  let restCounter = 0;
  const totalDays = plan.days.length;

  for (let week = 0; week < plan.weeks * 2; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(createdDate);
      d.setDate(d.getDate() + week * 7 + dow);

      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (d < createdDate) continue;

      const key = getDayKey(d.getFullYear(), d.getMonth(), d.getDate());

      if (dayIdx < totalDays) {
        const dayOfWeek = dow;
        const isTrainingDay = restCounter < daysPerWeek;

        if (isTrainingDay) {
          const workoutDay = plan.days[dayIdx];
          map[key] = { day: workoutDay, completed: workoutDay.completed, isRest: false };
          dayIdx++;
          restCounter++;
        } else {
          map[key] = { day: plan.days[0], completed: false, isRest: true };
        }

        if (dow === 6) restCounter = 0;
      }
    }
  }

  return map;
}

function formatDateEs(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${dayNames[date.getDay()]} ${d} de ${MONTHS_ES[m - 1]}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 110 },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 4 },
  monthTitle: { fontFamily: fonts.bold, fontSize: 17, textTransform: 'capitalize' },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayHeader: { fontFamily: fonts.semibold, fontSize: 11, textTransform: 'uppercase' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontFamily: fonts.medium, fontSize: 14 },
  dayDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },

  detailDate: { fontFamily: fonts.semibold, fontSize: 13, marginBottom: 12, textTransform: 'capitalize' },

  restCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  restIcon: { fontSize: 40 },
  restTitle: { fontFamily: fonts.semibold, fontSize: 16 },
  restSub: { fontFamily: fonts.regular, fontSize: 13 },

  workoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dayBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dayBadgeText: { fontFamily: fonts.bold, fontSize: 13 },
  workoutName: { fontFamily: fonts.semibold, fontSize: 15 },
  workoutFocus: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },

  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 0.5 },
  exName: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  exSets: { fontFamily: fonts.regular, fontSize: 12 },

  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.md, marginTop: 12 },
  startBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.regular, fontSize: 11 },
});
