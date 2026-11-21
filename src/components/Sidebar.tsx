import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Phone,
  BookOpen,
  X,
  MessageCircle,
  Sparkles,
  Languages,
  GraduationCap,
  Cpu,
} from 'lucide-react';
import { BRANCH_OPTIONS, GRADE_OPTIONS } from '../data/curriculum';
import { AI_MODELS } from '../data/models';
import type { Conversation, MathBranch, PrepGrade, TutorMode, LanguagePreference } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  grade: PrepGrade;
  onChangeGrade: (grade: PrepGrade) => void;
  branch: MathBranch;
  onChangeBranch: (branch: MathBranch) => void;
  mode?: TutorMode;
  onChangeMode?: (mode: TutorMode) => void;
  language?: LanguagePreference;
  onChangeLanguage?: (language: LanguagePreference) => void;
  selectedModelId?: string;
  onChangeModelId?: (modelId: string) => void;
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenFormulas: () => void;
  onOpenMaterials?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  grade,
  onChangeGrade,
  branch,
  onChangeBranch,
  mode = 'solve',
  onChangeMode,
  language = 'en',
  onChangeLanguage,
  selectedModelId,
  onChangeModelId,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenFormulas,
  onOpenMaterials,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-[min(20rem,85vw)] bg-[#132346] text-white flex flex-col border-l border-white/10 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Emblem Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-transparent.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_6971e0e5.png';
              }}
              alt="شعار مستر عمرو محسن"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 shadow-md ring-2 ring-[#C9A25D]/60 bg-white"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-white truncate">
                Mr. Amr Mohsen
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                رياضيات المرحلة الإعدادية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary New Chat + Formula Sheet Actions */}
        <div className="p-3 sm:p-4 space-y-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#B86428] hover:bg-[#A1541E] active:scale-[0.98] text-white py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-sm transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>محادثة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenFormulas();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-slate-100 py-2.5 px-4 text-xs font-semibold transition-all min-h-[42px]"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-[#E6B87A]" />
            <span>ملخص القوانين الهامة</span>
          </button>

          {onOpenMaterials && (
            <button
              type="button"
              onClick={() => {
                onOpenMaterials();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 hover:bg-amber-500/30 active:scale-[0.98] text-amber-200 py-2.5 px-4 text-xs font-semibold transition-all min-h-[42px]"
            >
              <GraduationCap className="w-4 h-4 shrink-0 text-[#C9A25D]" />
              <span>بنك الامتحانات والمذكرات</span>
            </button>
          )}
        </div>

        {/* Scrollable selectors and conversations */}
        <div className="flex-1 overflow-y-auto space-y-3.5 p-3 sm:p-4">
          {/* Grade Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-1.5 px-1">الصف الدراسي</p>
            <div className="grid grid-cols-3 gap-1.5 bg-[#0C1833] p-1 rounded-xl">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChangeGrade(g.id)}
                  className={`py-2 px-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap active:scale-95 text-center ${
                    grade === g.id
                      ? 'bg-white text-[#132346] shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {g.labelAr}
                </button>
              ))}
            </div>
          </div>
          

          {/* Mobile-only Quick Controls: Mode & Language */}
          <div className="sm:hidden space-y-3 pt-1 border-t border-white/10">
            {onChangeMode && (
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1.5 px-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E6B87A]" />
                  <span>طريقة الشرح والحل</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0C1833] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onChangeMode('solve')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                      mode === 'solve'
                        ? 'bg-white text-[#132346] shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    شرح وحل
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode('quiz')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                      mode === 'quiz'
                        ? 'bg-white text-[#132346] shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    اختبرني
                  </button>
                </div>
              </div>
            )}

            {onChangeLanguage && (
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1.5 px-1 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#E6B87A]" />
                  <span>لغة الشرح (Math / عربي)</span>
                </p>
                <div className="grid grid-cols-3 gap-1 bg-[#0C1833] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('en')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      language === 'en'
                        ? 'bg-[#B86428] text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('bilingual')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      language === 'bilingual'
                        ? 'bg-[#B86428] text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    عربي + Math
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('ar')}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      language === 'ar'
                        ? 'bg-[#B86428] text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    عربي فقط
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Model Selector */}
          {onChangeModelId && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-300 mb-1.5 px-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#E6B87A]" />
                <span>محرك الذكاء الاصطناعي (Model)</span>
              </p>
              <div className="space-y-1">
                <select
                  value={selectedModelId || AI_MODELS[0].id}
                  onChange={(e) => onChangeModelId(e.target.value)}
                  className="w-full rounded-xl bg-[#0C1833] border border-white/10 text-white text-xs px-2.5 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-[#B86428]"
                >
                  {AI_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#132346] text-white">
                      {m.labelAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Recent Saved Conversations */}
          <div className="space-y-1 pt-2">
            <p className="px-1 py-1 text-xs font-semibold text-slate-400">
              المحادثات السابقة
            </p>
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-400">
                لا توجد محادثات محفوظة بعد.
              </p>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 rounded-xl px-2.5 py-1.5 sm:py-2 transition-colors ${
                      isActive
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                      className="flex-1 flex items-center gap-2.5 text-start min-w-0 min-h-[38px]"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-[#E6B87A]" />
                      <span className="text-xs font-medium truncate">{conv.title}</span>
                    </button>
                    {conversations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteConversation(conv.id)}
                        className="opacity-70 lg:opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-white/10 active:scale-95 transition-all shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="حذف المحادثة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Teacher Direct Contact Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0E1B38] space-y-2.5 pb-safe">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-white">تواصل مع مستر عمرو محسن</span>
            <span className="font-mono-math text-[#E6B87A]" dir="ltr">
              01211143632
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:01211143632"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 py-2 px-2 text-xs font-medium text-white transition-colors min-h-[42px]"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>اتصال</span>
            </a>
            <a
              href="https://wa.me/201211143632"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-98 py-2 px-2 text-xs font-medium text-white transition-colors min-h-[42px]"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>واتساب</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
