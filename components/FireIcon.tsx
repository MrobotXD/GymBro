import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  active: boolean;
  size?: number;
}

export default function FireIcon({ active, size = 28 }: Props) {
  const flicker = useSharedValue(1);
  const sway = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      flicker.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.05, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.92, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      sway.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      flicker.value = withTiming(1, { duration: 300 });
      sway.value = withTiming(0, { duration: 300 });
      glow.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: flicker.value },
      { rotate: `${sway.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const activeColor = '#ff9500';
  const tipColor = '#ff3b30';
  const inactiveColor = 'rgba(142, 142, 147, 0.35)';

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {active && (
        <Animated.View style={[styles.glowCircle, glowStyle, { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8, backgroundColor: 'rgba(255, 149, 0, 0.15)' }]} />
      )}
      <Animated.View style={[{ width: size, height: size }, active && flameStyle]}>
        <Svg viewBox="0 0 24 24" width={size} height={size}>
          {active ? (
            <>
              {/* Outer flame */}
              <Path
                d="M12 2C12 2 7 7.5 7 12.5C7 15.5 8.5 18 10 19.5C10 19.5 9.5 16 12 13C14.5 16 14 19.5 14 19.5C15.5 18 17 15.5 17 12.5C17 7.5 12 2 12 2Z"
                fill={activeColor}
              />
              {/* Inner bright core */}
              <Path
                d="M12 8C12 8 9.5 11 9.5 13.5C9.5 15.5 10.5 17 11.5 18C11.5 18 11 15.5 12 14C13 15.5 12.5 18 12.5 18C13.5 17 14.5 15.5 14.5 13.5C14.5 11 12 8 12 8Z"
                fill={tipColor}
              />
              {/* Bright yellow center */}
              <Path
                d="M12 12C12 12 10.8 13.5 10.8 14.8C10.8 16 11.3 17 12 17.5C12.7 17 13.2 16 13.2 14.8C13.2 13.5 12 12 12 12Z"
                fill="#ffd60a"
              />
            </>
          ) : (
            <>
              {/* Inactive gray flame */}
              <Path
                d="M12 2C12 2 7 7.5 7 12.5C7 15.5 8.5 18 10 19.5C10 19.5 9.5 16 12 13C14.5 16 14 19.5 14 19.5C15.5 18 17 15.5 17 12.5C17 7.5 12 2 12 2Z"
                fill={inactiveColor}
              />
              <Path
                d="M12 8C12 8 9.5 11 9.5 13.5C9.5 15.5 10.5 17 11.5 18C11.5 18 11 15.5 12 14C13 15.5 12.5 18 12.5 18C13.5 17 14.5 15.5 14.5 13.5C14.5 11 12 8 12 8Z"
                fill="rgba(142, 142, 147, 0.2)"
              />
            </>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  glowCircle: { position: 'absolute' },
});
