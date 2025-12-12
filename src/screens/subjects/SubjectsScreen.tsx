import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { SubjectsStackParamList } from '../../navigation/SubjectsStackNavigator';
import TabBar from '../../components/TabBar';
import { db, auth } from '../../lib/firebase';
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
  const { theme } = useTheme();
  const [isIntern] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const styles = createStyles(theme);

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
      <View style={styles.cardIconContainer}>
        <Feather 
          name={(item.selectedIcon || 'folder') as any} 
          size={32} 
          color={theme.colors.text} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.profileAvatarText}>U</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{isIntern ? 'Rotations' : 'Subjects'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
            <Feather name="search" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
            <Feather name="more-vertical" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Navigation */}
        <View style={styles.tabSection}>
          <TabBar
            tabs={[
              { id: 'all', label: 'All Notes' },
              { id: 'recent', label: 'Folders' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading subjects...</Text>
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
            <Feather name="book-open" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No subjects found</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'Add your first subject to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tabSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    height: CARD_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.regular,
  },
});

export default SubjectsScreen;