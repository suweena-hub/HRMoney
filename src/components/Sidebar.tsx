import React from 'react';
import {
  Calculator,
  Cloud,
  CloudOff,
  FileSignature,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    personnel: number;
    payrolls: number;
    contracts: number;
  };
  connectionMode: 'offline-network' | 'offline-forced' | 'local-only' | 'cloud-online';
  connectionLabel: string;
  pendingSyncCount: number;
  syncing: boolean;
  onSyncNow: () => void;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
  { id: 'personnel', label: 'ทะเบียนบุคลากร', icon: Users },
  { id: 'payroll', label: 'คำนวณเงินเดือน', icon: Calculator },
  { id: 'contracts', label: 'สัญญาจ้างเหมาบริการ', icon: FileSignature },
  { id: 'settings', label: 'ตั้งค่าและซิงค์ข้อมูล', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  counts,
  connectionMode,
  connectionLabel,
  pendingSyncCount,
  syncing,
  onSyncNow,
}) => {
  const getCount = (id: ActiveTab): number | null => {
    if (id === 'personnel') return counts.personnel;
    if (id === 'payroll') return counts.payrolls;
    if (id === 'contracts') return counts.contracts;
    return null;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap truncate">
          ระบบบริหารงานบุคลากร
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          aria-label="ปิดเมนู"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="เมนูหลัก">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const itemCount = getCount(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {itemCount !== null && (
                <span
                  className={`text-xs font-mono-num tabular-nums ml-2 ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            {connectionMode === 'cloud-online' ? (
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{connectionLabel}</span>
          </div>
          {pendingSyncCount > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700">
              <span className="text-xs text-amber-300 tabular-nums">
                รอซิงค์ {pendingSyncCount} รายการ
              </span>
              {connectionMode === 'cloud-online' && (
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={syncing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  ซิงค์
                </button>
              )}
            </div>
          )}
        </div>

        <PWAInstallButton />
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 no-print">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
};
