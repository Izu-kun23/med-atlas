import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import SvgIcon from './SvgIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type StatsCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconType?: 'feather' | 'svg';
  svgIconName?: 'book-bookmark' | 'calendar-clock' | 'dice-alt';
  color: string;
  bgColor: string;
  onPress?: () => void;
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconType = 'feather',
  svgIconName,
  color,
  bgColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.iconWrapper}>
          {iconType === 'svg' && svgIconName ? (
            <SvgIcon name={svgIconName} size={28} color={color} />
          ) : (
            <Feather name={icon as any} size={28} color={color} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.55,
    height: 160,
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginRight: 16,
  },
  cardInner: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  title: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.medium,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: Fonts.regular,
  },
  iconWrapper: {
    alignSelf: 'flex-end',
  },
});

export default StatsCard;

