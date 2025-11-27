import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type AnimatedScoreBarProps = {
  score: number; // 0-100
  color: string;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
};

const AnimatedScoreBar: React.FC<AnimatedScoreBarProps> = ({
  score,
  color,
  duration = 1500,
  delay = 0,
  style,
}) => {
  const height = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      height.value = withTiming(score, {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [score, duration, delay, height]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: `${height.value}%`,
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 18,
  },
});

export default AnimatedScoreBar;

