import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft, FadeInRight,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay, withSpring, Easing, interpolate,
  useAnimatedScrollHandler, SlideInRight, ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W } = Dimensions.get('window');
const SEEN_KEY = 'gymbro_landing_seen';

const FEATURES = [
  { icon: '🤖', title: 'Planes con IA', desc: 'Rutinas personalizadas segun tu nivel y equipo', color: '#0a84ff' },
  { icon: '📸', title: 'Escaneo de comida', desc: 'Foto → calorias, proteinas, carbos y grasas', color: '#30d158' },
  { icon: '🏆', title: 'Sistema de rangos', desc: 'Gana XP y sube de Madera a Diamante', color: '#FFD700' },
  { icon: '🎬', title: '1,324 GIFs', desc: 'Animaciones de tecnica para cada ejercicio', color: '#ff9500' },
  { icon: '📅', title: 'Calendario', desc: 'Tu agenda de entrenos y dias de descanso', color: '#bf5af2' },
  { icon: '💬', title: 'Chat con IA', desc: 'Tu entrenador personal 24/7', color: '#5ac8fa' },
];

const RANKS_PREVIEW = [
  { icon: '🔱', name: 'Diamante III', color: '#B9F2FF', xp: '155,000' },
  { icon: '🏆', name: 'Oro III', color: '#FFD700', xp: '48,000' },
  { icon: '⚡', name: 'Plata III', color: '#C0C0C0', xp: '27,000' },
  { icon: '⚔️', name: 'Hierro III', color: '#636366', xp: '6,500' },
  { icon: '🌱', name: 'Madera I', color: '#8B6914', xp: '0' },
];

const STATS = [
  { value: '1,324', label: 'Ejercicios' },
  { value: '24', label: 'Niveles' },
  { value: '100%', label: 'Gratis' },
  { value: 'IA', label: 'Personalizado' },
];

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const heroScale = useSharedValue(0.9);
  const heroOpacity = useSharedValue(0);
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const shimmerX = useSharedValue(-SCREEN_W);
  const badgePulse = useSharedValue(1);

  useEffect(() => {
    heroScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    heroOpacity.value = withTiming(1, { duration: 800 });

    orb1X.value = withRepeat(withSequence(
      withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    orb1Y.value = withRepeat(withSequence(
      withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    orb2X.value = withRepeat(withSequence(
      withTiming(-25, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      withTiming(25, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    orb2Y.value = withRepeat(withSequence(
      withTiming(20, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      withTiming(-20, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);

    pulseScale.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    glowOpacity.value = withRepeat(withSequence(
      withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);

    shimmerX.value = withRepeat(
      withTiming(SCREEN_W, { duration: 2500, easing: Easing.linear }),
      -1, false,
    );

    badgePulse.value = withRepeat(withSequence(
      withTiming(1.05, { duration: 1000 }),
      withTiming(1, { duration: 1000 }),
    ), -1, true);
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));
  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  const handleEnter = async () => {
    await AsyncStorage.setItem(SEEN_KEY, 'true');
    router.replace('/auth');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ===== HERO ===== */}
        <View style={styles.heroWrap}>
          {/* Floating orbs */}
          <Animated.View style={[styles.orb, styles.orb1, orb1Style]} />
          <Animated.View style={[styles.orb, styles.orb2, orb2Style]} />

          <Animated.View style={[styles.heroContent, heroStyle]}>
            {/* Badge */}
            <Animated.View style={[styles.heroBadge, { borderColor: `${colors.accent}40` }, badgeStyle]}>
              <View style={styles.liveDot} />
              <Text style={[styles.badgeText, { color: colors.accent }]}>Impulsado por IA</Text>
            </Animated.View>

            {/* Title */}
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Tu gimnasio,{'\n'}
              <Text style={styles.heroGradient}>tu juego.</Text>
            </Text>

            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Planes de entrenamiento con IA, nutricion inteligente y un sistema de rangos que convierte cada rep en XP.
            </Text>

            {/* CTA button with shimmer */}
            <TouchableOpacity onPress={handleEnter} activeOpacity={0.8} style={styles.ctaWrap}>
              <LinearGradient
                colors={['#0a84ff', '#3898ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaText}>Empezar ahora</Text>
                <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
                <Animated.View style={[styles.shimmer, shimmerStyle]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Phone mockup */}
          <Animated.View entering={FadeInUp.delay(400).duration(700).springify()} style={styles.phoneWrap}>
            <Animated.View style={pulseStyle}>
              <View style={[styles.phoneMock, { borderColor: `${colors.accent}25` }]}>
                <View style={[styles.phoneNotch, { backgroundColor: colors.bg }]} />
                <View style={styles.phoneScreen}>
                  <View style={[styles.phoneCard, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={styles.phoneLabel}>Buenos dias, Bro</Text>
                  </View>
                  <View style={styles.phoneStatsRow}>
                    <View style={[styles.phoneStat, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                      <Text style={[styles.phoneStatNum, { color: '#0a84ff' }]}>12</Text>
                      <Text style={styles.phoneStatLabel}>Sesiones</Text>
                    </View>
                    <View style={[styles.phoneStat, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                      <Text style={{ fontSize: 14 }}>🔥</Text>
                      <Text style={[styles.phoneStatNum, { color: '#ff9500' }]}>5</Text>
                      <Text style={styles.phoneStatLabel}>Racha</Text>
                    </View>
                    <View style={[styles.phoneStat, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                      <Text style={[styles.phoneStatNum, { color: '#0a84ff' }]}>78%</Text>
                      <Text style={styles.phoneStatLabel}>Progreso</Text>
                    </View>
                  </View>
                  <View style={[styles.phoneCard, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 22 }}>🪵</Text>
                      <View>
                        <Text style={[styles.phoneRank, { color: '#8B6914' }]}>Madera I</Text>
                        <Text style={styles.phoneXP}>1,250 / 1,800 XP</Text>
                      </View>
                    </View>
                    <View style={styles.phoneBar}>
                      <View style={[styles.phoneBarFill, { width: '70%' }]} />
                    </View>
                  </View>
                  <View style={[styles.phoneCard, { backgroundColor: 'rgba(28,28,30,0.65)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={styles.phoneSmLabel}>Entreno de hoy</Text>
                    <Text style={styles.phoneLabel}>Espalda y Biceps</Text>
                    <Text style={styles.phoneXP}>6 ejercicios · 45 min</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* ===== STATS BAR ===== */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={[styles.statsBar, { borderColor: colors.cardBorder }]}>
          {STATS.map((s, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(700 + i * 100).duration(400)} style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ===== FEATURES ===== */}
        <Animated.View entering={FadeInDown.delay(800).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>FUNCIONES</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Todo lo que necesitas</Text>
        </Animated.View>

        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(900 + i * 80).duration(400).springify()}
              style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${f.color}15`, borderColor: `${f.color}25` }]}>
                <Text style={{ fontSize: 24 }}>{f.icon}</Text>
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>{f.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ===== RANKS SECTION ===== */}
        <Animated.View entering={FadeInLeft.delay(1200).duration(600)}>
          <Text style={[styles.sectionLabel, { color: '#FFD700' }]}>SISTEMA DE RANGOS</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Convierte cada rep en XP</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            24 niveles. 8 tiers. Un camino desde Madera hasta Diamante.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(1300).duration(600)} style={[styles.ranksCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {RANKS_PREVIEW.map((r, i) => (
            <Animated.View key={i} entering={SlideInRight.delay(1400 + i * 100).duration(400)}>
              <View style={styles.rankRow}>
                <View style={[styles.rankCircle, { borderColor: r.color, backgroundColor: `${r.color}15` }]}>
                  <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankName, { color: r.color }]}>{r.name}</Text>
                  <Text style={[styles.rankXP, { color: colors.textTertiary }]}>{r.xp} XP</Text>
                </View>
                {i === RANKS_PREVIEW.length - 1 && (
                  <View style={[styles.youBadge, { backgroundColor: `${r.color}20`, borderColor: `${r.color}50` }]}>
                    <Text style={[styles.youText, { color: r.color }]}>START</Text>
                  </View>
                )}
              </View>
              {i < RANKS_PREVIEW.length - 1 && (
                <View style={[styles.rankLine, { backgroundColor: `${r.color}20` }]} />
              )}
            </Animated.View>
          ))}
        </Animated.View>

        {/* XP badges */}
        <Animated.View entering={FadeInDown.delay(1500).duration(400)} style={styles.xpBadges}>
          {[
            { label: '+100 XP / entreno', color: '#8B6914' },
            { label: '+15 XP / ejercicio', color: '#0a84ff' },
            { label: '+50 XP bonus', color: '#30d158' },
          ].map((b, i) => (
            <View key={i} style={[styles.xpBadge, { backgroundColor: `${b.color}12`, borderColor: `${b.color}35` }]}>
              <Text style={[styles.xpBadgeText, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ===== AI SECTION ===== */}
        <Animated.View entering={FadeInDown.delay(1600).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>INTELIGENCIA ARTIFICIAL</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tu entrenador nunca duerme</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1700).duration(500)} style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Animated.View entering={FadeInRight.delay(1800).duration(400)} style={[styles.chatMsg, styles.chatUser, { backgroundColor: 'rgba(10,132,255,0.15)', borderColor: 'rgba(10,132,255,0.25)' }]}>
            <Text style={{ color: '#5ac8fa', fontSize: 14, fontFamily: fonts.medium }}>
              Dame una rutina de pecho para hacer en casa
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInLeft.delay(2100).duration(400)} style={[styles.chatMsg, styles.chatBot, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={{ color: 'rgba(235,235,245,0.7)', fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 }}>
              Aqui tienes tu rutina de <Text style={{ color: '#0a84ff', fontFamily: fonts.bold }}>pecho en casa</Text>:{'\n\n'}
              1. Flexiones clasicas — 4x15{'\n'}
              2. Flexiones diamante — 3x12{'\n'}
              3. Flexiones declinadas — 3x10{'\n'}
              4. Fondos en silla — 3x12
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(2200).duration(400)} style={styles.aiFeatures}>
          {[
            'Planes adaptados a tu nivel y equipo',
            'Analisis nutricional con camara',
            'Chat ilimitado para dudas',
            'Seleccion de musculos interactiva',
          ].map((item, i) => (
            <Animated.View key={i} entering={FadeInLeft.delay(2300 + i * 80).duration(300)} style={styles.aiRow}>
              <View style={[styles.aiDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.aiText, { color: colors.textSecondary }]}>{item}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ===== FINAL CTA ===== */}
        <Animated.View entering={FadeInUp.delay(2500).duration(600)} style={styles.finalCta}>
          <Animated.View style={glowStyle}>
            <View style={styles.ctaGlow} />
          </Animated.View>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            Empieza tu camino{'\n'}
            <Text style={styles.heroGradient}>de Madera a Diamante</Text>
          </Text>
          <Text style={[styles.ctaSub, { color: colors.textTertiary }]}>
            Descarga GymBro gratis y convierte cada entrenamiento en progreso real.
          </Text>
          <TouchableOpacity onPress={handleEnter} activeOpacity={0.8} style={styles.ctaWrap}>
            <LinearGradient
              colors={['#0a84ff', '#3898ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.ctaBtn, { paddingHorizontal: 40 }]}
            >
              <Text style={[styles.ctaText, { fontSize: 17 }]}>Entrar a GymBro</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
              <Animated.View style={[styles.shimmer, shimmerStyle]} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            GymBro © 2026 · Hecho con 💪 y mucho cafe
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  // Hero
  heroWrap: { paddingTop: 60, paddingHorizontal: spacing.xl, position: 'relative', overflow: 'hidden', paddingBottom: 20 },
  orb: { position: 'absolute', borderRadius: 200, opacity: 0.12 },
  orb1: { width: 250, height: 250, backgroundColor: '#0a84ff', top: -40, left: -60 },
  orb2: { width: 200, height: 200, backgroundColor: '#bf5af2', top: 100, right: -80 },
  heroContent: { alignItems: 'center', marginBottom: 24 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(10,132,255,0.08)', marginBottom: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#30d158' },
  badgeText: { fontSize: 12, fontFamily: fonts.semibold },
  heroTitle: { fontSize: 38, fontFamily: fonts.bold, textAlign: 'center', lineHeight: 44, letterSpacing: -1 },
  heroGradient: { color: '#0a84ff' },
  heroSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 12, marginBottom: 24, paddingHorizontal: 10 },

  // CTA
  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ skewX: '-20deg' }] },

  // Phone
  phoneWrap: { alignItems: 'center', marginTop: 8 },
  phoneMock: { width: 220, height: 420, borderRadius: 30, borderWidth: 2, overflow: 'hidden', backgroundColor: '#1c1c1e' },
  phoneNotch: { position: 'absolute', top: 0, left: '50%' as any, marginLeft: -45, width: 90, height: 22, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 5 },
  phoneScreen: { paddingTop: 34, paddingHorizontal: 12, gap: 8 },
  phoneCard: { borderRadius: 12, padding: 10, borderWidth: 1 },
  phoneStatsRow: { flexDirection: 'row', gap: 6 },
  phoneStat: { flex: 1, alignItems: 'center', borderRadius: 12, padding: 8, borderWidth: 1 },
  phoneStatNum: { fontSize: 16, fontFamily: fonts.bold },
  phoneStatLabel: { fontSize: 8, color: 'rgba(235,235,245,0.3)', fontFamily: fonts.medium, marginTop: 1 },
  phoneLabel: { fontSize: 12, fontFamily: fonts.bold, color: '#f5f5f7' },
  phoneSmLabel: { fontSize: 8, color: 'rgba(235,235,245,0.3)', fontFamily: fonts.semibold, textTransform: 'uppercase', marginBottom: 2 },
  phoneRank: { fontSize: 12, fontFamily: fonts.bold },
  phoneXP: { fontSize: 8, color: 'rgba(235,235,245,0.3)', fontFamily: fonts.medium },
  phoneBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 6, overflow: 'hidden' },
  phoneBarFill: { height: 4, borderRadius: 2, backgroundColor: '#0a84ff' },

  // Stats bar
  statsBar: { flexDirection: 'row', paddingVertical: 24, marginHorizontal: spacing.xl, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: fonts.bold, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: fonts.medium, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  sectionLabel: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 3, textAlign: 'center', marginTop: 36, marginBottom: 6 },
  sectionTitle: { fontSize: 26, fontFamily: fonts.bold, textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  sectionSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginBottom: 16, fontFamily: fonts.regular },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: 10, marginTop: 16 },
  featureCard: { width: (SCREEN_W - 40 - 10) / 2, borderRadius: radius.card, borderWidth: 1, padding: 16 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 10 },
  featureTitle: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 4 },
  featureDesc: { fontSize: 12, fontFamily: fonts.regular, lineHeight: 17 },

  // Ranks
  ranksCard: { marginHorizontal: spacing.xl, borderRadius: radius.card, borderWidth: 1, padding: 16, marginTop: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rankCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankName: { fontSize: 14, fontFamily: fonts.bold },
  rankXP: { fontSize: 11, fontFamily: fonts.regular },
  rankLine: { width: 3, height: 16, borderRadius: 1.5, marginLeft: 20 },
  youBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  youText: { fontSize: 9, fontFamily: fonts.bold, letterSpacing: 1.5 },

  // XP badges
  xpBadges: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  xpBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  xpBadgeText: { fontSize: 12, fontFamily: fonts.semibold },

  // AI Chat
  chatCard: { marginHorizontal: spacing.xl, borderRadius: radius.card, borderWidth: 1, padding: 16, marginTop: 12, gap: 12 },
  chatMsg: { padding: 12, borderRadius: 16, borderWidth: 1 },
  chatUser: { alignSelf: 'flex-end', maxWidth: '85%' },
  chatBot: { alignSelf: 'flex-start', maxWidth: '90%' },
  aiFeatures: { paddingHorizontal: spacing.xl + 4, marginTop: 16, gap: 10 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiDot: { width: 7, height: 7, borderRadius: 3.5 },
  aiText: { fontSize: 13, fontFamily: fonts.medium },

  // Final CTA
  finalCta: { alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: 40, paddingVertical: 30 },
  ctaGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(10,132,255,0.08)' },
  ctaTitle: { fontSize: 28, fontFamily: fonts.bold, textAlign: 'center', lineHeight: 34, letterSpacing: -0.5, marginBottom: 10 },
  ctaSub: { fontSize: 14, fontFamily: fonts.regular, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 12, fontFamily: fonts.regular },
});
