import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';

export type Recommendation = {
  id: string;
  text: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'study' | 'quiz' | 'schedule' | 'performance' | 'wellness';
};

type UserData = {
  quizResults: Array<{
    score: number;
    subject: string;
    date: any;
    totalQuestions: number;
  }>;
  notes: Array<{
    subject: string;
    date: any;
  }>;
  schedule: Array<{
    title: string;
    date: any;
    type: string;
  }>;
  subjects: Array<{
    name: string;
    notesCount: number;
    averageScore?: number;
  }>;
  weakTopics?: Array<{
    subject: string;
    topic: string;
    accuracy: number;
  }>;
};

/**
 * Analyzes user data and generates personalized AI recommendations
 */
export const generateAIRecommendations = async (): Promise<Recommendation[]> => {
  const user = auth.currentUser;
  if (!user) {
    return getDefaultRecommendations();
  }

  try {
    const userData = await fetchUserData();
    const recommendations: Recommendation[] = [];

    // Analyze quiz performance
    const quizRecommendations = analyzeQuizPerformance(userData);
    recommendations.push(...quizRecommendations);

    // Analyze study patterns
    const studyRecommendations = analyzeStudyPatterns(userData);
    recommendations.push(...studyRecommendations);

    // Analyze schedule and upcoming events
    const scheduleRecommendations = analyzeSchedule(userData);
    recommendations.push(...scheduleRecommendations);

    // Analyze weak areas
    const weakAreaRecommendations = analyzeWeakAreas(userData);
    recommendations.push(...weakAreaRecommendations);

    // Analyze study consistency
    const consistencyRecommendations = analyzeConsistency(userData);
    recommendations.push(...consistencyRecommendations);

    // Sort by priority and limit to top 5
    const sortedRecommendations = recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);

    // If no recommendations, return defaults
    return sortedRecommendations.length > 0
      ? sortedRecommendations
      : getDefaultRecommendations();
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return getDefaultRecommendations();
  }
};

/**
 * Fetches all relevant user data for analysis
 */
const fetchUserData = async (): Promise<UserData> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [quizResults, notes, schedule, subjects, weakTopics] = await Promise.all([
    fetchQuizResults(user.uid),
    fetchRecentNotes(user.uid),
    fetchUpcomingSchedule(user.uid),
    fetchSubjects(user.uid),
    fetchWeakTopics(user.uid),
  ]);

  return {
    quizResults,
    notes,
    schedule,
    subjects,
    weakTopics,
  };
};

/**
 * Fetches recent quiz results
 */
const fetchQuizResults = async (userId: string) => {
  try {
    const quizResultsQuery = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(quizResultsQuery);
    const results: UserData['quizResults'] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        score: data.score || 0,
        subject: data.subject || 'Unknown',
        date: data.completedAt || data.createdAt,
        totalQuestions: data.totalQuestions || 0,
      });
    });

    return results.sort((a, b) => {
      const dateA = a.date?.toMillis?.() || 0;
      const dateB = b.date?.toMillis?.() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return [];
  }
};

/**
 * Fetches recent notes
 */
const fetchRecentNotes = async (userId: string) => {
  try {
    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(notesQuery);
    const notes: UserData['notes'] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.deleted) {
        notes.push({
          subject: data.subject || 'Unknown',
          date: data.createdAt,
        });
      }
    });

    return notes.sort((a, b) => {
      const dateA = a.date?.toMillis?.() || 0;
      const dateB = b.date?.toMillis?.() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

/**
 * Fetches upcoming schedule events
 */
const fetchUpcomingSchedule = async (userId: string) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eventsQuery = query(
      collection(db, 'calendarEvents'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(eventsQuery);
    const events: UserData['schedule'] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = data.date?.toDate?.() || new Date(data.date);
      
      if (eventDate >= now && eventDate <= sevenDaysFromNow) {
        events.push({
          title: data.title || 'Untitled Event',
          date: data.date,
          type: data.type || 'general',
        });
      }
    });

    return events.sort((a, b) => {
      const dateA = a.date?.toDate?.()?.getTime() || a.date?.toMillis?.() || 0;
      const dateB = b.date?.toDate?.()?.getTime() || b.date?.toMillis?.() || 0;
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
};

/**
 * Fetches user subjects
 */
const fetchSubjects = async (userId: string) => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(subjectsQuery);
    const subjects: UserData['subjects'] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      subjects.push({
        name: data.name || 'Unknown',
        notesCount: data.notesCount || 0,
        averageScore: data.averageScore,
      });
    });

    return subjects;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

/**
 * Fetches weak topics from quiz results
 */
const fetchWeakTopics = async (userId: string) => {
  try {
    // This would ideally come from a pre-computed collection
    // For now, we'll analyze quiz results to find weak areas
    const quizResultsQuery = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(quizResultsQuery);
    
    // Analyze failed questions to identify weak topics
    const topicMap = new Map<string, { attempts: number; correct: number }>();

    for (const docSnap of snapshot.docs) {
      const quizResult = docSnap.data();
      if (quizResult.questions) {
        for (const question of quizResult.questions) {
          const topic = question.topic || question.subject || 'General';
          const key = `${quizResult.subject || 'Unknown'}_${topic}`;
          
          if (!topicMap.has(key)) {
            topicMap.set(key, { attempts: 0, correct: 0 });
          }
          
          const stats = topicMap.get(key)!;
          stats.attempts++;
          if (question.isCorrect) {
            stats.correct++;
          }
        }
      }
    }

    const weakTopics: UserData['weakTopics'] = [];
    topicMap.forEach((stats, key) => {
      const accuracy = stats.attempts > 0 ? (stats.correct / stats.attempts) * 100 : 0;
      if (accuracy < 70 && stats.attempts >= 2) {
        const [subject, topic] = key.split('_');
        weakTopics.push({
          subject,
          topic,
          accuracy: Math.round(accuracy),
        });
      }
    });

    return weakTopics.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  } catch (error) {
    console.error('Error fetching weak topics:', error);
    return [];
  }
};

/**
 * Analyzes quiz performance and generates recommendations
 */
const analyzeQuizPerformance = (data: UserData): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (data.quizResults.length === 0) {
    recommendations.push({
      id: 'quiz-1',
      text: 'Take your first quiz to track your progress',
      action: 'Start Quiz',
      priority: 'high',
      category: 'quiz',
    });
    return recommendations;
  }

  // Check for low recent scores
  const recentQuizzes = data.quizResults.slice(0, 3);
  const lowScores = recentQuizzes.filter((q) => q.score < 60);
  
  if (lowScores.length > 0) {
    const subject = lowScores[0].subject;
    recommendations.push({
      id: 'quiz-2',
      text: `Your recent ${subject} quiz scored below 60%. Review your notes and try again`,
      action: 'Review Notes',
      priority: 'high',
      category: 'performance',
    });
  }

  // Check for declining performance
  if (data.quizResults.length >= 3) {
    const recent = data.quizResults.slice(0, 3);
    const older = data.quizResults.slice(3, 6);
    
    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, q) => sum + q.score, 0) / recent.length;
      const olderAvg = older.reduce((sum, q) => sum + q.score, 0) / older.length;
      
      if (recentAvg < olderAvg - 10) {
        recommendations.push({
          id: 'quiz-3',
          text: 'Your quiz scores have declined recently. Consider reviewing previous topics',
          action: 'Study More',
          priority: 'medium',
          category: 'performance',
        });
      }
    }
  }

  // Check for subjects with no quizzes
  const subjectsWithQuizzes = new Set(data.quizResults.map((q) => q.subject));
  const subjectsWithoutQuizzes = data.subjects.filter(
    (s) => !subjectsWithQuizzes.has(s.name) && s.notesCount > 0
  );

  if (subjectsWithoutQuizzes.length > 0) {
    const subject = subjectsWithoutQuizzes[0];
    recommendations.push({
      id: 'quiz-4',
      text: `You haven't quizzed on ${subject.name} yet. Test your knowledge!`,
      action: 'Start Quiz',
      priority: 'medium',
      category: 'quiz',
    });
  }

  return recommendations;
};

/**
 * Analyzes study patterns and generates recommendations
 */
const analyzeStudyPatterns = (data: UserData): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Check for inactive subjects
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentNoteSubjects = new Set(
    data.notes
      .filter((note) => {
        const noteDate = note.date?.toDate?.() || new Date(note.date);
        return noteDate >= sevenDaysAgo;
      })
      .map((note) => note.subject)
  );

  const inactiveSubjects = data.subjects.filter(
    (s) => !recentNoteSubjects.has(s.name) && s.notesCount > 0
  );

  if (inactiveSubjects.length > 0) {
    const subject = inactiveSubjects[0];
    recommendations.push({
      id: 'study-1',
      text: `You haven't studied ${subject.name} in a while. Time for a review!`,
      action: 'Add Note',
      priority: 'medium',
      category: 'study',
    });
  }

  // Check for subjects with many notes but no recent activity
  const subjectsWithManyNotes = data.subjects.filter((s) => s.notesCount >= 10);
  const untouchedSubjects = subjectsWithManyNotes.filter(
    (s) => !recentNoteSubjects.has(s.name)
  );

  if (untouchedSubjects.length > 0) {
    recommendations.push({
      id: 'study-2',
      text: `Complete ${untouchedSubjects.length} untouched topic${untouchedSubjects.length > 1 ? 's' : ''} this week`,
      action: 'View Subjects',
      priority: 'high',
      category: 'study',
    });
  }

  // Check for low note activity
  const notesLast7Days = data.notes.filter((note) => {
    const noteDate = note.date?.toDate?.() || new Date(note.date);
    return noteDate >= sevenDaysAgo;
  }).length;

  if (notesLast7Days === 0 && data.subjects.length > 0) {
    recommendations.push({
      id: 'study-3',
      text: 'You haven\'t added any notes this week. Start studying to stay on track!',
      action: 'Add Note',
      priority: 'high',
      category: 'study',
    });
  }

  return recommendations;
};

/**
 * Analyzes schedule and generates recommendations
 */
const analyzeSchedule = (data: UserData): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Check for upcoming exams or important events
  const examEvents = data.schedule.filter(
    (e) => e.type === 'exam' || e.title.toLowerCase().includes('exam')
  );

  if (examEvents.length > 0) {
    const nextExam = examEvents[0];
    const examDate = nextExam.date?.toDate?.() || new Date(nextExam.date);
    const daysUntil = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7 && daysUntil > 0) {
      recommendations.push({
        id: 'schedule-1',
        text: `Exam in ${daysUntil} day${daysUntil > 1 ? 's' : ''} - boost your prep`,
        action: 'Quick Quiz',
        priority: 'high',
        category: 'schedule',
      });
    }
  }

  // Check for upcoming classes/lectures
  const upcomingClasses = data.schedule.filter(
    (e) => e.type === 'lecture' || e.type === 'class'
  );

  if (upcomingClasses.length > 0) {
    const nextClass = upcomingClasses[0];
    const classDate = nextClass.date?.toDate?.() || new Date(nextClass.date);
    const hoursUntil = (classDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntil <= 24 && hoursUntil > 0) {
      recommendations.push({
        id: 'schedule-2',
        text: `Review notes before your ${nextClass.title} class`,
        action: 'View Notes',
        priority: 'medium',
        category: 'schedule',
      });
    }
  }

  return recommendations;
};

/**
 * Analyzes weak areas and generates recommendations
 */
const analyzeWeakAreas = (data: UserData): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (data.weakTopics && data.weakTopics.length > 0) {
    const weakestTopic = data.weakTopics[0];
    recommendations.push({
      id: 'weak-1',
      text: `Focus on ${weakestTopic.topic} in ${weakestTopic.subject} (${weakestTopic.accuracy}% accuracy)`,
      action: 'Practice',
      priority: 'high',
      category: 'performance',
    });
  }

  // Check for subjects with low average scores
  const lowPerformingSubjects = data.subjects.filter(
    (s) => s.averageScore !== undefined && s.averageScore < 70
  );

  if (lowPerformingSubjects.length > 0) {
    const subject = lowPerformingSubjects[0];
    recommendations.push({
      id: 'weak-2',
      text: `${subject.name} needs more attention (avg: ${Math.round(subject.averageScore!)}%)`,
      action: 'Study More',
      priority: 'medium',
      category: 'performance',
    });
  }

  return recommendations;
};

/**
 * Analyzes study consistency and generates recommendations
 */
const analyzeConsistency = (data: UserData): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Check for study streaks
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    return date.toDateString();
  });

  const notesByDay = new Map<string, number>();
  data.notes.forEach((note) => {
    const noteDate = note.date?.toDate?.() || new Date(note.date);
    const dayKey = noteDate.toDateString();
    if (last7Days.includes(dayKey)) {
      notesByDay.set(dayKey, (notesByDay.get(dayKey) || 0) + 1);
    }
  });

  const activeDays = notesByDay.size;
  
  if (activeDays >= 5) {
    recommendations.push({
      id: 'consistency-1',
      text: `Great! You've studied ${activeDays} out of 7 days. Keep up the momentum!`,
      action: undefined,
      priority: 'low',
      category: 'wellness',
    });
  } else if (activeDays < 3) {
    recommendations.push({
      id: 'consistency-2',
      text: 'Try to study at least 4 days this week for better retention',
      action: 'Add Note',
      priority: 'medium',
      category: 'study',
    });
  }

  return recommendations;
};

/**
 * Returns default recommendations when no data is available
 */
const getDefaultRecommendations = (): Recommendation[] => {
  return [
    {
      id: 'default-1',
      text: 'Start by adding your first note to begin tracking your studies',
      action: 'Add Note',
      priority: 'high',
      category: 'study',
    },
    {
      id: 'default-2',
      text: 'Take a quiz to test your knowledge and identify areas to improve',
      action: 'Start Quiz',
      priority: 'medium',
      category: 'quiz',
    },
  ];
};

