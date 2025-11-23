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
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { db, auth, storage } from '../lib/firebase';
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roseRed} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={handleImagePicker}
            disabled={isUploadingImage}
            activeOpacity={0.7}
            style={styles.avatarTouchable}
          >
            {isUploadingImage ? (
              <View style={[styles.avatarContainer, { backgroundColor: Colors.fogGrey }]}>
                <ActivityIndicator size="small" color={Colors.white} />
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
            <View style={styles.editImageIcon}>
              <Feather name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{userData.fullName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(userData.role) }]}>
              {getRoleLabel(userData.role)}
            </Text>
          </View>
        </View>

        {/* User Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="mail" size={20} color={Colors.coolGrey} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="user" size={20} color={Colors.coolGrey} />
                <Text style={styles.infoLabel}>Full Name</Text>
              </View>
              <Text style={styles.infoValue}>{userData.fullName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={handleEditRole}
            activeOpacity={0.7}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="briefcase" size={20} color={Colors.coolGrey} />
                <Text style={styles.infoLabel}>Role</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoValue}>{getRoleLabel(userData.role)}</Text>
                <Feather name="edit-2" size={16} color={Colors.coolGrey} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={handleEditLocation}
            activeOpacity={0.7}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="map-pin" size={20} color={Colors.coolGrey} />
                <Text style={styles.infoLabel}>Location</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoValue}>{userData.location || 'Not set'}</Text>
                <Feather name="edit-2" size={16} color={Colors.coolGrey} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="bell" size={20} color={Colors.darkSlate} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={20} color={Colors.darkSlate} />
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="help-circle" size={20} color={Colors.darkSlate} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Feather name="info" size={20} color={Colors.darkSlate} />
              <Text style={styles.settingText}>About</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
            <Feather name="log-out" size={20} color={Colors.errorRed} />
            <Text style={styles.logoutText}>Logout</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={Colors.darkSlate} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Location</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your location (e.g., Lagos, Nigeria)"
                value={editingLocation}
                onChangeText={setEditingLocation}
                autoCapitalize="words"
                editable={!isGettingLocation}
              />
              <TouchableOpacity
                style={[styles.useLocationButton, isGettingLocation && styles.useLocationButtonDisabled]}
                onPress={handleGetCurrentLocation}
                disabled={isGettingLocation}
                activeOpacity={0.8}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Feather name="map-pin" size={18} color={Colors.white} />
                )}
                <Text style={styles.useLocationButtonText}>
                  {isGettingLocation ? 'Detecting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Role</Text>
              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={Colors.darkSlate} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select Your Role</Text>
              {(['STUDENT', 'INTERN', 'WORKER'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    selectedRole === role && styles.roleOptionSelected,
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
                        selectedRole === role && styles.roleOptionTextSelected,
                      ]}
                    >
                      {getRoleLabel(role)}
                    </Text>
                  </View>
                  {selectedRole === role && (
                    <Feather name="check-circle" size={20} color={Colors.roseRed} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveRole}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
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
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  errorText: {
    fontSize: 16,
    color: Colors.errorRed,
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
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
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
    backgroundColor: Colors.roseRed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkSlate,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
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
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.errorRed,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.errorRed,
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
    backgroundColor: Colors.white,
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
    borderBottomColor: Colors.fogGrey,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkSlate,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: Colors.fogGrey + '30',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successGreen,
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
    backgroundColor: Colors.fogGrey + '30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  roleOptionSelected: {
    backgroundColor: Colors.roseRed + '10',
    borderColor: Colors.roseRed,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  roleOptionTextSelected: {
    color: Colors.roseRed,
  },
  modalSaveButton: {
    backgroundColor: Colors.roseRed,
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
});

export default MoreMenuScreen;
