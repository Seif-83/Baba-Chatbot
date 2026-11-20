import React, { useState } from 'react';
import { BookOpen, X, ArrowUpLeft } from 'lucide-react';
import { FORMULA_CARDS, GRADE_OPTIONS } from '../data/curriculum';
import type { PrepGrade } from '../types/chat';
import { MathContent } from './MathContent';

interface FormulaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGrade: PrepGrade;
  onSelectFormulaPrompt: (prompt: string) => void;
}

export const FormulaDrawer: React.FC<FormulaDrawerProps> = ({
  isOpen,
  onClose,
  activeGrade,
  onSelectFormulaPrompt,
}) => {
  const [filterGrade, setFilterGrade] = useState<'all' | PrepGrade>(activeGrade);

  if (!isOpen) return null;

  const filtered =
    filterGrade === 'all'
      ? FORMULA_CARDS
      : FORMULA_CARDS.filter((item) => item.grade === filterGrade);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-0 sm:p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-sheet-title"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="w-full max-w-3xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden pb-safe">
        {/* Mobile drag pill indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-[#F8F9FB]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#132346] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#E6B87A]" />
            </div>
            <div className="min-w-0">
              <h2 id="formula-sheet-title" className="text-sm sm:text-base font-bold text-[#132346] truncate">
                ملخص قوانين المرحلة الإعدادية
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                اضغط على أي قانون ليشرحه لك المساعد الذكي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 active:scale-95 transition-all"
            aria-label="إغلاق ملخص القوانين"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills with smooth horizontal scrolling */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-200 flex items-center gap-1.5 sm:gap-2 overflow-x-auto bg-white">
          <button
            type="button"
            onClick={() => setFilterGrade('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
              filterGrade === 'all'
                ? 'bg-[#132346] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كل الصفوف
          </button>
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setFilterGrade(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                filterGrade === g.id
                  ? 'bg-[#132346] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {g.labelAr}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-[#F8F9FB]">
          {filtered.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                onSelectFormulaPrompt(card.askPrompt);
                onClose();
              }}
              className="text-start group rounded-xl bg-white border border-slate-200 p-3.5 sm:p-4 hover:border-[#B86428] hover:shadow-md active:scale-[0.99] transition-all flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#132346]">{card.title}</span>
                  <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-[#B86428] transition-colors shrink-0" />
                </div>
                <div className="mt-1.5 overflow-x-auto">
                  <MathContent content={`$$${card.latex}$$`} />
                </div>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                <MathContent content={card.note} className="text-xs" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
