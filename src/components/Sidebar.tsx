import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Phone,
  BookOpen,
  X,
  MessageCircle,
} from 'lucide-react';
import { BRANCH_OPTIONS, GRADE_OPTIONS } from '../data/curriculum';
import type { Conversation, MathBranch, PrepGrade } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  grade: PrepGrade;
  onChangeGrade: (grade: PrepGrade) => void;
  branch: MathBranch;
  onChangeBranch: (branch: MathBranch) => void;
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenFormulas: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  grade,
  onChangeGrade,
  branch,
  onChangeBranch,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenFormulas,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-80 bg-[#132346] text-white flex flex-col border-l border-white/10 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Emblem Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-transparent.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_6971e0e5.png';
              }}
              alt="شعار مستر عمرو محسن"
              className="w-12 h-12 rounded-full object-cover shrink-0 shadow-md ring-2 ring-[#C9A25D]/60 bg-white"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold tracking-tight text-white truncate">
                Mr. Amr Mohsen
              </h1>
              <p className="text-xs text-slate-300 truncate">
                رياضيات المرحلة الإعدادية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary New Chat + Formula Sheet Actions */}
        <div className="p-4 space-y-2.5 border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#B86428] hover:bg-[#A1541E] text-white py-2.5 px-4 text-sm font-semibold shadow-sm transition-colors min-h-[44px]"
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
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 py-2.5 px-4 text-xs font-semibold transition-colors min-h-[42px]"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-[#E6B87A]" />
            <span>ملخص القوانين الهامة</span>
          </button>
        </div>

        {/* Grade & Branch Selectors */}
        <div className="p-4 space-y-4 border-b border-white/10">
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">الصف الدراسي</p>
            <div className="grid grid-cols-3 gap-1.5 bg-[#0C1833] p-1 rounded-xl">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChangeGrade(g.id)}
                  className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    grade === g.id
                      ? 'bg-white text-[#132346] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {g.labelAr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">الفرع</p>
            <div className="grid grid-cols-3 gap-1.5 bg-[#0C1833] p-1 rounded-xl">
              {BRANCH_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChangeBranch(b.id)}
                  className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap truncate ${
                    branch === b.id
                      ? 'bg-[#B86428] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {b.labelAr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Saved Conversations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-2 py-1 text-xs font-semibold text-slate-400">
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
                  className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="flex-1 flex items-center gap-2.5 text-start min-w-0 min-h-[36px]"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-[#E6B87A]" />
                    <span className="text-xs font-medium truncate">{conv.title}</span>
                  </button>
                  {conversations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteConversation(conv.id)}
                      className="opacity-70 lg:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-white/10 transition-all shrink-0"
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

        {/* Teacher Direct Contact Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0E1B38] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-white">تواصل مع مستر عمرو محسن</span>
            <span className="font-mono-math text-[#E6B87A]" dir="ltr">
              01211143632
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:01211143632"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 py-2 px-2 text-xs font-medium text-white transition-colors min-h-[40px]"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>اتصال</span>
            </a>
            <a
              href="https://wa.me/201211143632"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] py-2 px-2 text-xs font-medium text-white transition-colors min-h-[40px]"
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
