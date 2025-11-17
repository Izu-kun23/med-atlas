import { TextStyle } from 'react-native';
import { defaultFontFamily } from '../constants/fonts';

/**
 * Helper function to add default font family to text styles
 */
export const withDefaultFont = (style?: TextStyle | TextStyle[]): TextStyle | TextStyle[] => {
  if (!style) {
    return { fontFamily: defaultFontFamily };
  }
  
  if (Array.isArray(style)) {
    return [{ fontFamily: defaultFontFamily }, ...style];
  }
  
  return {
    fontFamily: defaultFontFamily,
    ...style,
  };
};

/**
 * Default text style with font applied
 */
export const defaultTextStyle: TextStyle = {
  fontFamily: defaultFontFamily,
};

