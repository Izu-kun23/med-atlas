import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useBricolageGrotesque } from './src/hooks/useFonts';
import StartScreen from './src/screens/StartScreen';
import CarouselScreen from './src/screens/CarouselScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TabNavigator from './src/navigation/TabNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const { fontsLoaded, fontError } = useBricolageGrotesque();
  const [introPhase, setIntroPhase] = useState<'start' | 'carousel'>('start');
  const [appPhase, setAppPhase] = useState<'intro' | 'login' | 'signup' | 'onboarding' | 'home'>('intro');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'STUDENT' | 'INTERN' | 'WORKER'>('STUDENT');
  const [startVisible, setStartVisible] = useState(true);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const transition = React.useRef(new Animated.Value(0)).current;
  const [pendingCredentials, setPendingCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  } | null>(null);

  // Fonts are loaded and will be applied via Typography component or style definitions

  const handleStartFinish = useCallback(() => {
    if (introPhase !== 'start') {
      return;
    }

    setCarouselVisible(true);
    Animated.timing(transition, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      transition.setValue(1);
      setIntroPhase('carousel');
      setStartVisible(false);
    });
  }, [introPhase, transition]);

  const handleCarouselDone = useCallback(() => {
    setAppPhase('login');
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    setAppPhase('home');
  }, []);

  const handleShowSignUp = useCallback(() => {
    setAppPhase('signup');
  }, []);

  const handleSignUpComplete = useCallback(
    (credentials: { fullName: string; email: string; password: string; confirmPassword: string }) => {
      setPendingCredentials(credentials);
      setAppPhase('onboarding');
    },
    [],
  );

  const transforms = useMemo(() => {
    const startScreenTranslate = transition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -SCREEN_WIDTH],
    });

    const carouselTranslate = transition.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_WIDTH * 0.2, 0],
    });

    const carouselOpacity = transition.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.35, 1],
    });

    return {
      startScreenTranslate,
      carouselTranslate,
      carouselOpacity,
    };
  }, [transition]);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          {fontError && <Text style={styles.errorText}>Error loading fonts</Text>}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {appPhase === 'home' ? (
        <NavigationContainer>
          <TabNavigator userRole={userRole} />
        </NavigationContainer>
      ) : appPhase === 'login' ? (
        <LoginScreen onRequestSignUp={handleShowSignUp} onLogin={handleLogin} />
      ) : appPhase === 'signup' ? (
        <SignUpScreen onLoginLinkPress={() => setAppPhase('login')} onContinue={handleSignUpComplete} />
      ) : appPhase === 'onboarding' && pendingCredentials ? (
        <OnboardingScreen
          credentials={{
            fullName: pendingCredentials.fullName,
            email: pendingCredentials.email,
            password: pendingCredentials.password,
          }}
          onComplete={(responses) => {
            setPendingCredentials(null);
            setIsAuthenticated(true);
            setUserRole(responses.role);
            setAppPhase('home');
          }}
        />
      ) : (
        <View style={styles.container}>
          {startVisible && (
            <Animated.View
              style={[
                styles.absoluteFill,
                { transform: [{ translateX: transforms.startScreenTranslate }] },
              ]}
            >
              <StartScreen onFinish={handleStartFinish} />
            </Animated.View>
          )}

          {(carouselVisible || introPhase === 'carousel') && (
            <Animated.View
              style={[
                styles.absoluteFill,
                {
                  transform: [{ translateX: transforms.carouselTranslate }],
                  opacity: transforms.carouselOpacity,
                },
              ]}
            >
              <CarouselScreen onDone={handleCarouselDone} />
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF4ED',
    overflow: 'hidden',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF4ED',
  },
  errorText: {
    marginTop: 16,
    color: '#DC2626',
    fontSize: 14,
  },
});
