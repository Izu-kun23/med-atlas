import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Get responsive width based on screen size
 */
export const getResponsiveWidth = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get responsive height based on screen size
 */
export const getResponsiveHeight = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Check if device is a small screen (phones with width < 360)
 */
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 360;
};

/**
 * Get responsive padding based on screen size
 */
export const getResponsivePadding = (basePadding: number = 20): number => {
  if (isSmallScreen()) {
    return basePadding * 0.75; // Reduce padding on small screens
  }
  if (isTablet()) {
    return basePadding * 1.5; // Increase padding on tablets
  }
  return basePadding;
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  if (isSmallScreen()) {
    return baseSize * 0.9;
  }
  if (isTablet()) {
    return baseSize * 1.1;
  }
  return baseSize;
};

/**
 * Android-specific: Get safe area insets for edge-to-edge mode
 */
export const getAndroidSafeArea = () => {
  if (Platform.OS === 'android') {
    // Android edge-to-edge mode requires additional top padding
    return {
      top: 0, // StatusBar is translucent, SafeAreaView handles this
      bottom: 0,
    };
  }
  return { top: 0, bottom: 0 };
};

/**
 * Get card width for responsive grid layouts
 */
export const getCardWidth = (columns: number = 2, gap: number = 16, padding: number = 20): number => {
  const totalPadding = padding * 2;
  const totalGaps = gap * (columns - 1);
  return (SCREEN_WIDTH - totalPadding - totalGaps) / columns;
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };

