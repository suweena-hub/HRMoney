import React from 'react';
import { Printer, X } from 'lucide-react';
import { OrganizationSetting, PayrollRecord, Personnel } from '../types';
import { bahtText, formatCurrency, THAI_MONTHS } from '../utils/thaiFormat';

interface PayslipPrintModalProps {
  record: PayrollRecord;
  person?: Personnel;
  orgSetting: OrganizationSetting;
  onClose: () => void;
}

export const PayslipPrintModal: React.FC<PayslipPrintModalProps> = ({
  record,
  person,
  orgSetting,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto print:static print:bg-white print:overflow-visible">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-slate-900 text-white px-6 py-3 flex items-center justify-between gap-4 border-b border-slate-700 no-print">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            ใบแจ้งรายละเอียดค่าตอบแทน / ใบสำคัญรับเงิน — {record.personnelName}
          </p>
          <p className="text-xs text-slate-400">
            ประจำเดือน {THAI_MONTHS[record.month - 1]} พ.ศ. {record.year + 543}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            ปิด
          </button>
        </div>
      </div>

      {/* Printable A4 Sheet */}
      <div className="py-8 px-4 print:p-0">
        <div className="print-only-container font-sarabun mx-auto bg-white text-black w-full max-w-[210mm] p-10 sm:p-12 shadow-xl border border-slate-200 print:border-none print:shadow-none">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-xl font-bold">{orgSetting.orgName}</h2>
            <p className="text-sm mt-0.5">{orgSetting.orgAddress}</p>
            <h3 className="text-lg font-bold mt-3">
              ใบแจ้งรายละเอียดการจ่ายเงินเดือน / ค่าตอบแทนจ้างเหมาบริการ
            </h3>
            <p className="text-sm">
              ประจำเดือน {THAI_MONTHS[record.month - 1]} พ.ศ. {record.year + 543}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-6">
            <div>
              <span className="font-semibold">ชื่อ-นามสกุล:</span> {record.personnelName}
            </div>
            <div>
              <span className="font-semibold">รหัสบุคลากร:</span> {record.employeeCode}
            </div>
            <div>
              <span className="font-semibold">ตำแหน่ง:</span> {record.position}
            </div>
            <div>
              <span className="font-semibold">ประเภทการจ้าง:</span>{' '}
              {person?.employmentType || 'จ้างเหมาบริการ'}
            </div>
            <div>
              <span className="font-semibold">บัญชีรับเงิน:</span>{' '}
              {person?.bankName ? `${person.bankName} ${person.bankAccount || ''}` : '-'}
            </div>
            <div>
              <span className="font-semibold">สถานะการจ่าย:</span> {record.paymentStatus}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <table className="w-full border border-black text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-black">
                  <th className="py-2 px-3 text-left font-bold">รายการรับ (Earnings)</th>
                  <th className="py-2 px-3 text-right font-bold">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-2 px-3">ค่าตอบแทน / เงินเดือนพื้นฐาน</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(record.baseSalary)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">ค่าล่วงเวลา ({record.otHours} ชม.)</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(record.otAmount)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">ค่าครองชีพ / ค่าตอบแทนพิเศษ</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(record.allowance)}</td>
                </tr>
                <tr className="font-bold bg-slate-50 border-t border-black">
                  <td className="py-2 px-3">รวมรายรับทั้งหมด</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(record.grossIncome)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border border-black text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-black">
                  <th className="py-2 px-3 text-left font-bold">รายการหัก (Deductions)</th>
                  <th className="py-2 px-3 text-right font-bold">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-2 px-3">หักขาดงาน / มาสาย ({record.absentDays} วัน)</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatCurrency(record.absentDeduction)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">ภาษีหัก ณ ที่จ่าย ({record.taxRate}%)</td>
                  <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(record.taxAmount)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">ประกันสังคม / รายการหักอื่น</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatCurrency(record.socialSecurityAmount + record.otherDeduction)}
                  </td>
                </tr>
                <tr className="font-bold bg-slate-50 border-t border-black">
                  <td className="py-2 px-3">รวมรายการหักทั้งหมด</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatCurrency(record.totalDeduction)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-2 border-black p-4 mb-10 flex items-center justify-between bg-slate-50">
            <div>
              <p className="text-sm font-bold">ยอดรับสุทธิ (Net Pay)</p>
              <p className="text-sm mt-0.5">({bahtText(record.netPay)})</p>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(record.netPay)} บาท</div>
          </div>

          {record.note && (
            <p className="text-sm mb-8">
              <span className="font-semibold">หมายเหตุ:</span> {record.note}
            </p>
          )}

          <div className="grid grid-cols-2 gap-12 pt-8 text-sm text-center">
            <div className="space-y-10">
              <p>...............................................................</p>
              <div>
                <p>({record.personnelName})</p>
                <p className="font-semibold mt-1">ผู้รับเงิน / ผู้รับจ้าง</p>
                <p className="text-xs text-slate-600 mt-1">วันที่ ......... / .................. / ............</p>
              </div>
            </div>
            <div className="space-y-10">
              <p>...............................................................</p>
              <div>
                <p>({orgSetting.authorizedSignatory})</p>
                <p className="font-semibold mt-1">{orgSetting.signatoryPosition}</p>
                <p className="text-xs text-slate-600 mt-1">ผู้จ่ายเงิน / ผู้มีอำนาจอนุมัติ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
