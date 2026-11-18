import React from 'react';
import {
  ArrowRight,
  Calculator,
  Database,
  FileSignature,
  Printer,
  UserPlus,
  Users,
} from 'lucide-react';
import { ActiveTab, OrganizationSetting, PayrollRecord, Personnel, ServiceContract } from '../types';
import { formatCurrency, formatThaiDate, THAI_MONTHS } from '../utils/thaiFormat';

interface OverviewViewProps {
  orgSetting: OrganizationSetting;
  personnel: Personnel[];
  payrolls: PayrollRecord[];
  contracts: ServiceContract[];
  onNavigate: (tab: ActiveTab) => void;
  onAddPersonnel: () => void;
  onCreateContract: () => void;
  onPrintContract: (contract: ServiceContract) => void;
  onLoadSampleData: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  orgSetting,
  personnel,
  payrolls,
  contracts,
  onNavigate,
  onAddPersonnel,
  onCreateContract,
  onPrintContract,
  onLoadSampleData,
}) => {
  const serviceStaffCount = personnel.filter((p) => p.employmentType === 'จ้างเหมาบริการ').length;
  const activeContracts = contracts.filter((c) => c.status === 'มีผลบังคับใช้');
  const pendingContracts = contracts.filter(
    (c) => c.status === 'ร่างสัญญา' || c.status === 'รอลงนาม'
  );

  const latestPeriod = payrolls.length > 0 ? { month: payrolls[0].month, year: payrolls[0].year } : null;
  const latestPayrolls = latestPeriod
    ? payrolls.filter((p) => p.month === latestPeriod.month && p.year === latestPeriod.year)
    : [];
  const latestNetTotal = latestPayrolls.reduce((sum, item) => sum + item.netPay, 0);

  const isEmptyWorkspace = personnel.length === 0 && payrolls.length === 0 && contracts.length === 0;

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            หน่วยงานผู้ว่าจ้าง · เลขผู้เสียภาษี {orgSetting.orgTaxId || '-'}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{orgSetting.orgName}</h2>
          <p className="text-sm text-slate-600">
            ผู้มีอำนาจลงนาม: {orgSetting.authorizedSignatory} ({orgSetting.signatoryPosition})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onAddPersonnel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มบุคลากร
          </button>
          <button
            type="button"
            onClick={onCreateContract}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileSignature className="w-4 h-4" />
            จัดทำสัญญาจ้างใหม่
          </button>
        </div>
      </div>

      {isEmptyWorkspace && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            เริ่มต้นระบบทะเบียนบุคลากรและสัญญาจ้างเหมาบริการ
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            คุณสามารถเพิ่มข้อมูลบุคลากร คำนวณค่าตอบแทนรายเดือน และสร้างเอกสารสัญญาจ้างเหมาบริการเพื่อพิมพ์ลงนามได้ทันที
            ข้อมูลจะถูกบันทึกในเครื่องและซิงค์ขึ้นคลาวด์อัตโนมัติเมื่อออนไลน์
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddPersonnel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              เพิ่มบุคลากรคนแรก
            </button>
            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="w-4 h-4" />
              เติมข้อมูลตัวอย่างเพื่อทดลองระบบ
            </button>
          </div>
        </div>
      )}

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">บุคลากรในทะเบียนทั้งหมด</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono-num tabular-nums">
            {personnel.length} <span className="text-sm font-normal text-slate-500">คน</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            จ้างเหมาบริการ {serviceStaffCount} คน · ประเภทอื่น {personnel.length - serviceStaffCount} คน
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">สัญญาจ้างเหมาบริการ</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono-num tabular-nums">
            {activeContracts.length} <span className="text-sm font-normal text-slate-500">ฉบับ</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            มีผลบังคับใช้ · รอลงนาม/ร่าง {pendingContracts.length} ฉบับ
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            ยอดจ่ายสุทธิ {latestPeriod ? `${THAI_MONTHS[latestPeriod.month - 1]} ${latestPeriod.year + 543}` : 'เดือนล่าสุด'}
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-800 font-mono-num tabular-nums">
            {formatCurrency(latestNetTotal)}{' '}
            <span className="text-sm font-normal text-slate-500">บาท</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            คำนวณแล้ว {latestPayrolls.length} รายการ
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">บุคลากรที่รอจัดทำสัญญา</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700 font-mono-num tabular-nums">
            {personnel.filter((p) => p.status === 'รอทำสัญญา').length}{' '}
            <span className="text-sm font-normal text-slate-500">คน</span>
          </p>
          <button
            type="button"
            onClick={() => onNavigate('contracts')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
          >
            ไปยังทะเบียนสัญญา <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-Column Operational Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* Recent Contracts */}
        <section className="bg-white border border-slate-200 rounded-xl flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">รายการสัญญาจ้างเหมาบริการล่าสุด</h3>
            <button
              type="button"
              onClick={() => onNavigate('contracts')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              ดูทั้งหมด
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                ยังไม่มีเอกสารสัญญาจ้างในระบบ
              </div>
            ) : (
              contracts.slice(0, 5).map((contract) => (
                <div
                  key={contract.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-num font-medium text-slate-700">
                        {contract.contractNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{contract.status}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                      {contract.contractorName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {contract.positionTitle} · {formatThaiDate(contract.startDate)} –{' '}
                      {formatThaiDate(contract.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium font-mono-num tabular-nums text-slate-900">
                      {formatCurrency(contract.monthlyFee)} ฿
                    </span>
                    <button
                      type="button"
                      onClick={() => onPrintContract(contract)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      พิมพ์สัญญา
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Payrolls */}
        <section className="bg-white border border-slate-200 rounded-xl flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">สรุปการคำนวณเงินเดือนล่าสุด</h3>
            <button
              type="button"
              onClick={() => onNavigate('payroll')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              คำนวณเงินเดือน
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {payrolls.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                ยังไม่มีประวัติการคำนวณเงินเดือน
              </div>
            ) : (
              payrolls.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        {THAI_MONTHS[item.month - 1]} {item.year + 543}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.paymentStatus === 'อนุมัติจ่ายแล้ว'
                            ? 'text-emerald-700 font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {item.paymentStatus}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                      {item.personnelName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      ค่าจ้าง {formatCurrency(item.baseSalary)} · OT {formatCurrency(item.otAmount)} ·
                      หัก {formatCurrency(item.totalDeduction)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold font-mono-num tabular-nums text-blue-800">
                      {formatCurrency(item.netPay)} ฿
                    </p>
                    <p className="text-xs text-slate-400">ยอดรับสุทธิ</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
