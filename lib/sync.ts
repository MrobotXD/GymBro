import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XPData } from './ranks';
import { WorkoutPlan, UserProfile, DailyNutrition } from './types';

export async function syncToCloud(userId: string) {
  const [xpRaw, plansRaw, activeId, profileRaw] = await Promise.all([
    AsyncStorage.getItem('gymbro_xp'),
    AsyncStorage.getItem('gymbro_plans'),
    AsyncStorage.getItem('gymbro_active_plan'),
    AsyncStorage.getItem('gymbro_profile'),
  ]);

  const payload = {
    user_id: userId,
    xp_data: xpRaw ? JSON.parse(xpRaw) : null,
    plans: plansRaw ? JSON.parse(plansRaw) : [],
    active_plan_id: activeId,
    profile: profileRaw ? JSON.parse(profileRaw) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_data')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) console.error('Sync to cloud failed:', error.message);
  return !error;
}

export async function syncFromCloud(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;

  const writes: Promise<void>[] = [];

  if (data.xp_data) {
    writes.push(AsyncStorage.setItem('gymbro_xp', JSON.stringify(data.xp_data)));
  }
  if (data.plans) {
    writes.push(AsyncStorage.setItem('gymbro_plans', JSON.stringify(data.plans)));
  }
  if (data.active_plan_id) {
    writes.push(AsyncStorage.setItem('gymbro_active_plan', data.active_plan_id));
  }
  if (data.profile) {
    writes.push(AsyncStorage.setItem('gymbro_profile', JSON.stringify(data.profile)));
  }

  await Promise.all(writes);
  return true;
}

export async function syncNutritionToCloud(userId: string, date: string) {
  const raw = await AsyncStorage.getItem(`gymbro_nutrition_${date}`);
  if (!raw) return;

  const { error } = await supabase
    .from('nutrition_log')
    .upsert({
      user_id: userId,
      date,
      data: JSON.parse(raw),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });

  if (error) console.error('Nutrition sync failed:', error.message);
}
