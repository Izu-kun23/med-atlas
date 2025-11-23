import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { SubjectsStackParamList } from '../navigation/SubjectsStackNavigator';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type AddSubjectRouteProp = RouteProp<SubjectsStackParamList, 'AddSubject'>;
type AddSubjectNavigationProp = StackNavigationProp<SubjectsStackParamList>;

// Available color options
const COLOR_OPTIONS = [
  { color: Colors.roseRed, bgColor: Colors.roseLight, name: 'Rose Red' },
  { color: Colors.errorRed, bgColor: '#FEF2F2', name: 'Red' },
  { color: Colors.successGreen, bgColor: '#ECFDF5', name: 'Green' },
  { color: Colors.warningAmber, bgColor: '#FFFBEB', name: 'Amber' },
  { color: '#6366F1', bgColor: '#EEF2FF', name: 'Indigo' },
  { color: '#8B5CF6', bgColor: '#F3E8FF', name: 'Purple' },
  { color: '#EC4899', bgColor: '#FCE7F3', name: 'Pink' },
  { color: '#14B8A6', bgColor: '#E6FFFA', name: 'Teal' },
];

// Available icon options
const ICON_OPTIONS = [
  'book-open',
  'activity',
  'heart',
  'brain',
  'flask',
  'stethoscope',
  'microscope',
  'pill',
  'file-text',
  'clipboard',
  'calendar',
  'target',
  'zap',
  'layers',
  'grid',
  'folder',
];

const AddSubjectScreen: React.FC = () => {
  const navigation = useNavigation<AddSubjectNavigationProp>();
  const route = useRoute<AddSubjectRouteProp>();
  const routeParams = route.params;

  const isEditing = !!routeParams?.subjectId;

  // Find the selected color from COLOR_OPTIONS based on route params
  const getInitialColor = () => {
    if (routeParams?.subjectColor) {
      const found = COLOR_OPTIONS.find(c => c.color === routeParams.subjectColor);
      return found || COLOR_OPTIONS[0];
    }
    return COLOR_OPTIONS[0];
  };

  // Find the selected icon from ICON_OPTIONS based on route params
  const getInitialIcon = () => {
    if (routeParams?.subjectIcon && ICON_OPTIONS.includes(routeParams.subjectIcon)) {
      return routeParams.subjectIcon;
    }
    return ICON_OPTIONS[0];
  };

  // Parse exam date from route params
  const getInitialExamDate = (): Date | null => {
    if (routeParams?.subjectExamDate) {
      const date = new Date(routeParams.subjectExamDate);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const [subjectName, setSubjectName] = useState(routeParams?.subjectName || '');
  const [examDate, setExamDate] = useState<Date | null>(getInitialExamDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(getInitialColor());
  const [selectedIcon, setSelectedIcon] = useState(getInitialIcon());
  const [coverPhoto, setCoverPhoto] = useState<string | null>(routeParams?.subjectCoverPhotoUrl || null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExamDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDaysRemaining = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(date);
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverPhoto(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `subjects/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!subjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a subject');
      navigation.goBack();
      return;
    }

    setIsSaving(true);

    try {
      let coverPhotoUrl: string | null = null;
      // Only upload if it's a new local image (starts with file:// or content://)
      // If it's already a URL (from existing subject), keep it as is
      if (coverPhoto) {
        if (coverPhoto.startsWith('http://') || coverPhoto.startsWith('https://')) {
          // Already uploaded, use as is
          coverPhotoUrl = coverPhoto;
        } else {
          // New local image, upload it
          coverPhotoUrl = await uploadImage(coverPhoto);
        }
      }

      const examDaysRemaining = examDate ? calculateDaysRemaining(examDate) : null;

      const subjectData: any = {
        name: subjectName.trim(),
        examDate: examDate ? examDate.toISOString() : null,
        examDaysRemaining,
        color: selectedColor.color,
        bgColor: selectedColor.bgColor,
        selectedColor: selectedColor.color,
        selectedIcon: selectedIcon,
        coverPhotoUrl: coverPhotoUrl,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && routeParams?.subjectId) {
        // Update existing subject
        const subjectRef = doc(db, 'subjects', routeParams.subjectId);
        await updateDoc(subjectRef, subjectData);
      } else {
        // Create new subject
        subjectData.userId = user.uid;
        subjectData.description = '';
        subjectData.progress = 0;
        subjectData.notesCount = 0;
        subjectData.studySessionsCount = 0;
        subjectData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'subjects'), subjectData);
      }

      setIsSaving(false);
      navigation.goBack();
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'save'} subject. Please try again.`);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Subject' : 'Add Subject'}</Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: subjectName.trim() ? Colors.roseRed : Colors.fogGrey },
            ]}
            activeOpacity={0.7}
            onPress={handleSave}
            disabled={!subjectName.trim() || isSaving}
          >
            <Text style={styles.saveText}>{isSaving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update' : 'Save')}</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Cover Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Photo (Optional)</Text>
              <TouchableOpacity
                style={styles.coverPhotoButton}
                activeOpacity={0.7}
                onPress={pickImage}
              >
                {coverPhoto ? (
                  <Image source={{ uri: coverPhoto }} style={styles.coverPhotoPreview} />
                ) : (
                  <View style={styles.coverPhotoPlaceholder}>
                    <Feather name="image" size={32} color={Colors.coolGrey} />
                    <Text style={styles.coverPhotoText}>Tap to add cover photo</Text>
                  </View>
                )}
                {coverPhoto && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setCoverPhoto(null)}
                  >
                    <Feather name="x" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Subject Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name of Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subject name"
                placeholderTextColor={Colors.coolGrey}
                value={subjectName}
                onChangeText={setSubjectName}
                autoCapitalize="words"
                maxLength={100}
              />
            </View>

            {/* Color Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Folder Color</Text>
              <TouchableOpacity
                style={[styles.colorPreviewButton, { backgroundColor: selectedColor.bgColor }]}
                activeOpacity={0.7}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <View style={[styles.colorCircle, { backgroundColor: selectedColor.color }]} />
                <Text style={styles.colorPreviewText}>{selectedColor.name}</Text>
                <Feather
                  name={showColorPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.coolGrey}
                />
              </TouchableOpacity>
              {showColorPicker && (
                <View style={styles.colorPickerGrid}>
                  {COLOR_OPTIONS.map((colorOption, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: colorOption.bgColor },
                        selectedColor.color === colorOption.color && styles.colorOptionSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedColor(colorOption);
                        setShowColorPicker(false);
                      }}
                    >
                      <View style={[styles.colorCircleSmall, { backgroundColor: colorOption.color }]} />
                      <Text style={styles.colorOptionText}>{colorOption.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Folder Icon</Text>
              <TouchableOpacity
                style={styles.iconPreviewButton}
                activeOpacity={0.7}
                onPress={() => setShowIconPicker(!showIconPicker)}
              >
                <View style={[styles.iconPreview, { backgroundColor: selectedColor.bgColor }]}>
                  <Feather name={selectedIcon as any} size={24} color={selectedColor.color} />
                </View>
                <Text style={styles.iconPreviewText}>Select Icon</Text>
                <Feather
                  name={showIconPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.coolGrey}
                />
              </TouchableOpacity>
              {showIconPicker && (
                <View style={styles.iconPickerGrid}>
                  {ICON_OPTIONS.map((icon, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.iconOption,
                        { backgroundColor: selectedColor.bgColor },
                        selectedIcon === icon && styles.iconOptionSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedIcon(icon);
                        setShowIconPicker(false);
                      }}
                    >
                      <Feather name={icon as any} size={24} color={selectedColor.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Exam Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exam Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                <Feather name="calendar" size={20} color={examDate ? Colors.roseRed : Colors.coolGrey} />
                <Text style={[styles.dateButtonText, { color: examDate ? Colors.darkSlate : Colors.coolGrey }]}>
                  {examDate ? formatDate(examDate) : 'Select exam date'}
                </Text>
                {examDate && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setExamDate(null);
                    }}
                    style={styles.clearDateButton}
                  >
                    <Feather name="x" size={18} color={Colors.coolGrey} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={examDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 1,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
    pointerEvents: 'none',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 1,
    minWidth: 60,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  input: {
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    backgroundColor: Colors.white,
  },
  coverPhotoButton: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.fogGrey + '20',
    gap: 8,
  },
  coverPhotoText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  coverPhotoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.errorRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    gap: 12,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorPreviewText: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    gap: 8,
    minWidth: '45%',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.roseRed,
  },
  colorCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  colorOptionText: {
    fontSize: 14,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  iconPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    gap: 12,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPreviewText: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.roseRed,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    backgroundColor: Colors.white,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  clearDateButton: {
    padding: 4,
  },
});

export default AddSubjectScreen;
