import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const appLogo = require('../../assets/logo/app_logo.png');

type StartScreenProps = {
  onFinish?: () => void;
};

const StartScreen: React.FC<StartScreenProps> = ({ onFinish }) => {
  const logoTranslateY = useRef(new Animated.Value(48)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoTranslateY, {
        toValue: 0,
        damping: 12,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, 1400);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [logoTranslateY, logoOpacity, onFinish]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.container.backgroundColor} />
      <Animated.Image
        source={appLogo}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          },
        ]}
        resizeMode="contain"
        accessibilityRole="image"
        accessible
        accessibilityLabel="MedTrackr logo"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  logo: {
    width: 280,
    height: 280,
  },
});

export default StartScreen;

