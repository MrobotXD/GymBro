import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import MacroRing from '@/components/MacroRing';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { FoodEntry } from '@/lib/types';
import { getProfile, getDailyNutrition, saveFoodEntry } from '@/lib/storage';
import { analyzeFoodPhoto, analyzeFoodText, calculateMacroTargets } from '@/lib/groq';
import * as ImagePicker from 'expo-image-picker';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [targets, setTargets] = useState({ calories: 2500, protein: 150, carbs: 300, fat: 70 });
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    const profile = await getProfile();
    if (profile) setTargets(calculateMacroTargets(profile));
    const daily = await getDailyNutrition(today);
    setEntries(daily?.entries || []);
  }, [today]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const totals = entries.reduce((a, e) => ({ calories: a.calories + e.calories, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const showError = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const addEntry = async (entry: Omit<FoodEntry, 'id' | 'timestamp'>, photoUri?: string) => {
    const full: FoodEntry = { ...entry, id: Date.now().toString(36), timestamp: new Date().toISOString(), photoUri };
    await saveFoodEntry(today, full, targets);
    setEntries(prev => [...prev, full]);
  };

  const scanPhoto = async (useCamera: boolean) => {
    if (useCamera) { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.5, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    setLoading(true);
    try { const a = await analyzeFoodPhoto(result.assets[0].base64); await addEntry(a, result.assets[0].uri); }
    catch (err: any) { showError(err.message); }
    finally { setLoading(false); }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try { const a = await analyzeFoodText(textInput); await addEntry(a); setTextInput(''); setShowInput(false); }
    catch (err: any) { showError(err.message); }
    finally { setLoading(false); }
  };

  const calPct = Math.min((totals.calories / targets.calories) * 100, 100);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Header title="Nutricion" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard>
            <View style={styles.calRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.calLabel, { color: colors.text }]}>Calorias</Text>
                <Text style={[styles.calSub, { color: colors.textTertiary }]}>{today}</Text>
              </View>
              <Text style={[styles.calNum, { color: colors.text }]}>{totals.calories}</Text>
              <Text style={[styles.calUnit, { color: colors.textTertiary }]}>/{targets.calories}</Text>
            </View>
            <View style={[styles.calBar, { backgroundColor: colors.dot }]}>
              <View style={[styles.calBarFill, { width: `${calPct}%`, backgroundColor: colors.accent }]} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.macroRow}>
          <GlassCard style={styles.macroCard}><MacroRing current={totals.protein} target={targets.protein} label="Proteina" color={colors.protein} size={70} /></GlassCard>
          <GlassCard style={styles.macroCard}><MacroRing current={totals.carbs} target={targets.carbs} label="Carbos" color={colors.carbs} size={70} /></GlassCard>
          <GlassCard style={styles.macroCard}><MacroRing current={totals.fat} target={targets.fat} label="Grasa" color={colors.fat} size={70} /></GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.addRow}>
          {[{ icon: 'camera-outline', action: () => scanPhoto(true) }, { icon: 'image-outline', action: () => scanPhoto(false) }, { icon: 'create-outline', action: () => setShowInput(!showInput) }].map((btn, i) => (
            <TouchableOpacity key={i} onPress={btn.action} disabled={loading} style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name={btn.icon as any} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {loading && (
          <Animated.View entering={FadeIn.duration(300)}>
            <GlassCard><Text style={[styles.loadingText, { color: colors.accent }]}>Analizando con IA...</Text></GlassCard>
          </Animated.View>
        )}

        {showInput && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassCard>
              <TextInput value={textInput} onChangeText={setTextInput} placeholder="2 huevos con pan y aguacate..." placeholderTextColor={colors.textTertiary} style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]} multiline />
              <TouchableOpacity onPress={analyzeText} disabled={!textInput.trim() || loading} style={[styles.analyzeBtn, { backgroundColor: colors.accent, opacity: !textInput.trim() || loading ? 0.3 : 1 }]}>
                <Text style={styles.analyzeBtnText}>Analizar</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}

        {entries.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <GlassCard noPadding>
              <View style={[styles.entriesHead, { borderBottomColor: colors.border }]}>
                <Text style={[styles.entriesTitle, { color: colors.text }]}>Hoy</Text>
                <Text style={[styles.entriesCount, { color: colors.textTertiary, backgroundColor: colors.dot }]}>{entries.length}</Text>
              </View>
              {entries.map(entry => (
                <View key={entry.id} style={[styles.entryRow, { borderTopColor: colors.border }]}>
                  {entry.photoUri && <Image source={{ uri: entry.photoUri }} style={styles.entryPhoto} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryName, { color: colors.text }]}>{entry.name}</Text>
                    <Text style={[styles.entryMacros, { color: colors.textTertiary }]}>{entry.calories}kcal · P:{entry.protein} · C:{entry.carbs} · G:{entry.fat}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 100 },
  calRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  calLabel: { fontFamily: fonts.semibold, fontSize: 14 },
  calSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  calNum: { fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.5 },
  calUnit: { fontFamily: fonts.medium, fontSize: 14 },
  calBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  calBarFill: { height: 4, borderRadius: 2 },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  macroCard: { flex: 1, alignItems: 'center' as any, paddingVertical: spacing.lg },
  addRow: { flexDirection: 'row', gap: spacing.md },
  addBtn: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  textInput: { borderRadius: radius.sm, padding: spacing.md, fontFamily: fonts.regular, fontSize: 14, minHeight: 50, marginBottom: spacing.md },
  analyzeBtn: { borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  analyzeBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  entriesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  entriesTitle: { fontFamily: fonts.semibold, fontSize: 14 },
  entriesCount: { fontFamily: fonts.medium, fontSize: 11, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: spacing.lg, borderTopWidth: 1 },
  entryPhoto: { width: 40, height: 40, borderRadius: radius.sm },
  entryName: { fontFamily: fonts.semibold, fontSize: 13 },
  entryMacros: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
});
