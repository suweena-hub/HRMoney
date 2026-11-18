import React, { useState } from 'react';
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { ContractPrintModal } from './components/ContractPrintModal';
import { ContractsView } from './components/ContractsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OverviewView } from './components/OverviewView';
import { PayrollView } from './components/PayrollView';
import { PersonnelView } from './components/PersonnelView';
import { SettingsSyncView } from './components/SettingsSyncView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { ActiveTab, Personnel, ServiceContract } from './types';

function AppContent() {
  const workspace = useWorkspaceData();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [printingContract, setPrintingContract] = useState<ServiceContract | null>(null);
  const [preselectedForPayroll, setPreselectedForPayroll] = useState<Personnel | null>(null);
  const [preselectedForContract, setPreselectedForContract] = useState<Personnel | null>(null);

  const [triggerCreatePersonnel, setTriggerCreatePersonnel] = useState(false);
  const [triggerCreatePayroll, setTriggerCreatePayroll] = useState(false);
  const [triggerCreateContract, setTriggerCreateContract] = useState(false);

  const primaryActionConfig: Record<ActiveTab, { label: string; handler: () => void }> = {
    overview: {
      label: 'เพิ่มบุคลากร',
      handler: () => {
        setActiveTab('personnel');
        setTriggerCreatePersonnel(true);
      },
    },
    personnel: {
      label: 'เพิ่มบุคลากร',
      handler: () => setTriggerCreatePersonnel(true),
    },
    payroll: {
      label: 'คำนวณเงินเดือน',
      handler: () => setTriggerCreatePayroll(true),
    },
    contracts: {
      label: 'จัดทำสัญญาจ้าง',
      handler: () => setTriggerCreateContract(true),
    },
    settings: {
      label: 'ซิงค์ข้อมูล',
      handler: () => void workspace.syncPendingToCloud(),
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        counts={{
          personnel: workspace.personnel.length,
          payrolls: workspace.payrolls.length,
          contracts: workspace.contracts.length,
        }}
        connectionMode={workspace.connectionSummary.mode}
        connectionLabel={workspace.connectionSummary.label}
        pendingSyncCount={workspace.pendingSyncCount}
        syncing={workspace.syncing}
        onSyncNow={() => void workspace.syncPendingToCloud()}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onPrimaryAction={primaryActionConfig[activeTab].handler}
          primaryActionLabel={primaryActionConfig[activeTab].label}
          isOnline={workspace.isOnline}
          forceOfflineMode={workspace.forceOfflineMode}
          onToggleForceOffline={workspace.toggleForceOffline}
          userEmail={workspace.user?.email}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto no-print">
          {workspace.loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  orgSetting={workspace.orgSetting}
                  personnel={workspace.personnel}
                  payrolls={workspace.payrolls}
                  contracts={workspace.contracts}
                  onNavigate={setActiveTab}
                  onAddPersonnel={() => {
                    setActiveTab('personnel');
                    setTriggerCreatePersonnel(true);
                  }}
                  onCreateContract={() => {
                    setActiveTab('contracts');
                    setTriggerCreateContract(true);
                  }}
                  onPrintContract={setPrintingContract}
                  onLoadSampleData={() => void workspace.loadSampleData()}
                />
              )}

              {activeTab === 'personnel' && (
                <PersonnelView
                  personnel={workspace.personnel}
                  defaultTaxRate={workspace.orgSetting.defaultWithholdingTaxRate}
                  onSavePersonnel={workspace.savePersonnel}
                  onDeletePersonnel={workspace.deletePersonnel}
                  onGoToPayroll={(person) => {
                    setPreselectedForPayroll(person);
                    setActiveTab('payroll');
                  }}
                  onGoToContract={(person) => {
                    setPreselectedForContract(person);
                    setActiveTab('contracts');
                  }}
                  externalOpenCreate={triggerCreatePersonnel}
                  onConsumedExternalCreate={() => setTriggerCreatePersonnel(false)}
                />
              )}

              {activeTab === 'payroll' && (
                <PayrollView
                  personnel={workspace.personnel}
                  payrolls={workspace.payrolls}
                  orgSetting={workspace.orgSetting}
                  preselectedPerson={preselectedForPayroll}
                  onClearPreselectedPerson={() => setPreselectedForPayroll(null)}
                  onSavePayroll={workspace.savePayroll}
                  onDeletePayroll={workspace.deletePayroll}
                  externalOpenCreate={triggerCreatePayroll}
                  onConsumedExternalCreate={() => setTriggerCreatePayroll(false)}
                />
              )}

              {activeTab === 'contracts' && (
                <ContractsView
                  contracts={workspace.contracts}
                  personnel={workspace.personnel}
                  orgSetting={workspace.orgSetting}
                  preselectedPerson={preselectedForContract}
                  onClearPreselectedPerson={() => setPreselectedForContract(null)}
                  onSaveContract={workspace.saveContract}
                  onDeleteContract={workspace.deleteContract}
                  onPrintContract={setPrintingContract}
                  externalOpenCreate={triggerCreateContract}
                  onConsumedExternalCreate={() => setTriggerCreateContract(false)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsSyncView
                  user={workspace.user}
                  isOnline={workspace.isOnline}
                  forceOfflineMode={workspace.forceOfflineMode}
                  connectionLabel={workspace.connectionSummary.label}
                  pendingSyncCount={workspace.pendingSyncCount}
                  syncing={workspace.syncing}
                  orgSetting={workspace.orgSetting}
                  onToggleForceOffline={workspace.toggleForceOffline}
                  onSignInGoogle={workspace.signInWithGoogle}
                  onSignOut={workspace.signOutAccount}
                  onSyncNow={workspace.syncPendingToCloud}
                  onSaveOrgSetting={workspace.saveOrganizationSetting}
                  onLoadSampleData={workspace.loadSampleData}
                  onExportBackup={workspace.exportBackupJson}
                  onImportBackup={workspace.importBackupJson}
                  onResetLocalCache={workspace.resetLocalCache}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Printable A4 Contract Viewer Modal */}
      {printingContract && (
        <ContractPrintModal
          contract={printingContract}
          onClose={() => setPrintingContract(null)}
        />
      )}

      {/* Toast Notification */}
      {workspace.toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm no-print ${
            workspace.toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : workspace.toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {workspace.toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : workspace.toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-300 shrink-0" />
          )}
          <span className="flex-1">{workspace.toast.text}</span>
          <button
            type="button"
            onClick={workspace.dismissToast}
            className="p-1 text-white/70 hover:text-white rounded"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
