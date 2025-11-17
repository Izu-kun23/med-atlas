import { Text, TextProps } from 'react-native';
import { defaultFontFamily } from '../constants/fonts';

// Override the default Text component to apply Bricolage Grotesque font globally
const OriginalText = Text;

// Create a wrapper that applies the font by default
export const setupGlobalFont = () => {
  const TextWithFont = (props: TextProps) => {
    const { style, ...restProps } = props;
    
    // Merge font family with existing styles
    const mergedStyle = Array.isArray(style)
      ? [{ fontFamily: defaultFontFamily }, ...style]
      : [{ fontFamily: defaultFontFamily }, style];
    
    return <OriginalText style={mergedStyle} {...restProps} />;
  };
  
  // Replace the default Text export
  // Note: This is a workaround - we'll use a different approach
  return TextWithFont;
};

