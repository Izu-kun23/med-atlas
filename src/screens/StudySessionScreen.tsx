import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { RootStackParamList } from '../navigation/RootStackNavigator';

type StudySessionRouteProp = RouteProp<RootStackParamList, 'StudySession'>;
type StudySessionNavigationProp = StackNavigationProp<RootStackParamList>;

type Subject = {
  id: string;
  name: string;
  color: string;
  bgColor: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: any;
};

const StudySessionScreen: React.FC = () => {
  const navigation = useNavigation<StudySessionNavigationProp>();
  const route = useRoute<StudySessionRouteProp>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  // Timer state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetDuration, setTargetDuration] = useState(3600); // Default 1 hour in seconds
  
  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchNotes();
    }
  }, [selectedSubject]);

  // Refresh notes when screen is focused (e.g., after adding/editing a note)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedSubject) {
        fetchNotes();
      }
    });
    return unsubscribe;
  }, [navigation, selectedSubject]);

  useEffect(() => {
    if (isSessionActive) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isSessionActive]);

  const fetchSubjects = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoadingSubjects(false);
      return;
    }

    try {
      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(subjectsQuery);
      const fetchedSubjects: Subject[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSubjects.push({
          id: doc.id,
          name: data.name || '',
          color: data.selectedColor || data.color || Colors.roseRed,
          bgColor: data.bgColor || Colors.roseLight,
        });
      });

      fetchedSubjects.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(fetchedSubjects);
      
      // If only one subject, auto-select it
      if (fetchedSubjects.length === 1) {
        setSelectedSubject(fetchedSubjects[0]);
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load subjects',
      });
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const fetchNotes = async () => {
    if (!selectedSubject) return;

    setIsLoadingNotes(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoadingNotes(false);
      return;
    }

    try {
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        where('subjectId', '==', selectedSubject.id)
      );
      const querySnapshot = await getDocs(notesQuery);
      const fetchedNotes: Note[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotes.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: data.createdAt,
        });
      });

      // Sort by creation date, newest first
      fetchedNotes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setNotes(fetchedNotes);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load notes',
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const startSession = async () => {
    if (!selectedSubject) {
      Toast.show({
        type: 'error',
        text1: 'Select Subject',
        text2: 'Please select a subject to start studying',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please log in to start a study session',
      });
      return;
    }

    try {
      const sessionData = {
        userId: user.uid,
        subjectId: selectedSubject.id,
        startedAt: serverTimestamp(),
        sessionType: 'MANUAL',
        durationMinutes: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'studySessions'), sessionData);
      setSessionId(docRef.id);
      sessionStartTimeRef.current = new Date();
      setIsSessionActive(true);
      setElapsedSeconds(0);

      Toast.show({
        type: 'success',
        text1: 'Session Started',
        text2: `Studying ${selectedSubject.name}`,
      });
    } catch (error: any) {
      console.error('Error starting session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start study session',
      });
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const durationMinutes = Math.floor(elapsedSeconds / 60);
      const sessionRef = doc(db, 'studySessions', sessionId);
      
      await updateDoc(sessionRef, {
        endedAt: serverTimestamp(),
        durationMinutes,
        updatedAt: serverTimestamp(),
      });

      setIsSessionActive(false);
      setSessionId(null);
      sessionStartTimeRef.current = null;

      Toast.show({
        type: 'success',
        text1: 'Session Ended',
        text2: `You studied for ${formatTime(elapsedSeconds)}`,
      });
    } catch (error: any) {
      console.error('Error ending session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to end study session',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleAddNote = () => {
    if (!selectedSubject) {
      Toast.show({
        type: 'error',
        text1: 'Select Subject',
        text2: 'Please select a subject first',
      });
      return;
    }

    navigation.navigate('AddEditNote', {
      subjectId: selectedSubject.id,
      subjectColor: selectedSubject.color,
      sessionId: sessionId || undefined,
      elapsedSeconds,
      isSessionActive,
    });
  };

  const handleEditNote = (note: Note) => {
    if (!selectedSubject) return;

    navigation.navigate('AddEditNote', {
      subjectId: selectedSubject.id,
      subjectColor: selectedSubject.color,
      sessionId: sessionId || undefined,
      elapsedSeconds,
      isSessionActive,
      noteId: note.id,
      noteTitle: note.title,
      noteContent: note.content,
    });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View
      style={[
        styles.noteCard,
        selectedSubject && { borderLeftColor: selectedSubject.color },
      ]}
    >
      <TouchableOpacity
        style={styles.noteCardContent}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('NoteDetail', {
            note: item,
            subjectColor: selectedSubject?.color,
            elapsedSeconds: elapsedSeconds,
            isSessionActive: isSessionActive,
          });
        }}
      >
        <Text style={styles.noteTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.noteContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.createdAt && (
          <Text style={styles.noteDate}>
            {item.createdAt.toDate?.().toLocaleDateString() || 'Recent'}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.editNoteButton}
        onPress={() => handleEditNote(item)}
        activeOpacity={0.7}
      >
        <Feather name="edit-2" size={18} color={selectedSubject?.color || Colors.roseRed} />
      </TouchableOpacity>
    </View>
  );

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
            onPress={() => {
              if (isSessionActive) {
                // Warn user if session is active
                Toast.show({
                  type: 'info',
                  text1: 'Session Active',
                  text2: 'End your session before leaving',
                });
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Session</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subject Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Subject</Text>
            {isLoadingSubjects ? (
              <ActivityIndicator size="small" color={Colors.roseRed} />
            ) : selectedSubject ? (
              <TouchableOpacity
                style={[
                  styles.subjectCard,
                  { borderColor: selectedSubject.color, backgroundColor: selectedSubject.bgColor },
                ]}
                onPress={() => setShowSubjectModal(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.subjectIcon, { backgroundColor: selectedSubject.color }]}>
                  <Feather name="book" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.subjectName}>{selectedSubject.name}</Text>
                <Feather name="chevron-down" size={20} color={selectedSubject.color} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.selectSubjectButton}
                onPress={() => setShowSubjectModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={20} color={Colors.roseRed} />
                <Text style={styles.selectSubjectText}>Select Subject</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Timer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Timer</Text>
            <View style={styles.timerContainer}>
              <View style={styles.timerDisplay}>
                <Svg width={200} height={200} style={styles.timerCircle}>
                  {/* Background circle */}
                  <Circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke={Colors.fogGrey}
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  {isSessionActive && (
                    <Circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke={Colors.roseRed}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - Math.min(elapsedSeconds / targetDuration, 1))}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  )}
                </Svg>
                <View style={styles.timerTextContainer}>
                  <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                </View>
              </View>
              {!isSessionActive ? (
                <TouchableOpacity
                  style={[
                    styles.timerButton,
                    { backgroundColor: Colors.roseRed },
                    !selectedSubject && styles.timerButtonDisabled,
                  ]}
                  onPress={startSession}
                  disabled={!selectedSubject}
                  activeOpacity={0.7}
                >
                  <Feather name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.timerButtonText}>Start Session</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.timerButton, { backgroundColor: Colors.errorRed }]}
                  onPress={endSession}
                  activeOpacity={0.7}
                >
                  <Feather name="square" size={24} color="#FFFFFF" />
                  <Text style={styles.timerButtonText}>End Session</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notes Section */}
          {selectedSubject && (
            <View style={styles.section}>
              <View style={styles.notesHeader}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <TouchableOpacity
                  style={[styles.addNoteButton, { borderColor: selectedSubject.color }]}
                  onPress={handleAddNote}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={20} color={selectedSubject.color} />
                  <Text style={[styles.addNoteButtonText, { color: selectedSubject.color }]}>
                    Add Note
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingNotes ? (
                <ActivityIndicator size="small" color={Colors.roseRed} style={styles.loader} />
              ) : notes.length > 0 ? (
                <FlatList
                  data={notes}
                  renderItem={renderNote}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.noteSeparator} />}
                />
              ) : (
                <View style={styles.emptyNotes}>
                  <Feather name="file-text" size={48} color={Colors.coolGrey} />
                  <Text style={styles.emptyNotesText}>No notes yet</Text>
                  <Text style={styles.emptyNotesSubtext}>Add your first note to get started</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Subject Selection Modal */}
        <Modal
          visible={showSubjectModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSubjectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Subject</Text>
                <TouchableOpacity
                  onPress={() => setShowSubjectModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color={Colors.darkSlate} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={subjects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.subjectOption,
                      selectedSubject?.id === item.id && styles.subjectOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubject(item);
                      setShowSubjectModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.subjectOptionIcon, { backgroundColor: item.bgColor }]}>
                      <Feather name="book" size={20} color={item.color} />
                    </View>
                    <Text style={styles.subjectOptionText}>{item.name}</Text>
                    {selectedSubject?.id === item.id && (
                      <Feather name="check" size={20} color={item.color} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  selectSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.fogGrey,
    borderStyle: 'dashed',
    gap: 8,
  },
  selectSubjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.roseRed,
    fontFamily: Fonts.semiBold,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerDisplay: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  timerCircle: {
    position: 'absolute',
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    minWidth: 200,
  },
  timerButtonDisabled: {
    opacity: 0.5,
  },
  timerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  addNoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  noteCard: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.roseRed,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    marginBottom: 12,
  },
  noteCardContent: {
    flex: 1,
    padding: 16,
  },
  editNoteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  noteSeparator: {
    height: 12,
  },
  emptyNotes: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyNotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  loader: {
    marginVertical: 24,
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
    padding: 20,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
    gap: 12,
  },
  subjectOptionSelected: {
    backgroundColor: '#FFF5F7',
  },
  subjectOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  noteInputTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 16,
    padding: 0,
    minHeight: 40,
  },
  noteInputContent: {
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    marginBottom: 24,
    padding: 0,
    minHeight: 200,
  },
  saveNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveNoteButtonDisabled: {
    opacity: 0.5,
  },
  saveNoteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
});

export default StudySessionScreen;

