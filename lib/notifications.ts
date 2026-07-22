import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_KEY = 'gymbro_reminder';

export interface ReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[]; // 1=Sun, 2=Mon, ... 7=Sat
}

const DEFAULT_REMINDER: ReminderConfig = {
  enabled: false,
  hour: 7,
  minute: 0,
  days: [2, 3, 4, 5, 6], // Mon-Fri
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getReminderConfig(): Promise<ReminderConfig> {
  const raw = await AsyncStorage.getItem(REMINDER_KEY);
  if (raw) return JSON.parse(raw);
  return DEFAULT_REMINDER;
}

export async function saveReminderConfig(config: ReminderConfig): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(config));
  await scheduleReminders(config);
}

const MESSAGES = [
  { title: '💪 Hora de entrenar!', body: 'Tu cuerpo te lo va a agradecer. Vamos!' },
  { title: '🔥 No rompas la racha!', body: 'Un entreno mas y sigues subiendo de rango.' },
  { title: '🏆 Tu XP te espera!', body: 'Cada rep cuenta. Abre GymBro y dale.' },
  { title: '⚡ Dia de entreno!', body: 'Los resultados se construyen con consistencia.' },
  { title: '🎯 Tienes un plan pendiente!', body: 'No dejes para manana lo que puedes levantar hoy.' },
];

export async function scheduleReminders(config: ReminderConfig): Promise<void> {
  // expo-notifications doesn't support local scheduling on web; saving the
  // preference is enough there, there's nothing to schedule against the OS.
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!config.enabled || config.days.length === 0) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  for (const weekday of config.days) {
    const msg = MESSAGES[weekday % MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: config.hour,
        minute: config.minute,
      },
    });
  }
}

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 GymBro funciona!',
      body: 'Vas a recibir recordatorios para entrenar.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}
