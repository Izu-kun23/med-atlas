import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type SpinnerSize = 'small' | 'large' | number;

type SpinnerProps = {
  size?: SpinnerSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const SIZE_MAP: Record<Exclude<SpinnerSize, number>, number> = {
  small: 24,
  large: 48,
};

const resolveSize = (size: SpinnerSize | undefined): number => {
  if (typeof size === 'number') {
    return size;
  }
  if (size && size in SIZE_MAP) {
    return SIZE_MAP[size as Exclude<SpinnerSize, number>];
  }
  return SIZE_MAP.small;
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'small',
  color = '#333333',
  style,
}) => {
  const resolvedSize = resolveSize(size);
  const borderWidth = Math.max(2, Math.round(resolvedSize * 0.12));
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width: resolvedSize,
          height: resolvedSize,
          borderRadius: resolvedSize / 2,
          borderWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [{ rotate: spin }],
        },
        style,
      ]}
    />
  );
};

export default Spinner;

