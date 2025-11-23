import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import type { OnboardingResponses, StudyPreference } from '../types/onboarding';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

type Role = 'STUDENT' | 'INTERN' | 'WORKER';

type OnboardingScreenProps = {
  credentials: {
    fullName: string;
    email: string;
    password: string;
  };
  onComplete: (responses: OnboardingResponses) => void;
  onBack?: () => void;
};

type Step =
  | 'role'
  | 'student-university'
  | 'student-level'
  | 'student-calendar'
  | 'student-subjects'
  | 'student-extra'
  | 'intern-rotation'
  | 'intern-shift'
  | 'intern-tracking'
  | 'intern-extra'
  | 'worker-specialty'
  | 'worker-learning'
  | 'worker-oncall'
  | 'universal-calendar'
  | 'universal-notifications'
  | 'universal-study'
  | 'universal-ai'
  | 'summary';

const STUDENT_LEVELS = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  'Final Year',
  'Other',
] as const;

const CORE_SUBJECTS = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pathology',
  'Surgery',
  'Medicine',
] as const;

const INTERN_ROTATIONS = [
  'Surgery',
  'Medicine',
  'Pediatrics',
  'Obstetrics & Gynaecology',
  'Community Medicine',
  'Psychiatry',
  'Emergency',
  'Lab / Radiology',
  'Other',
] as const;

const INTERN_SHIFT_PATTERNS = [
  'Daily shifts',
  'Night calls',
  '24-hour calls',
  'A mix of all',
  "I'll set it up later",
] as const;

const INTERN_TRACKING_OPTIONS = [
  'My shifts',
  'Procedures',
  'Patient cases',
  'Learning goals',
] as const;

const WORKER_LEARNING_FOCUS = [
  'Research',
  'Complex cases',
  'Exam prep',
  'Procedure logging',
  'Scheduling',
] as const;

const STUDY_PREFERENCES: StudyPreference[] = ['Pomodoro', 'Long sessions', 'Mixed style', "I'll decide later"];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ credentials, onComplete, onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [studentUniversity, setStudentUniversity] = useState('');
  const [studentLevel, setStudentLevel] = useState<string>('');
  const [semesterStart, setSemesterStart] = useState<Date | null>(null);
  const [semesterEnd, setSemesterEnd] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [coreSubjects, setCoreSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [preparingForMbExam, setPreparingForMbExam] = useState<boolean | null>(null);
  const [studentExtraNotes, setStudentExtraNotes] = useState('');

  const [internRotation, setInternRotation] = useState('');
  const [internShiftPattern, setInternShiftPattern] = useState('');
  const [internTrackingPrefs, setInternTrackingPrefs] = useState<string[]>([]);
  const [shouldPreloadSurgicalTools, setShouldPreloadSurgicalTools] = useState(false);

  const [workerSpecialty, setWorkerSpecialty] = useState('');
  const [workerLearningFocus, setWorkerLearningFocus] = useState<string[]>([]);
  const [workerTrackOnCallHours, setWorkerTrackOnCallHours] = useState<boolean | null>(null);

  const [calendarSyncOption, setCalendarSyncOption] = useState<'Google Calendar' | 'Outlook' | 'Skip for now'>(
    'Skip for now',
  );
  const [enableNotifications, setEnableNotifications] = useState<boolean | null>(null);
  const [studyPreferences, setStudyPreferences] = useState<StudyPreference[]>([]);
  const [enableAiQuizzes, setEnableAiQuizzes] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const steps: Step[] = useMemo(() => {
    const baseSteps: Step[] = ['role'];

    if (role === 'STUDENT') {
      baseSteps.push(
        'student-university',
        'student-level',
        'student-calendar',
        'student-subjects',
        'student-extra',
      );
    } else if (role === 'INTERN') {
      baseSteps.push('intern-rotation', 'intern-shift', 'intern-tracking', 'intern-extra');
    } else if (role === 'WORKER') {
      baseSteps.push('worker-specialty', 'worker-learning', 'worker-oncall');
    }

    baseSteps.push(
      'universal-calendar',
      'universal-notifications',
      'universal-study',
      'universal-ai',
      'summary',
    );

    return baseSteps;
  }, [role]);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStep === 'summary';
  const isFirstStep = currentStepIndex === 0;

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 'role':
        return role !== null;
      case 'student-university':
        return studentUniversity.trim().length > 0;
      case 'student-level':
        return studentLevel.length > 0;
      case 'student-calendar':
        return true;
      case 'student-subjects':
        return coreSubjects.length > 0;
      case 'student-extra':
        return true;
      case 'intern-rotation':
        return internRotation.length > 0;
      case 'intern-shift':
        return internShiftPattern.length > 0;
      case 'intern-tracking':
        return internTrackingPrefs.length > 0;
      case 'intern-extra':
        return true;
      case 'worker-specialty':
        return workerSpecialty.trim().length > 0;
      case 'worker-learning':
        return workerLearningFocus.length > 0;
      case 'worker-oncall':
        return workerTrackOnCallHours !== null;
      case 'universal-calendar':
        return true;
      case 'universal-notifications':
        return enableNotifications !== null;
      case 'universal-study':
        return studyPreferences.length > 0;
      case 'universal-ai':
        return enableAiQuizzes !== null;
      case 'summary':
        return false;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceedToNext()) {
      setStatus({ type: 'error', message: 'Please complete this step before continuing.' });
      return;
    }
    setStatus(null);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setStatus(null);
      setCurrentStepIndex((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const toggleSelection = <T extends string>(
    value: T,
    collection: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) => {
    setter((prev) => (prev.includes(value) ? (prev.filter((item) => item !== value) as T[]) : [...prev, value]));
  };

  const handleStartDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (date) {
      setSemesterStart(date);
    }
  };

  const handleEndDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (date) {
      setSemesterEnd(date);
    }
  };

  const finalizeOnboarding = async () => {
    if (!role) {
      return;
    }

    const responses: OnboardingResponses = {
      role,
      studentDetails:
        role === 'STUDENT'
          ? {
              university: studentUniversity,
              level: studentLevel as any,
              semesterStart: semesterStart?.toISOString(),
              semesterEnd: semesterEnd?.toISOString(),
              coreSubjects,
              preparingForMbExam: preparingForMbExam ?? undefined,
              extraNotes: studentExtraNotes.trim() || undefined,
            }
          : undefined,
      internDetails:
        role === 'INTERN'
          ? {
              rotation: internRotation,
              shiftPattern: internShiftPattern as any,
              trackingPreferences: internTrackingPrefs as any,
            }
          : undefined,
      medicalWorkerDetails:
        role === 'WORKER'
          ? {
              specialty: workerSpecialty,
              learningFocus: workerLearningFocus as any,
              trackOnCallHours: workerTrackOnCallHours ?? false,
            }
          : undefined,
      universal: {
        calendarSync: calendarSyncOption,
        enableNotifications: enableNotifications ?? false,
        studyPreferences,
        enableAiQuizzes: enableAiQuizzes ?? false,
      },
      createdFromSmartLogic: {
        mbExamPromptShown: role === 'STUDENT' && studentLevel === 'Final Year',
        surgicalCalculatorsPreloaded: shouldPreloadSurgicalTools,
        manualCalendarSetupOffered: calendarSyncOption === 'Skip for now',
        weeklyStudyPlanSuggested: role === 'STUDENT' && coreSubjects.length >= 5,
        defaultQuizScheduleCreated: enableAiQuizzes ?? false,
      },
    };

    try {
      setLoading(true);
      setStatus(null);

      const sanitizedResponses: OnboardingResponses = JSON.parse(
        JSON.stringify(responses, (_, value) => (value === undefined ? null : value)),
      );

      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      await updateProfile(userCredential.user, { displayName: credentials.fullName });

      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          fullName: credentials.fullName,
          email: credentials.email,
          role,
          onboardingCompleted: true,
          onboardingResponses: sanitizedResponses,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      Toast.show({
        type: 'success',
        text1: 'Welcome to MedFlow!',
        text2: 'Your account has been successfully created',
        position: 'top',
      });
      setStatus({ type: 'success', message: 'MedFlow is ready for you!' });
      onComplete(sanitizedResponses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to complete onboarding. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Setup failed',
        text2: errorMessage,
        position: 'top',
      });
      if (error instanceof Error) {
        setStatus({ type: 'error', message: error.message });
      } else {
        setStatus({ type: 'error', message: 'Unable to complete onboarding. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'role':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Welcome! What best describes you?</Text>
            <View style={styles.buttonGroup}>
              {(['STUDENT', 'INTERN', 'WORKER'] as Role[]).map((roleOption) => (
                <TouchableOpacity
                  key={roleOption}
                  style={[styles.pillButton, role === roleOption && styles.pillButtonActive]}
                  onPress={() => {
                    setRole(roleOption);
                    setCurrentStepIndex((prev) => (prev === 0 ? 1 : prev + 1));
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillButtonText, role === roleOption && styles.pillButtonTextActive]}>
                    {roleOption === 'WORKER' ? 'Medical Worker / Resident' : roleOption.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'student-university':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Which university do you attend?</Text>
            <TextInput
              value={studentUniversity}
              onChangeText={setStudentUniversity}
              placeholder="e.g. University of Lagos"
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        );

      case 'student-level':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What year are you currently in?</Text>
            <View style={styles.buttonGroup}>
              {STUDENT_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.pillButton, studentLevel === level && styles.pillButtonActive]}
                  onPress={() => {
                    setStudentLevel(level);
                    setPreparingForMbExam(level === 'Final Year' ? null : preparingForMbExam);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillButtonText, studentLevel === level && styles.pillButtonTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {studentLevel === 'Final Year' && (
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Are you preparing for MB exams?</Text>
                <View style={styles.optionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, preparingForMbExam === true && styles.optionButtonActive]}
                    onPress={() => setPreparingForMbExam(true)}
                  >
                    <Text
                      style={[styles.optionButtonText, preparingForMbExam === true && styles.optionButtonTextActive]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, preparingForMbExam === false && styles.optionButtonActive]}
                    onPress={() => setPreparingForMbExam(false)}
                  >
                    <Text
                      style={[styles.optionButtonText, preparingForMbExam === false && styles.optionButtonTextActive]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      case 'student-calendar':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>When does your current semester run?</Text>

            <View style={styles.dateSection}>
              <Text style={styles.helperText}>Semester start date</Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(!showStartPicker)}
                style={styles.datePickerButton}
                activeOpacity={0.85}
              >
                <Feather name="calendar" size={20} color="#6366F1" />
                <Text style={styles.datePickerText}>
                  {semesterStart ? semesterStart.toDateString() : 'Select start date'}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={semesterStart ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerDoneButton}
                      onPress={() => setShowStartPicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.dateSection}>
              <Text style={styles.helperText}>Semester end date</Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(!showEndPicker)}
                style={styles.datePickerButton}
                activeOpacity={0.85}
              >
                <Feather name="calendar" size={20} color="#6366F1" />
                <Text style={styles.datePickerText}>
                  {semesterEnd ? semesterEnd.toDateString() : 'Select end date'}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={semesterEnd ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => setShowEndPicker(false)}>
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        );

      case 'student-subjects':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What subjects are you taking this semester?</Text>
            <View style={styles.buttonGroup}>
              {CORE_SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[styles.pillButton, coreSubjects.includes(subject) && styles.pillButtonActive]}
                  onPress={() => toggleSelection(subject, coreSubjects, setCoreSubjects)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.pillButtonText, coreSubjects.includes(subject) && styles.pillButtonTextActive]}
                  >
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={customSubject}
              onChangeText={setCustomSubject}
              placeholder="Add custom subject"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              onSubmitEditing={() => {
                if (customSubject.trim() && !coreSubjects.includes(customSubject.trim())) {
                  setCoreSubjects([...coreSubjects, customSubject.trim()]);
                  setCustomSubject('');
                }
              }}
            />
          </View>
        );

      case 'student-extra':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Anything else you'd like to track this semester?</Text>
            <Text style={styles.helperText}>You can always adjust this later.</Text>
            <TextInput
              value={studentExtraNotes}
              onChangeText={setStudentExtraNotes}
              placeholder="e.g. Research projects, extracurricular activities, clinical rotations..."
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      case 'intern-rotation':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What rotation are you currently in?</Text>
            <View style={styles.buttonGroup}>
              {INTERN_ROTATIONS.map((rotation) => (
                <TouchableOpacity
                  key={rotation}
                  style={[styles.pillButton, internRotation === rotation && styles.pillButtonActive]}
                  onPress={() => {
                    setInternRotation(rotation);
                    setShouldPreloadSurgicalTools(rotation === 'Surgery');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillButtonText, internRotation === rotation && styles.pillButtonTextActive]}>
                    {rotation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'intern-shift':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What does your work schedule look like?</Text>
            <View style={styles.buttonGroup}>
              {INTERN_SHIFT_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  style={[styles.pillButton, internShiftPattern === pattern && styles.pillButtonActive]}
                  onPress={() => setInternShiftPattern(pattern)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillButtonText, internShiftPattern === pattern && styles.pillButtonTextActive]}>
                    {pattern}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'intern-tracking':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What would you like MedFlow to help you track?</Text>
            <View style={styles.buttonGroup}>
              {INTERN_TRACKING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pillButton, internTrackingPrefs.includes(option) && styles.pillButtonActive]}
                  onPress={() => toggleSelection(option, internTrackingPrefs, setInternTrackingPrefs)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.pillButtonText, internTrackingPrefs.includes(option) && styles.pillButtonTextActive]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'intern-extra':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>You're almost done!</Text>
            <Text style={styles.helperText}>We'll preload the best tools for your rotation.</Text>
          </View>
        );

      case 'worker-specialty':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Which specialty do you work in?</Text>
            <TextInput
              value={workerSpecialty}
              onChangeText={setWorkerSpecialty}
              placeholder="e.g. Cardiology, General Surgery"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>
        );

      case 'worker-learning':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>What are your current learning priorities?</Text>
            <View style={styles.buttonGroup}>
              {WORKER_LEARNING_FOCUS.map((focus) => (
                <TouchableOpacity
                  key={focus}
                  style={[styles.pillButton, workerLearningFocus.includes(focus) && styles.pillButtonActive]}
                  onPress={() => toggleSelection(focus, workerLearningFocus, setWorkerLearningFocus)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.pillButtonText, workerLearningFocus.includes(focus) && styles.pillButtonTextActive]}
                  >
                    {focus}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'worker-oncall':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Would you like to track on-call hours?</Text>
            <View style={styles.optionButtonsRow}>
              <TouchableOpacity
                style={[styles.optionButton, workerTrackOnCallHours === true && styles.optionButtonActive]}
                onPress={() => setWorkerTrackOnCallHours(true)}
              >
                <Text
                  style={[styles.optionButtonText, workerTrackOnCallHours === true && styles.optionButtonTextActive]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, workerTrackOnCallHours === false && styles.optionButtonActive]}
                onPress={() => setWorkerTrackOnCallHours(false)}
              >
                <Text
                  style={[styles.optionButtonText, workerTrackOnCallHours === false && styles.optionButtonTextActive]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'universal-calendar':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Would you like to sync your calendar?</Text>
            <View style={styles.buttonGroup}>
              {(['Google Calendar', 'Outlook', 'Skip for now'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pillButton, calendarSyncOption === option && styles.pillButtonActive]}
                  onPress={() => setCalendarSyncOption(option)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillButtonText, calendarSyncOption === option && styles.pillButtonTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'universal-notifications':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Enable reminders & notifications?</Text>
            <View style={styles.optionButtonsRow}>
              <TouchableOpacity
                style={[styles.optionButton, enableNotifications === true && styles.optionButtonActive]}
                onPress={() => setEnableNotifications(true)}
              >
                <Text
                  style={[styles.optionButtonText, enableNotifications === true && styles.optionButtonTextActive]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, enableNotifications === false && styles.optionButtonActive]}
                onPress={() => setEnableNotifications(false)}
              >
                <Text
                  style={[styles.optionButtonText, enableNotifications === false && styles.optionButtonTextActive]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'universal-study':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>How do you prefer to study?</Text>
            <Text style={styles.helperText}>Select all that apply.</Text>
            <View style={styles.buttonGroup}>
              {STUDY_PREFERENCES.map((preference) => (
                <TouchableOpacity
                  key={preference}
                  style={[styles.pillButton, studyPreferences.includes(preference) && styles.pillButtonActive]}
                  onPress={() => toggleSelection(preference, studyPreferences, setStudyPreferences)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.pillButtonText, studyPreferences.includes(preference) && styles.pillButtonTextActive]}
                  >
                    {preference}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'universal-ai':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>Should MedTrackr's AI automatically generate quizzes from your notes?</Text>
            <View style={styles.optionButtonsRow}>
              <TouchableOpacity
                style={[styles.optionButton, enableAiQuizzes === true && styles.optionButtonActive]}
                onPress={() => setEnableAiQuizzes(true)}
              >
                <Text style={[styles.optionButtonText, enableAiQuizzes === true && styles.optionButtonTextActive]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, enableAiQuizzes === false && styles.optionButtonActive]}
                onPress={() => setEnableAiQuizzes(false)}
              >
                <Text style={[styles.optionButtonText, enableAiQuizzes === false && styles.optionButtonTextActive]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'summary':
        return (
          <View style={styles.section}>
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.helperText}>
              We've customized MedTrackr for your workflow. Ready to build your best study + clinical routine?
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handlePrevious} style={styles.backButton} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressIndicator, { width: `${((currentStepIndex + 1) / steps.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
          {status && (
            <Text
              style={[
                styles.statusText,
                status.type === 'error' ? styles.statusTextError : styles.statusTextSuccess,
              ]}
            >
              {status.message}
            </Text>
          )}
        </ScrollView>

        <View style={styles.navigation}>
          {!isLastStep ? (
            <TouchableOpacity style={styles.primaryNavButton} onPress={handleNext} activeOpacity={0.9}>
              <Text style={styles.primaryNavButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryNavButton, loading && styles.primaryNavButtonDisabled]}
              onPress={finalizeOnboarding}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryNavButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.fogGrey,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  progressIndicator: {
    height: 6,
    backgroundColor: Colors.roseRed,
    borderRadius: 999,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    minHeight: 280,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.darkSlate,
    marginBottom: 24,
    lineHeight: 34,
    fontFamily: Fonts.bold,
  },
  helperText: {
    fontSize: 15,
    color: Colors.coolGrey,
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  pillButton: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
  },
  pillButtonActive: {
    backgroundColor: Colors.roseRed,
  },
  pillButtonText: {
    fontSize: 16,
    color: Colors.darkSlate,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  pillButtonTextActive: {
    color: Colors.white,
  },
  input: {
    marginTop: 8,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    color: Colors.darkSlate,
    backgroundColor: '#F3F4F6',
    fontFamily: Fonts.regular,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 18,
    marginTop: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  datePickerButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#F3F4F6',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.darkSlate,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  datePickerContainer: {
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  datePickerDoneButton: {
    marginTop: 12,
    backgroundColor: Colors.roseRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionRow: {
    marginTop: 28,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkSlate,
    marginBottom: 16,
    fontFamily: Fonts.semiBold,
  },
  optionButtonsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  optionButton: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  optionButtonActive: {
    backgroundColor: Colors.roseRed,
  },
  optionButtonText: {
    fontSize: 17,
    color: Colors.darkSlate,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  navigation: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryNavButton: {
    backgroundColor: Colors.roseRed,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryNavButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  primaryNavButtonDisabled: {
    opacity: 0.6,
  },
  statusText: {
    marginTop: 20,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  statusTextError: {
    color: '#DC2626',
  },
  statusTextSuccess: {
    color: '#059669',
  },
});

export default OnboardingScreen;