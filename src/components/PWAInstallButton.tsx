import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-100 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        ติดตั้งแอปลงเครื่อง (PWA)
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          ติดตั้งบน iOS / iPadOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">ติดตั้งแอปบน iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                <li>แตะปุ่มแชร์ (Share) ที่แถบเครื่องมือของ Safari</li>
                <li>เลื่อนลงแล้วเลือกคำสั่ง &quot;เพิ่มไปยังหน้าจอโฮม&quot; (Add to Home Screen)</li>
                <li>แตะ &quot;เพิ่ม&quot; เพื่อใช้งานแบบเต็มหน้าจอและออฟไลน์</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
