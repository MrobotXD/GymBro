export type Level = 'principiante' | 'intermedio' | 'avanzado';
export type Goal = 'perder_grasa' | 'ganar_musculo' | 'mantener' | 'fuerza' | 'resistencia';
export type MuscleGroup = 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'piernas' | 'core' | 'gluteos' | 'cuerpo_completo';

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  level: Level;
  goal: Goal;
  equipment: string[];
  daysPerWeek: number;
  minutesPerSession: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: string;
  restSeconds: number;
  weight?: string;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  name: string;
  focus: string;
  exercises: Exercise[];
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  level: Level;
  goal: Goal;
  daysPerWeek: number;
  weeks: number;
  days: WorkoutDay[];
  createdAt: string;
  currentWeek: number;
  currentDay: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string;
  timestamp: string;
}

export interface DailyNutrition {
  date: string;
  entries: FoodEntry[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ActiveExercise extends Exercise {
  completedSets: ExerciseSet[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
