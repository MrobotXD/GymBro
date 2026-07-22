import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, radius, spacing } from '@/lib/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

export function FormInput({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, style }: InputProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text }]}
      />
    </View>
  );
}

interface SelectProps {
  label: string;
  options: { label: string; value: string; icon?: string }[];
  selected: string;
  onSelect: (value: string) => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function SelectChip({ opt, isSelected, colors, onPress }: { opt: { label: string; value: string; icon?: string }; isSelected: boolean; colors: any; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onPress();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        styles.option,
        animStyle,
        { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
        isSelected && { backgroundColor: colors.accentDim, borderColor: colors.accent },
      ]}
    >
      {opt.icon && (
        <Ionicons
          name={opt.icon as any}
          size={14}
          color={isSelected ? colors.accent : colors.textTertiary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[
        styles.optionText,
        { color: colors.textSecondary },
        isSelected && { color: colors.accent, fontFamily: fonts.semibold },
      ]}>
        {opt.label}
      </Text>
      {isSelected && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.checkIcon}>
          <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
        </Animated.View>
      )}
    </AnimatedTouchable>
  );
}

export function FormSelect({ label, options, selected, onSelect, style }: SelectProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <View style={styles.options}>
        {options.map(opt => (
          <SelectChip
            key={opt.value}
            opt={opt}
            isSelected={selected === opt.value}
            colors={colors}
            onPress={() => onSelect(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onValueChange: (val: number) => void;
  style?: ViewStyle;
}

export function FormStepper({ label, value, min, max, step = 1, unit, onValueChange, style }: StepperProps) {
  const { colors } = useTheme();
  const valScale = useSharedValue(1);
  const valAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: valScale.value }],
  }));

  const handleChange = (newVal: number) => {
    valScale.value = withSequence(
      withSpring(1.15, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onValueChange(newVal);
  };

  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => handleChange(Math.max(min, value - step))}
          style={[styles.stepperBtn, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
          activeOpacity={0.6}
        >
          <Ionicons name="remove" size={18} color={colors.text} />
        </TouchableOpacity>
        <Animated.Text style={[styles.stepperValue, valAnimStyle, { color: colors.text }]}>{value} {unit}</Animated.Text>
        <TouchableOpacity
          onPress={() => handleChange(Math.min(max, value + step))}
          style={[styles.stepperBtn, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9 },
  optionText: { fontFamily: fonts.medium, fontSize: 13 },
  checkIcon: { marginLeft: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: fonts.bold, fontSize: 17, minWidth: 80, textAlign: 'center' },
});
