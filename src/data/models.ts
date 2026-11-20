export interface AIModelOption {
  id: string;
  provider: 'groq' | 'openrouter' | 'auto';
  model: string;
  name: string;
  labelAr: string;
  labelEn: string;
  badge?: string;
  isRecommended?: boolean;
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'groq:qwen/qwen3.8-27b',
    provider: 'groq',
    model: 'qwen/qwen3.8-27b',
    name: 'Groq: Qwen 2.5 (الأسرع والأدق)',
    labelAr: '⚡ Qwen 2.5 (Groq) — الأسرع والأدق لحل وشرح الامتحانات 🌟',
    labelEn: '⚡ Qwen 2.5 (Groq) — Ultra Fast & Best for Math Exams 🌟',
    badge: 'موصى به',
    isRecommended: true,
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
    id: 'openrouter:nvidia/nemotron-3.5-super-vl:free',
    provider: 'openrouter',
    model: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'OpenRouter: Nemotron 3.5 Free',
    labelAr: '🌐 Nemotron 3.5 (OpenRouter) — مجاني متقدم للمستندات',
    labelEn: '🌐 Nemotron 3.5 (OpenRouter) — Free Vision & Documents',
  },
  {
    id: 'auto',
    provider: 'auto',
    model: 'auto',
    name: 'Smart Auto',
    labelAr: '🚀 التلقائي الذكي (Qwen 2.5 أولاً مع تبديل تلقائي)',
    labelEn: '🚀 Smart Auto (Qwen 2.5 with Auto Fallback)',
  },
];
