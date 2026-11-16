export type PrepGrade = 'prep1' | 'prep2' | 'prep3';
export type MathBranch = 'all' | 'algebra' | 'geometry';
export type TutorMode = 'solve' | 'quiz';
export type LanguagePreference = 'bilingual' | 'en' | 'ar';

export interface ImageAttachment {
  mimeType: string;
  data: string; // raw base64
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    mimeType: string;
    data: string;
    previewUrl?: string;
  };
  createdAt: number;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  grade: PrepGrade;
  branch: MathBranch;
  mode: TutorMode;
  messages: ChatMessage[];
  updatedAt: number;
}
