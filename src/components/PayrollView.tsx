import React, { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  Printer,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { FIELD_LIMITS, OrganizationSetting, PaymentStatus, PayrollRecord, Personnel } from '../types';
import { bahtText, formatCurrency, generateSafeId, THAI_MONTHS } from '../utils/thaiFormat';
import { PayslipPrintModal } from './PayslipPrintModal';

interface PayrollViewProps {
  personnel: Personnel[];
  payrolls: PayrollRecord[];
  orgSetting: OrganizationSetting;
  preselectedPerson?: Personnel | null;
  onClearPreselectedPerson?: () => void;
  onSavePayroll: (item: PayrollRecord) => Promise<void>;
  onDeletePayroll: (id: string) => Promise<void>;
  externalOpenCreate?: boolean;
  onConsumedExternalCreate?: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  personnel,
  payrolls,
  orgSetting,
  preselectedPerson,
  onClearPreselectedPerson,
  onSavePayroll,
  onDeletePayroll,
  externalOpenCreate,
  onConsumedExternalCreate,
}) => {
  const nowDate = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(nowDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(nowDate.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<PayrollRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);

  // Calculator Form State
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [calcMonth, setCalcMonth] = useState<number>(nowDate.getMonth() + 1);
  const [calcYear, setCalcYear] = useState<number>(nowDate.getFullYear());
  const [baseSalary, setBaseSalary] = useState('0');
  const [otHours, setOtHours] = useState('0');
  const [otRate, setOtRate] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [absentDays, setAbsentDays] = useState('0');
  const [otherDeduction, setOtherDeduction] = useState('0');
  const [taxRate, setTaxRate] = useState('1');
  const [socialSecurityRate, setSocialSecurityRate] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('รอเบิกจ่าย');
  const [note, setNote] = useState('');

  const applyPersonnelDefaults = (person: Personnel) => {
    setSelectedPersonnelId(person.id);
    setBaseSalary(String(person.baseSalary));
    setOtHours('0');
    setOtRate(String(person.otHourlyRate));
    setAllowance(String(person.defaultAllowance));
    setAbsentDays('0');
    setOtherDeduction('0');
    setTaxRate(String(person.taxRate));
    setSocialSecurityRate(String(person.socialSecurityRate));
  };

  const openCreateModal = (person?: Personnel) => {
    setEditingRecord(null);
    setCalcMonth(filterMonth);
    setCalcYear(filterYear);
    setPaymentStatus('รอเบิกจ่าย');
    setNote('');
    const target = person || personnel[0];
    if (target) {
      applyPersonnelDefaults(target);
    } else {
      setSelectedPersonnelId('');
      setBaseSalary('0');
      setOtHours('0');
      setOtRate('0');
      setAllowance('0');
      setAbsentDays('0');
      setOtherDeduction('0');
      setTaxRate(String(orgSetting.defaultWithholdingTaxRate));
      setSocialSecurityRate('0');
    }
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (preselectedPerson) {
      openCreateModal(preselectedPerson);
      onClearPreselectedPerson?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPerson]);

  React.useEffect(() => {
    if (externalOpenCreate) {
      openCreateModal();
      onConsumedExternalCreate?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenCreate]);

  const openEditModal = (rec: PayrollRecord) => {
    setEditingRecord(rec);
    setSelectedPersonnelId(rec.personnelId);
    setCalcMonth(rec.month);
    setCalcYear(rec.year);
    setBaseSalary(String(rec.baseSalary));
    setOtHours(String(rec.otHours));
    const derivedRate = rec.otHours > 0 ? rec.otAmount / rec.otHours : 0;
    const matchedPerson = personnel.find((p) => p.id === rec.personnelId);
    setOtRate(String(derivedRate || matchedPerson?.otHourlyRate || 0));
    setAllowance(String(rec.allowance));
    setAbsentDays(String(rec.absentDays));
    setOtherDeduction(String(rec.otherDeduction));
    setTaxRate(String(rec.taxRate));
    const ssRate =
      rec.baseSalary > 0 ? Number(((rec.socialSecurityAmount / rec.baseSalary) * 100).toFixed(2)) : 0;
    setSocialSecurityRate(String(ssRate));
    setPaymentStatus(rec.paymentStatus);
    setNote(rec.note || '');
    setModalOpen(true);
  };

  // Live calculation metrics
  const computed = useMemo(() => {
    const base = Math.max(0, Number(baseSalary) || 0);
    const hours = Math.max(0, Number(otHours) || 0);
    const rate = Math.max(0, Number(otRate) || 0);
    const allow = Math.max(0, Number(allowance) || 0);
    const absDays = Math.max(0, Number(absentDays) || 0);
    const otherDed = Math.max(0, Number(otherDeduction) || 0);
    const tRate = Math.min(35, Math.max(0, Number(taxRate) || 0));
    const ssRate = Math.min(10, Math.max(0, Number(socialSecurityRate) || 0));

    const otAmount = Number((hours * rate).toFixed(2));
    const grossIncome = Number((base + otAmount + allow).toFixed(2));
    const absentDeduction = Number(((base / 30) * absDays).toFixed(2));
    const taxableBase = Math.max(0, grossIncome - absentDeduction);
    const taxAmount = Number(((taxableBase * tRate) / 100).toFixed(2));
    const socialSecurityAmount = Number(
      Math.min(750, (Math.min(15000, base) * ssRate) / 100).toFixed(2)
    );
    const totalDeduction = Number(
      (absentDeduction + taxAmount + socialSecurityAmount + otherDed).toFixed(2)
    );
    const netPay = Number(Math.max(0, grossIncome - totalDeduction).toFixed(2));

    return {
      base,
      hours,
      otAmount,
      allow,
      absDays,
      absentDeduction,
      otherDed,
      tRate,
      taxAmount,
      socialSecurityAmount,
      grossIncome,
      totalDeduction,
      netPay,
    };
  }, [
    absentDays,
    allowance,
    baseSalary,
    otHours,
    otRate,
    otherDeduction,
    socialSecurityRate,
    taxRate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = personnel.find((p) => p.id === selectedPersonnelId);
    if (!person) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const record: PayrollRecord = {
        id: editingRecord?.id || generateSafeId('pay'),
        ownerId: editingRecord?.ownerId || 'local_offline',
        personnelId: person.id,
        personnelName: `${person.title}${person.fullName}`,
        employeeCode: person.employeeCode,
        position: person.position,
        month: calcMonth,
        year: calcYear,
        baseSalary: computed.base,
        otHours: computed.hours,
        otAmount: computed.otAmount,
        allowance: computed.allow,
        absentDays: computed.absDays,
        absentDeduction: computed.absentDeduction,
        otherDeduction: computed.otherDed,
        taxRate: computed.tRate,
        taxAmount: computed.taxAmount,
        socialSecurityAmount: computed.socialSecurityAmount,
        grossIncome: computed.grossIncome,
        totalDeduction: computed.totalDeduction,
        netPay: computed.netPay,
        paymentStatus,
        note: note.trim().slice(0, FIELD_LIMITS.noteMax),
        createdAt: editingRecord?.createdAt || now,
        updatedAt: now,
      };
      await onSavePayroll(record);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((r) => r.month === filterMonth && r.year === filterYear);
  }, [filterMonth, filterYear, payrolls]);

  const periodSummary = useMemo(() => {
    return filteredPayrolls.reduce(
      (acc, r) => ({
        gross: acc.gross + r.grossIncome,
        tax: acc.tax + r.taxAmount,
        deduction: acc.deduction + r.totalDeduction,
        net: acc.net + r.netPay,
      }),
      { gross: 0, tax: 0, deduction: 0, net: 0 }
    );
  }, [filteredPayrolls]);

  const handleBatchGenerate = async () => {
    const activeStaff = personnel.filter((p) => p.status !== 'สิ้นสุดสัญญา');
    if (activeStaff.length === 0) return;
    setBatchGenerating(true);
    try {
      const existingPersonIds = new Set(filteredPayrolls.map((r) => r.personnelId));
      const now = new Date().toISOString();
      for (const person of activeStaff) {
        if (existingPersonIds.has(person.id)) continue;
        const grossIncome = Number((person.baseSalary + person.defaultAllowance).toFixed(2));
        const taxAmount = Number(((grossIncome * person.taxRate) / 100).toFixed(2));
        const socialSecurityAmount = Number(
          Math.min(750, (Math.min(15000, person.baseSalary) * person.socialSecurityRate) / 100).toFixed(2)
        );
        const totalDeduction = Number((taxAmount + socialSecurityAmount).toFixed(2));
        const netPay = Number(Math.max(0, grossIncome - totalDeduction).toFixed(2));
        await onSavePayroll({
          id: generateSafeId('pay'),
          ownerId: 'local_offline',
          personnelId: person.id,
          personnelName: `${person.title}${person.fullName}`,
          employeeCode: person.employeeCode,
          position: person.position,
          month: filterMonth,
          year: filterYear,
          baseSalary: person.baseSalary,
          otHours: 0,
          otAmount: 0,
          allowance: person.defaultAllowance,
          absentDays: 0,
          absentDeduction: 0,
          otherDeduction: 0,
          taxRate: person.taxRate,
          taxAmount,
          socialSecurityAmount,
          grossIncome,
          totalDeduction,
          netPay,
          paymentStatus: 'รอเบิกจ่าย',
          note: `สร้างรายการประจำเดือน ${THAI_MONTHS[filterMonth - 1]} ${filterYear + 543}`,
          createdAt: now,
          updatedAt: now,
        });
      }
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleApproveRow = async (rec: PayrollRecord) => {
    await onSavePayroll({
      ...rec,
      paymentStatus: 'อนุมัติจ่ายแล้ว',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExportCsv = () => {
    if (filteredPayrolls.length === 0) return;
    const headers = [
      'รหัสบุคลากร',
      'ชื่อ-นามสกุล',
      'ตำแหน่ง',
      'เดือน',
      'ปี พ.ศ.',
      'ค่าจ้างพื้นฐาน',
      'ค่าล่วงเวลา(OT)',
      'ค่าครองชีพ/เพิ่ม',
      'รวมรายรับ',
      'หักขาดงาน',
      'ภาษีหัก ณ ที่จ่าย',
      'ประกันสังคม',
      'หักอื่นๆ',
      'รวมรายการหัก',
      'ยอดรับสุทธิ',
      'สถานะ',
    ];
    const rows = filteredPayrolls.map((r) => [
      r.employeeCode,
      r.personnelName,
      r.position,
      THAI_MONTHS[r.month - 1],
      String(r.year + 543),
      r.baseSalary.toFixed(2),
      r.otAmount.toFixed(2),
      r.allowance.toFixed(2),
      r.grossIncome.toFixed(2),
      r.absentDeduction.toFixed(2),
      r.taxAmount.toFixed(2),
      r.socialSecurityAmount.toFixed(2),
      r.otherDeduction.toFixed(2),
      r.totalDeduction.toFixed(2),
      r.netPay.toFixed(2),
      r.paymentStatus,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${filterYear + 543}-${String(filterMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const yearOptions = [nowDate.getFullYear() - 1, nowDate.getFullYear(), nowDate.getFullYear() + 1];

  return (
    <div className="space-y-6">
      {/* Period Selector & Batch Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="payroll-month" className="text-xs font-medium text-slate-600">
              ประจำเดือน
            </label>
            <select
              id="payroll-month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {THAI_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="payroll-year" className="text-xs font-medium text-slate-600">
              พ.ศ.
            </label>
            <select
              id="payroll-year"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono-num"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleBatchGenerate()}
            disabled={batchGenerating || personnel.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            {batchGenerating ? 'กำลังคำนวณ...' : 'คำนวณเงินเดือนทั้งเดือนอัตโนมัติ'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredPayrolls.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            ส่งออก CSV
          </button>
          <button
            type="button"
            onClick={() => openCreateModal()}
            disabled={personnel.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            คำนวณรายบุคคล
          </button>
        </div>
      </div>

      {/* Period Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">จำนวนบุคลากรในงวด</p>
          <p className="mt-1 text-xl font-semibold font-mono-num tabular-nums text-slate-900">
            {filteredPayrolls.length} รายการ
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">รวมรายรับก่อนหัก</p>
          <p className="mt-1 text-xl font-semibold font-mono-num tabular-nums text-slate-900">
            {formatCurrency(periodSummary.gross)} บาท
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">รวมภาษีหัก ณ ที่จ่าย & รายการหัก</p>
          <p className="mt-1 text-xl font-semibold font-mono-num tabular-nums text-amber-700">
            {formatCurrency(periodSummary.deduction)} บาท
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">ยอดเบิกจ่ายสุทธิรวม</p>
          <p className="mt-1 text-xl font-semibold font-mono-num tabular-nums text-blue-800">
            {formatCurrency(periodSummary.net)} บาท
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredPayrolls.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              ยังไม่มีรายการคำนวณเงินเดือนสำหรับ {THAI_MONTHS[filterMonth - 1]} พ.ศ.{' '}
              {filterYear + 543}
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              {personnel.length === 0
                ? 'กรุณาเพิ่มข้อมูลบุคลากรในทะเบียนก่อนเริ่มคำนวณเงินเดือน'
                : 'คลิก "คำนวณเงินเดือนทั้งเดือนอัตโนมัติ" หรือ "คำนวณรายบุคคล" เพื่อสร้างรายการ'}
            </p>
            {personnel.length > 0 && (
              <button
                type="button"
                onClick={() => void handleBatchGenerate()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                สร้างรายการคำนวณทั้งเดือน
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">บุคลากร</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ค่าจ้างพื้นฐาน</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">OT / เพิ่ม</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">รายการหักรวม</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ยอดรับสุทธิ</th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะ</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayrolls.map((rec) => {
                  const isLocked = rec.paymentStatus === 'อนุมัติจ่ายแล้ว';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{rec.personnelName}</p>
                        <p className="text-xs text-slate-500">
                          {rec.employeeCode} · {rec.position}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num tabular-nums whitespace-nowrap">
                        {formatCurrency(rec.baseSalary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num tabular-nums whitespace-nowrap">
                        <p>{formatCurrency(rec.otAmount + rec.allowance)}</p>
                        {rec.otHours > 0 && (
                          <p className="text-xs text-slate-400">OT {rec.otHours} ชม.</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num tabular-nums text-red-700 whitespace-nowrap">
                        <p>-{formatCurrency(rec.totalDeduction)}</p>
                        <p className="text-xs text-slate-400">ภาษี {formatCurrency(rec.taxAmount)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num tabular-nums font-semibold text-blue-800 whitespace-nowrap">
                        {formatCurrency(rec.netPay)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            isLocked ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {rec.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => void handleApproveRow(rec)}
                              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="อนุมัติจ่ายเงิน"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPrintingRecord(rec)}
                            className="p-2 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="พิมพ์ใบแจ้งรายละเอียดค่าตอบแทน"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => openEditModal(rec)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="แก้ไขการคำนวณ"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {confirmDeleteId === rec.id ? (
                            <div className="inline-flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => {
                                  void onDeletePayroll(rec.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                              >
                                ลบ
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rec.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payroll Calculator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-slate-900">
                {editingRecord ? 'แก้ไขการคำนวณเงินเดือน' : 'เครื่องมือคำนวณเงินเดือนและค่าตอบแทน'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">บุคลากร *</label>
                  <select
                    disabled={Boolean(editingRecord)}
                    value={selectedPersonnelId}
                    onChange={(e) => {
                      const found = personnel.find((p) => p.id === e.target.value);
                      if (found) applyPersonnelDefaults(found);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  >
                    {personnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.employeeCode} - {p.title}
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ประจำเดือน</label>
                  <select
                    value={calcMonth}
                    onChange={(e) => setCalcMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {THAI_MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ปี พ.ศ.</label>
                  <select
                    value={calcYear}
                    onChange={(e) => setCalcYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono-num"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y + 543}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings Inputs */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    รายรับ (Earnings)
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ค่าตอบแทน / เงินเดือนพื้นฐาน (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        ชั่วโมง OT (ชม.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={otHours}
                        onChange={(e) => setOtHours(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        อัตรา OT (บาท/ชม.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={otRate}
                        onChange={(e) => setOtRate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ค่าครองชีพ / เบี้ยเลี้ยง / เพิ่มเติม (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={allowance}
                      onChange={(e) => setAllowance(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                </div>

                {/* Deductions Inputs */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    รายการหัก (Deductions)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        จำนวนวันขาดงาน (วัน)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        step="0.5"
                        value={absentDays}
                        onChange={(e) => setAbsentDays(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        หักขาดงานอัตโนมัติ (บาท)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(computed.absentDeduction)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg font-mono-num text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        ภาษีหัก ณ ที่จ่าย (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={35}
                        step="0.5"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        ประกันสังคม (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step="0.5"
                        value={socialSecurityRate}
                        onChange={(e) => setSocialSecurityRate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      รายการหักอื่นๆ / เงินประกันสัญญา (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={otherDeduction}
                      onChange={(e) => setOtherDeduction(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculation Summary */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    รวมรายรับ: <strong className="font-mono-num">{formatCurrency(computed.grossIncome)}</strong> บาท
                  </span>
                  <span>
                    ภาษีหัก ณ ที่จ่าย ({computed.tRate}%):{' '}
                    <strong className="font-mono-num">{formatCurrency(computed.taxAmount)}</strong> บาท
                  </span>
                  <span>
                    ประกันสังคม:{' '}
                    <strong className="font-mono-num">{formatCurrency(computed.socialSecurityAmount)}</strong> บาท
                  </span>
                  <span>
                    รวมหักทั้งหมด:{' '}
                    <strong className="font-mono-num text-red-700">
                      {formatCurrency(computed.totalDeduction)}
                    </strong>{' '}
                    บาท
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">ยอดจ่ายสุทธิ (Net Pay)</p>
                    <p className="text-xs text-slate-600">({bahtText(computed.netPay)})</p>
                  </div>
                  <p className="text-2xl font-bold font-mono-num tabular-nums text-blue-900">
                    {formatCurrency(computed.netPay)} บาท
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">สถานะการจ่ายเงิน</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="รอเบิกจ่าย">รอเบิกจ่าย</option>
                    <option value="อนุมัติจ่ายแล้ว">อนุมัติจ่ายแล้ว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ</label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.noteMax}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedPersonnelId}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกผลการคำนวณเงินเดือน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Print Modal */}
      {printingRecord && (
        <PayslipPrintModal
          record={printingRecord}
          person={personnel.find((p) => p.id === printingRecord.personnelId)}
          orgSetting={orgSetting}
          onClose={() => setPrintingRecord(null)}
        />
      )}
    </div>
  );
};
