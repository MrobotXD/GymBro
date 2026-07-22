import { useEffect, useState } from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { syncFromCloud } from '@/lib/sync';

SplashScreen.preventAutoHideAsync();

const MOBILE_BREAKPOINT = 500;

function AppContent() {
  const { colors, isDark } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const isMobileViewport = width <= MOBILE_BREAKPOINT;

  useEffect(() => {
    (async () => {
      const [seenLanding, onboardingDone] = await Promise.all([
        AsyncStorage.getItem('gymbro_landing_seen'),
        AsyncStorage.getItem('gymbro_onboarding_done'),
      ]);
      if (seenLanding !== 'true') {
        setInitialRoute('landing');
      } else if (!session) {
        setInitialRoute('auth');
      } else if (onboardingDone !== 'true') {
        setInitialRoute('onboarding');
      } else {
        await syncFromCloud(session.user.id);
        setInitialRoute('(tabs)');
      }
    })();
  }, [authLoading, session]);

  if (initialRoute === null || authLoading) return null;

  const content = (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="landing" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-plan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="active-workout" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );

  if (Platform.OS === 'web') {
    if (isMobileViewport) {
      return (
        <View style={[styles.mobileFull, { backgroundColor: colors.bg, width, height }]}>
          {content}
        </View>
      );
    }
    return (
      <View style={[styles.webBg, { backgroundColor: isDark ? '#020408' : '#d0d0da' }]}>
        <View style={[styles.phoneFrame, { backgroundColor: colors.bg }]}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  mobileFull: {
    flex: 1,
  },
  webBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%' as any,
  },
  phoneFrame: {
    width: 393,
    height: 852,
    maxHeight: '100vh' as any,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 24,
  },
});
