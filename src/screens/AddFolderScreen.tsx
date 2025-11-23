import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { SubjectsStackParamList } from '../navigation/SubjectsStackNavigator';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

type AddFolderRouteProp = RouteProp<SubjectsStackParamList, 'AddFolder'>;
type AddFolderNavigationProp = StackNavigationProp<SubjectsStackParamList>;

const AddFolderScreen: React.FC = () => {
  const navigation = useNavigation<AddFolderNavigationProp>();
  const route = useRoute<AddFolderRouteProp>();
  const { subjectId, subjectName, subjectColor, subjectBgColor, folderId, folderName } = route.params;

  const isEditing = !!folderId;
  const [name, setName] = useState(folderName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save folders');
      navigation.goBack();
      return;
    }

    setIsSaving(true);

    try {
      const folderData: any = {
        name: name.trim(),
        updatedAt: serverTimestamp(),
      };

      if (isEditing && folderId) {
        // Update existing folder
        const folderRef = doc(db, 'folders', folderId);
        await updateDoc(folderRef, folderData);
      } else {
        // Create new folder
        folderData.userId = user.uid;
        folderData.subjectId = subjectId;
        folderData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'folders'), folderData);
      }

      setIsSaving(false);
      navigation.goBack();
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'save'} folder. Please try again.`);
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
              {isEditing ? 'Edit Folder' : 'New Folder'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: name.trim() ? subjectColor : Colors.fogGrey }]}
            activeOpacity={0.7}
            onPress={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Update' : 'Create'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Folder Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Folder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter folder name"
              placeholderTextColor={Colors.coolGrey}
              value={name}
              onChangeText={setName}
              autoFocus={true}
              maxLength={100}
            />
          </View>

          <View style={styles.infoContainer}>
            <Feather name="info" size={16} color={Colors.coolGrey} />
            <Text style={styles.infoText}>
              Folders help you organize your notes within {subjectName}. You can assign notes to folders when creating or editing them.
            </Text>
          </View>
        </View>
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
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.fogGrey,
    backgroundColor: Colors.white,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.roseRed,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
});

export default AddFolderScreen;

