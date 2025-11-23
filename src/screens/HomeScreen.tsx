import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SvgIcon from '../components/SvgIcon';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootStackNavigator';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import StatsCard, { StatsCardProps } from '../components/StatsCard';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { generateAIRecommendations, Recommendation } from '../services/aiRecommendationService';
import { SCREEN_WIDTH, getResponsivePadding } from '../utils/responsive';
import { Platform } from 'react-native';

type SummaryCard = StatsCardProps & {
  id: string;
};

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  type: 'lecture' | 'study' | 'lab' | 'task' | 'quiz';
  isSuggested?: boolean;
  isExamMode?: boolean;
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
  const [userName, setUserName] = useState('User');
  const [isClinicalMode] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
  const [isQuickTipsExpanded, setIsQuickTipsExpanded] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const greeting = currentDate.getHours() < 12 ? 'Good Morning' : currentDate.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const getSummaryCards = (): SummaryCard[] => {
    const nextEvent = scheduleItems.length > 0 ? scheduleItems[0] : null;
    
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
        bgColor: Colors.roseRed,
      },
      {
        id: '2',
        title: 'Due Tasks',
        value: '3',
        subtitle: '2 overdue',
        icon: 'check-circle',
        color: '#FFFFFF',
        bgColor: Colors.errorRed,
      },
      {
        id: '3',
        title: 'Next Class',
        value: nextEvent ? nextEvent.time : '--:--',
        subtitle: nextEvent ? nextEvent.title : 'No events',
        icon: 'clock',
        color: '#FFFFFF',
        bgColor: Colors.successGreen,
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
      fetchTodaysSchedule();
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
          color: data.selectedColor || data.color || Colors.roseRed,
          bgColor: data.bgColor || Colors.roseLight,
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

  const fetchTodaysSchedule = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoadingSchedule(false);
      return;
    }

    try {
      setIsLoadingSchedule(true);
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const eventsQuery = query(
        collection(db, 'calendarEvents'),
        where('userId', '==', user.uid),
        where('date', '==', todayString)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const fetchedScheduleItems: ScheduleItem[] = [];

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        let timeString = 'All Day';
        if (data.time) {
          const timeMatch = data.time.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            timeString = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }

        let scheduleType: ScheduleItem['type'] = 'lecture';
        if (data.type === 'study') {
          scheduleType = 'study';
        } else if (data.type === 'lab') {
          scheduleType = 'lab';
        } else if (data.type === 'task') {
          scheduleType = 'task';
        } else if (data.type === 'exam') {
          scheduleType = 'quiz';
        } else {
          scheduleType = 'lecture';
        }

        fetchedScheduleItems.push({
          id: doc.id,
          time: timeString,
          title: data.title || 'Untitled Event',
          type: scheduleType,
        });
      });

      fetchedScheduleItems.sort((a, b) => {
        if (a.time === 'All Day') return 1;
        if (b.time === 'All Day') return -1;
        
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });

      setScheduleItems(fetchedScheduleItems);
    } catch (error: any) {
      console.error('Error fetching today\'s schedule:', error);
      setScheduleItems([]);
    } finally {
      setIsLoadingSchedule(false);
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

  const getScheduleIcon = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'lecture':
        return 'video';
      case 'study':
        return 'book-open';
      case 'lab':
        return 'activity';
      case 'task':
        return 'file-text';
      case 'quiz':
        return 'edit';
      default:
        return 'circle';
    }
  };

  const getScheduleColor = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'lecture':
        return Colors.roseRed;
      case 'study':
        return Colors.successGreen;
      case 'lab':
        return Colors.warningAmber;
      case 'task':
        return Colors.errorRed;
      case 'quiz':
        return Colors.roseDark;
      default:
        return Colors.coolGrey;
    }
  };

  const getScheduleBgColor = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'lecture':
        return Colors.roseLight;
      case 'study':
        return '#ECFDF5';
      case 'lab':
        return '#FFFBEB';
      case 'task':
        return '#FEF2F2';
      case 'quiz':
        return Colors.roseLight;
      default:
        return Colors.fogGrey;
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

  const renderScheduleItem = (item: ScheduleItem) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      activeOpacity={0.75}
      onPress={() => {
        (navigation as any).navigate('Calendar');
      }}
    >
      <View style={[styles.scheduleIconContainer, { backgroundColor: getScheduleBgColor(item.type) }]}>
        <SvgIcon name="calendar-clock" size={20} color={getScheduleColor(item.type)} />
      </View>
      <View style={styles.scheduleMiddle}>
        <View style={styles.scheduleTimeAndTitle}>
          <Text style={styles.scheduleTime}>{item.time}</Text>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.coolGrey} />
    </TouchableOpacity>
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
        return Colors.roseRed;
      case 'Clinical':
        return Colors.errorRed;
      case 'Exam Prep':
        return Colors.warningAmber;
      default:
        return Colors.roseRed;
    }
  };

  const renderDocumentCard = (doc: Document) => (
    <TouchableOpacity
      key={doc.id}
      style={styles.documentCard}
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

      {/* White Content Section */}
      <View style={styles.docContent}>
        <Text style={styles.docDate}>{doc.date}</Text>
        <Text style={styles.docTitle} numberOfLines={2}>
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
          <Text style={styles.docSubject} numberOfLines={1}>
            {doc.subject}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={styles.safeArea} 
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
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Hi! {userName} 👋</Text>
                <Text style={styles.headerSubtitle}>Let's explore your notes</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Feather name="bell" size={24} color={Colors.darkSlate} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutorial Banner */}
        <View style={styles.section}>
          <View style={styles.tutorialBanner}>
            <View style={styles.tutorialContent}>
              <Text style={styles.tutorialTitle}>{tutorialCard.title}</Text>
              <Text style={styles.tutorialDescription}>{tutorialCard.description}</Text>
              <TouchableOpacity style={styles.tutorialButton} activeOpacity={0.8}>
                <Feather name="play" size={16} color="#FFFFFF" />
                <Text style={styles.tutorialButtonText}>{tutorialCard.action}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tutorialIcon}>
              <View style={styles.tutorialIconBox}>
                <Feather name="layers" size={40} color={Colors.roseRed} />
              </View>
            </View>
          </View>
        </View>

        {/* Let's Jump In Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Let's jump in</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Feather name="chevron-right" size={24} color={Colors.roseRed} />
            </TouchableOpacity>
          </View>

          {isLoadingDocuments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.roseRed} />
              <Text style={styles.loadingText}>Loading today's notes...</Text>
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
              <Feather name="file-text" size={32} color={Colors.coolGrey} />
              <Text style={styles.emptyStateText}>No notes saved today</Text>
              <Text style={styles.emptyStateSubtext}>Start taking notes to see them here</Text>
            </View>
          )}
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
            extraData={scheduleItems}
          />
        </View>

        {/* Focus Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.focusCard}
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
              <Feather name="arrow-right" size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.7}
            onPress={() => setIsScheduleExpanded(!isScheduleExpanded)}
          >
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Feather
              name={isScheduleExpanded ? 'chevron-down' : 'chevron-right'}
              size={24}
              color={Colors.roseRed}
            />
          </TouchableOpacity>
          {isScheduleExpanded && (
            <View style={styles.scheduleContainer}>
              {isLoadingSchedule ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.roseRed} />
                  <Text style={styles.loadingText}>Loading schedule...</Text>
                </View>
              ) : scheduleItems.length > 0 ? (
                scheduleItems.map((item) => (
                  <View key={item.id}>{renderScheduleItem(item)}</View>
                ))
              ) : (
                <View style={styles.emptyScheduleState}>
                  <SvgIcon name="calendar-lines" size={48} color={Colors.coolGrey} />
                  <Text style={styles.emptyScheduleText}>No events scheduled for today</Text>
                  <Text style={styles.emptyScheduleSubtext}>Add events in the Calendar tab</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.7}
            onPress={() => setIsQuickTipsExpanded(!isQuickTipsExpanded)}
          >
            <View style={styles.insightHeaderLeft}>
              <Text style={styles.sectionTitle}>Quick Tips</Text>
              <View style={styles.aiBadge}>
                <Feather name="zap" size={12} color={Colors.warningAmber} />
              </View>
            </View>
            <Feather
              name={isQuickTipsExpanded ? 'chevron-down' : 'chevron-right'}
              size={24}
              color={Colors.roseRed}
            />
          </TouchableOpacity>
          {isQuickTipsExpanded && (
            <View style={styles.suggestionsContainer}>
              {isLoadingSuggestions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.roseRed} />
                  <Text style={styles.loadingText}>Generating personalized tips...</Text>
                </View>
              ) : suggestions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="lightbulb" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No recommendations yet</Text>
                  <Text style={styles.emptyStateText}>
                    Start studying and taking quizzes to get personalized tips
                  </Text>
                </View>
              ) : (
                suggestions.map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion.id} 
                    style={styles.suggestionItem} 
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
                    <View style={styles.suggestionIconContainer}>
                      <SvgIcon 
                        name="dice-alt" 
                        size={18} 
                        color={
                          suggestion.priority === 'high' 
                            ? Colors.errorRed 
                            : suggestion.priority === 'medium' 
                            ? Colors.warningAmber 
                            : Colors.successGreen
                        } 
                      />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                      {suggestion.action && (
                        <View style={styles.actionButtonSmall}>
                          <Text style={styles.actionButtonText}>{suggestion.action}</Text>
                          <Feather name="arrow-right" size={12} color={Colors.roseRed} />
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
    backgroundColor: Colors.white,
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
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  tutorialBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.roseRed,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.roseRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
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
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  tutorialButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.black,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  documentsScroll: {
    gap: 16,
    paddingRight: 20,
  },
  documentCard: {
    width: 180,
    height: 220,
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: Colors.white,
    padding: 16,
    gap: 6,
  },
  docDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkSlate,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    marginTop: 4,
  },
  summaryCardsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  focusCard: {
    flexDirection: 'row',
    backgroundColor: Colors.roseRed,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.roseRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  focusTextContent: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
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
  scheduleContainer: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleMiddle: {
    flex: 1,
    gap: 4,
  },
  scheduleTimeAndTitle: {
    gap: 2,
  },
  scheduleTime: {
    fontSize: 11,
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.fogGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
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
    color: Colors.darkSlate,
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
    color: Colors.roseRed,
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
    color: Colors.coolGrey,
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
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  emptyScheduleState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyScheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyScheduleSubtext: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
});

export default HomeScreen;