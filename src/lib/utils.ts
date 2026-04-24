import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRiskScore(checkIn: any): number {
  let score = 0;
  score += (11 - checkIn.mood);
  score += checkIn.anxiety;
  score += checkIn.stress;
  score += (11 - checkIn.energy);
  score += checkIn.panic_symptoms * 1.5;
  score += checkIn.hopelessness * 2;
  score += checkIn.self_harm_ideation * 5;
  return score;
}

export function getRiskLevel(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (score < 20) return 'LOW';
  if (score < 40) return 'MODERATE';
  if (score < 60) return 'HIGH';
  return 'CRITICAL';
}
