import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WorkoutPlan, DailyNutrition, FoodEntry } from './types';

const KEYS = {
  PROFILE: 'gymbro_profile',
  PLANS: 'gymbro_plans',
  ACTIVE_PLAN: 'gymbro_active_plan',
  NUTRITION: 'gymbro_nutrition',
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function getProfile(): Promise<UserProfile | null> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export async function savePlan(plan: WorkoutPlan): Promise<void> {
  const plans = await getPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) plans[idx] = plan;
  else plans.push(plan);
  await AsyncStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
}

export async function getPlans(): Promise<WorkoutPlan[]> {
  const data = await AsyncStorage.getItem(KEYS.PLANS);
  return data ? JSON.parse(data) : [];
}

export async function deletePlan(id: string): Promise<void> {
  const plans = await getPlans();
  await AsyncStorage.setItem(KEYS.PLANS, JSON.stringify(plans.filter(p => p.id !== id)));
}

export async function setActivePlan(planId: string | null): Promise<void> {
  if (planId) await AsyncStorage.setItem(KEYS.ACTIVE_PLAN, planId);
  else await AsyncStorage.removeItem(KEYS.ACTIVE_PLAN);
}

export async function getActivePlanId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACTIVE_PLAN);
}

export async function getDailyNutrition(date: string): Promise<DailyNutrition | null> {
  const data = await AsyncStorage.getItem(`${KEYS.NUTRITION}_${date}`);
  return data ? JSON.parse(data) : null;
}

export async function saveFoodEntry(date: string, entry: FoodEntry, targets: { calories: number; protein: number; carbs: number; fat: number }): Promise<DailyNutrition> {
  let daily = await getDailyNutrition(date);
  if (!daily) {
    daily = { date, entries: [], ...targets, targetCalories: targets.calories, targetProtein: targets.protein, targetCarbs: targets.carbs, targetFat: targets.fat };
  }
  daily.entries.push(entry);
  await AsyncStorage.setItem(`${KEYS.NUTRITION}_${date}`, JSON.stringify(daily));
  return daily;
}
