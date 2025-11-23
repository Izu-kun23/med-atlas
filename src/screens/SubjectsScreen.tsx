import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import { SubjectsStackParamList } from '../navigation/SubjectsStackNavigator';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_MARGIN * 3)) / 2;

type Subject = {
  id: string;
  name: string;
  description?: string;
  progress: number;
  notesCount: number;
  studySessionsCount: number;
  examDate?: string;
  examDaysRemaining?: number;
  color: string;
  bgColor: string;
  selectedColor?: string;
  selectedIcon?: string;
  coverPhotoUrl?: string;
};

type SubjectsScreenNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

const SubjectsScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsScreenNavigationProp>();
  const [isIntern] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubjects = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
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
          description: data.description || '',
          progress: data.progress || 0,
          notesCount: data.notesCount || 0,
          studySessionsCount: data.studySessionsCount || 0,
          examDate: data.examDate || undefined,
          examDaysRemaining: data.examDaysRemaining || undefined,
          color: data.selectedColor || data.color || Colors.roseRed,
          bgColor: data.bgColor || Colors.roseLight,
          selectedColor: data.selectedColor || data.color || Colors.roseRed,
          selectedIcon: data.selectedIcon || 'folder',
          coverPhotoUrl: data.coverPhotoUrl || undefined,
        });
      });

      fetchedSubjects.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(fetchedSubjects);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSubjects();
    }, [])
  );

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('SubjectDetails', {
          subjectId: item.id,
          subjectName: item.name,
          subjectColor: item.selectedColor || item.color,
          subjectBgColor: item.bgColor,
        });
      }}
      onLongPress={() => {
        navigation.navigate('AddSubject', {
          subjectId: item.id,
          subjectName: item.name,
          subjectColor: item.selectedColor || item.color,
          subjectBgColor: item.bgColor,
          subjectIcon: item.selectedIcon || 'folder',
          subjectExamDate: item.examDate,
          subjectCoverPhotoUrl: item.coverPhotoUrl,
        });
      }}
    >
      {item.coverPhotoUrl ? (
        <View style={styles.coverPhotoWrapper}>
          <Image source={{ uri: item.coverPhotoUrl }} style={styles.coverPhoto} />
          <View style={styles.coverOverlay} />
        </View>
      ) : (
        <View style={[styles.gradientBackground, { backgroundColor: item.bgColor }]}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>
      )}
      
      <View style={styles.cardContent}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Feather 
            name={(item.selectedIcon || 'folder') as any} 
            size={24} 
            color={item.selectedColor || item.color} 
          />
        </View>
        
        <Text style={styles.subjectName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {(item.notesCount > 0 || item.studySessionsCount > 0) && (
          <View style={styles.statsContainer}>
            {item.notesCount > 0 && (
              <View style={styles.statBadge}>
                <Feather name="file-text" size={12} color={item.selectedColor || item.color} />
                <Text style={[styles.statText, { color: item.selectedColor || item.color }]}>
                  {item.notesCount}
                </Text>
              </View>
            )}
            {item.studySessionsCount > 0 && (
              <View style={styles.statBadge}>
                <Feather name="clock" size={12} color={item.selectedColor || item.color} />
                <Text style={[styles.statText, { color: item.selectedColor || item.color }]}>
                  {item.studySessionsCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{isIntern ? 'Rotations' : 'Subjects'}</Text>
          <Text style={styles.headerSubtitle}>
            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('AddSubject');
          }}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.roseRed} />
            <Text style={styles.loadingText}>Loading subjects...</Text>
          </View>
        ) : filteredSubjects.length > 0 ? (
          <FlatList
            data={filteredSubjects}
            renderItem={renderSubjectCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No subjects found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try a different search term' : 'Add your first subject to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddSubject')}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Subject</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.roseRed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.roseRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  gridContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  subjectCard: {
    width: CARD_WIDTH,
    height: 200,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: -30,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    bottom: 10,
    left: -10,
  },
  coverPhotoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 96,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 8,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseRed,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
});

export default SubjectsScreen;