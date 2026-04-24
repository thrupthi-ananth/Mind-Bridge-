export interface User {
  id: string;
  name: string;
  age_range: string;
  preferred_name: string;
  appointment_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  care_reason: string;
  history_self_harm: boolean;
  history_panic: boolean;
  history_depression: boolean;
  history_crisis: boolean;
  consent_given: boolean;
}

export interface CheckIn {
  id?: number;
  user_id: string;
  mood: number; // 1-10
  anxiety: number; // 1-10
  stress: number; // 1-10
  sleep_duration: number;
  sleep_quality: number; // 1-10
  energy: number; // 1-10
  appetite: number; // 1-10
  social_withdrawal: number; // 1-10
  panic_symptoms: number; // 1-10
  hopelessness: number; // 1-10
  self_harm_ideation: number; // 1-10
  journal_text: string;
  sentiment?: string;
  themes?: string; // JSON string array
  risk_score: number;
  created_at?: string;
}

export interface VoiceSession {
  id?: number;
  user_id: string;
  transcript: string;
  mood_analysis: string;
  key_takeaways: string;
  created_at?: string;
}

export interface ChatMessage {
  id?: number;
  user_id: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
