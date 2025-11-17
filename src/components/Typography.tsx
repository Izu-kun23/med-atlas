import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { Fonts } from '../constants/fonts';

type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

interface TypographyProps extends TextProps {
  weight?: FontWeight;
}

const fontMap: Record<FontWeight, string> = {
  regular: Fonts.regular,
  medium: Fonts.medium,
  semiBold: Fonts.semiBold,
  bold: Fonts.bold,
};

export const Text: React.FC<TypographyProps> = ({ weight = 'regular', style, ...props }) => {
  return (
    <RNText
      style={[
        {
          fontFamily: fontMap[weight],
        },
        style,
      ]}
      {...props}
    />
  );
};

export default Text;

