import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';

function DiagonalBarbell({ focused, color }: { focused: boolean; color: string }) {
  return (
    <View style={{ transform: [{ rotate: '-35deg' }] }}>
      <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={24} color={color} />
    </View>
  );
}

function RanksTabIcon({ focused }: { focused: boolean }) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const glowOp = useSharedValue(0.15);

  useEffect(() => {
    scale.value = withRepeat(withSequence(
      withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    glowOp.value = withRepeat(withSequence(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOp.value,
  }));

  return (
    <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
      <Animated.View style={[{
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: focused ? colors.accent : isDark ? '#48484a' : '#c7c7cc',
      }, glowStyle]} />
      <Animated.View style={[{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.accent : isDark ? '#2c2c2e' : '#e5e5ea',
        borderWidth: 2.5,
        borderColor: focused ? colors.accent : isDark ? '#48484a' : '#c7c7cc',
        shadowColor: focused ? colors.accent : '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: focused ? 0.6 : 0.15,
        shadowRadius: 10,
        elevation: 10,
      }, pulseStyle]}>
        <Ionicons name="shield-outline" size={20} color={focused ? '#fff' : colors.textTertiary} />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          borderWidth: 0.5,
          borderColor: colors.tabBarBorder,
          height: 52,
          paddingBottom: 0,
          paddingTop: 0,
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 14 : 28,
          left: 16,
          right: 16,
          borderRadius: 26,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ color, focused }) => <DiagonalBarbell focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          tabBarIcon: ({ focused }) => <RanksTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'cog' : 'cog-outline'} size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
