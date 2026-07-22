import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, SlideInRight,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing, interpolate, useAnimatedScrollHandler,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  highlight: string;
  desc: string;
  color: string;
  features: { icon: string; text: string }[];
}

const SLIDES: Slide[] = [
  {
    icon: '🤖',
    title: 'Entrena con',
    highlight: 'Inteligencia Artificial',
    desc: 'GymBro genera planes de entrenamiento 100% personalizados segun tu nivel, equipo y objetivos.',
    color: '#0a84ff',
    features: [
      { icon: '🎯', text: 'Planes adaptados a ti' },
      { icon: '📊', text: 'Progresion automatica' },
      { icon: '💬', text: 'Chat con tu entrenador IA' },
    ],
  },
  {
    icon: '📸',
    title: 'Escanea tu',
    highlight: 'comida con la camara',
    desc: 'Toma una foto y la IA calcula calorias, proteinas, carbos y grasas al instante. Sin escribir nada.',
    color: '#30d158',
    features: [
      { icon: '⚡', text: 'Analisis en segundos' },
      { icon: '🥗', text: 'Macros automaticos' },
      { icon: '📈', text: 'Historial diario' },
    ],
  },
  {
    icon: '🏆',
    title: 'Sube de rango',
    highlight: 'como en un juego',
    desc: '24 niveles desde Madera hasta Diamante. Cada entrenamiento te da XP. Tu progreso es tu juego.',
    color: '#FFD700',
    features: [
      { icon: '⭐', text: '+100 XP por entreno' },
      { icon: '🔥', text: 'Rachas y desafios' },
      { icon: '💎', text: '8 tiers por desbloquear' },
    ],
  },
  {
    icon: '🎬',
    title: 'Tecnica perfecta',
    highlight: 'con GIFs animados',
    desc: '1,324 ejercicios con animaciones mostrando la tecnica correcta mientras entrenas.',
    color: '#ff9500',
    features: [
      { icon: '🏋️', text: 'Todos los musculos' },
      { icon: '🔍', text: 'Busqueda inteligente' },
      { icon: '✅', text: 'Forma correcta siempre' },
    ],
  },
];

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const input = scrollX.value / W;
    const width = interpolate(input, [index - 1, index, index + 1], [8, 28, 8], 'clamp');
    const opacity = interpolate(input, [index - 1, index, index + 1], [0.3, 1, 0.3], 'clamp');
    return { width, opacity };
  });

  return (
    <Animated.View style={[{
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginHorizontal: 4,
    }, style]} />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const isLast = currentPage === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentPage(page);
    scrollX.value = e.nativeEvent.contentOffset.x;
  };

  const goNext = () => {
    if (isLast) {
      finishOnboarding();
    } else {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * W, animated: true });
    }
  };

  const skip = () => finishOnboarding();

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('gymbro_onboarding_done', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Skip button */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.skipWrap}>
        <TouchableOpacity onPress={skip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textTertiary }]}>Saltar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.page, { width: W }]}>
            {/* Background orb */}
            <View style={[styles.orb, { backgroundColor: slide.color, opacity: 0.06 }]} />

            {/* Icon */}
            <Animated.View entering={ZoomIn.delay(200).duration(500).springify()} style={styles.iconWrap}>
              <View style={[styles.iconCircle, { backgroundColor: `${slide.color}15`, borderColor: `${slide.color}30` }]}>
                <Text style={{ fontSize: 56 }}>{slide.icon}</Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInUp.delay(300).duration(500)}>
              <Text style={[styles.title, { color: colors.text }]}>
                {slide.title}{'\n'}
                <Text style={[styles.highlight, { color: slide.color }]}>{slide.highlight}</Text>
              </Text>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <Text style={[styles.desc, { color: colors.textSecondary }]}>{slide.desc}</Text>
            </Animated.View>

            {/* Feature pills */}
            <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.featuresCol}>
              {slide.features.map((f, fi) => (
                <Animated.View
                  key={fi}
                  entering={SlideInRight.delay(600 + fi * 100).duration(400)}
                  style={[styles.featurePill, { backgroundColor: `${slide.color}10`, borderColor: `${slide.color}25` }]}
                >
                  <Text style={{ fontSize: 18 }}>{f.icon}</Text>
                  <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
                </Animated.View>
              ))}
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomWrap}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity onPress={goNext} activeOpacity={0.8} style={styles.ctaWrap}>
          <LinearGradient
            colors={[SLIDES[currentPage].color, `${SLIDES[currentPage].color}cc`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}
          >
            {isLast ? (
              <>
                <Ionicons name="rocket" size={20} color="#fff" />
                <Text style={styles.ctaText}>Empezar a entrenar</Text>
              </>
            ) : (
              <>
                <Text style={styles.ctaText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  skipWrap: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, fontFamily: fonts.semibold },

  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: '15%' },

  iconWrap: { marginBottom: 28 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 32, fontFamily: fonts.bold, textAlign: 'center', lineHeight: 40, letterSpacing: -0.5 },
  highlight: { fontFamily: fonts.bold },

  desc: { fontSize: 16, fontFamily: fonts.regular, textAlign: 'center', lineHeight: 24, marginTop: 14, paddingHorizontal: 8 },

  featuresCol: { marginTop: 28, gap: 10, width: '100%', maxWidth: 300 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  featureText: { fontSize: 15, fontFamily: fonts.medium },

  bottomWrap: { paddingHorizontal: 32, paddingBottom: 48, gap: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  ctaText: { color: '#fff', fontSize: 17, fontFamily: fonts.bold },
});
