import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import StatsCard, { StatsCardProps } from '../components/StatsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

type Suggestion = {
  id: string;
  text: string;
  action?: string;
};

const HomeScreen: React.FC = () => {
  const [userName] = useState('Sarah');
  const [isClinicalMode] = useState(false);

  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const greeting = currentDate.getHours() < 12 ? 'Good Morning' : currentDate.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const summaryCards: SummaryCard[] = [
    {
      id: '1',
      title: 'Study Hours',
      value: '2.5h',
      subtitle: '4h target',
      icon: 'book-open',
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
      value: '10:00',
      subtitle: 'Anatomy',
      icon: 'clock',
      color: '#FFFFFF',
      bgColor: Colors.successGreen,
    },
  ];

  const scheduleItems: ScheduleItem[] = [
    {
      id: '1',
      time: '8:00',
      title: 'Anatomy Lecture',
      type: 'lecture',
    },
    {
      id: '2',
      time: '10:00',
      title: 'Study Session',
      type: 'study',
      isSuggested: true,
    },
    {
      id: '3',
      time: '13:00',
      title: 'Surgery Lab',
      type: 'lab',
    },
    {
      id: '4',
      time: '16:00',
      title: 'Revise CVS Notes',
      type: 'task',
    },
    {
      id: '5',
      time: '20:00',
      title: 'Quiz Prep',
      type: 'quiz',
      isExamMode: true,
    },
  ];

  const suggestions: Suggestion[] = [
    {
      id: '1',
      text: 'Complete 2 untouched topics this week',
      action: 'View',
    },
    {
      id: '2',
      text: 'Exam in 6 days - boost your prep',
      action: 'Quick Quiz',
    },
    {
      id: '3',
      text: 'Review Anatomy - last studied 3 days ago',
      action: 'Study',
    },
  ];

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
      color={item.color}
      bgColor={item.bgColor}
    />
  );

  const renderScheduleItem = (item: ScheduleItem) => (
    <TouchableOpacity style={styles.scheduleItem} activeOpacity={0.75}>
      <View style={[styles.scheduleIconContainer, { backgroundColor: getScheduleBgColor(item.type) }]}>
        <Feather name={getScheduleIcon(item.type) as any} size={20} color={getScheduleColor(item.type)} />
      </View>
      <View style={styles.scheduleMiddle}>
        <View style={styles.scheduleTimeAndTitle}>
          <Text style={styles.scheduleTime}>{item.time}</Text>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
        </View>
        <View style={styles.badgesContainer}>
          {item.isSuggested && (
            <View style={styles.suggestedBadge}>
              <Feather name="zap" size={9} color={Colors.warningAmber} />
              <Text style={styles.badgeText}>AI Suggested</Text>
            </View>
          )}
          {item.isExamMode && (
            <View style={styles.examBadge}>
              <Feather name="alert-circle" size={9} color={Colors.roseDark} />
              <Text style={styles.badgeText}>Exam</Text>
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.coolGrey} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Profile */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.dateText}>{dayName} • {dateString}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
              <View style={styles.profileCircle}>
                <Text style={styles.profileInitial}>{userName.charAt(0)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - Swipable */}
        <View style={styles.section}>
          <FlatList
            data={summaryCards}
            renderItem={renderSummaryCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryCardsContainer}
            snapToInterval={SCREEN_WIDTH * 0.85 + 16}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </View>

        {/* Focus Card */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.focusCard} activeOpacity={0.85}>
            <View style={styles.focusIconBg}>
              <Feather name="target" size={28} color={Colors.white} />
            </View>
            <View style={styles.focusTextContent}>
              <Text style={styles.focusTitle}>Ready to Focus?</Text>
              <Text style={styles.focusSubtitle}>Start a Pomodoro session</Text>
            </View>
            <View style={styles.focusArrow}>
              <Feather name="arrow-right" size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Feather name="filter" size={20} color={Colors.roseRed} />
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleContainer}>
            {scheduleItems.map((item) => (
              <View key={item.id}>{renderScheduleItem(item)}</View>
            ))}
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.insightHeaderLeft}>
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <View style={styles.aiBadge}>
                <Feather name="zap" size={12} color={Colors.warningAmber} />
              </View>
            </View>
          </View>
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity key={suggestion.id} style={styles.suggestionItem} activeOpacity={0.75}>
                <View style={styles.suggestionIconContainer}>
                  <Feather name="lightbulb" size={18} color={Colors.warningAmber} />
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
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Feather name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  userName: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.medium,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardsContainer: {
    paddingHorizontal: 7,
    gap: 16,
    paddingRight: 16,
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
  focusIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
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
    gap: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleMiddle: {
    flex: 1,
    gap: 6,
  },
  scheduleTimeAndTitle: {
    gap: 3,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  examBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontSize: 15,
    color: Colors.darkSlate,
    fontFamily: Fonts.semiBold,
    lineHeight: 22,
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  actionButtonText: {
    fontSize: 13,
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 50,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 16,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;