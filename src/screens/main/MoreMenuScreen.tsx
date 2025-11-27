import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, PrimaryColorOption } from '../../types/theme';
import { db, auth, storage } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';

type UserData = {
  fullName: string;
  email: string;
  role: 'STUDENT' | 'INTERN' | 'WORKER';
  profileImageUrl?: string;
  location?: string;
  onboardingCompleted: boolean;
  createdAt?: any;
  updatedAt?: any;
  onboardingResponses?: any;
};

const MoreMenuScreen: React.FC = () => {
  const { theme, toggleTheme, setThemeMode, setPrimaryColor, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'INTERN' | 'WORKER'>('STUDENT');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData({
          fullName: data.fullName || '',
          email: data.email || user.email || '',
          role: data.role || 'STUDENT',
          profileImageUrl: data.profileImageUrl || undefined,
          location: data.location || undefined,
          onboardingCompleted: data.onboardingCompleted || false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          onboardingResponses: data.onboardingResponses,
        });
      } else {
        // Fallback to auth user data
        setUserData({
          fullName: user.displayName || 'User',
          email: user.email || '',
          role: 'STUDENT',
          onboardingCompleted: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'Student';
      case 'INTERN':
        return 'Intern';
      case 'WORKER':
        return 'Medical Worker';
      default:
        return 'User';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return Colors.roseRed;
      case 'INTERN':
        return Colors.successGreen;
      case 'WORKER':
        return Colors.warningAmber;
      default:
        return Colors.coolGrey;
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to update your profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setIsUploadingImage(true);

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const imageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(imageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);

      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profileImageUrl: downloadURL,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setUserData((prev) => prev ? { ...prev, profileImageUrl: downloadURL } : null);
      Toast.show({
        type: 'success',
        text1: 'Profile image updated',
        text2: 'Your profile image has been successfully updated',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: 'Failed to upload image. Please try again.',
        position: 'top',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditLocation = () => {
    if (userData) {
      setEditingLocation(userData.location || '');
      setShowLocationModal(true);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to detect your current location. Please enable it in your device settings.',
        );
        setIsGettingLocation(false);
        return;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
        );
        setIsGettingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        // Format address: City, Country or City, State, Country
        let formattedAddress = '';
        
        if (address.city && address.country) {
          if (address.region && address.region !== address.city) {
            formattedAddress = `${address.city}, ${address.region}, ${address.country}`;
          } else {
            formattedAddress = `${address.city}, ${address.country}`;
          }
        } else if (address.country) {
          formattedAddress = address.country;
        } else {
          formattedAddress = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
        }

        setEditingLocation(formattedAddress);
        Toast.show({
          type: 'success',
          text1: 'Location detected',
          text2: 'Your current location has been detected',
          position: 'top',
        });
      } else {
        // Fallback to coordinates if reverse geocoding fails
        setEditingLocation(
          `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
        );
        Toast.show({
          type: 'info',
          text1: 'Location detected',
          text2: 'Using coordinates (address unavailable)',
          position: 'top',
        });
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to get your current location. Please try again or enter it manually.',
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        location: editingLocation.trim() || null,
        updatedAt: serverTimestamp(),
      });

      setUserData((prev) => prev ? { ...prev, location: editingLocation.trim() || undefined } : null);
      setShowLocationModal(false);
      Toast.show({
        type: 'success',
        text1: 'Location updated',
        text2: 'Your location has been successfully updated',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: 'Failed to update location. Please try again.',
        position: 'top',
      });
    }
  };

  const handleEditRole = () => {
    if (userData) {
      setSelectedRole(userData.role);
      setShowRoleModal(true);
    }
  };

  const handleSaveRole = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        role: selectedRole,
        updatedAt: serverTimestamp(),
      });

      setUserData((prev) => prev ? { ...prev, role: selectedRole } : null);
      setShowRoleModal(false);
      Toast.show({
        type: 'success',
        text1: 'Role updated',
        text2: 'Your role has been successfully updated',
        position: 'top',
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: 'Failed to update role. Please try again.',
        position: 'top',
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile & Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={handleImagePicker}
            disabled={isUploadingImage}
            activeOpacity={0.7}
            style={styles.avatarTouchable}
          >
            {isUploadingImage ? (
              <View style={[styles.avatarContainer, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="small" color={theme.colors.white} />
              </View>
            ) : userData.profileImageUrl ? (
              <Image
                source={{ uri: userData.profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: getRoleColor(userData.role) }]}>
                <Text style={styles.avatarText}>{userData.fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.editImageIcon, { backgroundColor: theme.colors.primary }]}>
              <Feather name="camera" size={16} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.colors.text }]}>{userData.fullName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(userData.role) }]}>
              {getRoleLabel(userData.role)}
            </Text>
          </View>
        </View>

        {/* User Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Information</Text>
          
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="mail" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
              </View>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userData.email}</Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="user" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
              </View>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userData.fullName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleEditRole}
            activeOpacity={0.7}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="briefcase" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Role</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getRoleLabel(userData.role)}</Text>
                <Feather name="edit-2" size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleEditLocation}
            activeOpacity={0.7}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="map-pin" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Location</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userData.location || 'Not set'}</Text>
                <Feather name="edit-2" size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
            activeOpacity={0.7}
            onPress={() => setShowThemeModal(true)}
          >
            <View style={styles.settingLeft}>
              <Feather name="palette" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Appearance</Text>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.themePreview, { backgroundColor: theme.colors.primary, borderColor: theme.colors.white }]} />
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="bell" size={20} color={theme.colors.text} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Notifications</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={20} color={theme.colors.text} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Privacy & Security</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="help-circle" size={20} color={theme.colors.text} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Help & Support</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="info" size={20} color={theme.colors.text} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>About</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.error }]} activeOpacity={0.7} onPress={handleLogout}>
            <Feather name="log-out" size={20} color={theme.colors.error} />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Location Edit Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Location</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Enter your location (e.g., Lagos, Nigeria)"
                placeholderTextColor={theme.colors.textTertiary}
                value={editingLocation}
                onChangeText={setEditingLocation}
                autoCapitalize="words"
                editable={!isGettingLocation}
              />
              <TouchableOpacity
                style={[styles.useLocationButton, { backgroundColor: theme.colors.success }, isGettingLocation && styles.useLocationButtonDisabled]}
                onPress={handleGetCurrentLocation}
                disabled={isGettingLocation}
                activeOpacity={0.8}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Feather name="map-pin" size={18} color={theme.colors.white} />
                )}
                <Text style={styles.useLocationButtonText}>
                  {isGettingLocation ? 'Detecting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveLocation}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Edit Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Role</Text>
              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Select Your Role</Text>
              {(['STUDENT', 'INTERN', 'WORKER'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedRole === role && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setSelectedRole(role)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleOptionContent}>
                    <View
                      style={[
                        styles.roleOptionIcon,
                        { backgroundColor: getRoleColor(role) + '20' },
                      ]}
                    >
                      <Feather
                        name="briefcase"
                        size={20}
                        color={getRoleColor(role)}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleOptionText,
                        { color: theme.colors.text },
                        selectedRole === role && { color: theme.colors.primary },
                      ]}
                    >
                      {getRoleLabel(role)}
                    </Text>
                  </View>
                  {selectedRole === role && (
                    <Feather name="check-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveRole}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Settings Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Appearance</Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* Dark Mode Toggle */}
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Theme</Text>
              <View style={[styles.themeToggleContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    !isDark && styles.themeOptionActive,
                    !isDark && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setThemeMode('light')}
                  activeOpacity={0.7}
                >
                  <Feather name="sun" size={20} color={!isDark ? theme.colors.white : theme.colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: !isDark ? theme.colors.white : theme.colors.textSecondary }
                  ]}>
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    isDark && styles.themeOptionActive,
                    isDark && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setThemeMode('dark')}
                  activeOpacity={0.7}
                >
                  <Feather name="moon" size={20} color={isDark ? theme.colors.white : theme.colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: isDark ? theme.colors.white : theme.colors.textSecondary }
                  ]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Color Picker */}
              <Text style={[styles.modalLabel, { color: theme.colors.text, marginTop: 24 }]}>Primary Color</Text>
              <View style={styles.colorPickerContainer}>
                {(Object.keys(PRIMARY_COLORS) as PrimaryColorOption[]).map((colorKey) => {
                  const color = PRIMARY_COLORS[colorKey];
                  const isSelected = theme.primaryColor === colorKey;
                  return (
                    <TouchableOpacity
                      key={colorKey}
                      style={[
                        styles.colorOption,
                        isSelected && { borderColor: theme.colors.primary, borderWidth: 3 },
                      ]}
                      onPress={() => setPrimaryColor(colorKey)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: color.value }]} />
                      {isSelected && (
                        <View style={styles.colorCheck}>
                          <Feather name="check" size={16} color={theme.colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 16,
    borderWidth: 1,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  useLocationButtonDisabled: {
    opacity: 0.6,
  },
  useLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  roleOptionSelected: {
    // Handled inline
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  roleOptionTextSelected: {
    // Handled inline
  },
  modalSaveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themePreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  themeOptionActive: {
    // Active state handled by backgroundColor in inline style
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.fogGrey,
    position: 'relative',
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  colorCheck: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MoreMenuScreen;
