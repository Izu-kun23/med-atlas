export type StudentLevel =
  | '100 Level'
  | '200 Level'
  | '300 Level'
  | '400 Level'
  | '500 Level'
  | 'Final Year'
  | 'Other';

export type ShiftPattern =
  | 'Daily shifts'
  | 'Night calls'
  | '24-hour calls'
  | 'A mix of all'
  | "I'll set it up later";

export type TrackingPreference =
  | 'My shifts'
  | 'Procedures'
  | 'Patient cases'
  | 'Learning goals';

export type LearningFocus =
  | 'Research'
  | 'Complex cases'
  | 'Exam prep'
  | 'Procedure logging'
  | 'Scheduling';

export type StudyPreference = 'Pomodoro' | 'Long sessions' | 'Mixed style' | "I'll decide later";

export interface StudentOnboarding {
  university: string;
  level: StudentLevel;
  semesterStart?: string; // ISO date
  semesterEnd?: string; // ISO date
  coreSubjects: string[];
  preparingForMbExam?: boolean;
  extraNotes?: string;
}

export interface InternOnboarding {
  rotation: string;
  shiftPattern: ShiftPattern;
  trackingPreferences: TrackingPreference[];
}

export interface MedicalWorkerOnboarding {
  specialty: string;
  learningFocus: LearningFocus[];
  trackOnCallHours: boolean;
}

export interface UniversalOnboarding {
  calendarSync: 'Google Calendar' | 'Outlook' | 'Skip for now';
  enableNotifications: boolean;
  studyPreferences: StudyPreference[];
  enableAiQuizzes: boolean;
}

export interface OnboardingResponses {
  role: 'STUDENT' | 'INTERN' | 'WORKER';
  studentDetails?: StudentOnboarding;
  internDetails?: InternOnboarding;
  medicalWorkerDetails?: MedicalWorkerOnboarding;
  universal: UniversalOnboarding;
  createdFromSmartLogic?: {
    mbExamPromptShown?: boolean;
    surgicalCalculatorsPreloaded?: boolean;
    manualCalendarSetupOffered?: boolean;
    weeklyStudyPlanSuggested?: boolean;
    defaultQuizScheduleCreated?: boolean;
  };
}

