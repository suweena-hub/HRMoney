import React from 'react';
import { Printer, X } from 'lucide-react';
import { ServiceContract } from '../types';
import { bahtText, formatCurrency, formatNationalId, formatThaiDate } from '../utils/thaiFormat';

interface ContractPrintModalProps {
  contract: ServiceContract;
  onClose: () => void;
}

export const ContractPrintModal: React.FC<ContractPrintModalProps> = ({ contract, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 overflow-y-auto print:static print:bg-white print:overflow-visible">
      {/* Control Toolbar (hidden when printing) */}
      <div className="sticky top-0 z-10 bg-slate-900 text-white px-6 py-3 flex items-center justify-between gap-4 border-b border-slate-700 no-print">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            ตัวอย่างเอกสารสัญญาจ้างเหมาบริการ — เลขที่ {contract.contractNumber}
          </p>
          <p className="text-xs text-slate-400">
            ผู้รับจ้าง: {contract.contractorName} · ระยะเวลา {contract.durationMonths} เดือน
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            พิมพ์สัญญาเพื่อลงนาม / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Printable A4 Contract Document */}
      <div className="py-8 px-4 print:p-0">
        <article className="print-only-container font-sarabun mx-auto bg-white text-black w-full max-w-[210mm] p-10 sm:p-14 shadow-2xl border border-slate-200 print:border-none print:shadow-none leading-[1.75] text-[15px]">
          {/* Header & Contract Number */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm">
              <p className="font-semibold">{contract.orgName}</p>
            </div>
            <div className="text-right text-sm">
              <p>
                <span className="font-semibold">สัญญาเลขที่</span> {contract.contractNumber}
              </p>
            </div>
          </div>

          <h1 className="text-center text-[20px] font-bold tracking-wide mt-2 mb-6">
            สัญญาจ้างเหมาบริการ
          </h1>

          {/* Preamble */}
          <p className="indent-12 text-justify mb-4">
            สัญญาฉบับนี้ทำขึ้น ณ {contract.orgName} ตั้งอยู่เลขที่ {contract.orgAddress} เมื่อวันที่{' '}
            {formatThaiDate(contract.contractDate)} ระหว่าง{' '}
            <span className="font-semibold">{contract.orgName}</span> โดย{' '}
            <span className="font-semibold">{contract.employerRepresentative}</span> ตำแหน่ง{' '}
            {contract.employerPosition} ผู้มีอำนาจลงนามผูกพันหน่วยงาน ซึ่งต่อไปในสัญญานี้เรียกว่า{' '}
            <span className="font-semibold">&ldquo;ผู้ว่าจ้าง&rdquo;</span> ฝ่ายหนึ่ง กับ{' '}
            <span className="font-semibold">{contract.contractorName}</span> เลขประจำตัวประชาชน{' '}
            <span className="font-mono-num">{formatNationalId(contract.contractorNationalId)}</span>{' '}
            อยู่บ้านเลขที่ {contract.contractorAddress}
            {contract.contractorPhone ? ` โทรศัพท์ ${contract.contractorPhone}` : ''}{' '}
            ซึ่งต่อไปในสัญญานี้เรียกว่า <span className="font-semibold">&ldquo;ผู้รับจ้าง&rdquo;</span>{' '}
            อีกฝ่ายหนึ่ง
          </p>

          <p className="indent-12 text-justify mb-5">
            คู่สัญญาทั้งสองฝ่ายได้ตกลงทำสัญญากันมีข้อความดังต่อไปนี้
          </p>

          {/* Clause 1 */}
          <div className="mb-4">
            <p className="text-justify">
              <span className="font-bold">ข้อ ๑. ข้อตกลงจ้าง</span> ผู้ว่าจ้างตกลงจ้างและผู้รับจ้างตกลงรับจ้างทำงานในตำแหน่ง{' '}
              <span className="font-semibold">{contract.positionTitle}</span> สังกัด{' '}
              {contract.department} ณ {contract.workLocation} โดยมีรายละเอียดขอบเขตงานดังต่อไปนี้
            </p>
            <ol className="list-decimal pl-10 mt-1.5 space-y-1">
              {contract.scopeOfWork.map((item, index) => (
                <li key={index} className="text-justify">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          {/* Clause 2 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๒. ระยะเวลาการจ้างและเวลาปฏิบัติงาน</span> สัญญานี้มีกำหนดระยะเวลา{' '}
            <span className="font-semibold">{contract.durationMonths} เดือน</span> ตั้งแต่วันที่{' '}
            <span className="font-semibold">{formatThaiDate(contract.startDate)}</span> ถึงวันที่{' '}
            <span className="font-semibold">{formatThaiDate(contract.endDate)}</span> โดยผู้รับจ้างต้องปฏิบัติงานตามวันและเวลา{' '}
            {contract.workingHours} หรือตามที่ผู้ว่าจ้างกำหนดเพื่อให้บรรลุผลสำเร็จของงาน
          </p>

          {/* Clause 3 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๓. ค่าจ้างและการจ่ายเงิน</span> ผู้ว่าจ้างตกลงจ่ายค่าจ้างเหมาบริการให้แก่ผู้รับจ้างตลอดอายุสัญญาเป็นจำนวนเงินรวมทั้งสิ้น{' '}
            <span className="font-semibold font-mono-num">
              {formatCurrency(contract.totalValue)} บาท
            </span>{' '}
            ({bahtText(contract.totalValue)}) โดยแบ่งจ่ายเป็นรายเดือน เดือนละ{' '}
            <span className="font-semibold font-mono-num">
              {formatCurrency(contract.monthlyFee)} บาท
            </span>{' '}
            ({bahtText(contract.monthlyFee)}) ทั้งนี้ {contract.paymentTerms}
          </p>

          {/* Clause 4 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๔. สถานะของผู้รับจ้าง</span> คู่สัญญาตกลงให้สัญญาฉบับนี้เป็นการจ้างทำของตามประมวลกฎหมายแพ่งและพาณิชย์ และเป็นการจ้างเหมาบริการตามระเบียบของทางราชการหรือหน่วยงาน ผู้รับจ้างมิได้มีฐานะเป็นลูกจ้างหรือข้าราชการของผู้ว่าจ้าง และไม่มีสิทธิเรียกร้องสวัสดิการ เงินบำเหน็จ บำนาญ หรือสิทธิประโยชน์อื่นใดนอกเหนือจากที่ระบุไว้ในสัญญานี้
          </p>

          {/* Clause 5 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๕. หน้าที่และความรับผิดชอบของผู้รับจ้าง</span> ผู้รับจ้างต้องปฏิบัติงานด้วยความซื่อสัตย์สุจริต ใช้ความรู้ความสามารถอย่างเต็มที่ รักษาความลับของทางราชการและหน่วยงาน และห้ามมิให้นำงานตามสัญญานี้ไปจ้างช่วงให้ผู้อื่นทำแทน เว้นแต่จะได้รับความยินยอมเป็นหนังสือจากผู้ว่าจ้าง
          </p>

          {/* Clause 6 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๖. ค่าปรับและการผิดสัญญา</span> {contract.penaltyTerms}
          </p>

          {/* Clause 7 */}
          <p className="mb-4 text-justify">
            <span className="font-bold">ข้อ ๗. การบอกเลิกสัญญา</span> หากผู้รับจ้างปฏิบัติผิดเงื่อนไขข้อหนึ่งข้อใดแห่งสัญญานี้ หรือไม่สามารถปฏิบัติงานให้แล้วเสร็จตามกำหนด ผู้ว่าจ้างมีสิทธิบอกเลิกสัญญาได้ทันทีโดยแจ้งเป็นหนังสือล่วงหน้าไม่น้อยกว่า ๑๕ วัน หรือในกรณีผู้รับจ้างประสงค์จะบอกเลิกสัญญาก่อนครบกำหนด ต้องแจ้งเป็นหนังสือต่อผู้ว่าจ้างล่วงหน้าไม่น้อยกว่า ๓๐ วัน
          </p>

          {/* Clause 8 */}
          <p className="mb-8 text-justify">
            <span className="font-bold">ข้อ ๘. การจัดทำสัญญา</span> สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญานี้โดยตลอดดีแล้ว จึงได้ลงลายมือชื่อพร้อมประทับตรา (ถ้ามี) ไว้เป็นสำคัญต่อหน้าพยาน และต่างยึดถือไว้ฝ่ายละหนึ่งฉบับ
          </p>

          {/* Wet Signature Grid */}
          <div className="print-page-break-avoid pt-6 space-y-12 text-[15px]">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div className="space-y-2">
                <p>ลงชื่อ ..................................................... ผู้ว่าจ้าง</p>
                <p>({contract.employerRepresentative})</p>
                <p className="text-sm">{contract.employerPosition}</p>
              </div>
              <div className="space-y-2">
                <p>ลงชื่อ ..................................................... ผู้รับจ้าง</p>
                <p>({contract.contractorName})</p>
                <p className="text-sm">{contract.positionTitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center">
              <div className="space-y-2">
                <p>ลงชื่อ ..................................................... พยาน</p>
                <p>({contract.witness1 || '....................................................'})</p>
              </div>
              <div className="space-y-2">
                <p>ลงชื่อ ..................................................... พยาน</p>
                <p>({contract.witness2 || '....................................................'})</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
