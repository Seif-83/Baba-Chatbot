export interface AIModelOption {
  id: string;
  provider: 'gemini' | 'groq' | 'openrouter' | 'auto';
  model: string;
  name: string;
  labelAr: string;
  labelEn: string;
  badge?: string;
  isRecommended?: boolean;
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini:gemini-3.5-flash',
    provider: 'gemini',
    model: 'gemini-3.5-flash',
    name: 'Google Gemini 3.5 Flash',
    labelAr: '✨ Google Gemini 3.5 Flash — الأقوى لحل وشرح الامتحانات الكبيرة 🌟',
    labelEn: '✨ Google Gemini 3.5 Flash — Most Powerful Math Reasoning & Exams 🌟',
    badge: 'الأقوى',
    isRecommended: true,
  },
  {
    id: 'groq:qwen/qwen3.8-27b',
    provider: 'groq',
    model: 'qwen/qwen3.8-27b',
    name: 'Groq: Qwen 2.5 (فائق السرعة)',
    labelAr: '⚡ Qwen 2.5 (Groq) — فائق السرعة للشرح والمسائل الفردية ⚡',
    labelEn: '⚡ Qwen 2.5 (Groq) — Ultra Fast for Problems & Questions ⚡',
    badge: 'الأسرع',
  },
  {
    id: 'groq:openai/gpt-oss-120b',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    name: 'Groq: GPT OSS 120B (تفكير متعمق)',
    labelAr: '⚡ GPT OSS 120B (Groq) — تفكير عميق للمسائل المعقدة',
    labelEn: '⚡ GPT OSS 120B (Groq) — Deep Reasoning',
    badge: 'تفكير متعمق',
  },
  {
    id: 'groq:allam-2-7b',
    provider: 'groq',
    model: 'allam-2-7b',
    name: 'Groq: ALAM 2 (عربي سريع)',
    labelAr: '⚡ علام ALAM 2 (Groq) — نموذج عربي خفيف وسريع',
    labelEn: '⚡ ALAM 2 (Groq) — Fast Arabic Model',
  },
  {
    id: 'openrouter:z-ai/glm-4.7-flash',
    provider: 'openrouter',
    model: 'z-ai/glm-4.7-flash',
    name: 'OpenRouter: GLM 4.7 Flash',
    labelAr: '🌐 GLM 4.7 Flash (OpenRouter) — احتياطي سريع',
    labelEn: '🌐 GLM 4.7 Flash (OpenRouter) — Fast Fallback',
  },
  {
    id: 'auto',
    provider: 'auto',
    model: 'auto',
    name: 'Smart Auto',
    labelAr: '🚀 التلقائي الذكي (Gemini + Groq تبديل تلقائي)',
    labelEn: '🚀 Smart Auto (Gemini + Groq Auto Fallback)',
  },
];
