import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { db, auth } from '../lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { RootStackParamList } from '../navigation/RootStackNavigator';
import { renderFormattedContent } from '../utils/formatNoteContent';
import FormattedTextEditor from '../components/FormattedTextEditor';

type AddEditNoteRouteProp = RouteProp<RootStackParamList, 'AddEditNote'>;
type AddEditNoteNavigationProp = StackNavigationProp<RootStackParamList>;

const AddEditNoteScreen: React.FC = () => {
  const navigation = useNavigation<AddEditNoteNavigationProp>();
  const route = useRoute<AddEditNoteRouteProp>();
  const params = route.params;

  const isEditing = !!params?.noteId;
  const [title, setTitle] = useState(params?.noteTitle || '');
  const [content, setContent] = useState(params?.noteContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(params?.elapsedSeconds || 0);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const startSecondsRef = React.useRef(params?.elapsedSeconds || 0);
  const startTimeRef = React.useRef(Date.now());
  const contentInputRef = React.useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showPreview, setShowPreview] = useState(false);

  const subjectColor = params?.subjectColor || Colors.roseRed;
  const isSessionActive = params?.isSessionActive || false;

  // Initialize timer when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isSessionActive && params?.elapsedSeconds !== undefined) {
        startSecondsRef.current = params.elapsedSeconds;
        startTimeRef.current = Date.now();
        setElapsedSeconds(params.elapsedSeconds);

        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(startSecondsRef.current + elapsed);
        }, 1000);
      }

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }, [isSessionActive, params?.elapsedSeconds])
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `00:${secs.toString().padStart(2, '0')}`;
    }
  };

  const insertTextAtCursor = (textToInsert: string, cursorOffset: number = 0) => {
    const { start, end } = selection;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    setContent(newContent);
    // Set cursor position after inserted text
    setTimeout(() => {
      const newPosition = start + textToInsert.length + cursorOffset;
      contentInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition },
      });
      setSelection({ start: newPosition, end: newPosition });
    }, 0);
  };

  const handleFormatHeader = () => {
    const { start, end } = selection;
    const lineStart = content.substring(0, start).lastIndexOf('\n') + 1;
    const lineEnd = content.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const lineText = content.substring(lineStart, actualLineEnd);
    const trimmedLine = lineText.trim();
    
    // Check if line already starts with #
    if (trimmedLine.startsWith('# ')) {
      // Remove existing header markers
      const textWithoutHeader = trimmedLine.replace(/^#+\s*/, '');
      const newContent = content.substring(0, lineStart) + textWithoutHeader + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        const removedChars = lineText.length - textWithoutHeader.length;
        const newPosition = Math.max(lineStart, start - removedChars);
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    } else {
      // Add or update header at start of line
      const textWithoutFormat = trimmedLine.replace(/^##+\s*/, '').replace(/^#+\s*/, '');
      const newContent = content.substring(0, lineStart) + '# ' + textWithoutFormat + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        const addedChars = 2;
        const newPosition = start + addedChars;
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    }
  };

  const handleFormatSubHeader = () => {
    const { start, end } = selection;
    const lineStart = content.substring(0, start).lastIndexOf('\n') + 1;
    const lineEnd = content.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const lineText = content.substring(lineStart, actualLineEnd);
    const trimmedLine = lineText.trim();
    
    // Check if line already starts with ##
    if (trimmedLine.startsWith('## ')) {
      // Remove existing subheader markers
      const textWithoutSubHeader = trimmedLine.replace(/^##+\s*/, '');
      const newContent = content.substring(0, lineStart) + textWithoutSubHeader + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        const removedChars = lineText.length - textWithoutSubHeader.length;
        const newPosition = Math.max(lineStart, start - removedChars);
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    } else {
      // Add or update subheader at start of line
      const textWithoutFormat = trimmedLine.replace(/^##+\s*/, '').replace(/^#+\s*/, '');
      const newContent = content.substring(0, lineStart) + '## ' + textWithoutFormat + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        const addedChars = 3;
        const newPosition = start + addedChars;
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    }
  };

  const handleFormatUnderline = () => {
    const { start, end } = selection;
    if (start === end) {
      // No selection, insert underline markers with cursor in between
      const newContent = content.substring(0, start) + '__' + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        const newPosition = start + 2;
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    } else {
      // Wrap selected text
      const selectedText = content.substring(start, end);
      const newContent = content.substring(0, start) + `__${selectedText}__` + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        const newStart = start + 2;
        const newEnd = end + 2;
        contentInputRef.current?.setNativeProps({
          selection: { start: newStart, end: newEnd },
        });
        setSelection({ start: newStart, end: newEnd });
      }, 0);
    }
  };

  const handleFormatBullet = () => {
    const { start } = selection;
    const lineStart = content.substring(0, start).lastIndexOf('\n') + 1;
    const lineEnd = content.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const lineText = content.substring(lineStart, actualLineEnd);
    
    // Check if line already starts with bullet
    if (lineText.trim().startsWith('- ') || lineText.trim().startsWith('* ')) {
      // Remove existing bullet
      const newContent = content.substring(0, lineStart) + lineText.replace(/^[-*]\s*/, '') + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        const newPosition = Math.max(lineStart, start - 2);
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    } else {
      // Add bullet at start of line
      const newContent = content.substring(0, lineStart) + '- ' + content.substring(lineStart);
      setContent(newContent);
      setTimeout(() => {
        const newPosition = start + 2;
        contentInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a note title',
      });
      return;
    }

    if (!params?.subjectId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Subject not found',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please log in to save notes',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && params?.noteId) {
        // Update existing note
        const noteRef = doc(db, 'notes', params.noteId);
        await updateDoc(noteRef, {
          title: title.trim(),
          content: content.trim(),
          updatedAt: serverTimestamp(),
        });

        Toast.show({
          type: 'success',
          text1: 'Note Updated',
          text2: 'Your note has been successfully updated',
        });
      } else {
        // Create new note
        const noteData: any = {
          userId: user.uid,
          subjectId: params.subjectId,
          title: title.trim(),
          content: content.trim(),
          sourceType: 'TYPED',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Link note to study session if active
        if (params?.sessionId) {
          noteData.studySessionId = params.sessionId;
        }

        await addDoc(collection(db, 'notes'), noteData);

        Toast.show({
          type: 'success',
          text1: 'Note Added',
          text2: 'Your note has been saved',
        });
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving note:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to ${isEditing ? 'update' : 'save'} note`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            {isSessionActive && (
              <View style={[styles.timerBadge, { backgroundColor: subjectColor }]}>
                <Feather name="clock" size={14} color="#FFFFFF" />
                <Text style={styles.timerBadgeText}>{formatTime(elapsedSeconds)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: title.trim() ? subjectColor : Colors.fogGrey },
              (!title.trim() || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!title.trim() || isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Note Editor */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Note Title"
            placeholderTextColor={Colors.coolGrey}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditing}
            maxLength={200}
          />
          
          {/* Formatting Toolbar */}
          <View style={styles.formattingToolbar}>
            <TouchableOpacity
              style={[styles.formatButton, { borderColor: subjectColor }]}
              onPress={handleFormatHeader}
              activeOpacity={0.7}
            >
              <Feather name="type" size={18} color={subjectColor} />
              <Text style={[styles.formatButtonText, { color: subjectColor }]}>H1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatButton, { borderColor: subjectColor }]}
              onPress={handleFormatSubHeader}
              activeOpacity={0.7}
            >
              <Feather name="type" size={16} color={subjectColor} />
              <Text style={[styles.formatButtonText, { color: subjectColor, fontSize: 12 }]}>H2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatButton, { borderColor: subjectColor }]}
              onPress={handleFormatUnderline}
              activeOpacity={0.7}
            >
              <Feather name="underline" size={18} color={subjectColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatButton, { borderColor: subjectColor }]}
              onPress={handleFormatBullet}
              activeOpacity={0.7}
            >
              <Feather name="list" size={18} color={subjectColor} />
            </TouchableOpacity>
            <View style={styles.toolbarSpacer} />
            <TouchableOpacity
              style={[styles.formatButton, { borderColor: subjectColor, backgroundColor: showPreview ? subjectColor : 'transparent' }]}
              onPress={() => setShowPreview(!showPreview)}
              activeOpacity={0.7}
            >
              <Feather name={showPreview ? 'edit' : 'eye'} size={18} color={showPreview ? '#FFFFFF' : subjectColor} />
            </TouchableOpacity>
          </View>

          {showPreview ? (
            <View style={styles.previewContainer}>
              {renderFormattedContent(content)}
            </View>
          ) : (
            <FormattedTextEditor
              value={content}
              onChangeText={setContent}
              placeholder="Note Content"
              placeholderTextColor={Colors.coolGrey}
              onSelectionChange={(sel) => {
                setSelection(sel);
              }}
              subjectColor={subjectColor}
            />
          )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  timerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 24,
    padding: 0,
    minHeight: 40,
  },
  formattingToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
    alignItems: 'center',
  },
  toolbarSpacer: {
    flex: 1,
  },
  previewContainer: {
    minHeight: 200,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  formatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
    minWidth: 44,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  contentInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 28,
    padding: 0,
    minHeight: 200,
  },
});

export default AddEditNoteScreen;

