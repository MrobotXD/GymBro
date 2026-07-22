import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';
import { ChatMessage } from '@/lib/types';
import { chatWithGymBro } from '@/lib/groq';

const SUGGESTIONS = [
  '¿Cómo ganar masa muscular?',
  '¿Qué comer post-entreno?',
  'Rutina para principiantes',
  '¿Cuánta proteína necesito?',
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(36),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await chatWithGymBro(history);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(36),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(36),
        role: 'assistant',
        content: 'Error al conectar con el servidor. Intenta de nuevo.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarBg, { backgroundColor: colors.accentDim }]}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>GymBro</Text>
          <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Tu experto en fitness</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="fitness-outline" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Hola, soy GymBro</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Preguntame lo que quieras sobre entrenamiento, nutrición, suplementos o técnica
            </Text>

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(400 + i * 80).duration(300)}>
                  <TouchableOpacity
                    onPress={() => sendMessage(s)}
                    style={[styles.suggestionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
                    <Ionicons name="arrow-forward-outline" size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <Animated.View
              key={msg.id}
              entering={FadeIn.duration(250)}
              style={[styles.msgRow, isUser && styles.msgRowUser]}
            >
              {!isUser && (
                <View style={[styles.msgAvatar, { backgroundColor: colors.accentDim }]}>
                  <Ionicons name="fitness-outline" size={12} color={colors.accent} />
                </View>
              )}
              <View style={[
                styles.msgBubble,
                isUser
                  ? { backgroundColor: colors.accent, borderBottomRightRadius: 4 }
                  : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
              ]}>
                <Text style={[
                  styles.msgText,
                  { color: isUser ? '#fff' : colors.text },
                ]}>{msg.content}</Text>
              </View>
            </Animated.View>
          );
        })}

        {loading && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.msgRow}>
            <View style={[styles.msgAvatar, { backgroundColor: colors.accentDim }]}>
              <Text style={{ fontSize: 12 }}>💪</Text>
            </View>
            <View style={[styles.msgBubble, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
              <Text style={[styles.typingText, { color: colors.textTertiary }]}>Escribiendo...</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta algo..."
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.accent : colors.inputBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name="send-outline" size={16} color={input.trim() ? '#fff' : colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
  avatarBg: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18 },
  headerSub: { fontFamily: fonts.regular, fontSize: 12 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 19 },
  suggestions: { width: '100%', gap: 8, marginTop: spacing.lg },
  suggestionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radius.md, padding: 14 },
  suggestionText: { fontFamily: fonts.medium, fontSize: 13, flex: 1 },

  // Messages
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  msgBubble: { maxWidth: '78%', borderRadius: radius.md, padding: 12 },
  msgText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  typingText: { fontFamily: fonts.medium, fontSize: 13 },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: 1, paddingBottom: Platform.OS === 'web' ? spacing.md : 30 },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
