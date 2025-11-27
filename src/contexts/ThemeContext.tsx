import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeMode, PrimaryColorOption, ThemeColors, PRIMARY_COLORS } from '../types/theme';
import { ThemeStorage } from '../services/themeStorage';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColorOption) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const generateThemeColors = (
  mode: ThemeMode,
  primaryColorOption: PrimaryColorOption
): ThemeColors => {
  const primaryColor = PRIMARY_COLORS[primaryColorOption];
  
  if (mode === 'dark') {
    return {
      // Primary colors
      primary: primaryColor.dark,
      primaryDark: primaryColor.value,
      primaryLight: primaryColor.light,
      
      // Background colors
      background: '#121212',
      surface: '#1E1E1E',
      card: '#2A2A2A',
      
      // Text colors
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      textTertiary: '#808080',
      
      // Border colors
      border: '#333333',
      divider: '#2A2A2A',
      
      // Semantic colors
      success: '#4CAF50',
      warning: '#FFB74D',
      error: '#D32F2F',
      
      // Common
      white: '#FFFFFF',
      black: '#000000',
    };
  } else {
    return {
      // Primary colors
      primary: primaryColor.value,
      primaryDark: primaryColor.value,
      primaryLight: primaryColor.light,
      
      // Background colors
      background: '#FFFFFF',
      surface: '#F5F5F5',
      card: '#FFFFFF',
      
      // Text colors
      text: '#2A2D34',
      textSecondary: '#5A5F68',
      textTertiary: '#8A8A8A',
      
      // Border colors
      border: '#E8E9EC',
      divider: '#E8E9EC',
      
      // Semantic colors
      success: '#4CAF50',
      warning: '#FFB74D',
      error: '#D32F2F',
      
      // Common
      white: '#FFFFFF',
      black: '#000000',
    };
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [primaryColorOption, setPrimaryColorOptionState] = useState<PrimaryColorOption>('roseRed');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme preferences on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await ThemeStorage.loadThemeMode();
        const savedColor = await ThemeStorage.loadPrimaryColor();
        
        if (savedMode) {
          setThemeModeState(savedMode);
        }
        if (savedColor) {
          setPrimaryColorOptionState(savedColor);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, []);

  const theme: Theme = {
    mode: themeMode,
    primaryColor: primaryColorOption,
    colors: generateThemeColors(themeMode, primaryColorOption),
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    ThemeStorage.saveThemeMode(newMode);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    ThemeStorage.saveThemeMode(mode);
  };

  const setPrimaryColor = (color: PrimaryColorOption) => {
    setPrimaryColorOptionState(color);
    ThemeStorage.savePrimaryColor(color);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setThemeMode,
    setPrimaryColor,
    isDark: themeMode === 'dark',
  };

  // Don't render children until theme is loaded to prevent flash
  if (!isInitialized) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

