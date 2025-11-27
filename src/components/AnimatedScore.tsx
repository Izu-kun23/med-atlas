import React, { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type AnimatedScoreProps = {
  value: number;
  suffix?: string;
  duration?: number;
  style?: TextProps['style'];
  onComplete?: () => void;
};

const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  suffix = '%',
  duration = 1500,
  style,
  onComplete,
}) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(
      value,
      {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished && onComplete) {
          onComplete();
        }
      }
    );
  }, [value, duration, animatedValue, onComplete]);

  // Update display value using interval (no worklets)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Math.round(animatedValue.value);
      if (current !== displayValue) {
        setDisplayValue(current);
      }
    }, 16); // Update ~60fps

    return () => clearInterval(interval);
  }, [animatedValue, displayValue]);

  return (
    <Text style={style}>
      {displayValue}{suffix}
    </Text>
  );
};

export default AnimatedScore;

