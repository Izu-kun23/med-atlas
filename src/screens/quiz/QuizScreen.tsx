import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { QuizQuestion } from '../../utils/quizGenerator';
import AnimatedScore from '../../components/AnimatedScore';
import { QuizStackParamList } from '../../navigation/QuizStackNavigator';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QuizScreenRouteProp = RouteProp<QuizStackParamList, 'QuizScreen'>;
type QuizScreenNavigationProp = StackNavigationProp<QuizStackParamList, 'QuizScreen'>;

const QuizScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const { subjectId, subjectName, subjectColor, questions } = route.params;
  
  // Use subject color if provided, otherwise fall back to theme primary
  const primaryColor = subjectColor || theme.colors.primary;
  // Create a light version of the subject color (with 15% opacity for backgrounds)
  const primaryColorLight = primaryColor + '26'; // ~15% opacity in hex

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Timer effect
  useEffect(() => {
    if (!showResults && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [showResults, isPaused]);

  // Pause timer when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      setIsPaused(false);
      return () => {
        setIsPaused(true);
      };
    }, [])
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    
    if (unansweredCount > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to finish?`,
        [
          { text: 'Continue Quiz', style: 'cancel' },
          {
            text: 'Finish Anyway',
            style: 'destructive',
            onPress: () => submitQuiz(),
          },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000 / 60); // minutes
    const correctAnswers = questions.filter(
      (q) => selectedAnswers[q.id] === q.correctAnswer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);

    // Save quiz data to Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        // Step 1: Create quiz document
        const quizDocRef = await addDoc(collection(db, 'quizzes'), {
          userId: user.uid,
          subjectId: subjectId,
          title: `Quick Quiz - ${subjectName}`,
          mode: 'CUSTOM',
          createdAt: serverTimestamp(),
        });

        const quizId = quizDocRef.id;

        // Step 2: Save questions to questions collection
        const questionDocPromises = questions.map((question) => {
          return addDoc(collection(db, 'questions'), {
            quizId: quizId,
            noteId: null,
            questionText: question.question,
            options: question.options.slice(0, 4), // Ensure only 4 options
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            createdAt: serverTimestamp(),
          });
        });

        const questionDocs = await Promise.all(questionDocPromises);
        const questionIds = questionDocs.map((doc) => doc.id);

        // Step 3: Save quiz result
        const quizResultDocRef = await addDoc(collection(db, 'quizResults'), {
          quizId: quizId,
          userId: user.uid,
          subjectId: subjectId,
          subjectName: subjectName,
          score: score,
          totalQuestions: questions.length,
          correctAnswers: correctAnswers,
          timeSpent: timeSpent,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        const quizResultId = quizResultDocRef.id;

        // Step 4: Save individual question results
        const questionResultsPromises = questions.map((question, index) => {
          const selectedAnswer = selectedAnswers[question.id];
          const isCorrect = selectedAnswer === question.correctAnswer;
          const questionId = questionIds[index];

          return addDoc(collection(db, 'questionResults'), {
            quizResultId: quizResultId,
            questionId: questionId,
            selectedAnswer: selectedAnswer !== undefined ? selectedAnswer : -1,
            isCorrect: isCorrect,
            createdAt: serverTimestamp(),
          });
        });

        await Promise.all(questionResultsPromises);

        console.log('Quiz data saved successfully');
      } catch (error) {
        console.error('Error saving quiz result:', error);
        Alert.alert('Error', 'Failed to save quiz results. Please try again.');
      }
    }

    setIsSubmitting(false);
    setShowResults(true);
  };

  const handleGoBack = () => {
    if (showResults) {
      navigation.goBack();
    } else {
      Alert.alert(
        'Exit Quiz?',
        'Your progress will be lost. Are you sure you want to exit?',
        [
          { text: 'Continue Quiz', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const renderQuestion = () => {
    if (showResults) {
      return renderResults();
    }

    if (isSubmitting) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Submitting quiz...</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionContainer}>
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: theme.colors.text }]}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
                <Text style={[styles.answeredText, { color: theme.colors.textSecondary }]}>
                  {answeredCount} answered
                </Text>
              </View>
              <View style={styles.timerContainer}>
                <Feather name="clock" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.timerText, { color: theme.colors.text }]}>{formatTime(timeElapsed)}</Text>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: primaryColor },
                ]}
              />
            </View>
          </View>

          {/* Question Card */}
          <View style={[styles.questionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentQuestion.question}</Text>
            {currentQuestion.sourceNote && (
              <View style={[styles.sourceNoteBadge, { borderTopColor: theme.colors.divider }]}>
                <Feather name="file-text" size={12} color={primaryColor} />
                <Text style={[styles.sourceNoteText, { color: theme.colors.textSecondary }]}>From: {currentQuestion.sourceNote}</Text>
              </View>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.slice(0, 4).map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    isSelected && [styles.optionCardSelected, { borderColor: primaryColor, backgroundColor: primaryColorLight }],
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionIndicator,
                        { backgroundColor: theme.colors.surface },
                        isSelected && [styles.optionIndicatorSelected, { backgroundColor: primaryColor }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLetter,
                          { color: theme.colors.text },
                          isSelected && [styles.optionLetterSelected, { color: theme.colors.white }],
                        ]}
                      >
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        isSelected && [styles.optionTextSelected, { color: theme.colors.text }],
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check-circle" size={20} color={primaryColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Question Navigation Dots */}
          <View style={styles.questionDots}>
            {questions.map((_, index) => {
              const isAnswered = selectedAnswers[questions[index].id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: theme.colors.border },
                    isCurrent && [styles.dotCurrent, { backgroundColor: primaryColor }],
                    isAnswered && [styles.dotAnswered, { backgroundColor: theme.colors.success }],
                  ]}
                  onPress={() => setCurrentQuestionIndex(index)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonSecondary,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                currentQuestionIndex === 0 && styles.navButtonDisabled,
              ]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
              activeOpacity={0.7}
            >
              <Feather 
                name="chevron-left" 
                size={20} 
                color={currentQuestionIndex === 0 ? theme.colors.textSecondary : theme.colors.text} 
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: theme.colors.text },
                  currentQuestionIndex === 0 && { color: theme.colors.textSecondary },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: primaryColor }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <Feather name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderResults = () => {
    const correctAnswers = questions.filter(
      (q) => selectedAnswers[q.id] === q.correctAnswer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000 / 60);

    return (
      <ScrollView 
        style={styles.resultsContainer} 
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <View style={[
            styles.scoreCircle,
            score >= 80 ? styles.scoreCircleGood : 
            score >= 60 ? styles.scoreCircleMedium : 
            styles.scoreCirclePoor
          ]}>
            <AnimatedScore
              value={score}
              suffix="%"
              style={styles.scoreValue}
              duration={2000}
            />
          </View>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <Text style={styles.resultsSubtitle}>
            {correctAnswers} out of {questions.length} correct
          </Text>
          <View style={styles.resultsStats}>
            <View style={styles.statItem}>
              <Feather name="clock" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>{timeSpent} min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="check-circle" size={16} color={theme.colors.success} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>{correctAnswers} correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="x-circle" size={16} color={theme.colors.error} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>{questions.length - correctAnswers} incorrect</Text>
            </View>
          </View>
        </View>

        {/* Results List */}
        <View style={styles.resultsList}>
          <Text style={[styles.resultsListTitle, { color: theme.colors.text }]}>Review Answers</Text>
          {questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[question.id];
            const isCorrect = selectedAnswer === question.correctAnswer;
            const correctAnswerIndex = question.correctAnswer;

            return (
              <View key={question.id} style={[styles.resultCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.resultQuestionHeader}>
                  <View style={[
                    styles.resultIndicator,
                    isCorrect ? styles.resultIndicatorCorrect : styles.resultIndicatorIncorrect
                  ]}>
                    <Feather
                      name={isCorrect ? 'check' : 'x'}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={[styles.resultQuestionNumber, { color: theme.colors.textSecondary }]}>Question {index + 1}</Text>
                </View>
                
                <Text style={[styles.resultQuestionText, { color: theme.colors.text }]}>{question.question}</Text>
                
                <View style={styles.resultAnswerSection}>
                  <View style={styles.answerRow}>
                    <Text style={[styles.resultAnswerLabel, { color: theme.colors.textSecondary }]}>Your answer:</Text>
                    <Text style={[
                      styles.resultAnswerText,
                      { color: theme.colors.text },
                      !isCorrect && styles.resultAnswerTextIncorrect
                    ]}>
                      {selectedAnswer !== undefined && selectedAnswer < 4
                        ? `${String.fromCharCode(65 + selectedAnswer)}. ${question.options[selectedAnswer]}`
                        : 'Not answered'}
                    </Text>
                  </View>
                  
                  {!isCorrect && (
                    <View style={styles.answerRow}>
                      <Text style={[styles.resultAnswerLabel, { color: theme.colors.textSecondary }]}>Correct answer:</Text>
                      <Text style={[styles.resultAnswerText, styles.resultAnswerTextCorrect]}>
                        {correctAnswerIndex < 4 
                          ? `${String.fromCharCode(65 + correctAnswerIndex)}. ${question.options[correctAnswerIndex]}`
                          : `A. ${question.options[0]}`}
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.explanationSection, { borderTopColor: theme.colors.divider }]}>
                    <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>Explanation:</Text>
                    <Text style={[styles.explanationText, { color: theme.colors.text }]}>{question.explanation}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.resultsActions}>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: primaryColor }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{subjectName}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Quick Quiz</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {renderQuestion()}
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  answeredText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.fogGrey,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    lineHeight: 28,
  },
  sourceNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sourceNoteText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIndicatorSelected: {
    // Handled inline
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  optionLetterSelected: {
    color: theme.colors.white,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  questionDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotAnswered: {
    // Handled inline
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  navButtonSecondary: {
    borderWidth: 2,
  },
  navButtonPrimary: {
    // Handled inline
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  navButtonTextSecondary: {
    // Handled inline
  },
  navButtonTextPrimary: {
    color: theme.colors.white,
  },
  navButtonTextDisabled: {
    // Handled inline
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircleGood: {
    backgroundColor: '#ECFDF5',
  },
  scoreCircleMedium: {
    backgroundColor: '#FFFBEB',
  },
  scoreCirclePoor: {
    backgroundColor: '#FEF2F2',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    marginBottom: 16,
  },
  resultsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.divider,
  },
  resultsList: {
    marginBottom: 24,
  },
  resultsListTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  resultCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  resultQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  resultIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIndicatorCorrect: {
    backgroundColor: theme.colors.success,
  },
  resultIndicatorIncorrect: {
    backgroundColor: theme.colors.error,
  },
  resultQuestionNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.semiBold,
  },
  resultQuestionText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 16,
    lineHeight: 24,
  },
  resultAnswerSection: {
    gap: 12,
  },
  answerRow: {
    marginBottom: 8,
  },
  resultAnswerLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultAnswerText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    lineHeight: 22,
  },
  resultAnswerTextIncorrect: {
    color: theme.colors.error,
  },
  resultAnswerTextCorrect: {
    color: theme.colors.success,
  },
  explanationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  resultsActions: {
    marginTop: 8,
  },
  doneButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
});

export default QuizScreen;
