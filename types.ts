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

export type AppView = 'dashboard' | 'areas' | 'profile' | 'results';

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
    time: string;
    icon: React.ComponentType<{ className?: string }>;
}