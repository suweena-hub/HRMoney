export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatThaiDate(isoDate?: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const yearNum = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const dayNum = Number(parts[2]);
  if (!Number.isFinite(yearNum) || monthIdx < 0 || monthIdx > 11 || !Number.isFinite(dayNum)) {
    return isoDate;
  }
  const buddhistYear = yearNum > 2400 ? yearNum : yearNum + 543;
  return `${dayNum} ${THAI_MONTHS[monthIdx]} ${buddhistYear}`;
}

export function formatBuddhistYear(adYear: number): number {
  return adYear > 2400 ? adYear : adYear + 543;
}

export function formatNationalId(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length !== 13) return raw;
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
}

export function validateThaiNationalId(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function readThaiInteger(numStr: string): string {
  if (numStr === '0' || /^0+$/.test(numStr)) return 'ศูนย์';
  const clean = numStr.replace(/^0+/, '');
  let result = '';
  const len = clean.length;

  for (let i = 0; i < len; i++) {
    const digit = Number(clean[i]);
    const pos = len - i - 1;
    const unitPos = pos % 6;

    if (pos > 0 && unitPos === 0) {
      if (digit > 0) {
        if (digit === 1 && len > 1 && i > 0) {
          result += 'เอ็ด';
        } else {
          result += THAI_NUMBERS[digit];
        }
      }
      result += 'ล้าน';
      continue;
    }

    if (digit === 0) continue;

    if (unitPos === 1) {
      if (digit === 1) {
        result += 'สิบ';
      } else if (digit === 2) {
        result += 'ยี่สิบ';
      } else {
        result += THAI_NUMBERS[digit] + 'สิบ';
      }
    } else if (unitPos === 0 && digit === 1 && len > 1) {
      const prevDigit = i > 0 ? Number(clean[i - 1]) : 0;
      result += prevDigit === 0 ? 'หนึ่ง' : 'เอ็ด';
    } else {
      result += THAI_NUMBERS[digit] + THAI_UNITS[unitPos];
    }
  }

  return result;
}

export function bahtText(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return 'ศูนย์บาทถ้วน';
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intText = readThaiInteger(intPart);
  if (decPart === '00') {
    return `${intText}บาทถ้วน`;
  }
  const satangText = readThaiInteger(decPart);
  return `${intText}บาท${satangText}สตางค์`;
}

export function calculateMonthsBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const dayAdjust = end.getDate() >= start.getDate() - 3 ? 1 : 0;
  return Math.max(1, years * 12 + months + dayAdjust);
}

export function generateSafeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export const DEFAULT_SCOPE_TEMPLATES: Record<string, string[]> = {
  'ธุรการและงานสารบรรณ': [
    'รับ-ส่ง ลงทะเบียนหนังสือราชการ และจัดเก็บเอกสารเข้าแฟ้มตามระบบสารบรรณอย่างเป็นระเบียบ',
    'ร่าง พิมพ์ ตรวจสอบความถูกต้องของหนังสือโต้ตอบ รายงานการประชุม และเอกสารประกอบการเบิกจ่าย',
    'ประสานงานนัดหมาย จัดเตรียมห้องประชุม และสนับสนุนงานบริหารทั่วไปตามที่ผู้ว่าจ้างมอบหมาย',
  ],
  'นักวิชาการคอมพิวเตอร์ / IT': [
    'ดูแลบำรุงรักษาระบบคอมพิวเตอร์ อุปกรณ์เครือข่าย และแก้ไขปัญหาการใช้งานซอฟต์แวร์แก่เจ้าหน้าที่',
    'จัดทำและปรับปรุงฐานข้อมูล เว็บไซต์ และรายงานสถิติสารสนเทศของหน่วยงานให้เป็นปัจจุบัน',
    'สำรองข้อมูลสำคัญของหน่วยงานและตรวจสอบความปลอดภัยระบบสารสนเทศเป็นประจำทุกเดือน',
  ],
  'การเงินและบัญชี': [
    'ตรวจสอบความถูกต้องของใบสำคัญจ่าย ใบเสร็จรับเงิน และเอกสารประกอบการขอเบิกเงินงบประมาณ',
    'จัดทำทะเบียนคุมการเบิกจ่ายค่าตอบแทน เอกสารหักภาษี ณ ที่จ่าย และรายงานสรุปรายเดือน',
    'ประสานงานการจัดซื้อจัดจ้างและรวบรวมเอกสารเพื่อส่งตรวจสอบตามระเบียบการเงินของหน่วยงาน',
  ],
  'พนักงานขับรถยนต์ / บริการ': [
    'ขับรถยนต์ส่วนกลางรับ-ส่งผู้บริหารและเจ้าหน้าที่ในการปฏิบัติราชการตามแผนงานที่ได้รับมอบหมาย',
    'ตรวจเช็กสภาพความพร้อมของรถยนต์ ทำความสะอาด และบันทึกสมุดคุมการใช้รถเป็นประจำทุกวัน',
    'ดูแลบำรุงรักษาและแจ้งซ่อมตามระยะเวลาที่กำหนดเพื่อความปลอดภัยในการปฏิบัติงาน',
  ],
};
