import React, { useState } from 'react';
import { Download, Smartphone, Share, X, CheckCircle2, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-lg bg-[#B86428] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#9E531F] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[40px]"
        aria-label="تثبيت التطبيق وإضافة اختصار للشاشة الرئيسية"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#132346] text-white">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="شعار تطبيق مستر عمرو محسن"
                  className="w-10 h-10 rounded-full object-cover bg-white/10"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-bold">
                    إضافة اختصار التطبيق
                  </h3>
                  <p className="text-xs text-slate-300">Mr. Amr Mohsen · Math AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F8F9FB] border border-slate-200">
                <img
                  src="/pwa-192x192.png"
                  alt="أيقونة الاختصار"
                  className="w-14 h-14 rounded-2xl shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-[#132346]">Amr Mohsen</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    سيظهر الشعار الرسمي على شاشة الموبايل أو سطح المكتب كتطبيق مستقل.
                  </p>
                </div>
              </div>

              {isIOS ? (
                <ol className="space-y-2.5 text-slate-700 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#132346] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      اضغط على زر <strong className="text-[#132346]">المشاركة (Share)</strong>{' '}
                      <Share className="inline w-4 h-4 text-[#B86428] mx-0.5" /> في شريط متصفح Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#132346] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      اختر <strong className="text-[#132346]">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> ثم اضغط <strong className="text-[#132346]">إضافة</strong>.
                    </span>
                  </li>
                </ol>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-5 h-5 text-[#B86428] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#132346]">على الموبايل (Android / Chrome):</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        افتح قائمة المتصفح (⋮) ثم اختر <strong>تثبيت التطبيق (Install App)</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#132346]">على الكمبيوتر (Chrome / Edge):</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        اضغط على أيقونة التثبيت في شريط العنوان أو من قائمة المتصفح اختر <strong>Save and share → Install / Create shortcut</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#132346] text-white text-sm font-semibold hover:bg-[#1B3161] transition-colors"
              >
                فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>أنت غير متصل بالإنترنت — المحادثات المحفوظة متاحة للمراجعة</span>
    </div>
  );
};
