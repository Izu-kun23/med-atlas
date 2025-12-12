import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
Dimensions,
ActivityIndicator,
Alert,
Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../hooks/useTheme';
import SvgIcon from '../../components/SvgIcon';
import AnimatedScore from '../../components/AnimatedScore';
import AnimatedProgressBar from '../../components/AnimatedProgressBar';
import AnimatedScoreBar from '../../components/AnimatedScoreBar';
import { SkeletonCard, SkeletonScoreBar, SkeletonTopicCard } from '../../components/SkeletonLoader';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { generateQuizFromNotes } from '../../utils/quizGenerator';
import { QuizStackParamList } from '../../navigation/QuizStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Subject = {
id: string;
name: string;
quizCount: number;
averageScore: number;
lastQuizDate?: string;
color: string;
bgColor: string;
selectedColor?: string;
selectedIcon?: string;
notesCount?: number;
};

type QuizHomeNavigationProp = StackNavigationProp<QuizStackParamList, 'QuizHome'>;

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

type Folder = {
id: string;
name: string;
};

const QuizHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<QuizHomeNavigationProp>();
const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);
const [recentQuizzes, setRecentQuizzes] = useState<QuizResult[]>([]);
const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
const [showFolderModal, setShowFolderModal] = useState(false);
const [selectedSubjectForQuiz, setSelectedSubjectForQuiz] = useState<Subject | null>(null);
const [folders, setFolders] = useState<Folder[]>([]);
const [weeks, setWeeks] = useState<string[]>([]);
const [isLoadingFolders, setIsLoadingFolders] = useState(false);
const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [isLoadingWeakTopics, setIsLoadingWeakTopics] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

React.useEffect(() => {
fetchSubjects();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchQuizResults();
      fetchSubjects();
      fetchWeakTopics();
      // Reset animation key to trigger animations
      setAnimationKey(prev => prev + 1);
    }, [])
  );

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
          quizCount: 0,
          averageScore: 0,
          color: data.selectedColor || data.color || theme.colors.primary,
          bgColor: data.bgColor || theme.colors.primaryLight,
          selectedColor: data.selectedColor || data.color || theme.colors.primary,
          selectedIcon: data.selectedIcon || 'folder',
          notesCount: 0,
        });
      });

for (const subject of fetchedSubjects) {
const notesQuery = query(
collection(db, 'notes'),
where('userId', '==', user.uid),
where('subjectId', '==', subject.id)
        );
const notesSnapshot = await getDocs(notesQuery);
let activeNotesCount = 0;
notesSnapshot.forEach((doc) => {
const data = doc.data();
if (!data.isDeleted) {
activeNotesCount++;
          }
        });
subject.notesCount = activeNotesCount;
      }

for (const subject of fetchedSubjects) {
const quizResultsQuery = query(
collection(db, 'quizResults'),
where('userId', '==', user.uid),
where('subjectId', '==', subject.id)
        );
const quizResultsSnapshot = await getDocs(quizResultsQuery);
const quizResults: number[] = [];
quizResultsSnapshot.forEach((doc) => {
const data = doc.data();
if (data.score !== undefined) {
quizResults.push(data.score);
          }
        });

subject.quizCount = quizResults.length;
if (quizResults.length > 0) {
subject.averageScore = Math.round(
quizResults.reduce((sum, score) => sum + score, 0) / quizResults.length
          );
        }
      }

fetchedSubjects.sort((a, b) => a.name.localeCompare(b.name));
setSubjects(fetchedSubjects);
    } catch (error: any) {
console.error('Error fetching subjects:', error);
    } finally {
setIsLoadingSubjects(false);
    }
  };

const fetchQuizResults = async () => {
const user = auth.currentUser;
if (!user) {
setIsLoadingQuizzes(false);
return;
    }

try {
const quizResultsQuery = query(
collection(db, 'quizResults'),
where('userId', '==', user.uid)
      );

const querySnapshot = await getDocs(quizResultsQuery);
const quizzesWithTimestamp: Array<QuizResult & { sortTime: number }> = [];

querySnapshot.forEach((doc) => {
const data = doc.data();
const completedAt = data.completedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
quizzesWithTimestamp.push({
          id: doc.id,
          subject: data.subjectName || 'Unknown',
          score: data.score || 0,
          totalQuestions: data.totalQuestions || 0,
          date: completedAt.toISOString().split('T')[0],
          timeSpent: data.timeSpent || 0,
          sortTime: completedAt.getTime(),
        });
      });

quizzesWithTimestamp.sort((a, b) => b.sortTime - a.sortTime);
const fetchedQuizzes = quizzesWithTimestamp
        .map(({ sortTime, ...quiz }) => quiz)
        .slice(0, 10);

setRecentQuizzes(fetchedQuizzes);
    } catch (error: any) {
console.error('Error fetching quiz results:', error);
setRecentQuizzes([]);
    } finally {
setIsLoadingQuizzes(false);
    }
  };

const fetchWeakTopics = async () => {
const user = auth.currentUser;
if (!user) {
setIsLoadingWeakTopics(false);
return;
    }

setIsLoadingWeakTopics(true);
try {
const quizResultsQuery = query(
collection(db, 'quizResults'),
where('userId', '==', user.uid)
      );
const quizResultsSnapshot = await getDocs(quizResultsQuery);

if (quizResultsSnapshot.empty) {
setWeakTopics([]);
setIsLoadingWeakTopics(false);
return;
      }

const quizResultMap: { [id: string]: { subjectId: string; subjectName: string; quizId: string } } = {};
const quizResultIds: string[] = [];
const quizIds = new Set<string>();

quizResultsSnapshot.forEach((doc) => {
const data = doc.data();
quizResultIds.push(doc.id);
quizResultMap[doc.id] = {
          subjectId: data.subjectId || '',
          subjectName: data.subjectName || 'Unknown',
          quizId: data.quizId || '',
        };
if (data.quizId) {
quizIds.add(data.quizId);
        }
      });

const allQuestionResults: Array<{
quizResultId: string;
questionId: string;
isCorrect: boolean;
      }> = [];

for (let i = 0; i < quizResultIds.length; i += 10) {
const batch = quizResultIds.slice(i, i + 10);
const batchQuery = query(
collection(db, 'questionResults'),
where('quizResultId', 'in', batch)
        );
const batchSnapshot = await getDocs(batchQuery);
batchSnapshot.forEach((doc) => {
const data = doc.data();
allQuestionResults.push({
            quizResultId: doc.data().quizResultId,
            questionId: data.questionId || '',
            isCorrect: data.isCorrect || false,
          });
        });
      }

if (allQuestionResults.length === 0) {
setWeakTopics([]);
setIsLoadingWeakTopics(false);
return;
      }

const questionsMap: { [questionId: string]: { questionText: string } } = {};
const questionIds = new Set(allQuestionResults.map((qr) => qr.questionId).filter(Boolean));

for (const quizId of Array.from(quizIds).slice(0, 20)) {
try {
const questionsQuery = query(
collection(db, 'questions'),
where('quizId', '==', quizId)
          );
const questionsSnapshot = await getDocs(questionsQuery);
questionsSnapshot.forEach((doc) => {
if (questionIds.has(doc.id)) {
questionsMap[doc.id] = {
                questionText: doc.data().questionText || '',
              };
            }
          });
        } catch (error) {
console.error('Error fetching questions for quiz:', error);
        }
      }

const topicStats: {
        [key: string]: {
attempts: number;
incorrect: number;
subjectId: string;
subjectName: string;
        };
      } = {};

allQuestionResults.forEach((qr) => {
const quizResult = quizResultMap[qr.quizResultId];
if (!quizResult) return;

const question = questionsMap[qr.questionId];
const questionText = question?.questionText || '';
const topic = extractTopicFromQuestion(questionText, quizResult.subjectName);
const key = `${quizResult.subjectId}-${topic}`;

if (!topicStats[key]) {
topicStats[key] = {
            attempts: 0,
            incorrect: 0,
            subjectId: quizResult.subjectId,
            subjectName: quizResult.subjectName,
          };
        }

topicStats[key].attempts++;
if (!qr.isCorrect) {
topicStats[key].incorrect++;
        }
      });

const weakTopicsList: WeakTopic[] = Object.entries(topicStats)
        .map(([key, stats]) => {
const accuracy =
stats.attempts > 0
? Math.round(((stats.attempts - stats.incorrect) / stats.attempts) * 100)
: 100;
const topic = key.split('-').slice(1).join('-');
return {
            id: key,
            subject: stats.subjectName,
            topic: topic || 'General',
            attempts: stats.attempts,
            accuracy: accuracy,
          };
        })
        .filter((topic) => topic.attempts >= 2 && topic.accuracy < 70)
        .sort((a, b) => {
if (a.accuracy !== b.accuracy) {
return a.accuracy - b.accuracy;
          }
return b.attempts - a.attempts;
        })
        .slice(0, 5);

setWeakTopics(weakTopicsList);
    } catch (error: any) {
console.error('Error fetching weak topics:', error);
setWeakTopics([]);
    } finally {
setIsLoadingWeakTopics(false);
    }
  };

const extractTopicFromQuestion = (questionText: string, subjectName: string): string => {
if (!questionText || questionText.trim().length === 0) {
return 'General';
    }

const whatIsMatch = questionText.match(/What is (.+?)\?/i);
if (whatIsMatch && whatIsMatch[1]) {
const topic = whatIsMatch[1].trim();
return topic.length > 40 ? topic.substring(0, 40) + '...' : topic;
    }

const fillBlankMatch = questionText.match(/Fill in the blank: (.+?)(?:\.|$)/i);
if (fillBlankMatch && fillBlankMatch[1]) {
const capitalizedTerms = fillBlankMatch[1].match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
if (capitalizedTerms && capitalizedTerms.length > 0) {
return capitalizedTerms[0];
      }
    }

const capitalizedTerms = questionText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
if (capitalizedTerms && capitalizedTerms.length > 0) {
return capitalizedTerms[0];
    }

const words = questionText.split(' ').slice(0, 4).join(' ');
return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

const totalQuizzes = subjects.reduce((sum, s) => sum + s.quizCount, 0);
const totalScoreSum = subjects.reduce((sum, s) => sum + s.averageScore * s.quizCount, 0);
const overallAverage = totalQuizzes > 0 
? Math.round(totalScoreSum / totalQuizzes)
: recentQuizzes.length > 0
? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
: 0;

const handleSubjectSelect = (subjectId: string) => {
setSelectedSubject(subjectId);
console.log('Select subject:', subjectId);
  };

const fetchFoldersAndWeeks = async (subjectId: string) => {
const user = auth.currentUser;
if (!user) {
return;
    }

setIsLoadingFolders(true);
try {
const foldersQuery = query(
collection(db, 'folders'),
where('userId', '==', user.uid),
where('subjectId', '==', subjectId)
      );
const foldersSnapshot = await getDocs(foldersQuery);
const fetchedFolders: Folder[] = [];
foldersSnapshot.forEach((doc) => {
const data = doc.data();
fetchedFolders.push({
          id: doc.id,
          name: data.name || 'Unnamed Folder',
        });
      });
setFolders(fetchedFolders);

const notesQuery = query(
collection(db, 'notes'),
where('userId', '==', user.uid),
where('subjectId', '==', subjectId)
      );
const notesSnapshot = await getDocs(notesQuery);
const uniqueWeeks = new Set<string>();
notesSnapshot.forEach((doc) => {
const data = doc.data();
if (data.isDeleted) {
return;
        }
const week = data.week;
if (week) {
uniqueWeeks.add(week);
        }
      });

const sortedWeeks = Array.from(uniqueWeeks).sort((a, b) => {
if (a === 'No Week') return 1;
if (b === 'No Week') return -1;
const numA = parseInt(a.replace('Week ', ''));
const numB = parseInt(b.replace('Week ', ''));
return numA - numB;
      });
setWeeks(sortedWeeks);
    } catch (error: any) {
console.error('Error fetching folders and weeks:', error);
    } finally {
setIsLoadingFolders(false);
    }
  };

const handleQuickQuiz = async (subject: Subject) => {
if (!subject.notesCount || subject.notesCount === 0) {
Alert.alert(
'No Notes Available',
`You don't have any notes for ${subject.name} yet. Add some notes first to generate a quiz.`,
        [{ text: 'OK' }]
      );
return;
    }

setSelectedSubjectForQuiz(subject);
setSelectedFolderId(null);
setSelectedWeek(null);
await fetchFoldersAndWeeks(subject.id);
setShowFolderModal(true);
  };

const handleStartQuiz = async () => {
if (!selectedSubjectForQuiz) {
console.log('No subject selected');
return;
    }

console.log('Starting quiz generation:', {
      subjectId: selectedSubjectForQuiz.id,
      folderId: selectedFolderId,
      week: selectedWeek,
    });

setShowFolderModal(false);
setGeneratingQuiz(selectedSubjectForQuiz.id);

try {
const user = auth.currentUser;
if (!user) {
Alert.alert('Error', 'You must be logged in to generate a quiz.');
setGeneratingQuiz(null);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
return;
      }

const notesQuery = query(
collection(db, 'notes'),
where('userId', '==', user.uid),
where('subjectId', '==', selectedSubjectForQuiz.id)
      );
const notesSnapshot = await getDocs(notesQuery);
console.log('Total notes fetched:', notesSnapshot.size);

const notes: Array<{ title: string; content: string }> = [];
notesSnapshot.forEach((doc) => {
const data = doc.data();
if (data.isDeleted) {
return;
        }

if (selectedFolderId !== null) {
if (data.folderId !== selectedFolderId) {
return;
          }
        }

if (selectedWeek !== null) {
const noteWeek = data.week || 'No Week';
if (noteWeek !== selectedWeek) {
return;
          }
        }

if (data.title && data.content && data.content.trim().length > 0) {
notes.push({
            title: data.title,
            content: data.content,
          });
        }
      });

console.log('Filtered notes after folder/week filter:', notes.length);

if (notes.length === 0) {
const folderName = selectedFolderId === null ? 'All Notes' : folders.find(f => f.id === selectedFolderId)?.name || 'this folder';
const weekName = selectedWeek === null ? 'All Weeks' : selectedWeek;
const totalNotesFetched = notesSnapshot.size;

Alert.alert(
'No Notes Available',
`No valid notes found in ${folderName} for ${weekName} in ${selectedSubjectForQuiz.name}.\n\n` +
`Total notes in subject: ${totalNotesFetched}\n` +
`Please ensure your notes have both title and content (at least 20 characters).`,
          [{ text: 'OK' }]
        );
setGeneratingQuiz(null);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
return;
      }

console.log('Generating quiz from', notes.length, 'notes');
const questions = generateQuizFromNotes(notes);
console.log('Generated', questions.length, 'questions');

if (questions.length === 0) {
Alert.alert(
'Unable to Generate Quiz',
'Could not generate questions from your notes. Make sure your notes contain enough content (at least 20 characters per note).',
          [{ text: 'OK' }]
        );
setGeneratingQuiz(null);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
return;
      }

console.log('Navigating to quiz screen with', questions.length, 'questions');
navigation.navigate('QuizScreen', {
        subjectId: selectedSubjectForQuiz.id,
        subjectName: selectedSubjectForQuiz.name,
        subjectColor: selectedSubjectForQuiz.selectedColor || selectedSubjectForQuiz.color,
        questions,
      });

setGeneratingQuiz(null);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
    } catch (error: any) {
console.error('Error generating quiz:', error);
Alert.alert('Error', 'Failed to generate quiz. Please try again.');
setGeneratingQuiz(null);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
    }
  };

const renderScoreHistory = () => {
const scores = recentQuizzes.slice(0, 5).map((q) => q.score);
if (scores.length === 0) {
return (
<View style={styles.scoreHistoryContainer}>
<View style={styles.emptyScoreHistory}>
            <Feather name="bar-chart-2" size={32} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyScoreHistoryText, { color: theme.colors.text }]}>No quiz data yet</Text>
            <Text style={[styles.emptyScoreHistorySubtext, { color: theme.colors.textSecondary }]}>Complete quizzes to see your score trend</Text>
</View>
</View>
      );
    }

    return (
      <View style={styles.scoreHistoryContainer}>
        <View style={styles.scoreBars}>
          {scores.map((score, index) => (
            <View key={`${index}-${animationKey}`} style={styles.scoreBarWrapper}>
              <View style={[styles.scoreBarContainer, { backgroundColor: theme.colors.surface }]}>
                <AnimatedScoreBar
                  score={score}
                  color={
                    score >= 80 ? theme.colors.success : score >= 60 ? theme.colors.warning : theme.colors.error
                  }
                  duration={1500}
                  delay={index * 100} // Stagger animation
                />
              </View>
              <AnimatedScore
                key={`score-label-${index}-${animationKey}`}
                value={score}
                suffix="%"
                style={[styles.scoreBarLabel, { color: theme.colors.textSecondary }]}
                duration={1500}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
<View style={styles.headerSection}>
<View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Quizzes</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            <Text style={[styles.highlight, { color: theme.colors.text }]}>{totalQuizzes}</Text> quizzes • <Text style={[styles.highlight, { color: theme.colors.text }]}>{overallAverage}%</Text> average
            </Text>
</View>
</View>

<ScrollView
style={styles.scrollView}
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
>
<View style={styles.challengeBanner}>
<View style={styles.challengeContent}>
<Text style={styles.challengeTitle}>Become Exam Ready</Text>
<Text style={styles.challengeSubtitle}>Revise and practice for your exams</Text>
<TouchableOpacity style={styles.challengeButton} activeOpacity={0.8}>
<Text style={styles.challengeButtonText}>Start Now</Text>
</TouchableOpacity>
</View>
<View style={styles.challengeIllustration}>
            <Feather name="users" size={100} color={theme.colors.primary} />
</View>
</View>

<View style={styles.exploreSection}>
<View style={styles.exploreSectionHeader}>
            <Text style={[styles.exploreSectionTitle, { color: theme.colors.text }]}>Explore Quizzes</Text>
            <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>VIEW ALL</Text>
            </TouchableOpacity>
</View>

          {isLoadingSubjects ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quizzesScrollContainer}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.quizCardWrapper}>
                  <SkeletonCard />
                </View>
              ))}
            </ScrollView>
          ) : subjects.length > 0 ? (
<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
contentContainerStyle={styles.quizzesScrollContainer}
snapToInterval={SCREEN_WIDTH - 20}
decelerationRate="fast"
snapToAlignment="center"
>
              {subjects.map((subject) => (
<View key={subject.id} style={styles.quizCardWrapper}>
<TouchableOpacity
style={[styles.premiumQuizCard, { backgroundColor: theme.colors.card }]}
onPress={() => handleSubjectSelect(subject.id)}
activeOpacity={0.9}
>
                    {/* Top Colored Section */}
<View style={[
styles.decorativeGradient,
                      { backgroundColor: subject.bgColor }
                    ]}>
                      {/* Decorative circles */}
<View style={styles.decorativeCircle1} />
<View style={styles.decorativeCircle2} />
</View>
                    
                    {/* Top Section Content */}
<View style={styles.topSection}>
<View style={styles.iconContainer}>
<Feather 
name={(subject.selectedIcon || 'folder') as any}
size={36}
color={subject.selectedColor || subject.color}
/>
</View>
                      
                    {subject.quizCount > 0 && (
            <View style={styles.completionBadge}>
            <View style={[styles.pulseDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.completionText, { color: theme.colors.success }]}>{subject.quizCount}</Text>
            </View>
                      )}
            </View>

                    {/* White Content Section */}
                    <View style={[styles.whiteContentSection, { backgroundColor: theme.colors.card }]}>
                      {/* Subject Name and Start Quiz Button Row */}
                      <View style={styles.subjectNameRow}>
                        <Text style={[styles.subjectName, { color: theme.colors.text }]} numberOfLines={2}>
                          {subject.name}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.startQuizBtnCompact,
                            { backgroundColor: subject.selectedColor || subject.color },
                            (!subject.notesCount || subject.notesCount === 0 || generatingQuiz === subject.id) && styles.startQuizBtnDisabled
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleQuickQuiz(subject);
                          }}
                          disabled={generatingQuiz === subject.id || !subject.notesCount || subject.notesCount === 0}
                          activeOpacity={0.85}
                        >
                          {generatingQuiz === subject.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <SvgIcon name="play" size={16} color="#FFFFFF" />
                              <Text style={styles.startQuizBtnTextCompact}>
                                {(!subject.notesCount || subject.notesCount === 0) ? 'No Notes' : 'Start'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                      
                      {/* Stats Row */}
<View style={styles.statsContainer}>
<View style={[styles.statBadge, { backgroundColor: theme.colors.surface }]}>
                    <Feather name="file-text" size={12} color={theme.colors.textSecondary} />
                    <Text style={[styles.statBadgeText, { color: theme.colors.textSecondary }]}>
                            {subject.notesCount || 0} {subject.notesCount === 1 ? 'note' : 'notes'}
                    </Text>
                    </View>
                        {subject.averageScore > 0 && (
                          <View style={[styles.statBadge, styles.scoreBadge, { backgroundColor: theme.colors.success + '20' }]}>
                            <Feather name="trending-up" size={12} color={theme.colors.success} />
                            <AnimatedScore
                              key={`score-badge-${subject.id}-${animationKey}`}
                              value={subject.averageScore}
                              suffix="%"
                              style={[styles.statBadgeText, { color: theme.colors.success }]}
                            />
                          </View>
                        )}
</View>
                      
                      {/* Divider */}
<View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                      
                      {/* Quiz Action Section */}
<View style={styles.quizActionSection}>
<View style={styles.quizInfoRow}>
<View style={[
styles.quizIconCircle,
                            { backgroundColor: (subject.selectedColor || subject.color) + '15' }
                          ]}>
<Feather 
name="zap" 
size={20} 
color={subject.selectedColor || subject.color} 
/>
</View>
<View style={styles.quizInfoText}>
                    <Text style={[styles.quizActionTitle, { color: theme.colors.text }]}>Quick Quiz</Text>
                    <Text style={[styles.quizActionSubtitle, { color: theme.colors.textSecondary }]}>AI-generated questions</Text>
                    </View>
                    </View>
                        
                    <Text style={[styles.quizDescription, { color: theme.colors.textSecondary }]}>
                          Test your knowledge with personalized questions from your notes
                    </Text>
                        
                        {/* Performance Stats */}
                    <View style={styles.performanceRow}>
                    <View style={styles.perfStat}>
                    <Text style={[styles.perfValue, { color: theme.colors.text }]}>{subject.quizCount || 0}</Text>
                    <Text style={[styles.perfLabel, { color: theme.colors.textSecondary }]}>Quizzes</Text>
                    </View>
                    <View style={styles.perfDivider} />
                            <View style={styles.perfStat}>
                              <AnimatedScore
                                key={`perf-${subject.id}-${animationKey}`}
                                value={subject.averageScore || 0}
                                suffix="%"
                                style={[styles.perfValue, { color: theme.colors.text }]}
                              />
                              <Text style={[styles.perfLabel, { color: theme.colors.textSecondary }]}>Average</Text>
                            </View>
                    </View>
                        
                        {/* Progress Bar */}
                        {subject.averageScore > 0 && (
                    <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Performance</Text>
                              <AnimatedScore
                                key={`progress-${subject.id}-${animationKey}`}
                                value={subject.averageScore}
                                suffix="%"
                                style={[
                                  styles.progressValue,
                                  { color: subject.selectedColor || subject.color }
                                ]}
                              />
                            </View>
                            <AnimatedProgressBar
                              key={`progress-bar-${subject.id}-${animationKey}`}
                              progress={subject.averageScore}
                              color={subject.selectedColor || subject.color}
                              height={8}
                              duration={1500}
                            />
</View>
                        )}
</View>
</View>
</TouchableOpacity>
</View>
              ))}
</ScrollView>
          ) : (
            <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No subjects found</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Add subjects and notes to start generating quizzes
            </Text>
            </View>
          )}
</View>

<View style={styles.section}>
<View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Score Trend</Text>
            <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Details</Text>
            </TouchableOpacity>
            </View>
            <View style={[styles.scoreHistoryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {renderScoreHistory()}
<View style={styles.scoreHistoryStats}>
<View style={styles.scoreStatItem}>
                            <AnimatedScore
                              key={`overall-avg-${animationKey}`}
                              value={overallAverage}
                              suffix="%"
                              style={styles.scoreStatValue}
                            />
                            <Text style={[styles.scoreStatLabel, { color: theme.colors.textSecondary }]}>Average</Text>
            </View>
            <View style={[styles.scoreStatDivider, { backgroundColor: theme.colors.divider }]} />
            <View style={styles.scoreStatItem}>
            <Text style={[styles.scoreStatValue, { color: theme.colors.text }]}>{totalQuizzes}</Text>
            <Text style={[styles.scoreStatLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.scoreStatDivider, { backgroundColor: theme.colors.divider }]} />
                            <View style={styles.scoreStatItem}>
                              <AnimatedScore
                                key={`best-score-${animationKey}`}
                                value={recentQuizzes.length > 0 ? Math.max(...recentQuizzes.map((q) => q.score)) : 0}
                                suffix="%"
                                style={[styles.scoreStatValue, { color: theme.colors.text }]}
                              />
                              <Text style={[styles.scoreStatLabel, { color: theme.colors.textSecondary }]}>Best</Text>
                            </View>
</View>
</View>
</View>

<View style={styles.section}>
<View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Focus Areas</Text>
            <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>All</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.weakTopicsList}>
            {isLoadingWeakTopics ? (
              <View style={styles.weakTopicsList}>
                {[1, 2, 3].map((i) => (
                  <SkeletonTopicCard key={i} />
                ))}
              </View>
            ) : weakTopics.length === 0 ? (
            <View style={styles.emptyState}>
            <Feather name="target" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No focus areas identified</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Complete more quizzes to identify areas that need improvement
            </Text>
            </View>
            ) : (
            weakTopics.map((topic) => (
            <TouchableOpacity
            key={topic.id}
            style={[styles.weakTopicCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            activeOpacity={0.75}
            >
            <View style={styles.weakTopicTop}>
            <View style={styles.weakTopicLeftContent}>
            <Text style={[styles.weakTopicSubject, { color: theme.colors.textSecondary }]}>{topic.subject}</Text>
            <Text style={[styles.weakTopicName, { color: theme.colors.text }]}>{topic.topic}</Text>
            </View>
            <View style={[styles.accuracyBadge, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.accuracyValue, { color: theme.colors.error }]}>{topic.accuracy}%</Text>
            </View>
            </View>
            <View style={styles.weakTopicBottom}>
            <View style={[styles.attemptsBadge, { backgroundColor: theme.colors.surface }]}>
                    <Feather name="repeat" size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.attemptsText, { color: theme.colors.textSecondary }]}>{topic.attempts} attempts</Text>
            </View>
            <TouchableOpacity style={[styles.practiceButton, { backgroundColor: theme.colors.primaryLight }]} activeOpacity={0.8}>
                    <Feather name="play-circle" size={14} color={theme.colors.primary} />
            <Text style={[styles.practiceButtonText, { color: theme.colors.primary }]}>Practice</Text>
            </TouchableOpacity>
            </View>
            </TouchableOpacity>
              ))
            )}
</View>
</View>

<View style={styles.section}>
<View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>History</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.recentQuizzesList}>
            {isLoadingQuizzes ? (
              <View style={styles.scoreHistoryContainer}>
                <View style={styles.scoreBars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonScoreBar key={i} />
                  ))}
                </View>
              </View>
            ) : recentQuizzes.length === 0 ? (
<View style={styles.emptyState}>
<Feather name="clipboard" size={48} color={theme.colors.textTertiary} />
<Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No quizzes yet</Text>
<Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Complete your first quiz to see it here
</Text>
</View>
            ) : (
recentQuizzes.map((quiz) => (
<TouchableOpacity
            key={quiz.id}
            style={[styles.recentQuizCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            activeOpacity={0.75}
            >
<View style={styles.recentQuizLeft}>
<View style={styles.recentQuizInfo}>
<Text style={[styles.recentQuizSubject, { color: theme.colors.text }]}>{quiz.subject}</Text>
<View style={styles.quizMetaRow}>
<View style={styles.metaItem}>
                    <Feather name="help-circle" size={12} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{quiz.totalQuestions} Q</Text>
                    </View>
                    <View style={[styles.metaDot, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.metaItem}>
                    <Feather name="clock" size={12} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{quiz.timeSpent}m</Text>
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
? theme.colors.success
: quiz.score >= 60
? theme.colors.warning
: theme.colors.error,
                        },
                      ]}
>
                      {quiz.score}%
</Text>
</View>
</TouchableOpacity>
              ))
            )}
</View>
</View>
</ScrollView>

<Modal
visible={showFolderModal}
transparent={true}
animationType="slide"
onRequestClose={() => {
setShowFolderModal(false);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
        }}
>
<View style={styles.modalOverlay}>
<View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
<View style={[styles.modalHeader, { borderBottomColor: theme.colors.divider }]}>
<Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Quiz Options</Text>
<TouchableOpacity
onPress={() => {
setShowFolderModal(false);
setSelectedSubjectForQuiz(null);
setSelectedFolderId(null);
setSelectedWeek(null);
                }}
style={styles.modalCloseButton}
>
            <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Choose folder and week for {selectedSubjectForQuiz?.name}
            </Text>
            {isLoadingFolders ? (
            <View style={styles.modalLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.modalLoadingText, { color: theme.colors.textSecondary }]}>Loading options...</Text>
</View>
            ) : (
<ScrollView style={styles.modalFolderList} showsVerticalScrollIndicator={false}>
<View style={styles.selectionSection}>
            <Text style={[styles.selectionSectionTitle, { color: theme.colors.text }]}>Select Folder</Text>
            <TouchableOpacity
            style={[
            styles.folderOption,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedFolderId === null && [styles.folderOptionSelected, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]
                    ]}
            onPress={() => setSelectedFolderId(null)}
            activeOpacity={0.7}
            >
            <View style={[
            styles.folderOptionIcon,
            { backgroundColor: theme.colors.surface },
            selectedFolderId === null && [styles.folderOptionIconSelected, { backgroundColor: theme.colors.primary }]
                    ]}>
            <Feather name="folder" size={24} color={selectedFolderId === null ? theme.colors.white : theme.colors.primary} />
            </View>
            <View style={styles.folderOptionContent}>
            <Text style={[styles.folderOptionName, { color: theme.colors.text }]}>All Notes</Text>
            <Text style={[styles.folderOptionDescription, { color: theme.colors.textSecondary }]}>Quiz from all notes in this subject</Text>
            </View>
                    {selectedFolderId === null && (
            <Feather name="check-circle" size={20} color={theme.colors.primary} />
                    )}
</TouchableOpacity>
                  {folders.map((folder) => (
<TouchableOpacity
key={folder.id}
style={[
styles.folderOption,
{ backgroundColor: theme.colors.card, borderColor: theme.colors.border },
selectedFolderId === folder.id && [styles.folderOptionSelected, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]
                      ]}
onPress={() => setSelectedFolderId(folder.id)}
activeOpacity={0.7}
>
<View style={[
styles.folderOptionIcon,
{ backgroundColor: theme.colors.surface },
selectedFolderId === folder.id && [styles.folderOptionIconSelected, { backgroundColor: theme.colors.primary }]
                      ]}>
            <Feather 
            name="folder" 
            size={24} 
            color={selectedFolderId === folder.id 
            ? theme.colors.white 
            : (selectedSubjectForQuiz?.selectedColor || selectedSubjectForQuiz?.color || theme.colors.primary)} 
            />
            </View>
            <View style={styles.folderOptionContent}>
            <Text style={[styles.folderOptionName, { color: theme.colors.text }]}>{folder.name}</Text>
            <Text style={[styles.folderOptionDescription, { color: theme.colors.textSecondary }]}>Quiz from notes in this folder</Text>
            </View>
                      {selectedFolderId === folder.id && (
            <Feather name="check-circle" size={20} color={theme.colors.primary} />
                      )}
</TouchableOpacity>
                  ))}
</View>

<View style={styles.selectionSection}>
            <Text style={[styles.selectionSectionTitle, { color: theme.colors.text }]}>Select Week</Text>
            <TouchableOpacity
            style={[
            styles.folderOption,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedWeek === null && [styles.folderOptionSelected, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]
                    ]}
            onPress={() => setSelectedWeek(null)}
            activeOpacity={0.7}
            >
            <View style={[
            styles.folderOptionIcon,
            { backgroundColor: theme.colors.surface },
            selectedWeek === null && [styles.folderOptionIconSelected, { backgroundColor: theme.colors.primary }]
                    ]}>
            <Feather name="calendar" size={24} color={selectedWeek === null ? theme.colors.white : theme.colors.primary} />
            </View>
            <View style={styles.folderOptionContent}>
            <Text style={[styles.folderOptionName, { color: theme.colors.text }]}>All Weeks</Text>
            <Text style={[styles.folderOptionDescription, { color: theme.colors.textSecondary }]}>Quiz from all weeks</Text>
            </View>
                    {selectedWeek === null && (
            <Feather name="check-circle" size={20} color={theme.colors.primary} />
                    )}
</TouchableOpacity>
                  {weeks.map((week) => (
<TouchableOpacity
key={week}
style={[
styles.folderOption,
{ backgroundColor: theme.colors.card, borderColor: theme.colors.border },
selectedWeek === week && [styles.folderOptionSelected, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]
                      ]}
onPress={() => setSelectedWeek(week)}
activeOpacity={0.7}
>
<View style={[
styles.folderOptionIcon,
{ backgroundColor: theme.colors.surface },
selectedWeek === week && [styles.folderOptionIconSelected, { backgroundColor: theme.colors.primary }]
                      ]}>
            <Feather 
            name="calendar" 
            size={24} 
            color={selectedWeek === week 
            ? theme.colors.white 
            : (selectedSubjectForQuiz?.selectedColor || selectedSubjectForQuiz?.color || theme.colors.primary)} 
            />
            </View>
            <View style={styles.folderOptionContent}>
            <Text style={[styles.folderOptionName, { color: theme.colors.text }]}>{week}</Text>
            <Text style={[styles.folderOptionDescription, { color: theme.colors.textSecondary }]}>Quiz from notes in this week</Text>
            </View>
                      {selectedWeek === week && (
            <Feather name="check-circle" size={20} color={theme.colors.primary} />
                      )}
</TouchableOpacity>
                  ))}
                  {weeks.length === 0 && (
<View style={styles.modalEmptyState}>
<Feather name="calendar" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.modalEmptyText, { color: theme.colors.text }]}>No weeks found</Text>
            <Text style={[styles.modalEmptySubtext, { color: theme.colors.textSecondary }]}>
                        Select "All Weeks" to quiz from all notes
            </Text>
</View>
                  )}
</View>

<TouchableOpacity
            style={[styles.startQuizButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleStartQuiz}
            activeOpacity={0.8}
            >
            <Text style={styles.startQuizButtonText}>Start Quiz</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
</ScrollView>
            )}
</View>
</View>
</Modal>
</SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  highlight: {
    fontWeight: '800',
  },
  challengeBanner: {
    flexDirection: 'row',
    backgroundColor: '#2D2E4F',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 180,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  challengeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Fonts.regular,
    marginBottom: 18,
  },
  challengeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignSelf: 'flex-start',
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2E4F',
    fontFamily: Fonts.bold,
  },
  challengeIllustration: {
    marginLeft: 20,
    opacity: 0.3,
  },
  exploreSection: {
    marginBottom: 32,
  },
  exploreSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  exploreSectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  quizzesScrollContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  quizCardWrapper: {
    width: SCREEN_WIDTH - 40,
  },
  // Enhanced Premium Quiz Card Styles
  premiumQuizCard: {
    width: '100%',
    height: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  decorativeGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 160,
    opacity: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -40,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 20,
    left: -20,
  },
  leftAccent: {
    display: 'none',
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  topSection: {
    height: 160,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    position: 'absolute',
    top: 24,
    right: 24,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  whiteContentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: 24,
    paddingTop: 28,
  },
  subjectNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  subjectName: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.bold,
    lineHeight: 30,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  scoreBadge: {
    // Handled inline
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  quizActionSection: {
    gap: 16,
  },
  quizInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quizIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizInfoText: {
    flex: 1,
  },
  quizActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 3,
  },
  quizActionSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  quizDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    gap: 24,
  },
  perfStat: {
    flex: 1,
    alignItems: 'center',
  },
  perfValue: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  perfLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  perfDivider: {
    width: 1,
    height: 40,
  },
  startQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 10,
    marginTop: 8,
    minHeight: 56,
  },
  startQuizBtnDisabled: {
    opacity: 0.5,
  },
  startQuizBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  startQuizBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
    minHeight: 40,
  },
  startQuizBtnTextCompact: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  progressSection: {
    marginTop: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  scoreHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    fontFamily: Fonts.bold,
  },
  emptyScoreHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyScoreHistoryText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyScoreHistorySubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
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
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  scoreStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  scoreStatDivider: {
    width: 1,
    height: 44,
  },
  weakTopicsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  weakTopicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weakTopicName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  accuracyBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: '900',
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
    fontFamily: Fonts.semiBold,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  practiceButtonText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  recentQuizzesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  recentQuizCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
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
    fontFamily: Fonts.semiBold,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.bold,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  modalFolderList: {
    paddingHorizontal: 20,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  folderOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  folderOptionContent: {
    flex: 1,
  },
  folderOptionName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  folderOptionDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  modalEmptyText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  modalEmptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  selectionSection: {
    marginBottom: 32,
  },
  selectionSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  folderOptionSelected: {
    // Handled inline
  },
  folderOptionIconSelected: {
    // Handled inline
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    marginBottom: 20,
    gap: 8,
  },
  startQuizButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
});

export default QuizHomeScreen;