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
- Grade Level: ${gradeLabel[grade] || gradeLabel.prep3}
- Focus Branch: ${branchLabel[branch] || branchLabel.all}
- Language Style: ${languageRule[language] || languageRule.bilingual}

TEACHING METHODOLOGY:
${modeRule}

MATH FORMATTING RULES (CRITICAL):
- Always write mathematical expressions, equations, fractions, square roots, angles, triangles, and symbols using valid LaTeX enclosed in \`$...$\` for inline math and \`$$...$$\` for standalone display equations.
- Examples: \`$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\`, \`$\\triangle ABC \\cong \\triangle DEF$\`, \`$m(\\angle A) = 60^\\circ$\`, \`$\\sin 30^\\circ = \\frac{1}{2}$\`, \`$S.S. = \\{2, -3\\}$\`.
- Do NOT wrap equations inside code blocks (\`\`\`). Use LaTeX math delimiters so they render cleanly.

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

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured in environment variables.' });
    }

    const hasImages = body.messages.some(
      (m) =>
        m.attachment &&
        m.attachment.data &&
        (m.attachment.mimeType || '').toLowerCase().startsWith('image/')
    );
    const defaultModel = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.7-flash';
    const visionModel = process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
    const model = hasImages ? visionModel : defaultModel;
    const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 4000;

    const openRouterMessages: Array<{ role: string; content: any }> = [
      {
        role: 'system',
        content: systemInstruction,
      },
    ];

    for (const msg of body.messages) {
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
          openRouterMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: parts,
          });
        } else {
          // Document file
          const docText = await extractAttachmentText(msg.attachment);
          const docName = msg.attachment.name || 'مستند مرفق';
          const userQuestion =
            msg.content && msg.content.trim().length > 0
              ? msg.content
              : 'يرجى قراءة هذا المستند وشرح وحل المسائل الرياضية الموجودة فيه بالتفصيل.';
          const combinedContent = `[مستند مرفق: ${docName}]\n--- بداية محتوى المستند ---\n${docText}\n--- نهاية محتوى المستند ---\n\nسؤال الطالب: ${userQuestion}`;
          openRouterMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: combinedContent,
          });
        }
      } else {
        openRouterMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || '',
        });
      }
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://baba-chatbot.vercel.app',
        'X-Title': 'Mr. Amr Mohsen Math AI Tutor',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        messages: openRouterMessages,
      }),
    });

    if (!openRouterResponse.ok) {
      const errBody = await openRouterResponse.text().catch(() => '');
      let errMsg = `OpenRouter error HTTP ${openRouterResponse.status}`;
      try {
        const parsedErr = JSON.parse(errBody);
        if (parsedErr?.error?.message) {
          errMsg = parsedErr.error.message;
        }
      } catch {}
      return res.status(openRouterResponse.status).json({ error: errMsg });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = openRouterResponse.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'No readable stream received from OpenRouter.' });
    }

    const decoder = new TextDecoder();
    let buffer = '';

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
          const content = chunkObj.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            (res as any).flush?.();
          }
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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
