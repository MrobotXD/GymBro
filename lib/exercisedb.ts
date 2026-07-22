const GITHUB_RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: { en: string; es: string };
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  media_id: string;
  image: string;
  gif_url: string;
}

let exercisesCache: Exercise[] | null = null;
const searchCache = new Map<string, ExerciseResult | null>();

async function loadExercises(): Promise<Exercise[]> {
  if (exercisesCache) return exercisesCache;
  const res = await fetch(`${GITHUB_RAW}/data/exercises.json`);
  if (!res.ok) return [];
  exercisesCache = await res.json();
  return exercisesCache!;
}

// Direct mapping: Spanish exercise name → exact English exercise name in the dataset.
// Each key maps to an array of candidate names tried in order.
// This is the PRIMARY matching mechanism — add entries here when exercises don't match.
const DIRECT_MAP: Record<string, string[]> = {
  // PECHO
  'press de banca': ['barbell bench press flat', 'barbell bench press', 'bench press'],
  'press banca': ['barbell bench press flat', 'barbell bench press'],
  'press de banca inclinado': ['barbell incline bench press', 'incline barbell bench press', 'dumbbell incline bench press'],
  'press inclinado': ['barbell incline bench press', 'dumbbell incline bench press'],
  'press inclinado con mancuernas': ['dumbbell incline bench press', 'dumbbell incline press'],
  'press de banca declinado': ['decline barbell bench press', 'barbell decline bench press'],
  'press declinado': ['decline barbell bench press', 'decline dumbbell bench press'],
  'press de pecho': ['barbell bench press flat', 'barbell bench press'],
  'press de pecho con mancuernas': ['dumbbell bench press', 'dumbbell press'],
  'press con mancuernas': ['dumbbell bench press', 'dumbbell press'],
  'press plano con mancuernas': ['dumbbell bench press'],
  'apertura con mancuernas': ['dumbbell fly', 'dumbbell chest fly'],
  'aperturas con mancuernas': ['dumbbell fly', 'dumbbell chest fly'],
  'vuelos con mancuernas': ['dumbbell fly'],
  'vuelos': ['dumbbell fly'],
  'cruces en polea': ['cable crossover', 'cable fly'],
  'cruces de polea': ['cable crossover', 'cable fly'],
  'pecho en polea': ['cable crossover', 'cable fly'],
  'flexiones': ['push-up', 'push up'],
  'flexiones clasicas': ['push-up', 'push up'],
  'flexiones clásicas': ['push-up', 'push up'],
  'flexiones diamante': ['diamond push-up', 'close grip push-up', 'diamond push up'],
  'flexiones declinadas': ['decline push-up', 'decline push up'],
  'flexiones inclinadas': ['incline push-up', 'incline push up'],
  'fondos en paralelas': ['chest dip', 'dip'],
  'fondos': ['chest dip', 'dip', 'triceps dip'],
  'press en máquina': ['lever chest press', 'machine chest press'],
  'press en maquina': ['lever chest press', 'machine chest press'],
  'pullover': ['dumbbell pullover'],
  'pullover con mancuerna': ['dumbbell pullover'],

  // ESPALDA
  'dominadas': ['pull-up', 'pull up'],
  'dominadas con agarre ancho': ['wide grip pull-up', 'wide grip pull up'],
  'dominadas con agarre cerrado': ['close grip pull-up', 'close grip chin-up'],
  'jalón al pecho': ['cable lat pulldown', 'lat pulldown', 'wide grip lat pulldown'],
  'jalon al pecho': ['cable lat pulldown', 'lat pulldown', 'wide grip lat pulldown'],
  'jalón frontal': ['cable lat pulldown', 'lat pulldown'],
  'jalon frontal': ['cable lat pulldown', 'lat pulldown'],
  'remo con barra': ['barbell bent over row', 'barbell row', 'bent over barbell row'],
  'remo con mancuerna': ['dumbbell bent over row', 'dumbbell row'],
  'remo con mancuernas': ['dumbbell bent over row', 'dumbbell row'],
  'remo en polea': ['cable seated row', 'seated cable row', 'seated row'],
  'remo en polea baja': ['cable seated row', 'seated cable row'],
  'remo invertido': ['inverted row', 'bodyweight row'],
  'remo con barra t': ['lever t-bar row', 't-bar row'],
  'peso muerto': ['barbell deadlift', 'deadlift'],
  'peso muerto convencional': ['barbell deadlift', 'deadlift'],
  'peso muerto rumano': ['barbell romanian deadlift', 'romanian deadlift', 'dumbbell romanian deadlift'],
  'peso muerto sumo': ['sumo deadlift', 'barbell sumo deadlift'],
  'hiperextensiones': ['hyperextension', 'back extension'],
  'buenos dias': ['barbell good morning', 'good morning'],
  'face pull': ['cable face pull', 'face pull'],

  // HOMBROS
  'press militar': ['barbell overhead press', 'barbell standing military press', 'military press'],
  'press de hombro': ['dumbbell shoulder press', 'dumbbell overhead press'],
  'press de hombros': ['dumbbell shoulder press', 'dumbbell overhead press'],
  'press de hombros con mancuernas': ['dumbbell shoulder press'],
  'press arnold': ['dumbbell arnold press', 'arnold press'],
  'elevaciones laterales': ['dumbbell lateral raise', 'lateral raise'],
  'elevaciones laterales con mancuernas': ['dumbbell lateral raise'],
  'elevaciones frontales': ['dumbbell front raise', 'front raise'],
  'elevaciones frontales con mancuernas': ['dumbbell front raise'],
  'remo al mentón': ['barbell upright row', 'upright row'],
  'remo al menton': ['barbell upright row', 'upright row'],
  'pájaros': ['dumbbell rear delt fly', 'rear delt fly', 'dumbbell reverse fly'],
  'pajaros': ['dumbbell rear delt fly', 'rear delt fly', 'dumbbell reverse fly'],
  'vuelos posteriores': ['dumbbell rear delt fly', 'reverse fly'],
  'elevaciones laterales en polea': ['cable lateral raise'],

  // BICEPS
  'curl de biceps': ['dumbbell bicep curl', 'dumbbell curl', 'barbell curl'],
  'curl de bíceps': ['dumbbell bicep curl', 'dumbbell curl', 'barbell curl'],
  'curl con barra': ['barbell curl', 'barbell bicep curl', 'ez barbell curl'],
  'curl con mancuernas': ['dumbbell curl', 'dumbbell bicep curl', 'dumbbell alternate bicep curl'],
  'curl martillo': ['dumbbell hammer curl', 'hammer curl'],
  'curl concentrado': ['dumbbell concentration curl', 'concentration curl'],
  'curl predicador': ['dumbbell preacher curl', 'barbell preacher curl', 'ez barbell preacher curl'],
  'curl scott': ['dumbbell preacher curl', 'ez barbell preacher curl'],
  'curl en polea': ['cable curl', 'cable bicep curl'],
  'curl con barra z': ['ez barbell curl', 'ez bar curl'],
  'curl inclinado': ['dumbbell incline curl', 'incline dumbbell curl'],
  'curl alterno': ['dumbbell alternate bicep curl', 'alternate dumbbell curl'],
  'curl con barra recta': ['barbell curl', 'barbell bicep curl'],
  'bicep en polea': ['cable curl', 'cable bicep curl'],

  // TRICEPS
  'extensiones de tríceps con mancuernas': ['dumbbell overhead tricep extension', 'dumbbell tricep extension', 'dumbbell kickback'],
  'extensiones de triceps con mancuernas': ['dumbbell overhead tricep extension', 'dumbbell tricep extension', 'dumbbell kickback'],
  'extensión de tríceps con mancuerna': ['dumbbell overhead tricep extension', 'dumbbell tricep extension'],
  'extension de triceps con mancuerna': ['dumbbell overhead tricep extension', 'dumbbell tricep extension'],
  'extensión de tríceps con mancuernas': ['dumbbell overhead tricep extension', 'dumbbell tricep extension'],
  'extension de triceps con mancuernas': ['dumbbell overhead tricep extension', 'dumbbell tricep extension'],
  'extensión de tríceps': ['cable tricep pushdown', 'tricep pushdown', 'cable pushdown'],
  'extension de triceps': ['cable tricep pushdown', 'tricep pushdown', 'cable pushdown'],
  'extensiones de triceps': ['cable tricep pushdown', 'tricep pushdown'],
  'press francés': ['barbell lying triceps extension', 'skull crusher', 'lying tricep extension'],
  'press frances': ['barbell lying triceps extension', 'skull crusher', 'lying tricep extension'],
  'patada de tríceps': ['dumbbell kickback', 'tricep kickback', 'dumbbell tricep kickback'],
  'patada de triceps': ['dumbbell kickback', 'tricep kickback', 'dumbbell tricep kickback'],
  'fondos en banco': ['bench dip', 'tricep bench dip'],
  'fondos en silla': ['bench dip', 'tricep bench dip'],
  'tricep en polea': ['cable pushdown', 'tricep pushdown', 'cable tricep pushdown'],
  'extensión de tríceps sobre cabeza': ['dumbbell overhead tricep extension', 'overhead tricep extension'],
  'extension de triceps sobre cabeza': ['dumbbell overhead tricep extension', 'overhead tricep extension'],
  'press cerrado': ['close grip barbell bench press', 'close grip bench press'],
  'extensión de tríceps con cuerda': ['cable rope pushdown', 'rope pushdown'],
  'extension de triceps con cuerda': ['cable rope pushdown', 'rope pushdown'],

  // PIERNAS
  'sentadilla': ['barbell full squat', 'barbell squat', 'squat'],
  'sentadillas': ['barbell full squat', 'barbell squat', 'squat'],
  'sentadilla con barra': ['barbell full squat', 'barbell squat'],
  'sentadilla frontal': ['barbell front squat', 'front squat'],
  'sentadilla goblet': ['dumbbell goblet squat', 'goblet squat'],
  'sentadilla sumo': ['dumbbell sumo squat', 'sumo squat'],
  'sentadilla búlgara': ['dumbbell bulgarian split squat', 'bulgarian split squat'],
  'sentadilla bulgara': ['dumbbell bulgarian split squat', 'bulgarian split squat'],
  'sentadilla hack': ['hack squat', 'sled hack squat'],
  'prensa de piernas': ['sled leg press', 'leg press', 'lever leg press'],
  'extensión de piernas': ['lever leg extension', 'leg extension'],
  'extension de piernas': ['lever leg extension', 'leg extension'],
  'curl de piernas': ['lever lying leg curl', 'leg curl', 'lying leg curl'],
  'curl femoral': ['lever lying leg curl', 'lying leg curl'],
  'zancadas': ['dumbbell lunge', 'lunge', 'barbell lunge'],
  'zancada': ['dumbbell lunge', 'lunge'],
  'zancadas con mancuernas': ['dumbbell lunge', 'walking lunge'],
  'desplantes': ['dumbbell lunge', 'lunge'],
  'step up': ['dumbbell step up', 'step up'],
  'subidas al banco': ['dumbbell step up', 'step up'],

  // GLUTEOS
  'hip thrust': ['barbell hip thrust', 'hip thrust', 'glute bridge barbell'],
  'puente de glúteos': ['barbell glute bridge', 'glute bridge'],
  'puente de gluteos': ['barbell glute bridge', 'glute bridge'],
  'patada de glúteo': ['cable kickback', 'glute kickback'],
  'patada de gluteo': ['cable kickback', 'glute kickback'],
  'sentadilla sumo con mancuerna': ['dumbbell sumo squat'],

  // PANTORRILLAS
  'elevación de pantorrillas': ['standing calf raise', 'calf raise', 'smith machine calf raise'],
  'elevacion de pantorrillas': ['standing calf raise', 'calf raise'],
  'elevación de gemelos': ['standing calf raise', 'calf raise'],
  'elevacion de gemelos': ['standing calf raise', 'calf raise'],
  'pantorrillas sentado': ['seated calf raise', 'lever seated calf raise'],
  'pantorrillas de pie': ['standing calf raise', 'calf raise'],

  // CORE / ABDOMINALES
  'abdominales': ['crunch', 'sit-up'],
  'crunch': ['crunch'],
  'plancha': ['front plank', 'plank'],
  'plancha abdominal': ['front plank', 'plank'],
  'plancha lateral': ['side plank', 'side bridge'],
  'elevación de piernas': ['hanging leg raise', 'leg raise', 'captain chair leg raise'],
  'elevacion de piernas': ['hanging leg raise', 'leg raise'],
  'elevación de piernas colgado': ['hanging leg raise'],
  'abdominales en polea': ['cable crunch', 'kneeling cable crunch'],
  'russian twist': ['russian twist'],
  'mountain climbers': ['mountain climber'],
  'mountain climber': ['mountain climber'],
  'burpees': ['burpee'],
  'burpee': ['burpee'],
  'rodillo abdominal': ['ab roller', 'ab wheel rollout'],
  'rueda abdominal': ['ab roller', 'ab wheel rollout'],
  'oblicuos': ['oblique crunch', 'side crunch'],
  'crunch bicicleta': ['bicycle crunch', 'air bike'],

  // TRAPECIO
  'encogimiento de hombros': ['barbell shrug', 'dumbbell shrug', 'shrug'],
  'encogimientos de hombros': ['barbell shrug', 'dumbbell shrug'],
  'encogimientos': ['barbell shrug', 'dumbbell shrug'],
};

// Muscle group from Spanish exercise context → dataset body_part for filtering
const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  'pecho': ['chest'],
  'espalda': ['back'],
  'hombros': ['shoulders'],
  'hombro': ['shoulders'],
  'biceps': ['upper arms'],
  'bíceps': ['upper arms'],
  'triceps': ['upper arms'],
  'tríceps': ['upper arms'],
  'piernas': ['upper legs', 'lower legs'],
  'pierna': ['upper legs', 'lower legs'],
  'cuádriceps': ['upper legs'],
  'cuadriceps': ['upper legs'],
  'isquiotibiales': ['upper legs'],
  'glúteos': ['upper legs'],
  'gluteos': ['upper legs'],
  'pantorrillas': ['lower legs'],
  'gemelos': ['lower legs'],
  'abdominales': ['waist'],
  'abdomen': ['waist'],
  'core': ['waist'],
  'cuerpo_completo': ['chest', 'back', 'upper legs', 'shoulders', 'upper arms'],
};

export interface ExerciseResult {
  name: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  instructions: string;
}

export async function searchExercise(name: string): Promise<ExerciseResult | null> {
  const cacheKey = name.toLowerCase().trim();
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)!;

  try {
    const exercises = await loadExercises();
    if (exercises.length === 0) return miss(cacheKey);

    // === STEP 1: Direct map lookup (most reliable) ===
    const directResult = tryDirectMap(cacheKey, exercises);
    if (directResult) return hit(cacheKey, directResult);

    // === STEP 2: Try partial phrase matches from the direct map ===
    const partialResult = tryPartialDirectMap(cacheKey, exercises);
    if (partialResult) return hit(cacheKey, partialResult);

    // === STEP 3: Fuzzy search with strict scoring ===
    const fuzzyResult = fuzzySearch(cacheKey, exercises);
    if (fuzzyResult) return hit(cacheKey, fuzzyResult);

    return miss(cacheKey);
  } catch {
    return miss(cacheKey);
  }
}

function tryDirectMap(input: string, exercises: Exercise[]): Exercise | null {
  // Try exact key match
  const variants = DIRECT_MAP[input];
  if (variants) {
    return findByVariants(variants, exercises);
  }

  // Try all keys that are contained in the input (longest first for specificity)
  const sortedKeys = Object.keys(DIRECT_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (input === key || input.includes(key)) {
      const found = findByVariants(DIRECT_MAP[key], exercises);
      if (found) return found;
    }
  }

  return null;
}

function tryPartialDirectMap(input: string, exercises: Exercise[]): Exercise | null {
  // Try matching if the input contains any key as a substring
  const words = input.split(/\s+/);
  if (words.length < 2) return null;

  // Build 2-word and 3-word combinations from the input
  const combos: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    combos.push(words.slice(i, i + 2).join(' '));
    if (i < words.length - 2) {
      combos.push(words.slice(i, i + 3).join(' '));
    }
  }

  const sortedKeys = Object.keys(DIRECT_MAP).sort((a, b) => b.length - a.length);
  for (const combo of combos) {
    for (const key of sortedKeys) {
      if (combo === key || key.includes(combo) || combo.includes(key)) {
        const found = findByVariants(DIRECT_MAP[key], exercises);
        if (found) return found;
      }
    }
  }

  return null;
}

function findByVariants(variants: string[], exercises: Exercise[]): Exercise | null {
  for (const name of variants) {
    const lower = name.toLowerCase();

    // Exact name match
    const exact = exercises.find(ex => ex.name.toLowerCase() === lower);
    if (exact && exact.gif_url) return exact;

    // Contains match (full variant must appear in exercise name)
    const contains = exercises.find(ex =>
      ex.name.toLowerCase().includes(lower) && ex.gif_url
    );
    if (contains) return contains;

    // Reverse: exercise name appears in variant
    const reverse = exercises.find(ex =>
      lower.includes(ex.name.toLowerCase()) && ex.gif_url
    );
    if (reverse) return reverse;
  }

  // Retry without gif_url requirement
  for (const name of variants) {
    const lower = name.toLowerCase();
    const match = exercises.find(ex => ex.name.toLowerCase().includes(lower));
    if (match) return match;
  }

  return null;
}

function fuzzySearch(input: string, exercises: Exercise[]): Exercise | null {
  // Extract muscle group context from input
  const bodyParts: string[] = [];
  for (const [es, parts] of Object.entries(MUSCLE_GROUP_MAP)) {
    if (input.includes(es)) {
      bodyParts.push(...parts);
    }
  }

  // Translate individual words to English for fuzzy matching
  const translated = translateWords(input);
  const terms = translated.split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return null;

  let best: Exercise | null = null;
  let bestScore = 0;

  for (const ex of exercises) {
    const exName = ex.name.toLowerCase();
    const exTarget = (ex.target || '').toLowerCase();
    const exBodyPart = (ex.body_part || '').toLowerCase();

    let score = 0;
    let matched = 0;

    for (const term of terms) {
      if (exName.includes(term)) {
        matched++;
        score += term.length * 3;
      }
    }

    if (matched === 0) continue;

    // Ratio bonus: what fraction of search terms matched
    const ratio = matched / terms.length;
    score += ratio * 20;

    // Body part context bonus
    if (bodyParts.length > 0 && bodyParts.includes(exBodyPart)) {
      score += 10;
    }

    // Penalize very short exercise names matching (likely false positives)
    if (exName.split(' ').length <= 1 && terms.length > 1) {
      score -= 5;
    }

    // Prefer exercises with GIFs
    if (ex.gif_url) score += 2;

    // Prefer higher match ratios strongly
    if (ratio < 0.5 && terms.length > 2) {
      score *= 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }

  // Require a minimum score to avoid garbage matches
  if (!best || bestScore < 10) return null;
  return best;
}

const WORD_TRANSLATE: Record<string, string> = {
  'press': 'press', 'banca': 'bench', 'militar': 'military',
  'hombro': 'shoulder', 'hombros': 'shoulder', 'sentadilla': 'squat',
  'sentadillas': 'squat', 'curl': 'curl', 'biceps': 'bicep',
  'bíceps': 'bicep', 'triceps': 'tricep', 'tríceps': 'tricep',
  'remo': 'row', 'barra': 'barbell', 'mancuerna': 'dumbbell',
  'mancuernas': 'dumbbell', 'inclinado': 'incline', 'declinado': 'decline',
  'dominadas': 'pull up', 'jalón': 'pulldown', 'jalon': 'pulldown',
  'pecho': 'chest', 'lateral': 'lateral', 'laterales': 'lateral',
  'frontal': 'front', 'frontales': 'front', 'elevaciones': 'raise',
  'elevación': 'raise', 'elevacion': 'raise', 'extensión': 'extension',
  'extension': 'extension', 'patada': 'kickback',
  'zancadas': 'lunge', 'zancada': 'lunge', 'prensa': 'press',
  'piernas': 'leg', 'pierna': 'leg', 'plancha': 'plank',
  'abdominales': 'crunch', 'apertura': 'fly', 'aperturas': 'fly',
  'glúteos': 'glute', 'gluteos': 'glute', 'puente': 'bridge',
  'arnold': 'arnold', 'flexiones': 'push up', 'cable': 'cable',
  'polea': 'cable', 'máquina': 'machine', 'maquina': 'machine',
  'copa': 'goblet', 'sumo': 'sumo', 'búlgara': 'bulgarian',
  'bulgara': 'bulgarian', 'rumano': 'romanian', 'martillo': 'hammer',
  'concentrado': 'concentration', 'predicador': 'preacher',
  'pantorrilla': 'calf', 'pantorrillas': 'calf', 'gemelos': 'calf',
  'encogimientos': 'shrug', 'encogimiento': 'shrug', 'trapecio': 'trap',
  'espalda': 'back', 'fondos': 'dip', 'cerrado': 'close grip',
  'ancho': 'wide grip', 'cuerda': 'rope', 'sobre': 'overhead',
  'cabeza': 'overhead', 'francés': 'lying extension', 'frances': 'lying extension',
  'sentado': 'seated', 'de pie': 'standing',
};

function translateWords(input: string): string {
  const words = input.replace(/[(),.·\-]/g, ' ').split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (const w of words) {
    if (WORD_TRANSLATE[w]) result.push(WORD_TRANSLATE[w]);
    else if (w.length > 2 && !/^(de|del|con|en|al|la|el|las|los|un|una|por|para|y|o)$/.test(w)) {
      result.push(w);
    }
  }
  return result.join(' ');
}

function hit(key: string, ex: Exercise): ExerciseResult {
  const result: ExerciseResult = {
    name: ex.name,
    gifUrl: ex.gif_url ? `${GITHUB_RAW}/${ex.gif_url}` : '',
    target: ex.target || '',
    secondaryMuscles: ex.secondary_muscles || [],
    equipment: ex.equipment || '',
    instructions: ex.instructions?.es || ex.instructions?.en || '',
  };
  searchCache.set(key, result);
  return result;
}

function miss(key: string): null {
  searchCache.set(key, null);
  return null;
}
