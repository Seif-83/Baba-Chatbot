import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  Send,
  ImagePlus,
  X,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MathContent } from './components/MathContent';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { FormulaDrawer } from './components/FormulaDrawer';
import {
  GRADE_OPTIONS,
  MATH_SYMBOLS,
  QUICK_PROMPTS,
} from './data/curriculum';
import type {
  ChatMessage,
  Conversation,
  ImageAttachment,
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
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formulaDrawerOpen, setFormulaDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSymbolBar, setShowSymbolBar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            ? { mimeType: m.attachment.mimeType, data: '', previewUrl: undefined }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setAttachment({
        mimeType: file.type,
        data: base64,
        previewUrl: result,
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

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if ((!textToSend && !attachment) || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: textToSend || 'حل المسألة الموجودة في الصورة خطوة بخطوة.',
      attachment: attachment
        ? {
            mimeType: attachment.mimeType,
            data: attachment.data,
            previewUrl: attachment.previewUrl,
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

    const currentHistory = activeConversation.messages;
    const nextHistory = [...currentHistory, userMsg];

    const derivedTitle =
      currentHistory.length === 0
        ? (textToSend || 'مسألة بالصورة').replace(/\$/g, '').slice(0, 38)
        : activeConversation.title;

    updateActiveConversation((conv) => ({
      ...conv,
      title: derivedTitle,
      updatedAt: Date.now(),
      messages: [...nextHistory, placeholderAssistant],
    }));

    if (!overrideText) {
      setInput('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
            attachment:
              m.attachment && m.attachment.data
                ? { mimeType: m.attachment.mimeType, data: m.attachment.data }
                : undefined,
          })),
          grade: activeConversation.grade,
          branch: activeConversation.branch,
          mode: activeConversation.mode,
          language,
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
            updateActiveConversation((conv) => ({
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m
              ),
            }));
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('لم يصل رد من المساعد الذكي. حاول مرة أخرى.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالمساعد الذكي.';
      updateActiveConversation((conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `عذراً، تعذر إكمال الحل الآن: ${message}`,
                isError: true,
              }
            : m
        ),
      }));
    } finally {
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
        conversations={conversations}
        activeId={activeConversation.id}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenFormulas={() => setFormulaDrawerOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Compact Top Bar (<= 56px) */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
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
              className="lg:hidden w-9 h-9 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0">
              <span className="text-sm font-bold text-[#132346] truncate block">
                مساعد مستر عمرو محسن
              </span>
            </div>
          </div>

          {/* Mode & Language Controls */}
          <div className="flex items-center gap-2 shrink-0">
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

            <PWAInstallButton />
          </div>
        </header>

        {/* Scrollable Chat Stage */}
        <div className="flex-1 overflow-y-auto math-grid-bg">
          {activeConversation.messages.length === 0 ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
              {/* Central Medallion Hero */}
              <div className="relative mb-6">
                <img
                  src="/amr-mohsen-hero.jpg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/logo-transparent.png';
                  }}
                  alt="شعار مستر عمرو محسن الرسمي"
                  className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl object-contain drop-shadow-2xl bg-white p-2 border border-slate-200/80 shadow-lg hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#132346] text-center text-balance">
                أهلاً بك في المساعد الذكي لمستر عمرو محسن
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 text-center max-w-xl leading-relaxed">
                مساعدك الشخصي في <strong className="text-[#132346]">الرياضيات و Math للمرحلة الإعدادية</strong> — اكتب مسألتك أو صورها من الكتاب وسيتم حلها وشرحها خطوة بخطوة.
              </p>

              {/* Mobile Quick Mode Switcher */}
              <div className="sm:hidden mt-4 flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    updateActiveConversation((c) => ({ ...c, mode: 'solve' }))
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeConversation.mode === 'solve'
                      ? 'bg-[#132346] text-white'
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeConversation.mode === 'quiz'
                      ? 'bg-[#132346] text-white'
                      : 'text-slate-600'
                  }`}
                >
                  اختبرني بسؤال
                </button>
              </div>

              {/* Quick Curriculum Starters */}
              <div className="w-full mt-8">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-500">
                    مسائل وموضوعات مقترحة · {activeGradeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormulaDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B86428] hover:text-[#9E531F] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>تصفح ملخص القوانين</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPrompts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendMessage(item.prompt)}
                      className="text-start rounded-xl bg-white border border-slate-200 p-4 hover:border-[#B86428] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                        <span>{item.branch === 'algebra' ? 'الجبر والإحصاء' : 'الهندسة'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-display">{item.titleEn}</span>
                      </div>
                      <p className="text-sm font-bold text-[#132346] group-hover:text-[#B86428] transition-colors">
                        {item.titleAr}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-5">
              {activeConversation.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLastAssistant =
                  !isUser && idx === activeConversation.messages.length - 1;

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#132346] text-white px-4 py-3 shadow-sm space-y-2">
                        {msg.attachment?.previewUrl && (
                          <img
                            src={msg.attachment.previewUrl}
                            alt="صورة المسألة المرفقة"
                            className="max-h-56 rounded-xl object-contain bg-white/10"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap" dir="auto">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <img
                      src="/logo-transparent.png"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/assets/aistudio/image_6971e0e5.png';
                      }}
                      alt="أيقونة مستر عمرو محسن"
                      className="w-9 h-9 rounded-full object-cover shrink-0 mt-1 shadow-xs bg-white"
                      referrerPolicy="no-referrer"
                    />

                    <div
                      className={`flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-white border p-4 sm:p-5 shadow-xs ${
                        msg.isError ? 'border-red-300 bg-red-50/40' : 'border-slate-200'
                      }`}
                    >
                      {msg.content ? (
                        <MathContent content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#B86428] animate-bounce" />
                          <span>جاري كتابة الحل خطوة بخطوة...</span>
                        </div>
                      )}

                      {msg.content && !(isLastAssistant && isStreaming) && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#132346] hover:bg-slate-100 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#059669]" />
                                <span>تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ الحل</span>
                              </>
                            )}
                          </button>

                          {!msg.isError && (
                            <button
                              type="button"
                              onClick={() =>
                                sendMessage('اديني مسألة تانية مشابهة لنفس الفكرة عشان أتدرب عليها.')
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#B86428] hover:bg-[#B86428]/10 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>مسألة مشابهة للتدريب</span>
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
                              <span>إعادة المحاولة</span>
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

        {/* Composer Area */}
        <footer className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 py-3">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Optional Quick Math Symbols Bar */}
            {showSymbolBar && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym.label}
                    type="button"
                    onClick={() => insertSymbol(sym.value)}
                    className="min-w-[36px] h-9 px-2 rounded-lg bg-slate-100 hover:bg-[#132346] hover:text-white text-sm font-mono-math font-semibold text-[#132346] transition-colors shrink-0"
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            )}

            {/* Attached Problem Photo Preview */}
            {attachment && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 w-fit">
                <img
                  src={attachment.previewUrl}
                  alt="معاينة الصورة"
                  className="w-12 h-12 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-medium text-slate-700">
                  تم إرفاق صورة المسألة
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                  aria-label="إزالة الصورة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-[#F8F9FB] px-2.5 py-2 focus-within:border-[#132346] focus-within:ring-2 focus-within:ring-[#132346]/10 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-[#132346] hover:bg-slate-200/70 transition-colors shrink-0"
                title="إرفاق صورة مسألة من الكتاب أو الكراسة"
                aria-label="رفع صورة مسألة"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowSymbolBar((prev) => !prev)}
                className={`min-w-[40px] min-h-[44px] px-2 flex items-center justify-center rounded-xl text-sm font-mono-math font-bold transition-colors shrink-0 ${
                  showSymbolBar
                    ? 'bg-[#132346] text-white'
                    : 'text-slate-600 hover:text-[#132346] hover:bg-slate-200/70'
                }`}
                title="لوحة الرموز الرياضية"
                aria-label="إظهار أو إخفاء الرموز الرياضية"
              >
                π√
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                dir="auto"
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
                placeholder="اكتب سؤالك أو مسألة الـ Math هنا... (مثال: حل المعادلة x² - 5x + 6 = 0)"
                className="flex-1 bg-transparent resize-none border-0 focus:outline-none text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 py-2.5 max-h-36"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isStreaming || (!input.trim() && !attachment)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#132346] text-white hover:bg-[#1C3263] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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

      <OfflineIndicator />
    </div>
  );
}
