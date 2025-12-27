
export type Language = 'en' | 'hi';

export enum Phase {
  Login = 'Login',
  Intro = 'Intro',
  Engagement = 'Engagement',
  Behavioral = 'Behavioral',
  SJT = 'SJT',
  ScoringMapping = 'ScoringMapping', // Phase 4
  Growth = 'Growth',
  Institutionalization = 'Institutionalization', // Phase 5
  Feedback = 'Feedback', // Added Feedback Phase
  Results = 'Results',
  Admin = 'Admin'
}

export interface LoginInfo {
  employeeName: string;
  pNo: string;
  department: string;
  designation: string;
  role: string;
  phoneNumber: string;
  location: string;
  timestamp: string;
}

export interface Question {
  id: string;
  textEn: string;
  textHi: string;
  dimension: string;
  purpose: string;
  framework: string;
  adaptiveTag?: 'LowEngagement' | 'HighEngagement' | 'Standard' | 'DeepDive';
}

export interface ForcedChoiceQuestion {
  id: string;
  scenarioEn: string;
  scenarioHi: string;
  options: {
    A: { textEn: string; textHi: string; trait: string };
    B: { textEn: string; textHi: string; trait: string };
  };
  adaptiveTag?: string;
}

export interface SJTQuestion {
  id: string;
  scenarioEn: string;
  scenarioHi: string;
  options: {
    A: { textEn: string; textHi: string; alignment: string };
    B: { textEn: string; textHi: string; alignment: string };
    C: { textEn: string; textHi: string; alignment: string };
    D: { textEn: string; textHi: string; alignment: string };
  };
  complexity: 'Basic' | 'Advanced' | 'Coaching';
}

export interface AssessmentState {
  language: Language;
  currentPhase: Phase;
  loginInfo: LoginInfo | null;
  currentQuestionIndex: number;
  questionPath: string[];
  engagementResponses: Record<string, number>;
  behavioralResponses: Record<string, 'A' | 'B'>;
  sjtResponses: Record<string, 'A' | 'B' | 'C' | 'D'>;
  feedback?: string;
  timeTakenSeconds?: number;
}

export interface ScoringResult {
  id?: number;
  employeeId?: number;
  engagementScore: number;
  engagementLevel: 'High' | 'Moderate' | 'Low';
  behavioralProfile: Record<string, number>;
  sjtAlignment: Record<string, number>;
  category: string;
  loginInfo?: LoginInfo;
  totalPoints: number;
  badges: string[];
  engagementResponses?: Record<string, number>;
  behavioralResponses?: Record<string, 'A' | 'B'>;
  sjtResponses?: Record<string, 'A' | 'B' | 'C' | 'D'>;
  feedback?: string;
  timeTakenSeconds?: number;
}
