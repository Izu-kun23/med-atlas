import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SkeletonBoxProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={72} height={72} borderRadius={36} />
        <View style={styles.cardHeaderText}>
          <SkeletonBox width="60%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={12} borderRadius={6} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <SkeletonBox width="100%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
        <SkeletonBox width="80%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={styles.cardStats}>
          <SkeletonBox width={60} height={24} borderRadius={12} />
          <SkeletonBox width={60} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonScoreBar: React.FC = () => {
  const randomHeight = Math.random() * 60 + 20; // Random height between 20-80%
  return (
    <View style={styles.scoreBarWrapper}>
      <View style={styles.scoreBarContainer}>
        <SkeletonBox width="100%" height={`${randomHeight}%`} borderRadius={18} />
      </View>
      <SkeletonBox width={30} height={14} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
};

export const SkeletonTopicCard: React.FC = () => {
  return (
    <View style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <View style={styles.topicLeft}>
          <SkeletonBox width={80} height={12} borderRadius={6} style={{ marginBottom: 6 }} />
          <SkeletonBox width={120} height={16} borderRadius={8} />
        </View>
        <SkeletonBox width={50} height={24} borderRadius={12} />
      </View>
      <View style={styles.topicFooter}>
        <SkeletonBox width={80} height={14} borderRadius={6} />
        <SkeletonBox width={70} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: 480,
    borderRadius: 32,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  cardBody: {
    marginTop: 20,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  scoreBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scoreBarContainer: {
    width: 40,
    height: 110,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 12,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicLeft: {
    flex: 1,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default SkeletonBox;
