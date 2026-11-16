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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-sheet-title"
    >
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F8F9FB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#132346] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="formula-sheet-title" className="text-base font-bold text-[#132346]">
                ملخص قوانين المرحلة الإعدادية
              </h2>
              <p className="text-xs text-slate-500">
                اضغط على أي قانون ليشرحه لك المساعد الذكي مع مسألة تطبيقية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            aria-label="إغلاق ملخص القوانين"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto bg-white">
          <button
            type="button"
            onClick={() => setFilterGrade('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filterGrade === 'all'
                ? 'bg-[#132346] text-white'
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filterGrade === g.id
                  ? 'bg-[#132346] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {g.labelAr}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F9FB]">
          {filtered.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                onSelectFormulaPrompt(card.askPrompt);
                onClose();
              }}
              className="text-start group rounded-xl bg-white border border-slate-200 p-4 hover:border-[#B86428] hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#132346]">{card.title}</span>
                  <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-[#B86428] transition-colors shrink-0" />
                </div>
                <div className="mt-2">
                  <MathContent content={`$$${card.latex}$$`} />
                </div>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <MathContent content={card.note} className="text-xs" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
