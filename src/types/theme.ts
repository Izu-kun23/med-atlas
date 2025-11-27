export type ThemeMode = 'light' | 'dark';

export type PrimaryColorOption = 
  | 'roseRed' 
  | 'blue' 
  | 'green' 
  | 'purple' 
  | 'orange' 
  | 'teal';

export interface PrimaryColor {
  name: PrimaryColorOption;
  value: string;
  dark: string;
  light: string;
}

export const PRIMARY_COLORS: Record<PrimaryColorOption, PrimaryColor> = {
  roseRed: {
    name: 'roseRed',
    value: '#E75466',
    dark: '#F87171',
    light: '#FCEDEF',
  },
  blue: {
    name: 'blue',
    value: '#3B82F6',
    dark: '#60A5FA',
    light: '#DBEAFE',
  },
  green: {
    name: 'green',
    value: '#10B981',
    dark: '#34D399',
    light: '#D1FAE5',
  },
  purple: {
    name: 'purple',
    value: '#8B5CF6',
    dark: '#A78BFA',
    light: '#EDE9FE',
  },
  orange: {
    name: 'orange',
    value: '#F59E0B',
    dark: '#FBBF24',
    light: '#FEF3C7',
  },
  teal: {
    name: 'teal',
    value: '#14B8A6',
    dark: '#5EEAD4',
    light: '#CCFBF1',
  },
};

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Border colors
  border: string;
  divider: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  
  // Common
  white: string;
  black: string;
}

export interface Theme {
  mode: ThemeMode;
  primaryColor: PrimaryColorOption;
  colors: ThemeColors;
}

