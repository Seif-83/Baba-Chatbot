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
    name: 'Groq: Qwen 2.5 (Fastest)',
    labelAr: '⚡ Groq - Qwen 2.5 (الأسرع والأدق للـ Math)',
    labelEn: '⚡ Groq - Qwen 2.5 (Ultra Fast & Accurate)',
    badge: 'الأسرع',
    isRecommended: true,
  },
  {
    id: 'groq:openai/gpt-oss-120b',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    name: 'Groq: GPT OSS 120B',
    labelAr: '⚡ Groq - GPT OSS 120B (حلول متقدمة)',
    labelEn: '⚡ Groq - GPT OSS 120B (Deep Reasoning)',
    badge: 'تفكير عميق',
  },
  {
    id: 'groq:openai/gpt-oss-20b',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    name: 'Groq: GPT OSS 20B',
    labelAr: '⚡ Groq - GPT OSS 20B (خفيف وسريع)',
    labelEn: '⚡ Groq - GPT OSS 20B (Lightweight)',
  },
  {
    id: 'openrouter:z-ai/glm-4.7-flash',
    provider: 'openrouter',
    model: 'z-ai/glm-4.7-flash',
    name: 'OpenRouter: GLM 4.7 Flash',
    labelAr: '🌐 OpenRouter - GLM 4.7 Flash (احتياطي)',
    labelEn: '🌐 OpenRouter - GLM 4.7 Flash (Fallback)',
  },
  {
    id: 'openrouter:meta-llama/llama-3.3-70b-instruct:free',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'OpenRouter: Llama 3.3 70B',
    labelAr: '🌐 OpenRouter - Llama 3.3 70B (مجاني)',
    labelEn: '🌐 OpenRouter - Llama 3.3 70B (Free)',
  },
  {
    id: 'auto',
    provider: 'auto',
    model: 'auto',
    name: 'Auto (Groq + Fallback)',
    labelAr: '🚀 تلقائي الذكي (Groq أولاً مع تبديل تلقائي)',
    labelEn: '🚀 Smart Auto (Groq with Auto Fallback)',
  },
];
