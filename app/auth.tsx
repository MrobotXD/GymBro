import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { syncFromCloud } from '@/lib/sync';
import { fonts, spacing, radius } from '@/lib/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }

    setLoading(true);
    try {
      const { error } = isLogin
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim());

      if (error) {
        Alert.alert('Error', translateError(error));
      } else {
        router.replace('/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleApple = async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: colors.accentDim, borderColor: `${colors.accent}40` }]}>
              <Ionicons name="fitness-outline" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>GymBro</Text>
            <Text style={[styles.logoSub, { color: colors.textTertiary }]}>
              {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </Text>
          </Animated.View>

          {/* Social buttons */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.socialRow}>
            <TouchableOpacity onPress={handleGoogle} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}>
              <Text style={{ fontSize: 17, fontFamily: fonts.semibold }}>G</Text>
              <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity onPress={handleApple} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={17} color={colors.text} />
                <Text style={[styles.socialText, { color: colors.text }]}>Apple</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>o continua con email</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.form}>
            {!isLogin && (
              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, { color: colors.text }]}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.text }]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contrasena"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
              <LinearGradient
                colors={['#0a84ff', '#3898ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                {loading ? (
                  <Text style={styles.submitText}>Cargando...</Text>
                ) : (
                  <>
                    <Ionicons name={isLogin ? 'log-in-outline' : 'person-add-outline'} size={16} color="#fff" />
                    <Text style={styles.submitText}>{isLogin ? 'Iniciar sesion' : 'Crear cuenta'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Toggle */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.toggleRow}>
            <Text style={[styles.toggleText, { color: colors.textTertiary }]}>
              {isLogin ? 'No tienes cuenta?' : 'Ya tienes cuenta?'}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.toggleLink, { color: colors.accent }]}>
                {isLogin ? 'Registrate' : 'Inicia sesion'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Skip */}
          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>Continuar sin cuenta</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email o contrasena incorrectos';
  if (msg.includes('already registered')) return 'Este email ya esta registrado';
  if (msg.includes('Password should be')) return 'La contrasena debe tener al menos 6 caracteres';
  if (msg.includes('valid email')) return 'Ingresa un email valido';
  return msg;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: 80, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 32, fontFamily: fonts.bold, letterSpacing: -1 },
  logoSub: { fontSize: 14, fontFamily: fonts.regular, marginTop: 4 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1 },
  socialText: { fontSize: 15, fontFamily: fonts.semibold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: fonts.medium },

  form: { gap: 12, marginBottom: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, fontFamily: fonts.regular },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.md },
  submitText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },

  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  toggleText: { fontSize: 14, fontFamily: fonts.regular },
  toggleLink: { fontSize: 14, fontFamily: fonts.bold },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 13, fontFamily: fonts.medium, textDecorationLine: 'underline' },
});
