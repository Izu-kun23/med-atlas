import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Subject = {
  id: string;
  name: string;
  quizCount: number;
  averageScore: number;
  lastQuizDate?: string;
  color: string;
  bgColor: string;
};

type QuizResult = {
  id: string;
  subject: string;
  score: number;
  totalQuestions: number;
  date: string;
  timeSpent: number;
};

type WeakTopic = {
  id: string;
  subject: string;
  topic: string;
  attempts: number;
  accuracy: number;
};

const QuizHomeScreen: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjects: Subject[] = [
    {
      id: '1',
      name: 'Anatomy',
      quizCount: 12,
      averageScore: 85,
      lastQuizDate: '2024-11-15',
      color: Colors.roseRed,
      bgColor: '#FFEBEE',
    },
    {
      id: '2',
      name: 'Surgery',
      quizCount: 8,
      averageScore: 72,
      lastQuizDate: '2024-11-14',
      color: Colors.errorRed,
      bgColor: '#FFEBEE',
    },
    {
      id: '3',
      name: 'Physiology',
      quizCount: 15,
      averageScore: 90,
      lastQuizDate: '2024-11-16',
      color: Colors.successGreen,
      bgColor: '#ECFDF5',
    },
    {
      id: '4',
      name: 'Pathology',
      quizCount: 6,
      averageScore: 68,
      lastQuizDate: '2024-11-12',
      color: Colors.warningAmber,
      bgColor: '#FFFBEB',
    },
  ];

  const recentQuizzes: QuizResult[] = [
    {
      id: '1',
      subject: 'Physiology',
      score: 92,
      totalQuestions: 20,
      date: '2024-11-16',
      timeSpent: 15,
    },
    {
      id: '2',
      subject: 'Anatomy',
      score: 85,
      totalQuestions: 25,
      date: '2024-11-15',
      timeSpent: 22,
    },
    {
      id: '3',
      subject: 'Surgery',
      score: 75,
      totalQuestions: 18,
      date: '2024-11-14',
      timeSpent: 18,
    },
  ];

  const weakTopics: WeakTopic[] = [
    {
      id: '1',
      subject: 'Pathology',
      topic: 'Inflammatory Processes',
      attempts: 5,
      accuracy: 45,
    },
    {
      id: '2',
      subject: 'Surgery',
      topic: 'Surgical Techniques',
      attempts: 8,
      accuracy: 55,
    },
    {
      id: '3',
      subject: 'Anatomy',
      topic: 'Neuroanatomy',
      attempts: 6,
      accuracy: 60,
    },
  ];

  const totalQuizzes = subjects.reduce((sum, s) => sum + s.quizCount, 0);
  const overallAverage = Math.round(
    subjects.reduce((sum, s) => sum + s.averageScore * s.quizCount, 0) /
      subjects.reduce((sum, s) => sum + s.quizCount, 0)
  );

  const hasUpcomingExam = true;
  const examDaysRemaining = 6;

  const handleGenerateQuiz = () => {
    console.log('Generate quiz');
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
    console.log('Select subject:', subjectId);
  };

  const handlePreExamMode = () => {
    console.log('Pre-exam mode');
  };

  const renderScoreHistory = () => {
    const scores = recentQuizzes.map((q) => q.score);
    return (
      <View style={styles.scoreHistoryContainer}>
        <View style={styles.scoreBars}>
          {scores.map((score, index) => (
            <View key={index} style={styles.scoreBarWrapper}>
              <View style={styles.scoreBarContainer}>
                <View
                  style={[
                    styles.scoreBar,
                    {
                      height: `${score}%`,
                      backgroundColor:
                        score >= 80 ? Colors.successGreen : score >= 60 ? Colors.warningAmber : Colors.errorRed,
                    },
                  ]}
                />
              </View>
              <Text style={styles.scoreBarLabel}>{score}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.headerTitle}>Quizzes</Text>
            <Text style={styles.headerSubtitle}>
              <Text style={styles.highlight}>{totalQuizzes}</Text> quizzes • <Text style={styles.highlight}>{overallAverage}%</Text> average
            </Text>
          </View>
        </View>

        {/* Pre-Exam Mode Banner */}
        {hasUpcomingExam && (
          <TouchableOpacity 
            style={styles.preExamBanner}
            onPress={handlePreExamMode}
            activeOpacity={0.85}
          >
            <View style={styles.preExamIconBg}>
              <Feather name="zap" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.preExamContent}>
              <Text style={styles.preExamTitle}>Pre-Exam Mode</Text>
              <Text style={styles.preExamSubtitle}>
                Exam in {examDaysRemaining} days • Smart revision enabled
              </Text>
            </View>
            <Feather name="arrow-right" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Generate Quick Quiz Button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateQuiz}
          activeOpacity={0.85}
        >
          <View style={styles.generateIconContainer}>
            <Feather name="zap" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.generateTextWrapper}>
            <Text style={styles.generateTitle}>Generate Quick Quiz</Text>
            <Text style={styles.generateSubtitle}>AI-powered from your notes</Text>
          </View>
          <Feather name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* All Subjects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectsScroll}
          >
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectCard,
                  selectedSubject === subject.id && styles.subjectCardSelected,
                ]}
                onPress={() => handleSubjectSelect(subject.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.subjectIconContainer, { backgroundColor: subject.color }]}>
                  <Text style={styles.subjectInitial}>
                    {subject.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <View style={styles.subjectStatsRow}>
                  <View style={styles.subjectStatBadge}>
                    <Feather name="layers" size={13} color={Colors.coolGrey} />
                    <Text style={styles.subjectStatBadgeText}>{subject.quizCount}</Text>
                  </View>
                  <View style={styles.subjectStatBadge}>
                    <Feather name="trending-up" size={13} color={Colors.successGreen} />
                    <Text style={[styles.subjectStatBadgeText, { color: Colors.successGreen }]}>{subject.averageScore}%</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.quizButton, { backgroundColor: subject.color }]}
                  activeOpacity={0.8}
                >
                  <Feather name="play" size={14} color="#FFFFFF" />
                  <Text style={styles.quizButtonText}>Quiz</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Score History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Score Trend</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scoreHistoryCard}>
            {renderScoreHistory()}
            <View style={styles.scoreHistoryStats}>
              <View style={styles.scoreStatItem}>
                <Text style={styles.scoreStatValue}>{overallAverage}%</Text>
                <Text style={styles.scoreStatLabel}>Average</Text>
              </View>
              <View style={styles.scoreStatDivider} />
              <View style={styles.scoreStatItem}>
                <Text style={styles.scoreStatValue}>{totalQuizzes}</Text>
                <Text style={styles.scoreStatLabel}>Total</Text>
              </View>
              <View style={styles.scoreStatDivider} />
              <View style={styles.scoreStatItem}>
                <Text style={styles.scoreStatValue}>
                  {Math.max(...recentQuizzes.map((q) => q.score))}%
                </Text>
                <Text style={styles.scoreStatLabel}>Best</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weak Topics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weakTopicsList}>
            {weakTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.weakTopicCard}
                activeOpacity={0.75}
              >
                <View style={styles.weakTopicTop}>
                  <View style={styles.weakTopicLeftContent}>
                    <Text style={styles.weakTopicSubject}>{topic.subject}</Text>
                    <Text style={styles.weakTopicName}>{topic.topic}</Text>
                  </View>
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.accuracyValue}>{topic.accuracy}%</Text>
                  </View>
                </View>
                <View style={styles.weakTopicBottom}>
                  <View style={styles.attemptsBadge}>
                    <Feather name="repeat-2" size={12} color={Colors.coolGrey} />
                    <Text style={styles.attemptsText}>{topic.attempts} attempts</Text>
                  </View>
                  <TouchableOpacity style={styles.practiceButton} activeOpacity={0.8}>
                    <Feather name="play-circle" size={14} color={Colors.roseRed} />
                    <Text style={styles.practiceButtonText}>Practice</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Quizzes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>History</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentQuizzesList}>
            {recentQuizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                style={styles.recentQuizCard}
                activeOpacity={0.75}
              >
                <View style={styles.recentQuizLeft}>
                  <View style={styles.recentQuizInfo}>
                    <Text style={styles.recentQuizSubject}>{quiz.subject}</Text>
                    <View style={styles.quizMetaRow}>
                      <View style={styles.metaItem}>
                        <Feather name="help-circle" size={12} color={Colors.coolGrey} />
                        <Text style={styles.metaText}>{quiz.totalQuestions} Q</Text>
                      </View>
                      <View style={styles.metaDot} />
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={12} color={Colors.coolGrey} />
                        <Text style={styles.metaText}>{quiz.timeSpent}m</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View
                  style={[
                    styles.scoreDisplayBadge,
                    {
                      backgroundColor:
                        quiz.score >= 80
                          ? '#ECFDF5'
                          : quiz.score >= 60
                          ? '#FFFBEB'
                          : '#FEF2F2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreDisplay,
                      {
                        color:
                          quiz.score >= 80
                            ? Colors.successGreen
                            : quiz.score >= 60
                            ? Colors.warningAmber
                            : Colors.errorRed,
                      },
                    ]}
                  >
                    {quiz.score}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  highlight: {
    fontWeight: '800',
    color: Colors.darkSlate,
  },
  preExamBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.warningAmber,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.warningAmber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  preExamIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  preExamContent: {
    flex: 1,
  },
  preExamTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  preExamSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.regular,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.roseRed,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.roseRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  generateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  generateTextWrapper: {
    flex: 1,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  generateSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.roseRed,
    fontFamily: Fonts.semiBold,
  },
  subjectsScroll: {
    paddingHorizontal: 24,
    gap: 14,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    width: 160,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectCardSelected: {
    borderColor: Colors.roseRed,
    shadowColor: Colors.roseRed,
    shadowOpacity: 0.15,
  },
  subjectIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectInitial: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    textAlign: 'center',
  },
  subjectStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    width: '100%',
  },
  subjectStatBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 6,
    gap: 3,
  },
  subjectStatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
  },
  quizButton: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quizButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  scoreHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHistoryContainer: {
    marginBottom: 24,
  },
  scoreBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingHorizontal: 8,
  },
  scoreBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scoreBarContainer: {
    width: 40,
    height: 110,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBar: {
    width: '100%',
    borderRadius: 18,
  },
  scoreBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
  },
  scoreHistoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  scoreStatItem: {
    alignItems: 'center',
  },
  scoreStatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  scoreStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  scoreStatDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E5E7EB',
  },
  weakTopicsList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  weakTopicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  weakTopicTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  weakTopicLeftContent: {
    flex: 1,
  },
  weakTopicSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weakTopicName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  accuracyBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.errorRed,
    fontFamily: Fonts.bold,
  },
  weakTopicBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  attemptsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9E3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  practiceButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
  },
  recentQuizzesList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  recentQuizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recentQuizLeft: {
    flex: 1,
  },
  recentQuizInfo: {
    gap: 6,
  },
  recentQuizSubject: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  quizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.fogGrey,
  },
  scoreDisplayBadge: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  scoreDisplay: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
});

export default QuizHomeScreen;