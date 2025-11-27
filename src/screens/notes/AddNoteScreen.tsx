import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { SubjectsStackParamList } from '../../navigation/SubjectsStackNavigator';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { extractTextFromImage } from '../../utils/ocr';

type AddNoteRouteProp = RouteProp<SubjectsStackParamList, 'AddNote'>;
type AddNoteNavigationProp = StackNavigationProp<SubjectsStackParamList>;

const AddNoteScreen: React.FC = () => {
  const navigation = useNavigation<AddNoteNavigationProp>();
  const route = useRoute<AddNoteRouteProp>();
  const { subjectId, subjectName, subjectColor, subjectBgColor, noteId, noteTitle, noteContent } = route.params;

  const isEditing = !!noteId;
  const [title, setTitle] = useState(noteTitle || '');
  const [body, setBody] = useState(noteContent || '');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  useEffect(() => {
    fetchFolders();
    // If editing, fetch existing week and folder from route params
    // Note: We could also fetch from Firestore, but route params should have the data
  }, []);

  // Refresh folders when screen is focused (e.g., after creating a folder)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFolders();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchFolders = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsLoadingFolders(true);
    try {
      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', user.uid),
        where('subjectId', '==', subjectId)
      );
      const querySnapshot = await getDocs(foldersQuery);
      const fetchedFolders: Array<{ id: string; name: string }> = [];
      querySnapshot.forEach((doc) => {
        fetchedFolders.push({
          id: doc.id,
          name: doc.data().name || '',
        });
      });
      setFolders(fetchedFolders);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const extractTextFromScannedImage = async (imageUri: string) => {
    setIsExtractingText(true);
    try {
      // Try to extract text using Google Cloud Vision API
      const extractedText = await extractTextFromImage(imageUri);
      if (extractedText && extractedText.trim()) {
        // Auto-fill the body with extracted text
        setBody(extractedText);
        // Auto-generate title from first line if title is empty
        if (!title.trim()) {
          const firstLine = extractedText.split('\n')[0].trim();
          if (firstLine.length > 0 && firstLine.length <= 200) {
            setTitle(firstLine);
          }
        }
        // Success - text extracted automatically
      } else {
        // No API key or no text found - user can type manually
        // Don't show alert, just let them type
      }
    } catch (error: any) {
      console.error('OCR Error:', error);
      const errorMessage = error?.message || 'OCR extraction failed';
      
      // Show helpful alert for API blocking errors
      if (errorMessage.includes('blocked') || errorMessage.includes('API')) {
        Alert.alert(
          'OCR Not Available',
          'The document scanner requires Google Cloud Vision API to be enabled.\n\n' +
          'Please check:\n' +
          '• Cloud Vision API is enabled in Google Cloud Console\n' +
          '• API key restrictions include Cloud Vision API\n' +
          '• Billing is enabled for your project\n\n' +
          'You can still type your notes manually.',
          [{ text: 'OK' }]
        );
      }
      // For other errors, don't show alert - just let them type manually
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleScan = async () => {
    Alert.alert(
      'Scan Document',
      'Choose how you want to scan',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required to scan documents');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              const imageUri = result.assets[0].uri;
              setScannedImage(imageUri);
              await extractTextFromScannedImage(imageUri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Please grant camera roll permissions');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              const imageUri = result.assets[0].uri;
              setScannedImage(imageUri);
              await extractTextFromScannedImage(imageUri);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save notes');
      navigation.goBack();
      return;
    }

    setIsSaving(true);

    try {
      const noteData: any = {
        title: title.trim(),
        content: body.trim(),
        updatedAt: serverTimestamp(),
      };

      // Add week if selected
      if (selectedWeek) {
        noteData.week = selectedWeek;
      }

      // Add folderId if selected
      if (selectedFolderId) {
        noteData.folderId = selectedFolderId;
      }

      if (isEditing && noteId) {
        // Update existing note
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, noteData);
        Toast.show({
          type: 'success',
          text1: 'Note updated',
          text2: 'Your note has been successfully updated',
          position: 'top',
        });
      } else {
        // Create new note
        noteData.userId = user.uid;
        noteData.subjectId = subjectId;
        noteData.sourceType = scannedImage ? 'OCR' : 'TYPED';
        noteData.createdAt = serverTimestamp();
        // Don't save scannedImageUrl since we don't want to display the image
        await addDoc(collection(db, 'notes'), noteData);
        Toast.show({
          type: 'success',
          text1: 'Note created',
          text2: 'Your note has been successfully saved',
          position: 'top',
        });
      }

      setIsSaving(false);
      navigation.goBack();
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'save'} note. Please try again.`);
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
          <View style={styles.headerTitleContainer}>
            <View style={[styles.subjectIconContainer, { backgroundColor: subjectBgColor }]}>
              <Feather name="folder" size={20} color={subjectColor} />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {subjectName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: title.trim() ? subjectColor : Colors.fogGrey }]}
            activeOpacity={0.7}
            onPress={handleSave}
            disabled={!title.trim() || isSaving}
          >
            <Text style={styles.saveText}>{isSaving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update' : 'Save')}</Text>
          </TouchableOpacity>
        </View>

        {/* Note Editor */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.editorContainer}>
            {/* Scan Button */}
            <TouchableOpacity
              style={[styles.scanButton, { borderColor: subjectColor }]}
              activeOpacity={0.7}
              onPress={handleScan}
              disabled={isExtractingText}
            >
              {isExtractingText ? (
                <>
                  <ActivityIndicator size="small" color={subjectColor} />
                  <Text style={[styles.scanButtonText, { color: subjectColor }]}>
                    Extracting text...
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="camera" size={20} color={subjectColor} />
                  <Text style={[styles.scanButtonText, { color: subjectColor }]}>
                    {scannedImage ? 'Rescan Document' : 'Scan Document'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Text Extraction Status */}
            {isExtractingText && (
              <View style={styles.extractingContainer}>
                <ActivityIndicator size="small" color={subjectColor} />
                <Text style={styles.scanHint}>
                  Extracting text from document...
                </Text>
              </View>
            )}
            {scannedImage && !isExtractingText && body.trim() && (
              <Text style={styles.scanHint}>
                Text extracted! You can edit it below.
              </Text>
            )}

            {/* Week and Folder Selectors */}
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={[styles.selectorButton, { borderColor: subjectColor }]}
                onPress={() => setShowWeekModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="calendar" size={16} color={subjectColor} />
                <Text style={[styles.selectorText, { color: selectedWeek ? Colors.darkSlate : Colors.coolGrey }]}>
                  {selectedWeek || 'Select Week'}
                </Text>
                <Feather name="chevron-down" size={16} color={Colors.coolGrey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorButton, { borderColor: subjectColor }]}
                onPress={() => {
                  setShowFolderModal(true);
                  fetchFolders();
                }}
                activeOpacity={0.7}
              >
                <Feather name="folder" size={16} color={subjectColor} />
                <Text style={[styles.selectorText, { color: selectedFolderId ? Colors.darkSlate : Colors.coolGrey }]}>
                  {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' : 'Select Folder'}
                </Text>
                <Feather name="chevron-down" size={16} color={Colors.coolGrey} />
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.coolGrey}
              value={title}
              onChangeText={setTitle}
              autoFocus={!scannedImage}
              maxLength={200}
            />

            {/* Body Input */}
            <TextInput
              style={styles.bodyInput}
              placeholder="Body"
              placeholderTextColor={Colors.coolGrey}
              value={body}
              onChangeText={setBody}
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Week Selection Modal */}
      <Modal
        visible={showWeekModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeekModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Week</Text>
              <TouchableOpacity
                onPress={() => setShowWeekModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={Colors.darkSlate} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[styles.weekOption, !selectedWeek && styles.weekOptionSelected]}
                onPress={() => {
                  setSelectedWeek('');
                  setShowWeekModal(false);
                }}
              >
                <Text style={[styles.weekOptionText, !selectedWeek && styles.weekOptionTextSelected]}>
                  No Week
                </Text>
                {!selectedWeek && <Feather name="check" size={20} color={subjectColor} />}
              </TouchableOpacity>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((week) => (
                <TouchableOpacity
                  key={week}
                  style={[styles.weekOption, selectedWeek === `Week ${week}` && styles.weekOptionSelected]}
                  onPress={() => {
                    setSelectedWeek(`Week ${week}`);
                    setShowWeekModal(false);
                  }}
                >
                  <Text style={[styles.weekOptionText, selectedWeek === `Week ${week}` && styles.weekOptionTextSelected]}>
                    Week {week}
                  </Text>
                  {selectedWeek === `Week ${week}` && <Feather name="check" size={20} color={subjectColor} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Folder Selection Modal */}
      <Modal
        visible={showFolderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Folder</Text>
              <TouchableOpacity
                onPress={() => setShowFolderModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={Colors.darkSlate} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[styles.folderOption, !selectedFolderId && styles.folderOptionSelected]}
                onPress={() => {
                  setSelectedFolderId(null);
                  setShowFolderModal(false);
                }}
              >
                <Feather name="folder" size={20} color={!selectedFolderId ? subjectColor : Colors.coolGrey} />
                <Text style={[styles.folderOptionText, !selectedFolderId && styles.folderOptionTextSelected]}>
                  No Folder
                </Text>
                {!selectedFolderId && <Feather name="check" size={20} color={subjectColor} />}
              </TouchableOpacity>
              {isLoadingFolders ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={subjectColor} />
                </View>
              ) : (
                folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={[styles.folderOption, selectedFolderId === folder.id && styles.folderOptionSelected]}
                    onPress={() => {
                      setSelectedFolderId(folder.id);
                      setShowFolderModal(false);
                    }}
                  >
                    <Feather name="folder" size={20} color={selectedFolderId === folder.id ? subjectColor : Colors.coolGrey} />
                    <Text style={[styles.folderOptionText, selectedFolderId === folder.id && styles.folderOptionTextSelected]}>
                      {folder.name}
                    </Text>
                    {selectedFolderId === folder.id && <Feather name="check" size={20} color={subjectColor} />}
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={[styles.createFolderButton, { backgroundColor: subjectColor }]}
                onPress={() => {
                  setShowFolderModal(false);
                  navigation.navigate('AddFolder', {
                    subjectId,
                    subjectName,
                    subjectColor,
                    subjectBgColor,
                  });
                }}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.createFolderButtonText}>Create New Folder</Text>
              </TouchableOpacity>
            </ScrollView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  subjectIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
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
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 20,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  scanHint: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  extractingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 24,
    padding: 0,
    minHeight: 40,
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    padding: 0,
    minHeight: 200,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
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
    maxHeight: '80%',
    paddingBottom: 40,
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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  weekOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  weekOptionSelected: {
    backgroundColor: '#FFF5F7',
  },
  weekOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  weekOptionTextSelected: {
    color: Colors.roseRed,
    fontWeight: '700',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
    gap: 12,
  },
  folderOptionSelected: {
    backgroundColor: '#FFF5F7',
  },
  folderOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  folderOptionTextSelected: {
    color: Colors.roseRed,
    fontWeight: '700',
  },
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    gap: 8,
  },
  createFolderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default AddNoteScreen;
