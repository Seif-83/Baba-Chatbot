import diagnosticsChannel from 'node:diagnostics_channel';

// Polyfill diagnostics_channel.tracingChannel for Node.js < 19.9.0
if (typeof (diagnosticsChannel as any).tracingChannel !== 'function') {
  (diagnosticsChannel as any).tracingChannel = function (name: string) {
    const ch = (suffix: string) => diagnosticsChannel.channel(typeof name === 'string' ? `${name}:${suffix}` : 'trace');
    return {
      name,
      hasSubscribers: false,
      start: ch('start'),
      end: ch('end'),
      asyncStart: ch('asyncStart'),
      asyncEnd: ch('asyncEnd'),
      error: ch('error'),
      traceSync<T>(fn: (...args: any[]) => T, _context?: any, thisArg?: any, ...args: any[]): T {
        return fn.apply(thisArg, args);
      },
      tracePromise<T>(fn: (...args: any[]) => Promise<T>, _context?: any, thisArg?: any, ...args: any[]): Promise<T> {
        return fn.apply(thisArg, args);
      },
      subscribe() {},
      unsubscribe() {},
    };
  };
}

import nodeCrypto from 'node:crypto';
if (typeof (globalThis as any).crypto === 'undefined' || !(globalThis as any).crypto.getRandomValues) {
  (globalThis as any).crypto = (nodeCrypto as any).webcrypto || nodeCrypto;
}
if (typeof (global as any).crypto === 'undefined' || !(global as any).crypto.getRandomValues) {
  (global as any).crypto = (nodeCrypto as any).webcrypto || nodeCrypto;
}

import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { Content, Part } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface IncomingAttachment {
  name?: string;
  mimeType: string;
  data: string; // base64 without data: prefix
  extractedText?: string;
}

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: IncomingAttachment;
}

async function extractAttachmentText(attachment: IncomingAttachment): Promise<string> {
  if (attachment.extractedText && attachment.extractedText.trim().length > 0) {
    return attachment.extractedText;
  }
  const mime = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.name || '').toLowerCase();
  if (!attachment.data) return '';
  const buffer = Buffer.from(attachment.data, 'base64');

  if (mime.includes('word') || mime.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) {
    try {
      const mammoth = await import('mammoth');
      const result = await (mammoth.default || mammoth).extractRawText({ buffer });
      if (result.value?.trim()) return result.value.trim();
    } catch (e) {
      console.warn('Word document parse failed:', e);
    }
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    try {
      const pdfParseLib = await import('pdf-parse/lib/pdf-parse.js');
      const parseFn = (pdfParseLib as any).default || pdfParseLib;
      const data = await parseFn(buffer);
      if (data.text?.trim()) return data.text.trim();
    } catch (e) {
      console.warn('PDF parse via lib failed, trying root:', e);
      try {
        const pdfParse = await import('pdf-parse');
        const parseFn = (pdfParse as any).default || pdfParse;
        const data = await parseFn(buffer);
        if (data.text?.trim()) return data.text.trim();
      } catch (err2) {
        console.warn('PDF parse root failed:', err2);
      }
    }
  }

  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.rtf')) {
    try {
      return buffer.toString('utf8');
    } catch {}
  }

  return '';
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  grade: 'prep1' | 'prep2' | 'prep3';
  branch: 'all' | 'algebra' | 'geometry';
  mode: 'solve' | 'quiz';
  language: 'bilingual' | 'en' | 'ar';
  provider?: 'groq' | 'openrouter' | 'auto';
  model?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(
  grade: ChatRequestBody['grade'],
  branch: ChatRequestBody['branch'],
  mode: ChatRequestBody['mode'],
  language: ChatRequestBody['language']
): string {
  const gradeLabel: Record<ChatRequestBody['grade'], string> = {
    prep1: 'الصف الأول الإعدادي (1st Preparatory / Prep 1 - Egyptian Curriculum)',
    prep2: 'الصف الثاني الإعدادي (2nd Preparatory / Prep 2 - Egyptian Curriculum)',
    prep3: 'الصف الثالث الإعدادي (3rd Preparatory / Prep 3 - Egyptian Curriculum)',
  };

  const branchLabel: Record<ChatRequestBody['branch'], string> = {
    all: 'All Preparatory Math Topics (Algebra, Statistics, Geometry & Trigonometry)',
    algebra: 'Algebra & Statistics (الجبر والإحصاء)',
    geometry: 'Geometry & Trigonometry (الهندسة وحساب المثلثات)',
  };

  const languageRule: Record<ChatRequestBody['language'], string> = {
    bilingual:
      'Respond in clear Egyptian-friendly Arabic explanations paired with standard English Math terminology and LaTeX formulas (ideal for Language Schools / المدارس اللغات والتجريبية as well as Arabic schools — match the language the student writes in, while gently clarifying key English Math terms).',
    en: 'Respond strictly in clear, encouraging English suitable for Egyptian Language Schools (Prep Math), using standard Egyptian MOE terminology (e.g., Given, R.T.P., Proof, S.S. for Solution Set).',
    ar: 'Respond strictly in clear, encouraging Arabic suitable for Egyptian Preparatory Arabic Schools (المناهج المصرية للرياضيات، المعطيات، المطلوب، البرهان، مجموعة الحل).',
  };

  const modeRule =
    mode === 'quiz'
      ? `INTERACTIVE QUIZ MODE:
- If the student asks for a quiz, practice, or picks a topic, give them ONE thoughtful, exam-style Egyptian Preparatory question (inspired by El-Moasser / Ministry exams) at a time.
- Wait for the student's answer before revealing the full solution!
- When the student submits an answer, verify it carefully: praise if correct and explain any shortcut, or gently point out the exact mistake and guide them to the right answer.`
      : `STEP-BY-STEP TUTOR MODE:
- Break every solution into clear numbered steps (Step 1, Step 2, ...).
- Always state the theorem, law, or algebraic rule used before applying it.
- For Geometry proofs, explicitly structure the solution into: **Given (المعطيات)**, **Required to Prove / Find (المطلوب)**, and **Proof / Solution (البرهان / الحل)**.
- End with a clearly highlighted **Final Answer** and a short helpful tip or common mistake to avoid in exams.`;

  return `You are the official AI Math Assistant for **Mr. Amr Mohsen (مستر عمرو محسن)**, a distinguished Mathematics teacher for the Egyptian Preparatory Stage (المرحلة الإعدادية: أولى وتانية وتالتة إعدادي).

STUDENT CONTEXT:
- Grade Level: ${gradeLabel[grade]}
- Focus Branch: ${branchLabel[branch]}
- Language Style: ${languageRule[language]}

TEACHING METHODOLOGY:
${modeRule}

MATH FORMATTING RULES (CRITICAL):
- Always write mathematical expressions, equations, fractions, square roots, angles, triangles, and symbols using valid LaTeX enclosed in \`$...$\` for inline math and \`$$...$$\` for standalone display equations.
- Examples: \`$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\`, \`$\\triangle ABC \\cong \\triangle DEF$\`, \`$m(\\angle A) = 60^\\circ$\`, \`$\\sin 30^\\circ = \\frac{1}{2}$\`, \`$S.S. = \\{2, -3\\}$\`.
- Do NOT wrap equations inside code blocks (\`\`\`). Use LaTeX math delimiters so they render cleanly.
- NEVER format exam solutions or multiple questions inside a markdown table (| col | col |) and NEVER use HTML \`<br>\` tags! Tables ruin math formatting and readability.
- ALWAYS format each exam question as a separate, beautifully structured section:
  ### السؤال [رقم السؤال] / Question [Number]
  - **المعطيات والمطلوب (Given & Required):** ...
  - **القانون أو القاعدة (Theorem / Formula):** ...
  - **الحل بالخطوات (Step-by-step Solution):** ...
  - **الناتج النهائي (Final Answer):** **...**

IMAGE / HOMEWORK PHOTO HANDLING:
- If the student sends an image of a math problem (handwritten or from a book like El-Moasser / المعاصر), first carefully read and transcribe the given problem and any diagram labels/measurements, then solve it step-by-step. If part of the image is blurry or cut off, state clearly what you can read and ask the student to confirm the missing part.

EFFICIENCY & SPEED:
- Start writing the solution IMMEDIATELY without conversational filler, long apologies, or repeating the user prompt.
- Jump straight to solving each problem clearly step-by-step using LaTeX for math formulas.

BRAND & CONTACT INFO:
- Maintain Mr. Amr Mohsen's supportive, clear, and motivating classroom spirit.
- If a student asks how to reach Mr. Amr Mohsen, book a lesson, or ask about classes/schedules, share his official contact number from the emblem: **01211143632** (Phone / WhatsApp).
- Stay focused on Preparatory Mathematics and student study support. If asked off-topic questions, politely steer back to Math with Mr. Amr Mohsen's assistant.`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'mr-amr-mohsen-math-ai' });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as ChatRequestBody;
      if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const grade = body.grade || 'prep3';
      const branch = body.branch || 'all';
      const mode = body.mode || 'solve';
      const language = body.language || 'bilingual';
      const systemInstruction = buildSystemInstruction(grade, branch, mode, language);

      const groqKey = process.env.GROQ_API_KEY;
      const openRouterKey = process.env.OPENROUTER_API_KEY;

      if (!groqKey && !openRouterKey) {
        res.status(500).json({
          error: 'لم يتم العثور على مفتاح الذكاء الاصطناعي (GROQ_API_KEY أو OPENROUTER_API_KEY) في إعدادات الخادم.',
        });
        return;
      }

      const hasImages = body.messages.some(
        (m) =>
          m.attachment &&
          m.attachment.data &&
          (m.attachment.mimeType || '').toLowerCase().startsWith('image/')
      );

      const requestedProvider = body.provider || 'auto';
      let chosenProvider: 'groq' | 'openrouter' = 'groq';

      if (requestedProvider === 'openrouter') {
        chosenProvider = openRouterKey ? 'openrouter' : 'groq';
      } else if (requestedProvider === 'groq') {
        chosenProvider = groqKey ? 'groq' : 'openrouter';
      } else {
        chosenProvider = groqKey ? 'groq' : 'openrouter';
      }

      const formattedMessages: Array<{ role: string; content: any }> = [
        { role: 'system', content: systemInstruction },
      ];

      for (const msg of body.messages) {
        if (msg.attachment && msg.attachment.data) {
          const isImage = (msg.attachment.mimeType || '').toLowerCase().startsWith('image/');
          if (isImage) {
            const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
              {
                type: 'image_url',
                image_url: { url: `data:${msg.attachment.mimeType};base64,${msg.attachment.data}` },
              },
            ];
            const text = msg.content?.trim() || 'حل المسألة الموجودة في الصورة خطوة بخطوة مع الشرح.';
            parts.push({ type: 'text', text });
            formattedMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: parts });
          } else {
            const docText = await extractAttachmentText(msg.attachment);
            const docName = msg.attachment.name || 'مستند مرفق';
            const userQuestion = msg.content?.trim() || 'يرجى قراءة هذا المستند وشرح وحل المسائل الرياضية الموجودة فيه بالتفصيل.';
            formattedMessages.push({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: `[مستند مرفق: ${docName}]\n--- بداية محتوى المستند ---\n${docText}\n--- نهاية المستند ---\n\nسؤال الطالب: ${userQuestion}`,
            });
          }
        } else {
          formattedMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content || '' });
        }
      }

      const callGroq = async (customModel?: string) => {
        if (!groqKey) throw new Error('GROQ_API_KEY is not configured');
        const defaultModel = customModel || process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
        const visionModel = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
        const model = hasImages ? visionModel : defaultModel;
        const maxTokens = Number(process.env.GROQ_MAX_TOKENS) || 4000;

        return fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, messages: formattedMessages }),
        });
      };

      const callOpenRouter = async (customModel?: string) => {
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured');
        const defaultModel = customModel || process.env.OPENROUTER_MODEL || 'z-ai/glm-4.7-flash';
        const visionModel = process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
        const model = hasImages ? visionModel : defaultModel;
        const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 4000;

        return fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Mr. Amr Mohsen Math AI Tutor',
          },
          body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, messages: formattedMessages }),
        });
      };

      let upstreamResponse: globalThis.Response;
      const requestedModel = body.model && body.model !== 'auto' ? body.model : undefined;

      if (chosenProvider === 'groq') {
        try {
          upstreamResponse = await callGroq(requestedModel);
          if (!upstreamResponse.ok && openRouterKey) {
            console.warn(`Groq error HTTP ${upstreamResponse.status}, falling back to OpenRouter...`);
            upstreamResponse = await callOpenRouter();
          }
        } catch (err) {
          if (openRouterKey) {
            console.warn('Groq failed, falling back to OpenRouter:', err);
            upstreamResponse = await callOpenRouter();
          } else {
            throw err;
          }
        }
      } else {
        try {
          upstreamResponse = await callOpenRouter(requestedModel);
          if (!upstreamResponse.ok && groqKey) {
            console.warn(`OpenRouter error HTTP ${upstreamResponse.status}, falling back to Groq...`);
            upstreamResponse = await callGroq();
          }
        } catch (err) {
          if (groqKey) {
            console.warn('OpenRouter failed, falling back to Groq:', err);
            upstreamResponse = await callGroq();
          } else {
            throw err;
          }
        }
      }

      if (!upstreamResponse.ok) {
        const errBody = await upstreamResponse.text().catch(() => '');
        let errMsg = `Upstream error HTTP ${upstreamResponse.status}`;
        try {
          const parsedErr = JSON.parse(errBody);
          if (parsedErr?.error?.message) errMsg = parsedErr.error.message;
        } catch {}
        res.status(upstreamResponse.status).json({ error: errMsg });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const reader = upstreamResponse.body?.getReader();
      if (!reader) {
        res.status(500).json({ error: 'No readable stream received from upstream.' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let totalCharsEmitted = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;
          if (!dataStr) continue;

          try {
            const chunkObj = JSON.parse(dataStr);
            if (chunkObj.error) {
              const errStr = chunkObj.error.message || JSON.stringify(chunkObj.error);
              res.write(`data: ${JSON.stringify({ error: errStr })}\n\n`);
              (res as any).flush?.();
              continue;
            }
            const content = chunkObj.choices?.[0]?.delta?.content;
            if (content) {
              totalCharsEmitted += content.length;
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              (res as any).flush?.();
            }
          } catch {}
        }
      }

      if (totalCharsEmitted === 0) {
        res.write(`data: ${JSON.stringify({ error: 'لم يتم إرجاع أي رد من نموذج الذكاء الاصطناعي. يرجى تجربة اختيار نموذج آخر من القائمة أو إعادة الإرسال.' })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
      return;

      const ai = getGeminiClient();
      const contents: Content[] = body.messages.map((msg) => {
        const parts: Part[] = [];
        if (msg.attachment && msg.attachment.data && msg.attachment.mimeType) {
          parts.push({
            inlineData: {
              mimeType: msg.attachment.mimeType,
              data: msg.attachment.data,
            },
          });
        }
        if (msg.content && msg.content.trim().length > 0) {
          parts.push({ text: msg.content });
        } else if (parts.length > 0) {
          parts.push({ text: 'حل المسألة الموجودة في الصورة خطوة بخطوة مع الشرح.' });
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MEDIUM,
          },
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected server error while generating response.';
      console.error('Chat API error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      } else {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mr. Amr Mohsen Math AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
