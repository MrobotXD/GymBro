import { useCallback } from 'react';
import { ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function AnimatedScreen({ children, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useFocusEffect(useCallback(() => {
    opacity.value = 0;
    translateY.value = 18;
    opacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []));

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style, animStyle]}>
      {children}
    </Animated.View>
  );
}
