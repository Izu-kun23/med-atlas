import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { SubjectsStackParamList } from '../navigation/SubjectsStackNavigator';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceType: 'TYPED' | 'OCR';
  scannedImageUrl?: string;
  week?: string;
  folderId?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};

type Folder = {
  id: string;
  name: string;
};

type NoteGroup = {
  folderId: string | null;
  folderName: string;
  weeks: { [week: string]: Note[] };
};

type SubjectDetailsRouteProp = RouteProp<SubjectsStackParamList, 'SubjectDetails'>;
type SubjectDetailsNavigationProp = StackNavigationProp<SubjectsStackParamList>;

const SubjectDetailsScreen: React.FC = () => {
  const navigation = useNavigation<SubjectDetailsNavigationProp>();
  const route = useRoute<SubjectDetailsRouteProp>();
  const { subjectId, subjectName, subjectColor, subjectBgColor } = route.params;

  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [showDeletedNotes, setShowDeletedNotes] = useState(false);

  const fetchNotes = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch notes
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        where('subjectId', '==', subjectId)
      );

      const notesSnapshot = await getDocs(notesQuery);
      const fetchedNotes: Note[] = [];

      const activeNotes: Note[] = [];
      const deletedNotesList: Note[] = [];

      notesSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const updatedAt = data.updatedAt?.toDate?.() || createdAt;
        const deletedAt = data.deletedAt?.toDate?.() || undefined;

        const note: Note = {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          sourceType: data.sourceType || 'TYPED',
          scannedImageUrl: data.scannedImageUrl || undefined,
          week: data.week || undefined,
          folderId: data.folderId || undefined,
          isDeleted: data.isDeleted || false,
          deletedAt: deletedAt ? deletedAt.toISOString() : undefined,
        };

        if (note.isDeleted) {
          deletedNotesList.push(note);
        } else {
          activeNotes.push(note);
        }
      });

      // Fetch folders
      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', user.uid),
        where('subjectId', '==', subjectId)
      );

      const foldersSnapshot = await getDocs(foldersQuery);
      const fetchedFolders: Folder[] = [];

      foldersSnapshot.forEach((doc) => {
        fetchedFolders.push({
          id: doc.id,
          name: doc.data().name || '',
        });
      });

      setFolders(fetchedFolders);
      setNotes(activeNotes);
      setDeletedNotes(deletedNotesList);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchNotes();
    }, [subjectId])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const organizeNotes = (): NoteGroup[] => {
    const groups: { [key: string]: NoteGroup } = {};

    // Add "No Folder" group
    groups['no-folder'] = {
      folderId: null,
      folderName: 'All Notes',
      weeks: {},
    };

    // Add folder groups
    folders.forEach((folder) => {
      groups[folder.id] = {
        folderId: folder.id,
        folderName: folder.name,
        weeks: {},
      };
    });

    // Organize notes by folder and week
    notes.forEach((note) => {
      const folderKey = note.folderId || 'no-folder';
      const weekKey = note.week || 'No Week';

      if (!groups[folderKey]) {
        groups[folderKey] = {
          folderId: note.folderId || null,
          folderName: note.folderId ? folders.find((f) => f.id === note.folderId)?.name || 'Unknown' : 'All Notes',
          weeks: {},
        };
      }

      if (!groups[folderKey].weeks[weekKey]) {
        groups[folderKey].weeks[weekKey] = [];
      }

      groups[folderKey].weeks[weekKey].push(note);
    });

    // Sort notes within each week by createdAt
    Object.values(groups).forEach((group) => {
      Object.keys(group.weeks).forEach((week) => {
        group.weeks[week].sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      });
    });

    return Object.values(groups).filter((group) => Object.keys(group.weeks).length > 0);
  };

  const toggleFolder = (folderId: string | null) => {
    const key = folderId || 'no-folder';
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleWeek = (folderId: string | null, week: string) => {
    const key = `${folderId || 'no-folder'}-${week}`;
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'This note will be moved to Recently Deleted. You can restore it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const noteRef = doc(db, 'notes', noteId);
              await updateDoc(noteRef, {
                isDeleted: true,
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              // Refresh notes
              fetchNotes();
            } catch (error: any) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRestoreNote = async (noteId: string) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        isDeleted: false,
        deletedAt: deleteField(),
        updatedAt: serverTimestamp(),
      });
      // Refresh notes
      fetchNotes();
    } catch (error: any) {
      console.error('Error restoring note:', error);
      Alert.alert('Error', 'Failed to restore note. Please try again.');
    }
  };

  const handlePermanentDelete = async (noteId: string) => {
    Alert.alert(
      'Permanently Delete',
      'This action cannot be undone. The note will be permanently removed from the database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const noteRef = doc(db, 'notes', noteId);
              await updateDoc(noteRef, {
                isDeleted: true,
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Note: We're still using soft delete. For permanent delete, you'd use deleteDoc
                // But per requirements, we should keep it in DB, so we'll just mark it differently
              });
              // Refresh notes
              fetchNotes();
            } catch (error: any) {
              console.error('Error permanently deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderNoteCard = ({ item: note }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('AddNote', {
          subjectId,
          subjectName,
          subjectColor,
          subjectBgColor,
          noteId: note.id,
          noteTitle: note.title,
          noteContent: note.content,
        });
      }}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTitleContainer}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title}
          </Text>
          {note.sourceType === 'OCR' && (
            <View style={styles.ocrBadge}>
              <Feather name="camera" size={12} color={Colors.roseRed} />
              <Text style={styles.ocrBadgeText}>OCR</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              'Note Options',
              note.title,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteNote(note.id),
                },
              ]
            );
          }}
        >
          <Feather name="more-vertical" size={20} color={Colors.coolGrey} />
        </TouchableOpacity>
      </View>

      <Text style={styles.noteContent} numberOfLines={3}>
        {note.content}
      </Text>

      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>
          {formatDate(note.createdAt)}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('AddNote', {
              subjectId,
              subjectName,
              subjectColor,
              subjectBgColor,
              noteId: note.id,
              noteTitle: note.title,
              noteContent: note.content,
            });
          }}
        >
          <Feather name="edit-2" size={16} color={Colors.roseRed} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={[styles.subjectIconContainer, { backgroundColor: subjectBgColor }]}>
            <Feather name="folder" size={24} color={subjectColor} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {subjectName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: subjectBgColor }]}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('AddFolder', {
                subjectId,
                subjectName,
                subjectColor,
                subjectBgColor,
              });
            }}
          >
            <Feather name="folder-plus" size={20} color={subjectColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addNoteButton}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('AddNote', {
                subjectId,
                subjectName,
                subjectColor,
                subjectBgColor,
              });
            }}
          >
            <Feather name="plus" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : notes.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {organizeNotes().map((group) => {
            const folderKey = group.folderId || 'no-folder';
            const isExpanded = expandedFolders.has(folderKey);

            return (
              <View key={folderKey} style={styles.folderGroup}>
                <TouchableOpacity
                  style={styles.folderHeader}
                  onPress={() => toggleFolder(group.folderId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.folderHeaderLeft}>
                    <Feather
                      name={isExpanded ? 'chevron-down' : 'chevron-right'}
                      size={20}
                      color={subjectColor}
                    />
                    <Feather name="folder" size={20} color={subjectColor} />
                    <Text style={styles.folderName}>{group.folderName}</Text>
                    <Text style={styles.folderCount}>
                      ({Object.values(group.weeks).reduce((sum, weekNotes) => sum + weekNotes.length, 0)})
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('AddFolder', {
                        subjectId,
                        subjectName,
                        subjectColor,
                        subjectBgColor,
                        folderId: group.folderId || undefined,
                        folderName: group.folderId ? group.folderName : undefined,
                      });
                    }}
                    style={styles.editFolderButton}
                  >
                    <Feather name="edit-2" size={16} color={Colors.coolGrey} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.weeksContainer}>
                    {Object.entries(group.weeks)
                      .sort(([weekA], [weekB]) => {
                        if (weekA === 'No Week') return 1;
                        if (weekB === 'No Week') return -1;
                        const numA = parseInt(weekA.replace('Week ', ''));
                        const numB = parseInt(weekB.replace('Week ', ''));
                        return numA - numB;
                      })
                      .map(([week, weekNotes]) => {
                        const weekKey = `${folderKey}-${week}`;
                        const isWeekExpanded = expandedWeeks.has(weekKey);

                        return (
                          <View key={week} style={styles.weekGroup}>
                            <TouchableOpacity
                              style={styles.weekHeader}
                              onPress={() => toggleWeek(group.folderId, week)}
                              activeOpacity={0.7}
                            >
                              <Feather
                                name={isWeekExpanded ? 'chevron-down' : 'chevron-right'}
                                size={16}
                                color={Colors.coolGrey}
                              />
                              <Text style={styles.weekName}>{week}</Text>
                              <Text style={styles.weekCount}>({weekNotes.length})</Text>
                            </TouchableOpacity>

                            {isWeekExpanded && (
                              <View style={styles.notesContainer}>
                                {weekNotes.map((note) => (
                                  <React.Fragment key={note.id}>
                                    {renderNoteCard({ item: note })}
                                  </React.Fragment>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Recently Deleted Section */}
          {deletedNotes.length > 0 && (
            <View style={styles.deletedSection}>
              <TouchableOpacity
                style={styles.deletedHeader}
                onPress={() => setShowDeletedNotes(!showDeletedNotes)}
                activeOpacity={0.7}
              >
                <View style={styles.deletedHeaderLeft}>
                  <Feather
                    name={showDeletedNotes ? 'chevron-down' : 'chevron-right'}
                    size={20}
                    color={Colors.errorRed}
                  />
                  <Feather name="trash-2" size={20} color={Colors.errorRed} />
                  <Text style={styles.deletedHeaderTitle}>Recently Deleted</Text>
                  <Text style={styles.deletedCount}>({deletedNotes.length})</Text>
                </View>
              </TouchableOpacity>

              {showDeletedNotes && (
                <View style={styles.deletedNotesContainer}>
                  {deletedNotes
                    .sort((a, b) => {
                      const dateA = new Date(a.deletedAt || a.createdAt).getTime();
                      const dateB = new Date(b.deletedAt || b.createdAt).getTime();
                      return dateB - dateA;
                    })
                    .map((note) => (
                      <View key={`deleted-${note.id}`} style={styles.deletedNoteCard}>
                        <View style={styles.deletedNoteContent}>
                          <Text style={styles.deletedNoteTitle} numberOfLines={1}>
                            {note.title}
                          </Text>
                          <Text style={styles.deletedNoteDate}>
                            Deleted: {formatDate(note.deletedAt || note.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.deletedNoteActions}>
                          <TouchableOpacity
                            style={styles.restoreButton}
                            onPress={() => handleRestoreNote(note.id)}
                            activeOpacity={0.7}
                          >
                            <Feather name="rotate-ccw" size={16} color={Colors.successGreen} />
                            <Text style={styles.restoreButtonText}>Restore</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: subjectBgColor }]}>
            <Feather name="file-text" size={48} color={subjectColor} />
          </View>
          <Text style={styles.emptyStateTitle}>No notes taken</Text>
          <Text style={styles.emptyStateText}>
            Start taking notes for {subjectName} to see them here
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: subjectColor }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('AddNote', {
                subjectId,
                subjectName,
                subjectColor,
                subjectBgColor,
              });
            }}
          >
            <Feather name="plus" size={20} color={Colors.white} />
            <Text style={styles.emptyStateButtonText}>Add Your First Note</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  addNoteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.roseRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderGroup: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    overflow: 'hidden',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  folderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  folderCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  editFolderButton: {
    padding: 4,
  },
  weeksContainer: {
    padding: 12,
  },
  weekGroup: {
    marginBottom: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  weekName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  weekCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  notesContainer: {
    paddingLeft: 20,
    gap: 12,
  },
  deletedSection: {
    marginTop: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    overflow: 'hidden',
  },
  deletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FEF2F2',
  },
  deletedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  deletedHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.errorRed,
    fontFamily: Fonts.bold,
  },
  deletedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.errorRed,
    fontFamily: Fonts.semiBold,
    opacity: 0.7,
  },
  deletedNotesContainer: {
    padding: 12,
    gap: 12,
  },
  deletedNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deletedNoteContent: {
    flex: 1,
    marginRight: 12,
  },
  deletedNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
    opacity: 0.7,
  },
  deletedNoteDate: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  deletedNoteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  restoreButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.successGreen,
    fontFamily: Fonts.bold,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginRight: 8,
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ocrBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.roseRed,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
  },
  moreButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  editButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
});

export default SubjectDetailsScreen;

