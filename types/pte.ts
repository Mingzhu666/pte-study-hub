export interface ScoringInfo {
  marks: string;
  components?: string;
  weight: 'high' | 'medium' | 'low';
}

export interface ModuleContent {
  overview: string;
  scoring: ScoringInfo;
  timeLimit?: string;
  questionCount: string;
  strategy: string[];
  tips: string[];
  commonMistakes?: string[];
  template?: string[];
}

export interface ModuleContentZh {
  overview: string;
  scoring: ScoringInfo;
  timeLimit?: string;
  questionCount: string;
  strategy: string[];
  tips: string[];
  commonMistakes?: string[];
  template?: string[];
}

export interface PTEModule {
  id: string;
  name: string;
  fullName: string;
  category: 'speaking' | 'writing' | 'reading' | 'listening';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  content: ModuleContent;
  contentZh?: ModuleContentZh;
}

export type Category = {
  id: 'speaking' | 'writing' | 'reading' | 'listening';
  name: string;
  color: string;
  modules: PTEModule[];
};
