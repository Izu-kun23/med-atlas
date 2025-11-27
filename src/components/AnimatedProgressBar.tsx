import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type AnimatedProgressBarProps = {
  progress: number; // 0-100
  color?: string;
  height?: number;
  duration?: number;
  style?: ViewStyle;
};

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  color = '#007AFF',
  height = 8,
  duration = 1500,
  style,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress, duration, width]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});

export default AnimatedProgressBar;

