import React, { useRef, useState } from 'react';
import {
  Cloud,
  CloudOff,
  Database,
  Download,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FIELD_LIMITS, OrganizationSetting } from '../types';

interface SettingsSyncViewProps {
  user: User | null;
  isOnline: boolean;
  forceOfflineMode: boolean;
  connectionLabel: string;
  pendingSyncCount: number;
  syncing: boolean;
  orgSetting: OrganizationSetting;
  onToggleForceOffline: (next: boolean) => void;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  onSaveOrgSetting: (
    next: Omit<OrganizationSetting, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onLoadSampleData: () => Promise<void>;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  onResetLocalCache: () => Promise<void>;
}

export const SettingsSyncView: React.FC<SettingsSyncViewProps> = ({
  user,
  isOnline,
  forceOfflineMode,
  connectionLabel,
  pendingSyncCount,
  syncing,
  orgSetting,
  onToggleForceOffline,
  onSignInGoogle,
  onSignOut,
  onSyncNow,
  onSaveOrgSetting,
  onLoadSampleData,
  onExportBackup,
  onImportBackup,
  onResetLocalCache,
}) => {
  const [orgName, setOrgName] = useState(orgSetting.orgName);
  const [orgAddress, setOrgAddress] = useState(orgSetting.orgAddress);
  const [orgTaxId, setOrgTaxId] = useState(orgSetting.orgTaxId || '');
  const [authorizedSignatory, setAuthorizedSignatory] = useState(orgSetting.authorizedSignatory);
  const [signatoryPosition, setSignatoryPosition] = useState(orgSetting.signatoryPosition);
  const [defaultWitness1, setDefaultWitness1] = useState(orgSetting.defaultWitness1 || '');
  const [defaultWitness2, setDefaultWitness2] = useState(orgSetting.defaultWitness2 || '');
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(orgSetting.defaultWithholdingTaxRate));
  const [savingOrg, setSavingOrg] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setOrgName(orgSetting.orgName);
    setOrgAddress(orgSetting.orgAddress);
    setOrgTaxId(orgSetting.orgTaxId || '');
    setAuthorizedSignatory(orgSetting.authorizedSignatory);
    setSignatoryPosition(orgSetting.signatoryPosition);
    setDefaultWitness1(orgSetting.defaultWitness1 || '');
    setDefaultWitness2(orgSetting.defaultWitness2 || '');
    setDefaultTaxRate(String(orgSetting.defaultWithholdingTaxRate));
  }, [orgSetting]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await onSaveOrgSetting({
        orgName: orgName.trim(),
        orgAddress: orgAddress.trim(),
        orgTaxId: orgTaxId.trim(),
        authorizedSignatory: authorizedSignatory.trim(),
        signatoryPosition: signatoryPosition.trim(),
        defaultWitness1: defaultWitness1.trim(),
        defaultWitness2: defaultWitness2.trim(),
        defaultWithholdingTaxRate: Math.max(0, Math.min(15, Number(defaultTaxRate) || 0)),
      });
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Online / Offline & Cloud Sync Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              โหมดการทำงานออนไลน์และออฟไลน์ (Cloud & Local Sync)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลทุกชุดจะถูกจัดเก็บใน IndexedDB บนอุปกรณ์นี้เสมอเพื่อให้ใช้งานได้แม้อยู่ในพื้นที่ไม่มีสัญญาณอินเทอร์เน็ต
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOnline && !forceOfflineMode && user ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Cloud className="w-4 h-4" />
                {connectionLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <CloudOff className="w-4 h-4" />
                {connectionLabel}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account & Sync */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-800">บัญชีคลาวด์ Firebase</h3>
            {user ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">เข้าสู่ระบบด้วยบัญชี Google</p>
                  <p className="text-sm font-medium text-slate-900">{user.displayName || user.email}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onSyncNow()}
                    disabled={!isOnline || forceOfflineMode || syncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    ซิงค์ขึ้นคลาวด์ ({pendingSyncCount} รายการรอซิงค์)
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600">
                  ขณะนี้ระบบกำลังบันทึกข้อมูลแบบออฟไลน์ในอุปกรณ์นี้ หากต้องการซิงค์ข้อมูลข้ามอุปกรณ์ผ่านระบบออนไลน์ สามารถลงชื่อเข้าใช้ด้วยบัญชี Google ได้ทันที
                </p>
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={() => void onSignInGoogle()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ Google เพื่อซิงค์ออนไลน์
                </button>
              </div>
            )}
          </div>

          {/* Working Mode Switch & Backup */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-800">สลับโหมดและสำรองไฟล์ข้อมูล</h3>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">บังคับใช้งานโหมดออฟไลน์</p>
                  <p className="text-xs text-slate-500">
                    ทำงานกับข้อมูลในเครื่องโดยไม่ส่งข้อมูลผ่านเครือข่ายชั่วคราว
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleForceOffline(!forceOfflineMode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    forceOfflineMode
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {forceOfflineMode ? 'กำลังใช้ออฟไลน์' : 'เปิดโหมดออฟไลน์'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  ส่งออกไฟล์สำรอง (.json)
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  นำเข้าไฟล์สำรอง (.json)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onImportBackup(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => void onLoadSampleData()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
                >
                  <Database className="w-3.5 h-3.5" />
                  เติมข้อมูลตัวอย่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization / Contract Signatory Settings */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="border-b border-slate-200 pb-4 mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            ข้อมูลหน่วยงานและผู้มีอำนาจลงนามในสัญญาจ้าง
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลส่วนนี้จะถูกดึงไปใส่ในหัวกระดาษสัญญาจ้างเหมาบริการและใบแจ้งจ่ายค่าตอบแทนโดยอัตโนมัติ
          </p>
        </div>

        <form onSubmit={(e) => void handleSaveOrg(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อหน่วยงาน / องค์กร *</label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.orgNameMax}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                เลขประจำตัวผู้เสียภาษี / รหัสหน่วยงาน
              </label>
              <input
                type="text"
                maxLength={FIELD_LIMITS.orgTaxIdMax}
                value={orgTaxId}
                onChange={(e) => setOrgTaxId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">ที่ตั้งหน่วยงาน *</label>
              <textarea
                rows={2}
                required
                maxLength={FIELD_LIMITS.orgAddressMax}
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ชื่อ-นามสกุลผู้มีอำนาจลงนาม (ผู้ว่าจ้าง) *
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.signatoryMax}
                value={authorizedSignatory}
                onChange={(e) => setAuthorizedSignatory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่งผู้มีอำนาจลงนาม *</label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.signatoryMax}
                value={signatoryPosition}
                onChange={(e) => setSignatoryPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">พยานเริ่มต้นคนที่ 1</label>
              <input
                type="text"
                maxLength={FIELD_LIMITS.signatoryMax}
                value={defaultWitness1}
                onChange={(e) => setDefaultWitness1(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">พยานเริ่มต้นคนที่ 2</label>
              <input
                type="text"
                maxLength={FIELD_LIMITS.signatoryMax}
                value={defaultWitness2}
                onChange={(e) => setDefaultWitness2(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                อัตราภาษีหัก ณ ที่จ่ายเริ่มต้น (%)
              </label>
              <input
                type="number"
                min={0}
                max={15}
                step="0.5"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              {confirmReset ? (
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs text-red-700">ยืนยันล้างแคชในเครื่องทั้งหมด?</span>
                  <button
                    type="button"
                    onClick={() => {
                      void onResetLocalCache();
                      setConfirmReset(false);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    ยืนยันล้างข้อมูล
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ล้างข้อมูลแคชออฟไลน์ในเครื่อง
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={savingOrg}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingOrg ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าหน่วยงาน'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
