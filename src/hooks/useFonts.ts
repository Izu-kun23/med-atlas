import { useFonts } from 'expo-font';

export const useBricolageGrotesque = () => {
  const [fontsLoaded, fontError] = useFonts({
    'BricolageGrotesque-Regular': require('../../assets/fonts/BricolageGrotesque-Regular.ttf'),
    'BricolageGrotesque-Medium': require('../../assets/fonts/BricolageGrotesque-Medium.ttf'),
    'BricolageGrotesque-SemiBold': require('../../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
    'BricolageGrotesque-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
  });

  return { fontsLoaded, fontError };
};

