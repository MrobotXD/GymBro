import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { WorkoutPlan, WorkoutDay } from '@/lib/types';
import { getPlans, getActivePlanId, setActivePlan, deletePlan, getProfile } from '@/lib/storage';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlanId, setActivePlanIdState] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);

  const loadData = useCallback(async () => {
    const [loadedPlans, activeId] = await Promise.all([getPlans(), getActivePlanId()]);
    setPlans(loadedPlans);
    setActivePlanIdState(activeId);
    const active = loadedPlans.find(p => p.id === activeId);
    if (active) setSelectedDay(active.days.find(d => !d.completed) || active.days[0]);
    else setSelectedDay(null);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activePlan = plans.find(p => p.id === activePlanId);
  const completedDays = (plan: WorkoutPlan) => plan.days.filter(d => d.completed).length;

  const [showMenu, setShowMenu] = useState(false);

  const handleAdd = () => {
    setShowMenu(true);
  };

  const handleActivate = async (id: string) => { await setActivePlan(id); setActivePlanIdState(id); loadData(); };

  const handleDelete = (plan: WorkoutPlan) => {
    if (Platform.OS === 'web') {
      if (confirm(`Eliminar "${plan.name}"?`)) {
        (async () => { await deletePlan(plan.id); if (activePlanId === plan.id) await setActivePlan(null); loadData(); })();
      }
    } else {
      Alert.alert('Eliminar', `Eliminar "${plan.name}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => { await deletePlan(plan.id); if (activePlanId === plan.id) await setActivePlan(null); loadData(); } },
      ]);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Entreno" subtitle="Planes y rutinas" onAdd={handleAdd} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active plan workout */}
        {activePlan && selectedDay && (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <GlassCard>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{activePlan.name}</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
                  {activePlan.days.map(day => {
                    const sel = selectedDay?.id === day.id;
                    return (
                      <TouchableOpacity
                        key={day.id}
                        onPress={() => setSelectedDay(day)}
                        style={[styles.dayTab, { backgroundColor: sel ? colors.accentDim : colors.inputBg, borderColor: sel ? colors.accent : 'transparent' }]}
                      >
                        <Text style={[styles.dayTabText, { color: sel ? colors.accent : colors.textSecondary }]}>D{day.dayNumber}</Text>
                        {day.completed && <View style={[styles.checkDot, { backgroundColor: colors.success }]} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <GlassCard>
                <View style={styles.dayHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayName, { color: colors.text }]}>{selectedDay.name}</Text>
                    <Text style={[styles.dayFocus, { color: colors.textTertiary }]}>{selectedDay.focus}</Text>
                  </View>
                  {selectedDay.completed && (
                    <View style={[styles.doneBadge, { backgroundColor: colors.successDim }]}>
                      <Ionicons name="checkmark" size={14} color={colors.success} />
                    </View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <GlassCard noPadding>
                {selectedDay.exercises.map((ex, i) => (
                  <View key={ex.id} style={[styles.exRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.exNum, { borderColor: colors.textTertiary }]}>
                      <Text style={[styles.exNumText, { color: colors.textSecondary }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.exName, { color: colors.text }]}>{ex.name}</Text>
                      <Text style={[styles.exDetail, { color: colors.textTertiary }]}>{ex.sets}x{ex.reps}{ex.weight ? ` · ${ex.weight}` : ''}</Text>
                    </View>
                    <View style={styles.exRestRow}>
                      <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                      <Text style={[styles.exRestText, { color: colors.textTertiary }]}>{ex.restSeconds}s</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>

            {!selectedDay.completed && (
              <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/active-workout', params: { planId: activePlan.id, dayId: selectedDay.id } })}
                  style={[styles.startBtn, { backgroundColor: colors.accent }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-outline" size={16} color="#fff" />
                  <Text style={styles.startBtnText}>Empezar entreno</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}

        {/* All plans */}
        {plans.length > 0 && (
          <>
            <View style={[styles.divider, { borderTopColor: colors.border }]} />
            <Text style={[styles.allPlansTitle, { color: colors.textSecondary }]}>Mis planes</Text>
          </>
        )}

        {plans.map((plan, idx) => {
          const isActive = plan.id === activePlanId;
          return (
            <Animated.View key={plan.id} entering={FadeInDown.delay(100 + idx * 80).duration(400)}>
              <GlassCard onPress={() => handleActivate(plan.id)}>
                <View style={styles.planRow}>
                  <View style={[styles.planDot, { backgroundColor: isActive ? colors.accent : colors.dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>{plan.name}</Text>
                    <Text style={[styles.planMeta, { color: colors.textTertiary }]}>
                      {plan.level} · {completedDays(plan)}/{plan.days.length} dias
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.accentDim }]}>
                      <Text style={[styles.activeBadgeText, { color: colors.accent }]}>Activo</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(plan)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}

        {/* Create plan CTA */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <TouchableOpacity onPress={handleAdd} style={[styles.createBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}>
            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            <Text style={[styles.createBtnText, { color: colors.text }]}>Crear nuevo plan con IA</Text>
          </TouchableOpacity>
        </Animated.View>

        {plans.length === 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.empty}>
            <View style={[styles.emptyCircle, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="barbell-outline" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin planes</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Crea tu primer plan de entrenamiento personalizado con IA</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Add menu modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              onPress={() => { setShowMenu(false); router.push('/create-plan'); }}
              style={[styles.menuRow, { borderBottomColor: colors.separator }]}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Crear plan con IA</Text>
                <Text style={[styles.menuDesc, { color: colors.textTertiary }]}>Genera un plan personalizado automáticamente</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowMenu(false); router.push('/create-routine'); }}
              style={styles.menuRow}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="list-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Crear rutina</Text>
                <Text style={[styles.menuDesc, { color: colors.textTertiary }]}>Elige tus ejercicios del catálogo manualmente</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 110 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 15, marginBottom: spacing.md },
  dayTabs: { gap: 6 },
  dayTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayTabText: { fontFamily: fonts.bold, fontSize: 13 },
  checkDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayName: { fontFamily: fonts.bold, fontSize: 16 },
  dayFocus: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  doneBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.lg, gap: 12, borderBottomWidth: 1 },
  exNum: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontFamily: fonts.semibold, fontSize: 11 },
  exName: { fontFamily: fonts.semibold, fontSize: 14 },
  exDetail: { fontFamily: fonts.regular, fontSize: 12 },
  exRestRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  exRestText: { fontFamily: fonts.regular, fontSize: 11 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: 16 },
  startBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  divider: { borderTopWidth: 1, marginVertical: 4 },
  allPlansTitle: { fontFamily: fonts.semibold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planDot: { width: 8, height: 8, borderRadius: 4 },
  planName: { fontFamily: fonts.semibold, fontSize: 14 },
  planMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  activeBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { fontFamily: fonts.semibold, fontSize: 11 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg, borderRadius: radius.card, borderWidth: 1 },
  createBtnText: { fontFamily: fonts.semibold, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 20, gap: 8 },
  emptyCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.xl },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  menuCard: { width: '100%', maxWidth: 340, borderRadius: radius.card, borderWidth: 0.5, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 0.5 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontFamily: fonts.semibold, fontSize: 15 },
  menuDesc: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
});
