import React from 'react';
import { Menu, Plus, Wifi, WifiOff } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  isOnline: boolean;
  forceOfflineMode: boolean;
  onToggleForceOffline: (next: boolean) => void;
  userEmail?: string | null;
}

const TAB_TITLES: Record<ActiveTab, string> = {
  overview: 'ภาพรวมงานบุคลากรและสัญญาจ้าง',
  personnel: 'ทะเบียนข้อมูลบุคลากร',
  payroll: 'คำนวณเงินเดือนและค่าตอบแทน',
  contracts: 'จัดทำสัญญาจ้างเหมาบริการ',
  settings: 'ตั้งค่าหน่วยงานและการซิงค์ข้อมูล',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onPrimaryAction,
  primaryActionLabel,
  isOnline,
  forceOfflineMode,
  onToggleForceOffline,
  userEmail,
}) => {
  const effectiveOnline = isOnline && !forceOfflineMode;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8 sticky top-0 z-30 no-print">
      {/* Zone 1: Page / Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
          {TAB_TITLES[activeTab]}
        </h1>
      </div>

      {/* Zone 2: Online/Offline Switch & Account text */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-600 shrink-0">
        <button
          type="button"
          onClick={() => onToggleForceOffline(!forceOfflineMode)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            effectiveOnline
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70'
              : 'border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80'
          }`}
          title="สลับโหมดการทำงานออนไลน์ / ออฟไลน์"
        >
          {effectiveOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              ออนไลน์
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              ออฟไลน์ในเครื่อง
            </>
          )}
        </button>
        {userEmail && (
          <span className="text-slate-500 truncate max-w-[180px]" title={userEmail}>
            {userEmail}
          </span>
        )}
      </div>

      {/* Zone 3: Single Primary Action */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{primaryActionLabel}</span>
        </button>
      </div>
    </header>
  );
};
