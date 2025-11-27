import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { useTheme } from '../hooks/useTheme';
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
  const { theme } = useTheme();
  
  // Create a more subtle border color with reduced opacity
  const getSubtleBorderColor = (color: string) => {
    // Convert hex to rgba with 25% opacity
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.25)`;
    }
    return color;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.card,
          borderColor: getSubtleBorderColor(bgColor) 
        }
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        <View>
          <Text style={[styles.title, { color: bgColor }]}>{title}</Text>
          <Text style={[styles.value, { color: bgColor }]}>{value}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: bgColor }]}>{subtitle}</Text>}
        </View>
        <View style={styles.iconWrapper}>
          {iconType === 'svg' && svgIconName ? (
            <SvgIcon name={svgIconName} size={28} color={bgColor} />
          ) : (
            <Feather name={icon as any} size={28} color={bgColor} />
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
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    marginRight: 16,
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  title: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    opacity: 0.75,
  },
  iconWrapper: {
    alignSelf: 'flex-end',
  },
});

export default StatsCard;

