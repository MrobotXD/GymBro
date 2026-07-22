import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing } from '@/lib/theme';
import { getXPData, getRank, getNextRank, getProgressToNext, getAllRanks, getRankIndex, XPData } from '@/lib/ranks';

function roman(n: number) { return ['I', 'II', 'III'][n - 1] || `${n}`; }

const SCREEN_W = Dimensions.get('window').width;
const PATH_W = SCREEN_W - 40;
const NODE_SIZE = 46;
const NODE_GAP = 90;
const CENTER_X = PATH_W / 2;

function getNodeX(vi: number): number {
  const amplitude = Math.min(PATH_W * 0.28, 100);
  const t = vi * 0.85;
  return CENTER_X + Math.sin(t) * amplitude;
}

function getNodeY(vi: number): number {
  return 50 + vi * NODE_GAP;
}

function buildCurvePath(count: number, reachedIndex: number): { reached: string; unreached: string } {
  let reachedPath = '';
  let unreachedPath = '';

  for (let i = 0; i < count - 1; i++) {
    const x1 = getNodeX(i);
    const y1 = getNodeY(i) + NODE_SIZE / 2;
    const x2 = getNodeX(i + 1);
    const y2 = getNodeY(i + 1) - NODE_SIZE / 2 + 8;
    const midY = (y1 + y2) / 2;

    const segment = `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
    const realI1 = count - 1 - i;
    if (realI1 <= reachedIndex) {
      reachedPath += segment + ' ';
    } else {
      unreachedPath += segment + ' ';
    }
  }

  return { reached: reachedPath, unreached: unreachedPath };
}

export default function RanksScreen() {
  const { colors, isDark } = useTheme();
  const [xpData, setXpData] = useState<XPData>({ totalXP: 0, workoutsCompleted: 0, exercisesCompleted: 0, xpHistory: [] });
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useSharedValue(1);
  const glowOp = useSharedValue(0.2);

  useFocusEffect(useCallback(() => {
    getXPData().then(setXpData);
  }, []));

  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.15, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    glowOp.value = withRepeat(withSequence(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const currentRank = getRank(xpData.totalXP);
  const nextRank = getNextRank(xpData.totalXP);
  const progress = getProgressToNext(xpData.totalXP);
  const currentIndex = getRankIndex(xpData.totalXP);
  const allRanks = getAllRanks();
  const reversed = [...allRanks].reverse();

  const last7 = getLast7DaysXP(xpData.xpHistory);
  const maxXP = Math.max(...last7.map(d => d.xp), 1);

  const pathHeight = 50 + reversed.length * NODE_GAP + 60;
  const { reached: reachedPath, unreached: unreachedPath } = buildCurvePath(reversed.length, currentIndex);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Rango" subtitle="Sube de nivel entrenando" />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard style={styles.hero}>
            <View style={[styles.heroBadge, { backgroundColor: `${currentRank.color}20`, borderColor: `${currentRank.color}50` }]}>
              <Text style={{ fontSize: 26 }}>{currentRank.icon}</Text>
            </View>
            <Text style={[styles.heroName, { color: currentRank.color }]}>{currentRank.name} {roman(currentRank.level)}</Text>
            <Text style={[styles.heroXP, { color: colors.text }]}>{xpData.totalXP.toLocaleString()} XP</Text>
            {nextRank && (
              <View style={styles.heroBarWrap}>
                <View style={[styles.barBg, { backgroundColor: colors.dot }]}>
                  <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: currentRank.color }]} />
                </View>
                <Text style={[styles.barText, { color: colors.textSecondary }]}>
                  {(nextRank.minXP - xpData.totalXP).toLocaleString()} XP → {nextRank.name} {roman(nextRank.level)}
                </Text>
              </View>
            )}
            <View style={styles.statsRow}>
              {[
                { n: xpData.workoutsCompleted, l: 'Entrenos' },
                { n: xpData.exercisesCompleted, l: 'Ejercicios' },
                { n: `${currentIndex + 1}/24`, l: 'Nivel' },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={[styles.statN, { color: colors.accent }]}>{s.n}</Text>
                  <Text style={[styles.statL, { color: colors.textTertiary }]}>{s.l}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Weekly chart */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard>
            <Text style={[styles.secTitle, { color: colors.text }]}>Actividad semanal</Text>
            <View style={styles.chartRow}>
              {last7.map((d, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.chartBarH}>
                    <View style={[styles.chartBar, { height: `${Math.max((d.xp / maxXP) * 100, 6)}%`, backgroundColor: d.xp > 0 ? currentRank.color : colors.dot }]} />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Path */}
        <Text style={[styles.pathTitle, { color: colors.text }]}>Camino del guerrero</Text>

        <View style={{ width: PATH_W, height: pathHeight, alignSelf: 'center' }}>
          {/* SVG curved path */}
          <Svg width={PATH_W} height={pathHeight} style={StyleSheet.absoluteFill}>
            {unreachedPath ? (
              <Path
                d={unreachedPath}
                stroke={isDark ? '#2c2c2e' : '#d1d1d6'}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                strokeDasharray="8,6"
                opacity={0.4}
              />
            ) : null}
            {reachedPath ? (
              <Path
                d={reachedPath}
                stroke={currentRank.color}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />
            ) : null}
          </Svg>

          {/* Nodes */}
          {reversed.map((rank, vi) => {
            const realIdx = allRanks.length - 1 - vi;
            const reached = realIdx <= currentIndex;
            const isCurrent = realIdx === currentIndex;
            const isNext = realIdx === currentIndex + 1;
            const isNewTier = vi === 0 || reversed[vi].name !== reversed[vi - 1].name;
            const nx = getNodeX(vi);
            const ny = getNodeY(vi);
            const labelLeft = nx > CENTER_X;

            return (
              <View key={vi}>
                {/* Tier label */}
                {isNewTier && (
                  <View style={[styles.tierPill, {
                    position: 'absolute',
                    top: ny + NODE_SIZE / 2 - 10,
                    left: labelLeft ? nx - NODE_SIZE - 110 : nx + NODE_SIZE + 10,
                    backgroundColor: reached ? `${rank.color}18` : colors.inputBg,
                    borderColor: reached ? `${rank.color}50` : colors.cardBorder,
                  }]}>
                    <Text style={[styles.tierText, { color: reached ? rank.color : colors.textTertiary }]}>
                      {rank.name.toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Glow ring for current */}
                {isCurrent && (
                  <Animated.View style={[{
                    position: 'absolute',
                    left: nx - NODE_SIZE / 2 - 12,
                    top: ny - 12,
                    width: NODE_SIZE + 24,
                    height: NODE_SIZE + 24,
                    borderRadius: (NODE_SIZE + 24) / 2,
                    backgroundColor: `${rank.color}12`,
                    borderWidth: 2.5,
                    borderColor: rank.color,
                  }, glowStyle]} />
                )}

                {/* Node circle */}
                <Animated.View style={[{
                  position: 'absolute',
                  left: nx - NODE_SIZE / 2,
                  top: ny,
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: NODE_SIZE / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: reached ? rank.color : isDark ? '#1c1c1e' : '#e5e5ea',
                  borderColor: isCurrent ? '#fff' : isNext ? `${rank.color}99` : reached ? `${rank.color}55` : colors.cardBorder,
                  borderWidth: isCurrent ? 3.5 : isNext ? 2.5 : 1.5,
                  shadowColor: reached ? rank.color : 'transparent',
                  shadowOpacity: reached ? 0.5 : 0,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: reached ? 8 : 0,
                }, isCurrent ? pulseStyle : {}]}>
                  <Text style={{ fontSize: 20, opacity: reached || isNext ? 1 : 0.2 }}>{rank.icon}</Text>
                </Animated.View>

                {/* Label */}
                <View style={{
                  position: 'absolute',
                  top: ny + 6,
                  left: labelLeft ? nx - NODE_SIZE / 2 - 120 : nx + NODE_SIZE / 2 + 10,
                  width: 110,
                  alignItems: labelLeft ? 'flex-end' as const : 'flex-start' as const,
                }}>
                  <Text style={{
                    color: isCurrent ? rank.color : reached ? colors.text : colors.textTertiary,
                    fontFamily: isCurrent ? fonts.bold : fonts.medium,
                    fontSize: isCurrent ? 14 : 12,
                    letterSpacing: 0.3,
                  }}>
                    {rank.name} {roman(rank.level)}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.youTag, { backgroundColor: `${rank.color}22`, borderColor: `${rank.color}55` }]}>
                      <Text style={[styles.youTagText, { color: rank.color }]}>ESTÁS AQUÍ</Text>
                    </View>
                  )}
                  {isNext && <Text style={[styles.subLabel, { color: colors.textTertiary }]}>Siguiente</Text>}
                  {!isCurrent && !isNext && (
                    <Text style={[styles.subLabel, { color: colors.textTertiary }]}>{rank.minXP.toLocaleString()} XP</Text>
                  )}
                </View>

                {/* Check mark */}
                {reached && !isCurrent && (
                  <Text style={{
                    position: 'absolute',
                    left: nx + NODE_SIZE / 2 - 8,
                    top: ny - 6,
                    color: rank.color,
                    fontFamily: fonts.bold,
                    fontSize: 14,
                  }}>✓</Text>
                )}
              </View>
            );
          })}

          {/* Flag at bottom */}
          <View style={[styles.flagRow, { position: 'absolute', top: getNodeY(reversed.length - 1) + NODE_SIZE + 16, left: 0, right: 0 }]}>
            <Text style={{ fontSize: 24 }}>🏁</Text>
            <Text style={[styles.flagText, { color: colors.textTertiary }]}>Inicio del camino</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function getLast7DaysXP(history: XPData['xpHistory']) {
  const days: { label: string; xp: number }[] = [];
  const names = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ label: names[d.getDay()], xp: history.filter(h => h.date === key).reduce((s, h) => s + h.xp, 0) });
  }
  return days;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: 0, paddingBottom: 120 },

  hero: { alignItems: 'center' as any, paddingVertical: 24, gap: 2, marginBottom: 12 },
  heroBadge: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  heroName: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroXP: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: -1 },
  heroBarWrap: { width: '100%', paddingHorizontal: spacing.md, marginTop: 10 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barText: { fontFamily: fonts.medium, fontSize: 11, textAlign: 'center', marginTop: 6 },
  statsRow: { flexDirection: 'row', marginTop: 14, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.bold, fontSize: 18 },
  statL: { fontFamily: fonts.medium, fontSize: 9, textTransform: 'uppercase', marginTop: 2 },

  secTitle: { fontFamily: fonts.semibold, fontSize: 15, marginBottom: spacing.sm },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartBarH: { height: 70, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '55%', minHeight: 4, borderRadius: 4 },
  chartLabel: { fontFamily: fonts.medium, fontSize: 11 },

  pathTitle: { fontFamily: fonts.bold, fontSize: 18, marginTop: 16, marginBottom: 8 },

  tierPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tierText: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 2 },

  subLabel: { fontFamily: fonts.regular, fontSize: 11 },
  youTag: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  youTagText: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.5 },

  flagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  flagText: { fontFamily: fonts.medium, fontSize: 13 },
});
