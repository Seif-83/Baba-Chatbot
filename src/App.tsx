import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  Send,
  ImagePlus,
  Camera,
  FileText,
  X,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Cpu,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MathContent } from './components/MathContent';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { FormulaDrawer } from './components/FormulaDrawer';
import { MaterialsDrawer } from './components/MaterialsDrawer';
import { STUDY_MATERIALS, type MaterialItem } from './data/materials';
import { AI_MODELS } from './data/models';
import {
  GRADE_OPTIONS,
  MATH_SYMBOLS,
  QUICK_PROMPTS,
} from './data/curriculum';
import type {
  ChatMessage,
  Conversation,
  ChatAttachment,
  LanguagePreference,
  MathBranch,
  PrepGrade,
  TutorMode,
} from './types/chat';

const STORAGE_KEY = 'amr_mohsen_math_chats_v1';

function createEmptyConversation(
  grade: PrepGrade = 'prep3',
  branch: MathBranch = 'all',
  mode: TutorMode = 'solve'
): Conversation {
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'محادثة جديدة',
    grade,
    branch,
    mode,
    messages: [],
    updatedAt: Date.now(),
  };
}

function loadInitialConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return [createEmptyConversation()];
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(loadInitialConversations);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id || '');
  const [language, setLanguage] = useState<LanguagePreference>('bilingual');
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    const saved = localStorage.getItem('mr_amr_selected_model');
    if (!saved || saved.includes('20b') || saved.includes('llama') || !AI_MODELS.some((m) => m.id === saved)) {
      return 'gemini:gemini-3.5-flash';
    }
    return saved;
  });
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formulaDrawerOpen, setFormulaDrawerOpen] = useState(false);
  const [materialsDrawerOpen, setMaterialsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSymbolBar, setShowSymbolBar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || conversations[0],
    [conversations, activeId]
  );

  // Persist conversations cleanly (strip large base64 data if localStorage quota approaches limit)
  useEffect(() => {
    try {
      const sanitized = conversations.slice(0, 15).map((conv) => ({
        ...conv,
        messages: conv.messages.map((m) => ({
          ...m,
          attachment: m.attachment
            ? {
                type: m.attachment.type,
                name: m.attachment.name,
                mimeType: m.attachment.mimeType,
                data: '',
                previewUrl: undefined,
                extractedText: m.attachment.extractedText?.slice(0, 300),
              }
            : undefined,
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore storage quota errors
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, isStreaming]);

  const updateActiveConversation = (updater: (conv: Conversation) => Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? updater(c) : c))
    );
  };

  const handleNewChat = () => {
    const newConv = createEmptyConversation(
      activeConversation.grade,
      activeConversation.branch,
      activeConversation.mode
    );
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setInput('');
    setAttachment(null);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createEmptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setAttachment({
        type: 'image',
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        data: base64,
        previewUrl: result,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isWord = lower.endsWith('.docx') || lower.endsWith('.doc') || file.type.includes('word');
    const isPdf = lower.endsWith('.pdf') || file.type.includes('pdf');
    const isText = file.type.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md');

    let extractedText = '';
    if (isText) {
      try {
        extractedText = await file.text();
      } catch {}
    } else if (isWord && lower.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const res = await (mammoth.default || mammoth).extractRawText({ arrayBuffer });
        extractedText = res.value || '';
      } catch (err) {
        console.warn('Word client extraction note:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setAttachment({
        type: 'document',
        name: file.name,
        mimeType:
          file.type ||
          (isWord
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : isPdf
            ? 'application/pdf'
            : 'text/plain'),
        data: base64,
        extractedText,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const insertSymbol = (symbol: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInput((prev) => prev + symbol);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + symbol + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  };

  const sendMessage = async (
    overrideText?: string,
    overrideAttachment?: ChatAttachment | null,
    targetConvId?: string,
    explicitHistory?: ChatMessage[]
  ) => {
    const activeAtt = overrideAttachment !== undefined ? overrideAttachment : attachment;
    const textToSend = (overrideText ?? input).trim();
    if ((!textToSend && !activeAtt) || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content:
        textToSend ||
        (activeAtt?.type === 'document'
          ? 'يرجى قراءة هذا المستند وشرح وحل المسائل الموجودة فيه بالتفصيل.'
          : 'حل المسألة الموجودة في الصورة خطوة بخطوة مع الشرح.'),
      attachment: activeAtt
        ? {
            type: activeAtt.type,
            name: activeAtt.name,
            mimeType: activeAtt.mimeType,
            data: activeAtt.data,
            previewUrl: activeAtt.previewUrl,
            extractedText: activeAtt.extractedText,
            size: activeAtt.size,
          }
        : undefined,
      createdAt: Date.now(),
    };

    const assistantMsgId = `msg_${Date.now()}_a`;
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    const convIdToUse = targetConvId || activeConversation.id;
    const currentConv =
      conversations.find((c) => c.id === convIdToUse) || activeConversation;

    const currentHistory = explicitHistory !== undefined ? explicitHistory : currentConv.messages;
    const nextHistory = [...currentHistory, userMsg];

    const defaultTitle =
      activeAtt?.name
        ? activeAtt.name.slice(0, 38)
        : textToSend
        ? textToSend.replace(/\$/g, '').slice(0, 38)
        : 'مسألة مرفقة';

    const derivedTitle =
      currentHistory.length === 0 ? defaultTitle : currentConv.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convIdToUse
          ? {
              ...c,
              title: derivedTitle,
              updatedAt: Date.now(),
              messages: [...nextHistory, placeholderAssistant],
            }
          : c
      )
    );

    if (!overrideText) {
      setInput('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    setIsStreaming(true);

    try {
      // Sanitize and window history to stay well under TPM limits (e.g. Groq 7,000 TPM limit)
      const sanitizedHistory = nextHistory.map((m, idx) => {
        if (m.role === 'assistant' && idx < nextHistory.length - 1 && m.content.length > 500) {
          return {
            role: m.role,
            content: m.content.slice(0, 500) + '... [باقي الحل السابق]',
            attachment: undefined,
          };
        }
        return {
          role: m.role,
          content: m.content,
          attachment:
            m.attachment && m.attachment.data
              ? {
                  name: m.attachment.name,
                  mimeType: m.attachment.mimeType,
                  data: m.attachment.data,
                  extractedText: m.attachment.extractedText,
                }
              : undefined,
        };
      });

      const messagesToSend =
        sanitizedHistory.length > 4
          ? [sanitizedHistory[0], ...sanitizedHistory.slice(-3)]
          : sanitizedHistory;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          grade: currentConv.grade,
          branch: currentConv.branch,
          mode: currentConv.mode,
          language,
          provider: (AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0]).provider,
          model: (AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0]).model,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('لم يتم استلام البث من الخادم.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          const parsed = JSON.parse(jsonStr) as {
            text?: string;
            error?: string;
            done?: boolean;
          };
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            accumulated += parsed.text;
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convIdToUse
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: accumulated } : m
                      ),
                    }
                  : c
              )
            );
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('لم يصل رد من المساعد الذكي. حاول مرة أخرى.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالمساعد الذكي.';
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convIdToUse
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `عذراً، تعذر إكمال الحل الآن: ${message}`,
                        isError: true,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSolveMaterial = async (item: MaterialItem) => {
    try {
      setIsStreaming(true);
      const res = await fetch(encodeURI(item.fileUrl));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        const att: ChatAttachment = {
          type: 'document',
          name: item.fileName,
          mimeType: 'application/pdf',
          data: base64,
          extractedText: item.extractedText || undefined,
          size: blob.size,
        };

        const newConv = createEmptyConversation(item.grade, item.branch, 'solve');
        newConv.title = `حل ${item.title}`;
        setConversations((prev) => [newConv, ...prev]);
        setActiveId(newConv.id);
        setIsStreaming(false);

        setTimeout(() => {
          sendMessage(
            `مستر عمرو، من فضلك حل واشرح أسئلة هذا الامتحان (${item.title}) خطوة بخطوة بالتفصيل مع القوانين وطريقة الحل النموذجية.`,
            att,
            newConv.id,
            [] // Explicitly pass empty history so it never carries over prior chat tokens
          );
        }, 100);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load material for solving:', err);
      setIsStreaming(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const filteredPrompts = useMemo(() => {
    return QUICK_PROMPTS.filter((p) => {
      if (p.grade !== activeConversation.grade) return false;
      if (activeConversation.branch !== 'all' && p.branch !== activeConversation.branch) {
        return false;
      }
      return true;
    });
  }, [activeConversation.grade, activeConversation.branch]);

  const activeGradeLabel =
    GRADE_OPTIONS.find((g) => g.id === activeConversation.grade)?.labelAr || 'تالتة إعدادي';

  return (
    <div className="h-dvh w-full flex overflow-hidden bg-[#F8F9FB] text-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        grade={activeConversation.grade}
        onChangeGrade={(grade) =>
          updateActiveConversation((c) => ({ ...c, grade }))
        }
        branch={activeConversation.branch}
        onChangeBranch={(branch) =>
          updateActiveConversation((c) => ({ ...c, branch }))
        }
        mode={activeConversation.mode}
        onChangeMode={(mode) =>
          updateActiveConversation((c) => ({ ...c, mode }))
        }
        language={language}
        onChangeLanguage={(lang) => setLanguage(lang)}
        selectedModelId={selectedModelId}
        onChangeModelId={(id) => {
          setSelectedModelId(id);
          localStorage.setItem('mr_amr_selected_model', id);
        }}
        conversations={conversations}
        activeId={activeConversation.id}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenFormulas={() => setFormulaDrawerOpen(true)}
        onOpenMaterials={() => setMaterialsDrawerOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Compact Top Bar with Safe Area */}
        <header className="h-14 sm:h-16 shrink-0 bg-white border-b border-slate-200 px-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 z-20 pt-safe">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            <img
              src="/logo-transparent.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_6971e0e5.png';
              }}
              alt="شعار مستر عمرو محسن"
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#132346] truncate block">
                مساعد مستر عمرو محسن
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block lg:hidden">
                {activeGradeLabel}
              </span>
            </div>
          </div>

          {/* Mode & Language Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() =>
                  updateActiveConversation((c) => ({ ...c, mode: 'solve' }))
                }
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeConversation.mode === 'solve'
                    ? 'bg-white text-[#132346] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                شرح وحل
              </button>
              <button
                type="button"
                onClick={() =>
                  updateActiveConversation((c) => ({ ...c, mode: 'quiz' }))
                }
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeConversation.mode === 'quiz'
                    ? 'bg-white text-[#132346] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                اختبرني
              </button>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
              aria-label="لغة الشرح"
              className="hidden md:block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#132346]/20 min-h-[38px]"
            >
              <option value="bilingual">عربي + Math</option>
              <option value="en">English Math</option>
              <option value="ar">رياضيات عربي</option>
            </select>

            {/* AI Model Selector */}
            <div className="hidden lg:flex items-center">
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  localStorage.setItem('mr_amr_selected_model', e.target.value);
                }}
                aria-label="اختيار نموذج الذكاء الاصطناعي"
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#132346] focus:outline-none focus:ring-2 focus:ring-[#132346]/20 min-h-[38px]"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <PWAInstallButton />
          </div>
        </header>

        {/* Scrollable Chat Stage */}
        <div className="flex-1 overflow-y-auto math-grid-bg">
          {activeConversation.messages.length === 0 ? (
            <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 flex flex-col items-center">
              {/* Central Medallion Hero */}
              <div className="relative mb-4 sm:mb-6">
                <img
                  src="/amr-mohsen-hero.jpg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/logo-transparent.png';
                  }}
                  alt="شعار مستر عمرو محسن الرسمي"
                  className="w-36 h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-3xl object-contain drop-shadow-xl bg-white p-2 border border-slate-200/80 shadow-md hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#132346] text-center text-balance leading-snug">
                أهلاً بك في المساعد الذكي لمستر عمرو محسن
              </h2>
              <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 text-center max-w-xl leading-relaxed">
                مساعدك الشخصي في <strong className="text-[#132346]">الرياضيات و Math للمرحلة الإعدادية</strong> — اكتب مسألتك أو صورها من الكتاب وسيتم حلها وشرحها خطوة بخطوة.
              </p>

              {/* Mobile Quick Mode Switcher */}
              <div className="sm:hidden mt-4 flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() =>
                    updateActiveConversation((c) => ({ ...c, mode: 'solve' }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeConversation.mode === 'solve'
                      ? 'bg-[#132346] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  شرح وحل المسائل
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateActiveConversation((c) => ({ ...c, mode: 'quiz' }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeConversation.mode === 'quiz'
                      ? 'bg-[#132346] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  اختبرني بسؤال
                </button>
              </div>

              {/* Quick Curriculum Starters */}
              <div className="w-full mt-6 sm:mt-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                    مسائل وموضوعات مقترحة · {activeGradeLabel}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setMaterialsDrawerOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#132346] hover:text-[#B86428] bg-slate-100 hover:bg-slate-200 transition-colors py-1 px-2.5 rounded-lg"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#B86428]" />
                      <span>بنك الامتحانات والمذكرات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormulaDrawerOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B86428] hover:text-[#9E531F] transition-colors py-1 px-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>ملخص القوانين</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {filteredPrompts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendMessage(item.prompt)}
                      className="text-start rounded-xl bg-white border border-slate-200 p-3.5 sm:p-4 hover:border-[#B86428] hover:shadow-md active:bg-slate-50 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                        <span>{item.branch === 'algebra' ? 'الجبر والإحصاء' : 'الهندسة'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-display">{item.titleEn}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#132346] group-hover:text-[#B86428] transition-colors line-clamp-2">
                        {item.titleAr}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
              {activeConversation.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLastAssistant =
                  !isUser && idx === activeConversation.messages.length - 1;

                if (isUser) {
                  return (
                    <div
                      key={msg.id}
                      dir={language === 'en' ? 'ltr' : 'rtl'}
                      className={`flex ${language === 'en' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl ${
                          language === 'en' ? 'rounded-br-sm text-left' : 'rounded-tr-sm text-right'
                        } bg-[#132346] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xs space-y-2`}
                      >
                        {msg.attachment && (
                          msg.attachment.type === 'document' || !msg.attachment.previewUrl ? (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/20 text-xs">
                              <FileText className="w-5 h-5 text-[#C9A25D] shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold block truncate">
                                  {msg.attachment.name || 'مستند مرفق'}
                                </span>
                                <span className="text-[11px] text-white/70 block">
                                  مستند أسئلة / واجب
                                </span>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={msg.attachment.previewUrl}
                              alt="صورة المسألة المرفقة"
                              className="max-h-48 sm:max-h-56 rounded-xl object-contain bg-white/10"
                              referrerPolicy="no-referrer"
                            />
                          )
                        )}
                        <p className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${language === 'en' ? 'text-left' : ''}`} dir={language === 'en' ? 'ltr' : 'auto'}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                    className="flex items-start gap-2 sm:gap-3"
                  >
                    <img
                      src="/logo-transparent.png"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/assets/aistudio/image_6971e0e5.png';
                      }}
                      alt="أيقونة مستر عمرو محسن"
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 mt-1 shadow-xs bg-white"
                      referrerPolicy="no-referrer"
                    />

                    <div
                      className={`flex-1 min-w-0 rounded-2xl bg-white border p-3.5 sm:p-5 shadow-xs overflow-hidden ${
                        language === 'en' ? 'rounded-tl-sm text-left' : 'rounded-tl-sm text-right'
                      } ${
                        msg.isError ? 'border-red-300 bg-red-50/40' : 'border-slate-200'
                      }`}
                    >
                      {msg.content ? (
                        <MathContent content={msg.content} dir={language === 'en' ? 'ltr' : 'auto'} />
                      ) : (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#B86428] animate-bounce" />
                          <span>{language === 'en' ? 'Solving step by step...' : 'جاري كتابة الحل خطوة بخطوة...'}</span>
                        </div>
                      )}

                      {msg.content && !(isLastAssistant && isStreaming) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#132346] hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#059669]" />
                                <span>{language === 'en' ? 'Copied!' : 'تم النسخ'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{language === 'en' ? 'Copy solution' : 'نسخ الحل'}</span>
                              </>
                            )}
                          </button>

                          {!msg.isError && (
                            <button
                              type="button"
                              onClick={() =>
                                sendMessage(
                                  language === 'en'
                                    ? 'Give me a similar practice problem on the same concept.'
                                    : 'اديني مسألة تانية مشابهة لنفس الفكرة عشان أتدرب عليها.'
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#B86428] hover:bg-[#B86428]/10 active:bg-[#B86428]/20 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Practice problem' : 'مسألة للتدريب'}</span>
                            </button>
                          )}

                          {msg.isError && idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevUser = activeConversation.messages[idx - 1];
                                if (prevUser?.role === 'user') {
                                  sendMessage(prevUser.content);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Retry' : 'إعادة المحاولة'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer Area with iOS Safe Area */}
        <footer className="shrink-0 bg-white border-t border-slate-200 px-2 sm:px-6 py-2 sm:py-3 pb-safe">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Optional Quick Math Symbols Bar */}
            {showSymbolBar && (
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym.label}
                    type="button"
                    onClick={() => insertSymbol(sym.value)}
                    className="min-w-[34px] sm:min-w-[38px] h-8 sm:h-9 px-2 rounded-lg bg-slate-100 hover:bg-[#132346] hover:text-white active:bg-[#132346] text-xs sm:text-sm font-mono-math font-semibold text-[#132346] transition-colors shrink-0"
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            )}

            {/* Attached Problem Photo or Document Preview */}
            {attachment && (
              <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 w-fit max-w-full">
                {attachment.type === 'document' || !attachment.previewUrl ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#132346]/10 flex items-center justify-center shrink-0 text-[#132346]">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#B86428]" />
                    </div>
                    <div className="min-w-0 pr-1">
                      <span className="text-xs font-bold text-slate-800 truncate block max-w-[180px] sm:max-w-xs">
                        {attachment.name || 'مستند مرفق'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans block">
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB • ` : ''}مستند جاهز للتحليل
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <img
                      src={attachment.previewUrl}
                      alt="معاينة الصورة"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        صورة مسألة
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 block">
                        جاهزة للشرح والحل
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors mr-1 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="إزالة المرفق"
                  title="إزالة المرفق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-1 sm:gap-2 rounded-2xl border border-slate-300 bg-[#F8F9FB] px-1.5 sm:px-2.5 py-1.5 sm:py-2 focus-within:border-[#132346] focus-within:ring-2 focus-within:ring-[#132346]/10 transition-all">
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".doc,.docx,.pdf,.txt,.rtf,.md"
                onChange={handleDocChange}
                className="hidden"
              />

              {/* Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#B86428] hover:bg-slate-200/70 active:bg-slate-300 transition-colors shrink-0"
                title="فتح الكاميرا لتصوير المسألة مباشرة"
                aria-label="فتح الكاميرا"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#B86428]" />
              </button>

              {/* Image Picker Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#132346] hover:bg-slate-200/70 active:bg-slate-300 transition-colors shrink-0"
                title="اختيار صورة مسألة من الجهاز"
                aria-label="رفع صورة مسألة"
              >
                <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Document Picker Button */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#132346] hover:bg-slate-200/70 active:bg-slate-300 transition-colors shrink-0"
                title="إرفاق مستند أو مذكرة (Word, PDF, Text)"
                aria-label="رفع مستند"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowSymbolBar((prev) => !prev)}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-mono-math font-bold transition-colors shrink-0 ${
                  showSymbolBar
                    ? 'bg-[#132346] text-white'
                    : 'text-slate-600 hover:text-[#132346] hover:bg-slate-200/70'
                }`}
                title="لوحة الرموز الرياضية"
                aria-label="إظهار أو إخفاء الرموز الرياضية"
              >
                π√
              </button>

              {/* Textarea: text-base on mobile prevents iOS Safari auto-zoom on focus */}
              <textarea
                ref={textareaRef}
                rows={1}
                dir={language === 'en' ? 'ltr' : 'auto'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  language === 'en'
                    ? 'Type your math question here... (e.g., Solve x² - 5x + 6 = 0)'
                    : 'اكتب سؤالك أو مسألة الـ Math...'
                }
                className={`flex-1 bg-transparent resize-none border-0 focus:outline-none text-base sm:text-sm text-slate-900 placeholder:text-slate-400 py-2 sm:py-2.5 max-h-36 min-w-0 ${
                  language === 'en' ? 'text-left' : ''
                }`}
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isStreaming || (!input.trim() && !attachment)}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-[#132346] text-white hover:bg-[#1C3263] active:bg-[#0D1830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="إرسال السؤال"
              >
                <Send className="w-4 h-4 -scale-x-100" />
              </button>
            </div>
          </div>
        </footer>
      </main>

      <FormulaDrawer
        isOpen={formulaDrawerOpen}
        onClose={() => setFormulaDrawerOpen(false)}
        activeGrade={activeConversation.grade}
        onSelectFormulaPrompt={(prompt) => sendMessage(prompt)}
      />

      <MaterialsDrawer
        isOpen={materialsDrawerOpen}
        onClose={() => setMaterialsDrawerOpen(false)}
        activeGrade={activeConversation.grade}
        onSolveMaterial={handleSolveMaterial}
      />

      <OfflineIndicator />
    </div>
  );
}
