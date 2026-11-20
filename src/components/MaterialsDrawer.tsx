import React, { useState } from 'react';
import { X, FileText, Download, Sparkles, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import { STUDY_MATERIALS, GRADE_LABELS, type MaterialItem } from '../data/materials';
import type { PrepGrade } from '../types/chat';

interface MaterialsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGrade?: PrepGrade;
  onSolveMaterial: (material: MaterialItem) => void;
}

export function MaterialsDrawer({
  isOpen,
  onClose,
  activeGrade = 'prep3',
  onSolveMaterial,
}: MaterialsDrawerProps) {
  const [selectedGrade, setSelectedGrade] = useState<'all' | PrepGrade>(activeGrade);
  const [selectedType, setSelectedType] = useState<'all' | 'exam' | 'booklet'>('all');

  if (!isOpen) return null;

  const filteredMaterials = STUDY_MATERIALS.filter((item) => {
    if (selectedGrade !== 'all' && item.grade !== selectedGrade) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مكتبة الامتحانات والمذكرات"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in fade-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#132346] to-[#1C3263] text-white pt-safe">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-[#C9A25D]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                مكتبة الامتحانات والمذكرات
              </h3>
              <p className="text-xs text-slate-300">
                مذكرات وامتحانات مستر عمرو محسن لمراحل الإعدادية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedGrade === 'all'
                  ? 'bg-[#132346] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع المراحل
            </button>
            {(['prep1', 'prep2', 'prep3'] as PrepGrade[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGrade === g
                    ? 'bg-[#132346] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {GRADE_LABELS[g]}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedType === 'all'
                  ? 'bg-white text-[#132346] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('exam')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedType === 'exam'
                  ? 'bg-white text-[#132346] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 الامتحانات
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('booklet')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedType === 'booklet'
                  ? 'bg-white text-[#132346] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📖 المذكرات
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 pb-safe">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">لا توجد ملفات في هذا القسم حالياً</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                الملفات التي تضيفها في مجلد <code>public/امتحانات</code> أو <code>public/مذكرات</code> ستظهر هنا للطلاب مباشرة.
              </p>
            </div>
          ) : (
            filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#132346] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shrink-0 text-red-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#132346]/10 text-[#132346]">
                        {GRADE_LABELS[item.grade]}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {item.type === 'exam' ? 'امتحان' : 'مذكرة'}
                      </span>
                      {item.fileSize && (
                        <span className="text-[11px] text-slate-400">
                          {item.fileSize}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[#132346] line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* View/Download Link */}
                  <a
                    href={encodeURI(item.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                    title="تحميل أو فتح ملف الـ PDF"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>تحميل الملف</span>
                  </a>

                  {/* Solve with AI Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSolveMaterial(item);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#B86428] to-[#9E531F] hover:opacity-95 active:scale-98 shadow-xs transition-all"
                    title="اطلب من المساعد الذكي حل وشرح هذا الامتحان خطوة بخطوة"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>حل بالذكاء الاصطناعي</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
