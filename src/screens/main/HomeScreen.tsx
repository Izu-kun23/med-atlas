import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SvgIcon from '../../components/SvgIcon';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../hooks/useTheme';
import StatsCard, { StatsCardProps } from '../../components/StatsCard';
import TabBar from '../../components/TabBar';
import HealthMetricsCard from '../../components/HealthMetricsCard';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { generateAIRecommendations, Recommendation } from '../../services/aiRecommendationService';
import { SCREEN_WIDTH, getResponsivePadding } from '../../utils/responsive';
import { Platform } from 'react-native';

type SummaryCard = StatsCardProps & {
  id: string;
};


type Document = {
  id: string;
  date: string;
  title: string;
  subject: string;
  subjectId: string;
  subjectColor: string;
  subjectBgColor: string;
  tags: string[];
  noteId: string;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const [userName, setUserName] = useState('User');
  const [isClinicalMode] = useState(false);
  const [isQuickTipsExpanded, setIsQuickTipsExpanded] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const greeting = currentDate.getHours() < 12 ? 'Good Morning' : currentDate.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const getSummaryCards = (): SummaryCard[] => {
    return [
      {
        id: '1',
        title: 'Study Hours',
        value: '2.5h',
        subtitle: '4h target',
        icon: 'book-open',
        iconType: 'svg',
        svgIconName: 'book-bookmark',
        color: '#FFFFFF',
        bgColor: theme.colors.primary,
      },
      {
        id: '2',
        title: 'Due Tasks',
        value: '3',
        subtitle: '2 overdue',
        icon: 'check-circle',
        color: '#FFFFFF',
        bgColor: theme.colors.error,
      },
      {
        id: '3',
        title: 'Next Class',
        value: '--:--',
        subtitle: 'No events',
        icon: 'clock',
        color: '#FFFFFF',
        bgColor: theme.colors.success,
      },
    ];
  };

  const tutorialCard = {
    title: 'Welcome to MedTrackr',
    description: 'Your all-in-one companion for medical studies, clinical rotations, and exam preparation.',
    action: 'Get Started',
    icon: 'play-circle',
  };

  React.useEffect(() => {
    fetchUserName();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTodaysNotes();
      fetchAIRecommendations();
    }, [])
  );

  const fetchUserName = async () => {
    const user = auth.currentUser;
    if (!user) {
      setUserName('User');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const fullName = data.fullName || user.displayName || user.email?.split('@')[0] || 'User';
        setUserName(fullName);
      } else {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        setUserName(name);
      }
    } catch (error: any) {
      console.error('Error fetching user name:', error);
      const user = auth.currentUser;
      const name = user?.displayName || user?.email?.split('@')[0] || 'User';
      setUserName(name);
    }
  };

  const fetchTodaysNotes = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoadingDocuments(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid)
      );

      const notesSnapshot = await getDocs(notesQuery);

      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('userId', '==', user.uid)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);

      const subjectsMap = new Map();
      subjectsSnapshot.forEach((doc) => {
        const data = doc.data();
        subjectsMap.set(doc.id, {
          name: data.name || '',
          color: data.selectedColor || data.color || theme.colors.primary,
          bgColor: data.bgColor || theme.colors.primaryLight,
        });
      });

      const fetchedDocuments: Document[] = [];
      notesSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        
        if (data.isDeleted) {
          return;
        }
        
        if (createdAt >= today && createdAt < tomorrow) {
          const subjectId = data.subjectId;
          const subject = subjectsMap.get(subjectId);

          if (subject) {
            const dateStr = createdAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            fetchedDocuments.push({
              id: doc.id,
              date: dateStr,
              title: data.title || 'Untitled Note',
              subject: subject.name,
              subjectId: subjectId,
              subjectColor: subject.color,
              subjectBgColor: subject.bgColor,
              tags: data.sourceType === 'OCR' ? ['Recent'] : [],
              noteId: doc.id,
            });
          }
        }
      });

      fetchedDocuments.sort((a, b) => {
        const noteA = notesSnapshot.docs.find(d => d.id === a.noteId);
        const noteB = notesSnapshot.docs.find(d => d.id === b.noteId);
        const dateA = noteA?.data().createdAt?.toDate?.() || new Date();
        const dateB = noteB?.data().createdAt?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });

      setDocuments(fetchedDocuments);
    } catch (error: any) {
      console.error('Error fetching today\'s notes:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchAIRecommendations = async () => {
    setIsLoadingSuggestions(true);
    try {
      const recommendations = await generateAIRecommendations();
      setSuggestions(recommendations);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const renderSummaryCard = ({ item }: { item: SummaryCard }) => (
    <StatsCard
      title={item.title}
      value={item.value}
      subtitle={item.subtitle}
      icon={item.icon}
      iconType={item.iconType}
      svgIconName={item.svgIconName}
      color={item.color}
      bgColor={item.bgColor}
    />
  );

  const getDocIconColor = (doc: Document) => {
    return doc.subjectColor;
  };

  const getDocIconBgColor = (doc: Document) => {
    return doc.subjectBgColor;
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Recent':
        return theme.colors.primary;
      case 'Clinical':
        return theme.colors.error;
      case 'Exam Prep':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const renderDocumentCard = (doc: Document) => (
    <TouchableOpacity
      key={doc.id}
      style={[styles.documentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      activeOpacity={0.75}
      onPress={() => {
        (navigation as any).navigate('Subjects', {
          screen: 'SubjectDetails',
          params: {
            subjectId: doc.subjectId,
            subjectName: doc.subject,
            subjectColor: doc.subjectColor,
            subjectBgColor: doc.subjectBgColor,
          },
        });
      }}
    >
      {/* Colored Background Section */}
      <View style={[styles.documentCardInner, { backgroundColor: getDocIconBgColor(doc) }]}>
        <View style={styles.docIconWrapper}>
          <View style={[styles.docIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <Feather name="file-text" size={28} color={getDocIconColor(doc)} />
          </View>
        </View>
        {/* Decorative circles */}
        <View style={[styles.decorativeCircle1, { opacity: 0.15 }]} />
        <View style={[styles.decorativeCircle2, { opacity: 0.1 }]} />
      </View>

      {/* Content Section */}
      <View style={[styles.docContent, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.docDate, { color: theme.colors.textSecondary }]}>{doc.date}</Text>
        <Text style={[styles.docTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {doc.title}
        </Text>
        {doc.tags.length > 0 ? (
          <View style={styles.docTags}>
            {doc.tags.map((tag, idx) => (
              <View key={idx} style={[styles.docTag, { backgroundColor: getTagColor(tag) }]}>
                <Text style={styles.docTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.docSubject, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {doc.subject}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]} 
      edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* Header with Profile */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.profileAvatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>Hi! {userName} 👋</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Let's explore your notes</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerIcon}
                onPress={() => navigation.navigate('Messages')}
              >
                <Feather name="message-circle" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
                <Feather name="bell" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Today's Notes Section with Tabs */}
        <View style={styles.section}>
          <TabBar
            tabs={[
              { id: 'today', label: 'Today' },
              { id: 'recent', label: 'Recent' },
              { id: 'all', label: 'All Notes' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <View style={styles.tabContent}>
            {isLoadingDocuments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading notes...</Text>
              </View>
            ) : documents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.documentsScroll}
              >
                {documents.map((doc) => renderDocumentCard(doc))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={32} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No notes saved today</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>Start taking notes to see them here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tutorial Banner */}
        <View style={styles.section}>
          <View style={[styles.tutorialBanner, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.tutorialContent}>
              <Text style={styles.tutorialTitle}>{tutorialCard.title}</Text>
              <Text style={styles.tutorialDescription}>{tutorialCard.description}</Text>
              <TouchableOpacity style={[styles.tutorialButton, { backgroundColor: theme.colors.white }]} activeOpacity={0.8}>
                <Text style={[styles.tutorialButtonText, { color: theme.colors.primary }]}>{tutorialCard.action}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tutorialIcon}>
              <View style={styles.tutorialIconBox}>
                <Feather name="layers" size={40} color={theme.colors.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Study Progress Section */}
        <View style={styles.section}>
          <HealthMetricsCard
            title="Study Progress"
            period="Weekly"
            avgValue={getSummaryCards()[0]?.value || '0h'}
            avgLabel="Study Hours"
            deepValue={getSummaryCards()[1]?.value || '0'}
            deepLabel="Tasks"
            chartData={[
              { day: 'S', value: 2 },
              { day: 'M', value: 2.5 },
              { day: 'T', value: 1.5 },
              { day: 'W', value: 3 },
              { day: 'T', value: 2.8 },
              { day: 'F', value: 1.2 },
              { day: 'S', value: 2.5 },
            ]}
            otherMetrics={[
              {
                label: 'Notes Created',
                value: String(documents.length),
                unit: 'today',
                icon: 'file-text',
              },
              {
                label: 'Progress',
                value: '62',
                unit: '%',
                icon: 'trending-up',
                progress: 62,
              },
            ]}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <FlatList
            data={getSummaryCards()}
            renderItem={renderSummaryCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryCardsContainer}
            scrollEnabled={true}
            snapToInterval={SCREEN_WIDTH * 0.55 + 16}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </View>

        {/* Focus Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.focusCard, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.85}
            onPress={() => {
              navigation.navigate('StudySession' as never);
            }}
          >
            <View style={styles.focusTextContent}>
              <Text style={styles.focusTitle}>Ready to Focus?</Text>
              <Text style={styles.focusSubtitle}>Start a study session</Text>
            </View>
            <View style={styles.focusArrow}>
              <Feather name="arrow-right" size={24} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.7}
            onPress={() => setIsQuickTipsExpanded(!isQuickTipsExpanded)}
          >
            <View style={styles.insightHeaderLeft}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Tips</Text>
              <View style={[styles.aiBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Feather name="zap" size={12} color={theme.colors.warning} />
              </View>
            </View>
            <Feather
              name={isQuickTipsExpanded ? 'chevron-down' : 'chevron-right'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          {isQuickTipsExpanded && (
            <View style={styles.suggestionsContainer}>
              {isLoadingSuggestions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Generating personalized tips...</Text>
                </View>
              ) : suggestions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="lightbulb" size={48} color={theme.colors.textTertiary} />
                  <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No recommendations yet</Text>
                  <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                    Start studying and taking quizzes to get personalized tips
                  </Text>
                </View>
              ) : (
                suggestions.map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion.id} 
                    style={[styles.suggestionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
                    activeOpacity={0.75}
                    onPress={() => {
                      if (suggestion.action === 'Start Quiz') {
                        (navigation as any).navigate('Quizzes', { screen: 'QuizHome' });
                      } else if (suggestion.action === 'Add Note') {
                        (navigation as any).navigate('Subjects', { screen: 'SubjectsList' });
                      } else if (suggestion.action === 'View Notes' || suggestion.action === 'Review Notes') {
                        (navigation as any).navigate('Subjects', { screen: 'SubjectsList' });
                      } else if (suggestion.action === 'View Subjects') {
                        (navigation as any).navigate('Subjects', { screen: 'SubjectsList' });
                      } else if (suggestion.action === 'Quick Quiz') {
                        (navigation as any).navigate('Quizzes', { screen: 'QuizHome' });
                      } else if (suggestion.action === 'Practice' || suggestion.action === 'Study More') {
                        (navigation as any).navigate('Quizzes', { screen: 'QuizHome' });
                      }
                    }}
                  >
                    <View style={[styles.suggestionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <SvgIcon 
                        name="dice-alt" 
                        size={18} 
                        color={
                          suggestion.priority === 'high' 
                            ? theme.colors.error 
                            : suggestion.priority === 'medium' 
                            ? theme.colors.warning 
                            : theme.colors.success
                        } 
                      />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{suggestion.text}</Text>
                      {suggestion.action && (
                        <View style={styles.actionButtonSmall}>
                          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>{suggestion.action}</Text>
                          <Feather name="arrow-right" size={12} color={theme.colors.primary} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    ...(Platform.OS === 'android' && {
      paddingTop: 0,
    }),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
  },
  headerSection: {
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  tabContent: {
    marginTop: 16,
    gap: 16,
  },
  timeSlotSection: {
    marginTop: 8,
  },
  tutorialBanner: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tutorialContent: {
    flex: 1,
    gap: 12,
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  tutorialDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  tutorialButton: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  tutorialButtonText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  tutorialIcon: {
    marginLeft: 16,
    opacity: 0.2,
  },
  tutorialIconBox: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  documentsScroll: {
    gap: 16,
    paddingRight: 20,
  },
  documentCard: {
    width: 200,
    height: 240,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentCardInner: {
    position: 'relative',
    height: 120,
    padding: 20,
    justifyContent: 'flex-start',
  },
  docIconWrapper: {
    zIndex: 10,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: -20,
    right: -15,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    bottom: 15,
    left: -10,
  },
  docContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  docDate: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    lineHeight: 20,
    flex: 1,
  },
  docTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  docTag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  docTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  docSubject: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginTop: 4,
  },
  summaryCardsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  focusCard: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  focusTextContent: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  focusSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Fonts.regular,
  },
  focusArrow: {
    marginLeft: 12,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  suggestionContent: {
    flex: 1,
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    lineHeight: 20,
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
});

export default HomeScreen;