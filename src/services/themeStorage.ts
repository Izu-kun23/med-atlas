import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, PrimaryColorOption } from '../types/theme';

const THEME_STORAGE_KEY = '@med_atlas_theme_mode';
const PRIMARY_COLOR_STORAGE_KEY = '@med_atlas_primary_color';

export const ThemeStorage = {
  /**
   * Save theme mode preference
   */
  async saveThemeMode(mode: ThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  /**
   * Load theme mode preference
   */
  async loadThemeMode(): Promise<ThemeMode | null> {
    try {
      const mode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return mode as ThemeMode | null;
    } catch (error) {
      console.error('Error loading theme mode:', error);
      return null;
    }
  },

  /**
   * Save primary color preference
   */
  async savePrimaryColor(color: PrimaryColorOption): Promise<void> {
    try {
      await AsyncStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, color);
    } catch (error) {
      console.error('Error saving primary color:', error);
    }
  },

  /**
   * Load primary color preference
   */
  async loadPrimaryColor(): Promise<PrimaryColorOption | null> {
    try {
      const color = await AsyncStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
      return color as PrimaryColorOption | null;
    } catch (error) {
      console.error('Error loading primary color:', error);
      return null;
    }
  },

  /**
   * Clear all theme preferences
   */
  async clearThemePreferences(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([THEME_STORAGE_KEY, PRIMARY_COLOR_STORAGE_KEY]);
    } catch (error) {
      console.error('Error clearing theme preferences:', error);
    }
  },
};

