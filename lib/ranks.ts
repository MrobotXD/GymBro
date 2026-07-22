import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RankTier {
  name: string;
  level: number; // 1, 2, 3
  color: string;
  glowColor: string;
  icon: string;
  minXP: number;
}

export interface XPData {
  totalXP: number;
  workoutsCompleted: number;
  exercisesCompleted: number;
  xpHistory: { date: string; xp: number; reason: string }[];
}

const RANKS: RankTier[] = [
  { name: 'Madera', level: 1, color: '#8B6914', glowColor: 'rgba(139,105,20,0.3)', icon: '🌱', minXP: 0 },
  { name: 'Madera', level: 2, color: '#8B6914', glowColor: 'rgba(139,105,20,0.3)', icon: '🪵', minXP: 300 },
  { name: 'Madera', level: 3, color: '#8B6914', glowColor: 'rgba(139,105,20,0.3)', icon: '🌳', minXP: 700 },
  { name: 'Piedra', level: 1, color: '#8E8E93', glowColor: 'rgba(142,142,147,0.3)', icon: '🪨', minXP: 1200 },
  { name: 'Piedra', level: 2, color: '#8E8E93', glowColor: 'rgba(142,142,147,0.3)', icon: '⛏️', minXP: 1800 },
  { name: 'Piedra', level: 3, color: '#8E8E93', glowColor: 'rgba(142,142,147,0.3)', icon: '🏔️', minXP: 2500 },
  { name: 'Hierro', level: 1, color: '#636366', glowColor: 'rgba(99,99,102,0.3)', icon: '⚙️', minXP: 3500 },
  { name: 'Hierro', level: 2, color: '#636366', glowColor: 'rgba(99,99,102,0.3)', icon: '🔩', minXP: 4800 },
  { name: 'Hierro', level: 3, color: '#636366', glowColor: 'rgba(99,99,102,0.3)', icon: '⚔️', minXP: 6500 },
  { name: 'Bronce', level: 1, color: '#CD7F32', glowColor: 'rgba(205,127,50,0.3)', icon: '🥉', minXP: 8500 },
  { name: 'Bronce', level: 2, color: '#CD7F32', glowColor: 'rgba(205,127,50,0.3)', icon: '🛡️', minXP: 11000 },
  { name: 'Bronce', level: 3, color: '#CD7F32', glowColor: 'rgba(205,127,50,0.3)', icon: '🏺', minXP: 14000 },
  { name: 'Plata', level: 1, color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.35)', icon: '🥈', minXP: 17500 },
  { name: 'Plata', level: 2, color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.35)', icon: '🌙', minXP: 22000 },
  { name: 'Plata', level: 3, color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.35)', icon: '⚡', minXP: 27000 },
  { name: 'Oro', level: 1, color: '#FFD700', glowColor: 'rgba(255,215,0,0.3)', icon: '🥇', minXP: 33000 },
  { name: 'Oro', level: 2, color: '#FFD700', glowColor: 'rgba(255,215,0,0.3)', icon: '👑', minXP: 40000 },
  { name: 'Oro', level: 3, color: '#FFD700', glowColor: 'rgba(255,215,0,0.3)', icon: '🏆', minXP: 48000 },
  { name: 'Platino', level: 1, color: '#E5E4E2', glowColor: 'rgba(229,228,226,0.35)', icon: '💎', minXP: 58000 },
  { name: 'Platino', level: 2, color: '#E5E4E2', glowColor: 'rgba(229,228,226,0.35)', icon: '🔮', minXP: 70000 },
  { name: 'Platino', level: 3, color: '#E5E4E2', glowColor: 'rgba(229,228,226,0.35)', icon: '✨', minXP: 85000 },
  { name: 'Diamante', level: 1, color: '#B9F2FF', glowColor: 'rgba(185,242,255,0.4)', icon: '💠', minXP: 100000 },
  { name: 'Diamante', level: 2, color: '#B9F2FF', glowColor: 'rgba(185,242,255,0.4)', icon: '🌟', minXP: 125000 },
  { name: 'Diamante', level: 3, color: '#B9F2FF', glowColor: 'rgba(185,242,255,0.4)', icon: '🔱', minXP: 155000 },
];

const XP_KEY = 'gymbro_xp';

export function getRank(xp: number): RankTier {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXP) current = rank;
    else break;
  }
  return current;
}

export function getNextRank(xp: number): RankTier | null {
  for (const rank of RANKS) {
    if (rank.minXP > xp) return rank;
  }
  return null;
}

export function getRankIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXP) idx = i;
    else break;
  }
  return idx;
}

export function getProgressToNext(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 1;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.min(1, progress / range);
}

export function getAllRanks(): RankTier[] {
  return RANKS;
}

export async function getXPData(): Promise<XPData> {
  const data = await AsyncStorage.getItem(XP_KEY);
  if (data) return JSON.parse(data);
  return { totalXP: 0, workoutsCompleted: 0, exercisesCompleted: 0, xpHistory: [] };
}

export async function addXP(amount: number, reason: string): Promise<XPData> {
  const data = await getXPData();
  const today = new Date().toISOString().split('T')[0];
  data.totalXP += amount;
  data.xpHistory.push({ date: today, xp: amount, reason });
  if (data.xpHistory.length > 100) data.xpHistory = data.xpHistory.slice(-100);
  await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));
  return data;
}

export async function awardWorkoutXP(exerciseCount: number, allCompleted: boolean): Promise<{ total: number; breakdown: { reason: string; xp: number }[] }> {
  const breakdown: { reason: string; xp: number }[] = [];

  breakdown.push({ reason: 'Entrenamiento completado', xp: 100 });
  breakdown.push({ reason: `${exerciseCount} ejercicios`, xp: exerciseCount * 15 });
  if (allCompleted) breakdown.push({ reason: 'Todos los sets completos', xp: 50 });

  let data = await getXPData();
  data.workoutsCompleted += 1;
  data.exercisesCompleted += exerciseCount;

  let totalAwarded = 0;
  for (const b of breakdown) {
    totalAwarded += b.xp;
    data.totalXP += b.xp;
  }

  const today = new Date().toISOString().split('T')[0];
  data.xpHistory.push({ date: today, xp: totalAwarded, reason: 'Entrenamiento' });
  if (data.xpHistory.length > 100) data.xpHistory = data.xpHistory.slice(-100);
  await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));

  return { total: totalAwarded, breakdown };
}
