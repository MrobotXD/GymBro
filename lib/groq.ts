import { UserProfile, WorkoutPlan } from './types';
import { GROQ_API_KEY } from './config';

// Exercises that have matching GIFs in the database, grouped by muscle.
// The AI MUST only pick from this list so every exercise has an animation.
export const EXERCISE_CATALOG: Record<string, string[]> = {
  pecho: [
    'Press de banca', 'Press de banca inclinado', 'Press de banca declinado',
    'Press con mancuernas', 'Press inclinado con mancuernas', 'Press plano con mancuernas',
    'Apertura con mancuernas', 'Cruces en polea', 'Flexiones', 'Flexiones diamante',
    'Flexiones declinadas', 'Flexiones inclinadas', 'Fondos en paralelas',
    'Press en máquina', 'Pullover con mancuerna',
  ],
  espalda: [
    'Dominadas', 'Dominadas con agarre ancho', 'Dominadas con agarre cerrado',
    'Jalón al pecho', 'Remo con barra', 'Remo con mancuerna', 'Remo en polea',
    'Remo invertido', 'Peso muerto', 'Peso muerto rumano', 'Peso muerto sumo',
    'Hiperextensiones', 'Face pull', 'Remo con barra t',
  ],
  hombros: [
    'Press militar', 'Press de hombros con mancuernas', 'Press Arnold',
    'Elevaciones laterales', 'Elevaciones frontales', 'Remo al mentón',
    'Pájaros', 'Vuelos posteriores', 'Elevaciones laterales en polea',
    'Encogimiento de hombros',
  ],
  biceps: [
    'Curl con barra', 'Curl con mancuernas', 'Curl martillo',
    'Curl concentrado', 'Curl predicador', 'Curl en polea',
    'Curl con barra z', 'Curl inclinado', 'Curl alterno',
  ],
  triceps: [
    'Extensión de tríceps', 'Extensiones de tríceps con mancuernas',
    'Extensión de tríceps sobre cabeza', 'Extensión de tríceps con cuerda',
    'Press francés', 'Patada de tríceps', 'Fondos en banco',
    'Fondos en silla', 'Press cerrado',
  ],
  piernas: [
    'Sentadilla con barra', 'Sentadilla frontal', 'Sentadilla goblet',
    'Sentadilla sumo', 'Sentadilla búlgara', 'Sentadilla hack',
    'Prensa de piernas', 'Extensión de piernas', 'Curl de piernas',
    'Curl femoral', 'Zancadas', 'Zancadas con mancuernas',
    'Peso muerto rumano', 'Step up',
  ],
  gluteos: [
    'Hip thrust', 'Puente de glúteos', 'Sentadilla sumo',
    'Sentadilla búlgara', 'Zancadas', 'Peso muerto rumano',
    'Patada de glúteo',
  ],
  pantorrillas: [
    'Elevación de pantorrillas', 'Pantorrillas sentado', 'Pantorrillas de pie',
  ],
  core: [
    'Plancha', 'Plancha lateral', 'Abdominales', 'Crunch',
    'Elevación de piernas', 'Elevación de piernas colgado',
    'Abdominales en polea', 'Russian twist', 'Mountain climbers',
    'Burpees', 'Rueda abdominal', 'Crunch bicicleta',
  ],
};

function getExerciseCatalogForPrompt(targetMuscles?: string[]): string {
  const groups = targetMuscles?.length
    ? targetMuscles.map(m => m.toLowerCase().replace(/ /g, '_'))
    : Object.keys(EXERCISE_CATALOG);

  const lines: string[] = [];
  for (const group of groups) {
    const key = Object.keys(EXERCISE_CATALOG).find(k =>
      k === group || group.includes(k) || k.includes(group)
    );
    if (key) {
      lines.push(`${key.toUpperCase()}: ${EXERCISE_CATALOG[key].join(', ')}`);
    }
  }

  // Always include core
  if (!groups.includes('core')) {
    lines.push(`CORE: ${EXERCISE_CATALOG.core.join(', ')}`);
  }

  return lines.join('\n');
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(messages: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[], jsonMode = true) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content;
  return jsonMode ? JSON.parse(content) : content;
}

export async function generateWorkoutPlan(profile: UserProfile & { equipment: string[]; targetMuscles?: string[] }): Promise<WorkoutPlan> {
  const equipmentStr = profile.equipment.join(', ');
  const musclesStr = profile.targetMuscles?.length ? profile.targetMuscles.join(', ') : 'todos';
  const exerciseCatalog = getExerciseCatalogForPrompt(profile.targetMuscles);
  const prompt = `Eres un entrenador personal profesional certificado. Genera un plan de entrenamiento completo y detallado en JSON.

Datos del usuario:
- Edad: ${profile.age} años
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Nivel: ${profile.level}
- Objetivo: ${profile.goal.replace('_', ' ')}
- Equipamiento disponible: ${equipmentStr}
- Músculos objetivo: ${musclesStr}
- Días por semana: ${profile.daysPerWeek}
- Minutos por sesión: ${profile.minutesPerSession}

⚠️ REGLA CRÍTICA: SOLO usa ejercicios de la siguiente lista. NO inventes nombres de ejercicios. Copia los nombres EXACTAMENTE como aparecen aquí:

${exerciseCatalog}

⚠️ REGLA DE EQUIPAMIENTO (OBLIGATORIA): El usuario SOLO tiene: ${equipmentStr}. TODOS los ejercicios del plan deben poder realizarse con SOLO ese equipamiento. NO incluyas NINGÚN ejercicio que requiera equipamiento que el usuario NO listó.
Mapeo de ejercicios a equipamiento requerido:
- "Peso corporal": Flexiones, Plancha, Fondos en banco, Sentadilla sin peso, Abdominales, Mountain climbers, Burpees, Remo invertido, Flexiones diamante, Plancha lateral, Crunch, Russian twist, Crunch bicicleta, Elevación de piernas, Puente de glúteos
- "Mancuernas": Press con mancuernas, Curl con mancuernas, Curl martillo, Elevaciones laterales, Press Arnold, Apertura con mancuernas, Remo con mancuerna, Zancadas con mancuernas, Sentadilla goblet, Press de hombros con mancuernas, Curl concentrado, Patada de tríceps, Peso muerto rumano (mancuernas), Sentadilla búlgara
- "Barra": Press de banca, Sentadilla con barra, Peso muerto, Curl con barra, Press militar, Remo con barra, Press francés, Hip thrust, Remo al mentón, Peso muerto sumo, Sentadilla frontal
- "Máquinas": Prensa de piernas, Extensión de piernas, Curl de piernas, Press en máquina, Sentadilla hack
- "Poleas": Jalón al pecho, Cruces en polea, Remo en polea, Extensión de tríceps, Curl en polea, Face pull, Elevaciones laterales en polea, Abdominales en polea, Extensión de tríceps con cuerda
- "Barra de dominadas" o "Dominadas": Dominadas, Dominadas con agarre ancho, Dominadas con agarre cerrado, Elevación de piernas colgado
- "Banco": Cualquier press en banco, Fondos en banco, Curl inclinado, Step up
- "Bandas": Ejercicios de resistencia con banda
- "Kettlebells": Sentadilla goblet, Zancadas, Press
- "TRX": Remo invertido, Flexiones suspendidas

⚠️ REGLA DE OBJETIVO (OBLIGATORIA): El objetivo del usuario es "${profile.goal.replace('_', ' ')}". Diseña el plan ESPECÍFICAMENTE para ese objetivo:
- "ganar musculo": Hipertrofia. 3-4 series de 8-12 reps, descanso 60-90s, peso moderado-alto, ejercicios compuestos + aislamiento
- "perder grasa": Circuitos, superseries, 3-4 series de 12-15 reps, descanso 30-45s, alta intensidad
- "fuerza": 4-5 series de 3-6 reps, descanso 2-3min, peso alto, ejercicios compuestos pesados
- "resistencia": 2-3 series de 15-20 reps, descanso 30s, peso ligero, ritmo rápido
- "mantener": 3 series de 10-12 reps, descanso 60s, peso moderado, variedad

⚠️ REGLA DE MÚSCULOS (OBLIGATORIA): El usuario quiere trabajar ESTOS músculos: ${musclesStr}. Distribuye los ${profile.daysPerWeek} días para cubrir SOLO estos grupos musculares. NO incluyas ejercicios de músculos que el usuario NO seleccionó (excepto core como complemento).

Genera un plan de ${profile.daysPerWeek} días por semana durante 4 semanas. Cada día debe tener entre 5 y 8 ejercicios de la lista anterior que cumplan TODAS las reglas anteriores.

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "name": "Nombre del plan",
  "description": "Descripción breve del plan",
  "weeks": 4,
  "days": [
    {
      "dayNumber": 1,
      "name": "Día 1 - Pecho y Tríceps",
      "focus": "Pecho, Tríceps",
      "exercises": [
        {
          "name": "Press de banca",
          "muscleGroup": "pecho",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "weight": "Moderado",
          "notes": "Baja controlado"
        }
      ]
    }
  ]
}

IMPORTANTE: El campo "name" de cada ejercicio DEBE ser exactamente uno de los nombres de la lista de arriba. No modifiques, traduzcas ni parafrasees los nombres.
muscleGroup debe ser uno de: pecho, espalda, hombros, biceps, triceps, piernas, core, gluteos, cuerpo_completo`;

  const result = await callGroq([
    { role: 'system', content: 'Eres un entrenador personal experto. Responde solo con JSON válido.' },
    { role: 'user', content: prompt },
  ]);

  const planId = Date.now().toString(36);
  const plan: WorkoutPlan = {
    id: planId,
    name: result.name,
    description: result.description,
    level: profile.level,
    goal: profile.goal,
    daysPerWeek: profile.daysPerWeek,
    weeks: result.weeks || 4,
    days: result.days.map((d: any, i: number) => ({
      id: `${planId}_d${i}`,
      dayNumber: d.dayNumber,
      name: d.name,
      focus: d.focus,
      completed: false,
      exercises: d.exercises.map((e: any, j: number) => ({
        id: `${planId}_d${i}_e${j}`,
        name: e.name,
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds || 60,
        weight: e.weight,
        notes: e.notes,
      })),
    })),
    createdAt: new Date().toISOString(),
    currentWeek: 1,
    currentDay: 0,
  };

  return plan;
}

export async function analyzeFoodPhoto(base64Image: string): Promise<{ name: string; calories: number; protein: number; carbs: number; fat: number }> {
  const result = await callGroq([
    {
      role: 'system',
      content: 'Eres un nutricionista experto. Analiza la foto de comida y estima los macronutrientes. Responde solo con JSON válido.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analiza esta foto de comida y estima los macronutrientes. Responde SOLO con JSON:
{
  "name": "Nombre de la comida",
  "calories": 450,
  "protein": 30,
  "carbs": 45,
  "fat": 15
}
Los valores deben ser números realistas basados en lo que ves en la imagen.`,
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64Image}` },
        },
      ],
    },
  ]);

  return result;
}

export async function analyzeFoodText(description: string): Promise<{ name: string; calories: number; protein: number; carbs: number; fat: number }> {
  const result = await callGroq([
    {
      role: 'system',
      content: 'Eres un nutricionista experto. Estima los macronutrientes de la comida descrita. Responde solo con JSON válido.',
    },
    {
      role: 'user',
      content: `Estima los macronutrientes de esta comida: "${description}". Responde SOLO con JSON:
{
  "name": "Nombre de la comida",
  "calories": 450,
  "protein": 30,
  "carbs": 45,
  "fat": 15
}`,
    },
  ]);

  return result;
}

export async function chatWithGymBro(messages: { role: string; content: string }[]): Promise<string> {
  const systemMsg = `Eres GymBro, un asistente experto en fitness, entrenamiento y nutrición deportiva. Eres motivador, directo y hablas como un bro del gym pero con conocimiento profesional.

Tus áreas de expertise:
- Rutinas de entrenamiento (hipertrofia, fuerza, resistencia, calistenia)
- Nutrición deportiva (macros, suplementos, dietas, meal prep)
- Técnica de ejercicios y prevención de lesiones
- Periodización y programación de entrenamiento
- Motivación y mentalidad fitness

Reglas:
- Responde siempre en español
- Sé conciso pero informativo
- Da consejos prácticos y aplicables
- Si te preguntan algo médico específico, recomienda consultar un profesional
- Usa un tono amigable y motivador`;

  const result = await callGroq([
    { role: 'system', content: systemMsg },
    ...messages,
  ], false);

  return result;
}

export function calculateMacroTargets(profile: UserProfile): { calories: number; protein: number; carbs: number; fat: number } {
  const bmr = profile.weight * 10 + profile.height * 6.25 - profile.age * 5 + 5;
  const activityMultiplier = profile.daysPerWeek <= 2 ? 1.375 : profile.daysPerWeek <= 4 ? 1.55 : 1.725;
  let tdee = bmr * activityMultiplier;

  switch (profile.goal) {
    case 'perder_grasa':
      tdee *= 0.8;
      break;
    case 'ganar_musculo':
      tdee *= 1.15;
      break;
    case 'fuerza':
      tdee *= 1.1;
      break;
  }

  const calories = Math.round(tdee);
  const protein = Math.round(profile.weight * (profile.goal === 'ganar_musculo' ? 2.2 : 1.8));
  const fat = Math.round(calories * 0.25 / 9);
  const carbCals = calories - protein * 4 - fat * 9;
  const carbs = Math.round(carbCals / 4);

  return { calories, protein, carbs, fat };
}
