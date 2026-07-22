import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { useTheme } from '@/lib/ThemeContext';
import { fonts, spacing, radius } from '@/lib/theme';

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
}

type MuscleId = 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'core' | 'piernas' | 'gluteos' | 'pantorrillas';

const MUSCLE_LABELS: Record<MuscleId, string> = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', biceps: 'Bíceps',
  triceps: 'Tríceps', core: 'Core', piernas: 'Piernas', gluteos: 'Glúteos', pantorrillas: 'Pantorrillas',
};

// Our muscle groups -> library slugs (a group can map to several slugs so the whole area lights up)
const ID_TO_SLUGS: Record<MuscleId, Slug[]> = {
  pecho: ['chest'],
  espalda: ['upper-back', 'lower-back', 'trapezius'],
  hombros: ['deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  core: ['abs', 'obliques'],
  piernas: ['quadriceps', 'hamstring', 'adductors'],
  gluteos: ['gluteal'],
  pantorrillas: ['calves', 'tibialis'],
};

const SLUG_TO_ID: Partial<Record<Slug, MuscleId>> = {};
(Object.keys(ID_TO_SLUGS) as MuscleId[]).forEach(id => {
  ID_TO_SLUGS[id].forEach(slug => { SLUG_TO_ID[slug] = id; });
});

const DISABLED_SLUGS: Slug[] = ['ankles', 'feet', 'hands', 'hair', 'head', 'knees', 'neck', 'forearm'];

const ALL_MUSCLE_IDS = Object.keys(MUSCLE_LABELS) as MuscleId[];

export default function MuscleMap({ selected, onToggle }: Props) {
  const { colors } = useTheme();
  const [side, setSide] = useState<'front' | 'back'>('front');

  const bodyData: ExtendedBodyPart[] = selected.flatMap(id => {
    const slugs = ID_TO_SLUGS[id as MuscleId] || [];
    return slugs.map(slug => ({ slug, intensity: 1 }));
  });

  const handlePress = (part: ExtendedBodyPart) => {
    if (!part.slug) return;
    const id = SLUG_TO_ID[part.slug];
    if (id) onToggle(id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setSide(side === 'front' ? 'back' : 'front')}
        style={[styles.flipBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.flipBtnText, { color: colors.accent }]}>
          {side === 'front' ? 'Ver espalda ↻' : 'Ver frente ↻'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bodyWrap}>
        <Body
          gender="male"
          side={side}
          scale={1.7}
          data={bodyData}
          colors={[colors.accent]}
          border={colors.separator}
          defaultFill={colors.inputBg}
          disabledParts={DISABLED_SLUGS}
          onBodyPartPress={handlePress}
        />
      </View>

      <View style={styles.chipsRow}>
        {ALL_MUSCLE_IDS.map(id => {
          const isSelected = selected.includes(id);
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onToggle(id)}
              style={[
                styles.chip,
                {
                  borderColor: isSelected ? colors.accent : colors.separator,
                  backgroundColor: isSelected ? colors.accentDim : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: isSelected ? colors.accent : colors.textSecondary }]}>
                {MUSCLE_LABELS[id]}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={13} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 14 },
  flipBtn: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  flipBtnText: { fontFamily: fonts.semibold, fontSize: 13 },
  bodyWrap: { alignItems: 'center', paddingVertical: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
});
