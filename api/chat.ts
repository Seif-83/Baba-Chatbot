export const config = {
  maxDuration: 60,
};

interface IncomingAttachment {
  name?: string;
  mimeType: string;
  data: string;
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
  provider?: 'gemini' | 'groq' | 'openrouter' | 'auto';
  model?: string;
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
    en: 'Respond strictly and completely in English from left-to-right (LTR). Suitable for Egyptian Language Schools (Prep Math), using standard Egyptian MOE terminology (e.g., Given, R.T.P., Proof, S.S. for Solution Set). Avoid Arabic words completely.',
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
- Grade Level: ${gradeLabel[grade] || gradeLabel.prep3}
- Focus Branch: ${branchLabel[branch] || branchLabel.all}
- Language Style: ${languageRule[language] || languageRule.bilingual}

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

AVAILABLE OFFICIAL EXAMS & BOOKLETS (مكتبة مذكرات وامتحانات مستر عمرو محسن المتاحة):
- **امتحان شامل رياضيات - الصف الثالث الإعدادي (Comprehensive Math Exam - Prep 3)**:
  - الرابط المباشر للتحميل: \`/امتحانات/3rd%20prep/شامل%20٣ع.pdf\`
  - يشمل: أسئلة اختر، ومسائل مقالية في الجبر (دوال الدرجة الثانية، التغير الطردي والعكسي، مجموعات الحل)، والهندسة وحساب المثلثات (إثبات استقامة النقاط، معادلة الخط المستقيم، مساحات وأطوال الأضلاع).
- **قواعد الرد على طلبات الامتحانات والمذكرات**:
  - إذا سألك الطالب عن امتحانات أو مذكرات مستر عمرو محسن (مثال: "عايز امتحان تالتة إعدادي"، "امتحان شامل"، "مذكرات المستر"):
    1. قدم له فوراً رابط التحميل المباشر بصيغة Markdown:
       [📄 اضغط هنا لتحميل امتحان شامل رياضيات - الصف الثالث الإعدادي](/امتحانات/3rd%20prep/شامل%20٣ع.pdf)
    2. وضح له أن بإمكانه أيضاً تصفح **«بنك الامتحانات والمذكرات»** في الموقع لتحميل أي امتحان أو مذكرة، أو الضغط على زر «حل بالذكاء الاصطناعي» لأي امتحان ليتم حله وشرحه له فوراً!
    3. اسأله بلطف: "تحب نبدأ نحل أول سؤال في الامتحان سوا؟"

EFFICIENCY & SPEED:
- Start writing the solution IMMEDIATELY without conversational filler, long apologies, or repeating the user prompt.
- Jump straight to solving each problem clearly step-by-step using LaTeX for math formulas.

BRAND & CONTACT INFO:
- Maintain Mr. Amr Mohsen's supportive, clear, and motivating classroom spirit.
- If a student asks how to reach Mr. Amr Mohsen, book a lesson, or ask about classes/schedules, share his official contact number from the emblem: **01211143632** (Phone / WhatsApp).
- Stay focused on Preparatory Mathematics and student study support. If asked off-topic questions, politely steer back to Math with Mr. Amr Mohsen's assistant.`;
}

async function prepareOpenAIMessages(messages: IncomingMessage[], systemInstruction: string) {
  const formattedMessages: Array<{ role: string; content: any }> = [
    { role: 'system', content: systemInstruction },
  ];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isPastAssistant = msg.role === 'assistant' && i < messages.length - 1;
    if (isPastAssistant && msg.content && msg.content.length > 400) {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content.slice(0, 400) + '... [باقي الشرح السابق]',
      });
      continue;
    }

    if (msg.attachment && msg.attachment.data) {
      const isImage = (msg.attachment.mimeType || '').toLowerCase().startsWith('image/');
      if (isImage) {
        const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
          {
            type: 'image_url',
            image_url: {
              url: `data:${msg.attachment.mimeType};base64,${msg.attachment.data}`,
            },
          },
        ];
        const text =
          msg.content && msg.content.trim().length > 0
            ? msg.content
            : 'حل المسألة الموجودة في الصورة خطوة بخطوة مع الشرح.';
        parts.push({ type: 'text', text });
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: parts,
        });
      } else {
        const docText = await extractAttachmentText(msg.attachment);
        const docName = msg.attachment.name || 'مستند مرفق';
        const userQuestion =
          msg.content && msg.content.trim().length > 0
            ? msg.content
            : 'يرجى قراءة هذا المستند وشرح وحل المسائل الرياضية الموجودة فيه بالتفصيل.';
        const combinedContent = `[مستند مرفق: ${docName}]\n--- بداية محتوى المستند ---\n${docText}\n--- نهاية محتوى المستند ---\n\nسؤال الطالب: ${userQuestion}`;
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: combinedContent,
        });
      }
    } else {
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || '',
      });
    }
  }

  return formattedMessages;
}

async function prepareGeminiContents(messages: IncomingMessage[]) {
  const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const isPastAssistant = role === 'model' && i < messages.length - 1;
    const parts: any[] = [];

    if (isPastAssistant && msg.content && msg.content.length > 500) {
      contents.push({ role, parts: [{ text: msg.content.slice(0, 500) + '... [باقي الشرح السابق]' }] });
      continue;
    }

    if (msg.attachment && msg.attachment.data) {
      const isImg = (msg.attachment.mimeType || '').toLowerCase().startsWith('image/');
      if (isImg) {
        parts.push({
          inlineData: {
            mimeType: msg.attachment.mimeType,
            data: msg.attachment.data,
          },
        });
        if (msg.content) parts.push({ text: msg.content });
      } else {
        const docText = await extractAttachmentText(msg.attachment);
        const name = msg.attachment.name || 'مستند مرفق';
        const q = msg.content || 'يرجى قراءة هذا المستند وشرح وحل المسائل الرياضية بالتفصيل.';
        parts.push({
          text: `[مستند مرفق: ${name}]\n--- محتوى المستند ---\n${docText}\n--- نهاية المستند ---\n\nسؤال الطالب: ${q}`,
        });
      }
    } else if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  return contents;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'mr-amr-mohsen-math-ai' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as ChatRequestBody;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const grade = body.grade || 'prep3';
    const branch = body.branch || 'all';
    const mode = body.mode || 'solve';
    const language = body.language || 'bilingual';
    const systemInstruction = buildSystemInstruction(grade, branch, mode, language);

    const hasImages = body.messages.some(
      (m) =>
        m.attachment &&
        m.attachment.data &&
        (m.attachment.mimeType || '').toLowerCase().startsWith('image/')
    );

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!geminiKey && !groqKey && !openRouterKey) {
      return res.status(500).json({
        error: 'لم يتم العثور على أي مفتاح ذكاء اصطناعي في إعدادات الخادم.',
      });
    }

    const requestedProvider = body.provider || 'auto';
    let chosenProvider: 'gemini' | 'groq' | 'openrouter' = 'gemini';

    if (requestedProvider === 'gemini') {
      chosenProvider = geminiKey ? 'gemini' : (groqKey ? 'groq' : 'openrouter');
    } else if (requestedProvider === 'groq') {
      chosenProvider = groqKey ? 'groq' : (geminiKey ? 'gemini' : 'openrouter');
    } else if (requestedProvider === 'openrouter') {
      chosenProvider = openRouterKey ? 'openrouter' : (geminiKey ? 'gemini' : 'groq');
    } else {
      // auto: prefer gemini for robust exam reasoning, then groq
      chosenProvider = geminiKey ? 'gemini' : (groqKey ? 'groq' : 'openrouter');
    }

    // Helper to call Gemini
    const callGemini = async (customModel = 'gemini-3.5-flash') => {
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured');
      const contents = await prepareGeminiContents(body.messages);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${customModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;

      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
          },
        }),
      });
    };

    // Helper to call Groq
    const callGroq = async (customModel?: string) => {
      if (!groqKey) throw new Error('GROQ_API_KEY is not configured');
      const formattedMessages = await prepareOpenAIMessages(body.messages, systemInstruction);
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
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          stream: true,
          messages: formattedMessages,
        }),
      });
    };

    // Helper to call OpenRouter
    const callOpenRouter = async (customModel?: string) => {
      if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured');
      const formattedMessages = await prepareOpenAIMessages(body.messages, systemInstruction);
      const defaultModel = customModel || process.env.OPENROUTER_MODEL || 'z-ai/glm-4.7-flash';
      const visionModel = process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
      const model = hasImages ? visionModel : defaultModel;
      const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 4000;

      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://mr-amr-chatbot.vercel.app',
          'X-Title': 'Mr. Amr Mohsen Math AI Tutor',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          stream: true,
          messages: formattedMessages,
        }),
      });
    };

    let upstreamResponse: Response;
    const requestedModel = body.model && body.model !== 'auto' ? body.model : undefined;

    if (chosenProvider === 'gemini') {
      try {
        upstreamResponse = await callGemini(requestedModel || 'gemini-3.5-flash');
        if (!upstreamResponse.ok && groqKey) {
          console.warn(`Gemini error HTTP ${upstreamResponse.status}, falling back to Groq...`);
          upstreamResponse = await callGroq();
        }
      } catch (err) {
        if (groqKey) {
          console.warn('Gemini failed, falling back to Groq:', err);
          upstreamResponse = await callGroq();
        } else {
          throw err;
        }
      }
    } else if (chosenProvider === 'groq') {
      try {
        upstreamResponse = await callGroq(requestedModel);
        if (!upstreamResponse.ok && geminiKey) {
          console.warn(`Groq error HTTP ${upstreamResponse.status}, falling back to Gemini...`);
          upstreamResponse = await callGemini();
        } else if (!upstreamResponse.ok && openRouterKey) {
          upstreamResponse = await callOpenRouter();
        }
      } catch (err) {
        if (geminiKey) {
          console.warn('Groq failed, falling back to Gemini:', err);
          upstreamResponse = await callGemini();
        } else if (openRouterKey) {
          upstreamResponse = await callOpenRouter();
        } else {
          throw err;
        }
      }
    } else {
      try {
        upstreamResponse = await callOpenRouter(requestedModel);
        if (!upstreamResponse.ok && geminiKey) {
          upstreamResponse = await callGemini();
        } else if (!upstreamResponse.ok && groqKey) {
          upstreamResponse = await callGroq();
        }
      } catch (err) {
        if (geminiKey) {
          upstreamResponse = await callGemini();
        } else if (groqKey) {
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
        if (parsedErr?.error?.message) {
          errMsg = parsedErr.error.message;
        }
      } catch {}

      if (errMsg.toLowerCase().includes('tokens per minute') || errMsg.includes('TPM') || errMsg.toLowerCase().includes('too large')) {
        errMsg = 'عذراً، تم الوصول للحد الأقصى لعدد الكلمات في الدقيقة (Rate Limit). يرجى الانتظار 30 ثانية ثم إعادة المحاولة أو بدء محادثة جديدة.';
      }
      return res.status(upstreamResponse.status).json({ error: errMsg });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const reader = upstreamResponse.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'لم يتم استلام بث بيانات من خادم الذكاء الاصطناعي.' });
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

          // Handle both Gemini response format and OpenAI/Groq response format
          const geminiText = chunkObj.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
          const openAIText = chunkObj.choices?.[0]?.delta?.content;
          const content = geminiText ?? openAIText;

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
}
