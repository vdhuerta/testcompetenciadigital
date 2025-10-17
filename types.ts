import React from 'react';
import { TrophyIcon } from './components/icons/Icons';

export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface Area {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: Question[];
}

export interface UserData {
  country: string;
  university: string;
}

export interface Answer {
  questionId: number;
  optionIndex: number;
}

export type AppView = 'dashboard' | 'areas' | 'profile' | 'results' | 'tasks' | 'achievements';

export interface SearchResult {
  type: 'area' | 'question';
  areaId: number;
  areaTitle: string;
  questionId?: number;
  questionIndex?: number;
  matchText: string;
}

export interface Notification {
    id: string;
    text: string;
    timestamp: string; // ISO Date string
    icon: React.ComponentType<{ className?: string }>;
    isNew?: boolean;
}

// Types for Netlify functions payload
export interface AreaScore {
  title: string;
  score: number;
  level: {
    name: string;
    code: string;
  };
}

export interface GenerateSummaryPayload {
  scores: AreaScore[];
}

export interface GeneratePlanPayload {
  area: {
    title: string;
    score: number;
  };
}

export interface PlanState {
  content: string;
  isLoading: boolean;
  error: string | null;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  areaTitle: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Streak {
  count: number;
  lastVisit: string; // ISO date string (e.g., "2023-10-27")
}