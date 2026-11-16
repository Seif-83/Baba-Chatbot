export type PrepGrade = 'prep1' | 'prep2' | 'prep3';
export type MathBranch = 'all' | 'algebra' | 'geometry';
export type TutorMode = 'solve' | 'quiz';
export type LanguagePreference = 'bilingual' | 'en' | 'ar';

export interface ChatAttachment {
  type: 'image' | 'document';
  name?: string;
  mimeType: string;
  data: string; // raw base64
  previewUrl?: string;
  extractedText?: string;
  size?: number;
}

// Backward compatibility alias
export type ImageAttachment = ChatAttachment;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: ChatAttachment;
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
