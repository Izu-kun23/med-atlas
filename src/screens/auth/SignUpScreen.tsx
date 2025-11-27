import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
type SignUpScreenProps = {
  onContinue?: (fields: { fullName: string; email: string; password: string; confirmPassword: string }) => void;
  onLoginLinkPress?: () => void;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onContinue, onLoginLinkPress }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focus, setFocus] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirm?: boolean }>({});
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const appLogo = require('../../../assets/logo/logo.png');

  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.15)).current;
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

  const handleSignUp = async () => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFullName || !trimmedEmail || !password || !confirmPassword) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Account created',
      text2: "Great! Let's personalize MedFlow next",
      position: 'top',
    });
    setStatus({ type: 'success', message: "Great! Let's personalize MedFlow next." });
    onContinue?.({
      fullName: trimmedFullName,
      email: trimmedEmail,
      password,
      confirmPassword,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
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
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>
                Join MedTrackr to keep your studies and clinical duties on track.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, focus.name && styles.inputWrapperFocused]}>
                  <Feather
                    name="user"
                    size={20}
                    color={focus.name ? Colors.roseRed : '#9CA3AF'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full name"
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocus({ ...focus, name: true })}
                    onBlur={() => setFocus({ ...focus, name: false })}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, focus.email && styles.inputWrapperFocused]}>
                  <Feather
                    name="mail"
                    size={20}
                    color={focus.email ? Colors.roseRed : '#9CA3AF'}
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
                    onFocus={() => setFocus({ ...focus, email: true })}
                    onBlur={() => setFocus({ ...focus, email: false })}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, focus.password && styles.inputWrapperFocused]}>
                  <Feather
                    name="lock"
                    size={20}
                    color={focus.password ? Colors.roseRed : '#9CA3AF'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocus({ ...focus, password: true })}
                    onBlur={() => setFocus({ ...focus, password: false })}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, focus.confirm && styles.inputWrapperFocused]}>
                  <Feather
                    name="lock"
                    size={20}
                    color={focus.confirm ? Colors.roseRed : '#9CA3AF'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocus({ ...focus, confirm: true })}
                    onBlur={() => setFocus({ ...focus, confirm: false })}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
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
              <Text style={styles.separatorText}>or sign up with</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={[styles.socialButton, styles.googleButton]} activeOpacity={0.9}>
                <Image
                  source={require('../../../assets/logo/google.png')}
                  style={styles.socialIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} activeOpacity={0.9}>
                <Image
                  source={require('../../../assets/logo/apple.png')}
                  style={styles.socialIconImage}
                  resizeMode="contain"
                />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkText} onPress={onLoginLinkPress}>
                  Log in
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
  primaryButton: {
    backgroundColor: Colors.roseRed,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
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
  linkText: {
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

export default SignUpScreen;

