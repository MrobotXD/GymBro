import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import { FormInput, FormStepper } from '@/components/FormField';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { syncToCloud } from '@/lib/sync';
import { getReminderConfig, saveReminderConfig, sendTestNotification, ReminderConfig } from '@/lib/notifications';
import { fonts, spacing, radius } from '@/lib/theme';
import { UserProfile } from '@/lib/types';
import { getProfile, saveProfile } from '@/lib/storage';
import { calculateMacroTargets } from '@/lib/groq';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, toggle, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [saved, setSaved] = useState(false);
  const [reminder, setReminder] = useState<ReminderConfig>({ enabled: false, hour: 7, minute: 0, days: [2, 3, 4, 5, 6] });

  const saveScale = useSharedValue(1);
  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  useFocusEffect(useCallback(() => {
    (async () => {
      const [profile, rem] = await Promise.all([getProfile(), getReminderConfig()]);
      if (profile) {
        setName(profile.name);
        setAge(profile.age);
        setWeight(profile.weight);
        setHeight(profile.height);
        setDaysPerWeek(profile.daysPerWeek);
      }
      setReminder(rem);
    })();
  }, []));

  const handleSave = async () => {
    saveScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    try {
      const existing = await getProfile();
      const profile: UserProfile = {
        name: name || 'Bro', age, weight, height,
        level: existing?.level || 'intermedio',
        goal: existing?.goal || 'ganar_musculo',
        equipment: existing?.equipment || ['peso_corporal'],
        daysPerWeek,
        minutesPerSession: existing?.minutesPerSession || 60,
      };
      await saveProfile(profile);
      if (user) await syncToCloud(user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      const msg = 'No se pudieron guardar los cambios. Intenta de nuevo.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const updateReminder = async (updated: ReminderConfig) => {
    setReminder(updated);
    try {
      await saveReminderConfig(updated);
    } catch (e) {
      const msg = 'No se pudo actualizar el recordatorio.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesion', 'Quieres cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesion', style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/auth');
      }},
    ]);
  };

  const macros = calculateMacroTargets({ age, weight, height, daysPerWeek, goal: 'ganar_musculo' } as UserProfile);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Config" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme toggle */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard>
            <View style={styles.themeRow}>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeLabel, { color: colors.text }]}>Apariencia</Text>
              </View>
              <TouchableOpacity onPress={toggle} style={[styles.toggleTrack, { backgroundColor: isDark ? colors.accent : colors.cardBorder }]} activeOpacity={0.7}>
                <View style={[styles.toggleThumb, isDark ? styles.toggleRight : styles.toggleLeft, { backgroundColor: isDark ? colors.bg : '#fff' }]} />
              </TouchableOpacity>
              <Text style={[styles.themeMode, { color: colors.textSecondary }]}>{isDark ? 'Dark' : 'Light'}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Profile */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Perfil</Text>
            <View style={styles.fields}>
              <FormInput label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
              <FormStepper label="Edad" value={age} min={14} max={80} unit="anos" onValueChange={setAge} />
              <FormStepper label="Peso" value={weight} min={30} max={200} unit="kg" onValueChange={setWeight} />
              <FormStepper label="Altura" value={height} min={120} max={220} unit="cm" onValueChange={setHeight} />
              <FormStepper label="Dias de entreno" value={daysPerWeek} min={2} max={6} unit="dias/sem" onValueChange={setDaysPerWeek} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Macros */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Macros recomendados</Text>
            <MacroRow label="Calorias" value={`${macros.calories} kcal`} color={colors.accent} textColor={colors.textSecondary} />
            <MacroRow label="Proteina" value={`${macros.protein}g`} color={colors.protein} textColor={colors.textSecondary} />
            <MacroRow label="Carbos" value={`${macros.carbs}g`} color={colors.carbs} textColor={colors.textSecondary} />
            <MacroRow label="Grasa" value={`${macros.fat}g`} color={colors.fat} textColor={colors.textSecondary} />
          </GlassCard>
        </Animated.View>

        {/* Reminders */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Recordatorios</Text>

            {/* Toggle */}
            <View style={styles.themeRow}>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeLabel, { color: colors.text, fontSize: 14 }]}>Recordatorio diario</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateReminder({ ...reminder, enabled: !reminder.enabled })}
                style={[styles.toggleTrack, { backgroundColor: reminder.enabled ? colors.accent : colors.cardBorder }]}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, reminder.enabled ? styles.toggleRight : styles.toggleLeft, { backgroundColor: reminder.enabled ? colors.bg : '#fff' }]} />
              </TouchableOpacity>
            </View>

            {reminder.enabled && (
              <View style={{ marginTop: 14, gap: 12 }}>
                {/* Time */}
                <View style={styles.reminderTimeRow}>
                  <Text style={[styles.reminderLabel, { color: colors.textSecondary }]}>Hora</Text>
                  <View style={styles.timePickerRow}>
                    <TouchableOpacity
                      onPress={() => updateReminder({ ...reminder, hour: (reminder.hour - 1 + 24) % 24 })}
                      style={[styles.timeBtn, { backgroundColor: colors.inputBg }]}
                    >
                      <Ionicons name="chevron-down-outline" size={13} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {String(reminder.hour).padStart(2, '0')}:{String(reminder.minute).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateReminder({ ...reminder, hour: (reminder.hour + 1) % 24 })}
                      style={[styles.timeBtn, { backgroundColor: colors.inputBg }]}
                    >
                      <Ionicons name="chevron-up-outline" size={13} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Days */}
                <View>
                  <Text style={[styles.reminderLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Dias</Text>
                  <View style={styles.daysRow}>
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d, i) => {
                      const dayNum = i + 1;
                      const active = reminder.days.includes(dayNum);
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => updateReminder({
                            ...reminder,
                            days: active ? reminder.days.filter(x => x !== dayNum) : [...reminder.days, dayNum],
                          })}
                          style={[styles.dayChip, {
                            backgroundColor: active ? colors.accent : colors.inputBg,
                            borderColor: active ? colors.accent : colors.cardBorder,
                          }]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dayChipText, { color: active ? '#fff' : colors.textTertiary }]}>{d}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Test */}
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await sendTestNotification();
                        Alert.alert('Listo', 'Recibiras una notificacion de prueba en 3 segundos');
                      } catch (e) {
                        Alert.alert('Error', 'No se pudo enviar la notificacion de prueba.');
                      }
                    }}
                    style={[styles.testBtn, { borderColor: colors.accent }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="paper-plane-outline" size={13} color={colors.accent} />
                    <Text style={[styles.testBtnText, { color: colors.accent }]}>Enviar prueba</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Save */}
        <AnimatedTouchable
          entering={FadeInUp.delay(400).duration(500)}
          onPress={handleSave}
          style={[styles.saveBtn, saveAnimStyle, { backgroundColor: saved ? colors.success : colors.accent }]}
          activeOpacity={0.7}
        >
          {saved && <Ionicons name="checkmark-outline" size={16} color="#fff" />}
          <Text style={styles.saveBtnText}>{saved ? 'Guardado' : 'Guardar cambios'}</Text>
        </AnimatedTouchable>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Cuenta</Text>
            {user ? (
              <>
                <View style={styles.accountRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                </View>
                <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, { borderColor: colors.error }]} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={14} color={colors.error} />
                  <Text style={[styles.signOutText, { color: colors.error }]}>Cerrar sesion</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => router.push('/auth')} style={[styles.loginBtn, { backgroundColor: colors.accentDim }]} activeOpacity={0.7}>
                <Ionicons name="log-in-outline" size={14} color={colors.accent} />
                <Text style={[styles.loginText, { color: colors.accent }]}>Iniciar sesion para guardar datos</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <GlassCard>
            <Text style={[styles.about, { color: colors.text }]}>GymBro v1.0.0</Text>
            <Text style={[styles.aboutSub, { color: colors.textTertiary }]}>Tu entrenador personal con IA</Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MacroRow({ label, value, color, textColor }: { label: string; value: string; color: string; textColor: string }) {
  return (
    <View style={mStyles.row}>
      <View style={[mStyles.dot, { backgroundColor: color }]} />
      <Text style={[mStyles.label, { color: textColor }]}>{label}</Text>
      <Text style={[mStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const mStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  label: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
  value: { fontFamily: fonts.bold, fontSize: 15 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 100 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeLabel: { fontFamily: fonts.semibold, fontSize: 15 },
  themeMode: { fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', padding: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },
  toggleLeft: { alignSelf: 'flex-start' as any },
  toggleRight: { alignSelf: 'flex-end' as any },
  sectionLabel: { fontFamily: fonts.semibold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  fields: { gap: spacing.xl },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.md, paddingVertical: 16,
  },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  accountEmail: { fontFamily: fonts.medium, fontSize: 14 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5 },
  signOutText: { fontFamily: fonts.bold, fontSize: 14 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md },
  loginText: { fontFamily: fonts.semibold, fontSize: 14 },
  reminderTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLabel: { fontFamily: fonts.medium, fontSize: 13 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: 1, minWidth: 70, textAlign: 'center' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dayChipText: { fontFamily: fonts.bold, fontSize: 12 },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5 },
  testBtnText: { fontFamily: fonts.semibold, fontSize: 13 },
  about: { fontFamily: fonts.bold, fontSize: 14 },
  aboutSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
});
