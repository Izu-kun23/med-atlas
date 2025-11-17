import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

type LoginScreenProps = {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onContinueWithGoogle?: () => void;
  onContinueWithApple?: () => void;
  onForgotPassword?: () => void;
  onRequestSignUp?: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onContinueWithApple,
  onContinueWithGoogle,
  onForgotPassword,
  onRequestSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const appLogo = require('../../assets/logo/logo.png');

  // Logo animations - starts centered, slides upward slightly
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.15)).current;
  // Content animations - fade/slide in after logo settles
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(logoTranslateY, {
        toValue: -96,
        damping: 14,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          damping: 14,
          stiffness: 140,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [contentOpacity, contentTranslateY, logoOpacity, logoScale, logoTranslateY]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setStatus({ type: 'error', message: 'Please enter your email and password.' });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      setStatus({ type: 'success', message: 'Welcome back!' });
      onLogin?.({ email: trimmedEmail, password });
    } catch (error) {
      if (error instanceof Error) {
        setStatus({ type: 'error', message: error.message });
      } else {
        setStatus({ type: 'error', message: 'Unable to sign you in. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Logo - centered initially, then moves to top */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoTranslateY },
                  { scale: logoScale },
                ],
              },
            ]}
          >
            <Animated.Image
              source={appLogo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="MedTrackr logo"
            />
          </Animated.View>

          {/* Content - appears after logo animation */}
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.heading}>Welcome Back</Text>
              <Text style={styles.subheading}>
                Sign in to continue tracking your health.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Feather
                    name="mail"
                    size={20}
                    color={emailFocused ? '#6366F1' : '#9CA3AF'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={passwordFocused ? '#6366F1' : '#9CA3AF'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={onForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
              </TouchableOpacity>
              {status && (
                <Text
                  style={[
                    styles.statusText,
                    status.type === 'error' ? styles.statusTextError : styles.statusTextSuccess,
                  ]}
                >
                  {status.message}
                </Text>
              )}
            </View>

            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>or continue with</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={onContinueWithGoogle}
                activeOpacity={0.9}
              >
                <Image
                  source={require('../../assets/logo/google.png')}
                  style={styles.socialIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={onContinueWithApple}
                activeOpacity={0.9}
              >
                <Image
                  source={require('../../assets/logo/apple.png')}
                  style={styles.socialIconImage}
                  resizeMode="contain"
                />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Apple
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              <Text style={styles.signUpLink} onPress={onRequestSignUp}>
                Sign Up
              </Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -40,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: -100,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 420,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkSlate,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  subheading: {
    fontSize: 15,
    color: Colors.coolGrey,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.fogGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: Colors.roseRed,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: Colors.roseRed,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  primaryButton: {
    backgroundColor: Colors.roseRed,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Fonts.bold,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 2,
    gap: 8,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.fogGrey,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: Colors.fogGrey,
  },
  socialIconImage: {
    width: 22,
    height: 22,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  appleButtonText: {
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  signUpLink: {
    color: Colors.roseRed,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  statusTextError: {
    color: '#DC2626',
  },
  statusTextSuccess: {
    color: '#059669',
  },
});

export default LoginScreen;