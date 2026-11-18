import {
  CollectionName,
  OrganizationSetting,
  PayrollRecord,
  PendingSyncItem,
  Personnel,
  ServiceContract,
} from '../types';

const DB_NAME = 'hr-service-contract-offline-v1';
const DB_VERSION = 1;

const STORES: Array<CollectionName | 'pendingSync'> = [
  'orgSettings',
  'personnel',
  'payrolls',
  'contracts',
  'pendingSync',
];

export const DEFAULT_ORG_SETTING: Omit<OrganizationSetting, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
  orgName: 'สำนักงานบริหารงานทั่วไป',
  orgAddress: '99 ถนนราชดำเนิน แขวงบวรนิเวศ เขตพระนคร กรุงเทพมหานคร 10200',
  orgTaxId: '0994000160123',
  authorizedSignatory: 'นายสมชาย รัตนประเสริฐ',
  signatoryPosition: 'ผู้อำนวยการสำนักงานบริหารงานทั่วไป',
  defaultWitness1: 'นางสาววิภาดา ศรีสุข',
  defaultWitness2: 'นายธนากร มั่นคง',
  defaultWithholdingTaxRate: 1,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const keyPath = storeName === 'pendingSync' ? 'key' : 'id';
          db.createObjectStore(storeName, { keyPath });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function getAllFromStore<T>(storeName: CollectionName | 'pendingSync'): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function putToStore<T>(storeName: CollectionName | 'pendingSync', item: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFromStore(storeName: CollectionName | 'pendingSync', key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function replaceStoreContents<T>(storeName: CollectionName | 'pendingSync', items: T[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface OfflineWorkspaceSnapshot {
  orgSettings: OrganizationSetting[];
  personnel: Personnel[];
  payrolls: PayrollRecord[];
  contracts: ServiceContract[];
  pendingSync: PendingSyncItem[];
}

export async function loadOfflineSnapshot(): Promise<OfflineWorkspaceSnapshot> {
  const [orgSettings, personnel, payrolls, contracts, pendingSync] = await Promise.all([
    getAllFromStore<OrganizationSetting>('orgSettings'),
    getAllFromStore<Personnel>('personnel'),
    getAllFromStore<PayrollRecord>('payrolls'),
    getAllFromStore<ServiceContract>('contracts'),
    getAllFromStore<PendingSyncItem>('pendingSync'),
  ]);
  return { orgSettings, personnel, payrolls, contracts, pendingSync };
}

export async function saveOfflineItem<T extends { id: string }>(
  collection: CollectionName,
  item: T
): Promise<void> {
  await putToStore(collection, item);
}

export async function removeOfflineItem(collection: CollectionName, id: string): Promise<void> {
  await deleteFromStore(collection, id);
}

export async function replaceOfflineCollection<T>(
  collection: CollectionName,
  items: T[]
): Promise<void> {
  await replaceStoreContents(collection, items);
}

export async function enqueuePendingSync(item: PendingSyncItem): Promise<void> {
  await putToStore('pendingSync', item);
}

export async function removePendingSync(key: string): Promise<void> {
  await deleteFromStore('pendingSync', key);
}

export async function clearAllPendingSync(): Promise<void> {
  await replaceStoreContents('pendingSync', []);
}

export function createSampleWorkspaceData(ownerId: string): {
  orgSetting: OrganizationSetting;
  personnel: Personnel[];
  payrolls: PayrollRecord[];
  contracts: ServiceContract[];
} {
  const now = new Date().toISOString();
  const orgSetting: OrganizationSetting = {
    id: ownerId,
    ownerId,
    ...DEFAULT_ORG_SETTING,
    createdAt: now,
    updatedAt: now,
  };

  const p1: Personnel = {
    id: 'per_sample_001',
    ownerId,
    employeeCode: 'EMP-2569-001',
    title: 'นางสาว',
    fullName: 'กัญญารัตน์ วงศ์สุวรรณ',
    nationalId: '1100400512345',
    birthDate: '1995-04-12',
    phone: '089-412-8890',
    email: 'kanyarat.w@example.th',
    address: '124/18 หมู่ที่ 5 ตำบลบางกระสอ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
    position: 'นักวิชาการคอมพิวเตอร์ (จ้างเหมาบริการ)',
    department: 'กลุ่มงานเทคโนโลยีสารสนเทศ',
    employmentType: 'จ้างเหมาบริการ',
    educationLevel: 'ปริญญาตรี วิทยาการคอมพิวเตอร์',
    bankName: 'ธนาคารกรุงไทย',
    bankAccount: '981-2-44510-9',
    baseSalary: 18000,
    defaultAllowance: 0,
    otHourlyRate: 112.5,
    taxRate: 1,
    socialSecurityRate: 0,
    status: 'ปฏิบัติงาน',
    startDate: '2026-10-01',
    createdAt: now,
    updatedAt: now,
  };

  const p2: Personnel = {
    id: 'per_sample_002',
    ownerId,
    employeeCode: 'EMP-2569-002',
    title: 'นาย',
    fullName: 'ณัฐวุฒิ เจริญยิ่ง',
    nationalId: '3101500921847',
    birthDate: '1991-09-25',
    phone: '081-775-3021',
    email: 'nattawut.c@example.th',
    address: '88 ซอยลาดพร้าว 71 แขวงสะพานสอง เขตวังทองหลาง กรุงเทพมหานคร 10310',
    position: 'เจ้าหน้าที่ธุรการและพัสดุ',
    department: 'ฝ่ายบริหารงานทั่วไป',
    employmentType: 'จ้างเหมาบริการ',
    educationLevel: 'ปริญญาตรี รัฐประศาสนศาสตร์',
    bankName: 'ธนาคารกรุงไทย',
    bankAccount: '014-6-11982-4',
    baseSalary: 15000,
    defaultAllowance: 1000,
    otHourlyRate: 93.75,
    taxRate: 1,
    socialSecurityRate: 0,
    status: 'ปฏิบัติงาน',
    startDate: '2026-10-01',
    createdAt: now,
    updatedAt: now,
  };

  const p3: Personnel = {
    id: 'per_sample_003',
    ownerId,
    employeeCode: 'EMP-2569-003',
    title: 'นาย',
    fullName: 'สมศักดิ์ ทองดี',
    nationalId: '1409900215432',
    birthDate: '1988-01-19',
    phone: '086-550-1920',
    email: '',
    address: '45/3 หมู่ 2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    position: 'พนักงานขับรถยนต์ส่วนกลาง',
    department: 'งานยานพาหนะและอาคารสถานที่',
    employmentType: 'จ้างเหมาบริการ',
    educationLevel: 'มัธยมศึกษาตอนปลาย (ม.6)',
    bankName: 'ธนาคารออมสิน',
    bankAccount: '020-1928-4451-2',
    baseSalary: 12000,
    defaultAllowance: 1500,
    otHourlyRate: 75,
    taxRate: 0,
    socialSecurityRate: 0,
    status: 'รอทำสัญญา',
    startDate: '2026-11-01',
    createdAt: now,
    updatedAt: now,
  };

  const pay1: PayrollRecord = {
    id: 'pay_sample_001',
    ownerId,
    personnelId: p1.id,
    personnelName: `${p1.title}${p1.fullName}`,
    employeeCode: p1.employeeCode,
    position: p1.position,
    month: 11,
    year: 2026,
    baseSalary: 18000,
    otHours: 4,
    otAmount: 450,
    allowance: 0,
    absentDays: 0,
    absentDeduction: 0,
    otherDeduction: 0,
    taxRate: 1,
    taxAmount: 184.5,
    socialSecurityAmount: 0,
    grossIncome: 18450,
    totalDeduction: 184.5,
    netPay: 18265.5,
    paymentStatus: 'รอเบิกจ่าย',
    note: 'งวดประจำเดือนพฤศจิกายน 2569',
    createdAt: now,
    updatedAt: now,
  };

  const pay2: PayrollRecord = {
    id: 'pay_sample_002',
    ownerId,
    personnelId: p2.id,
    personnelName: `${p2.title}${p2.fullName}`,
    employeeCode: p2.employeeCode,
    position: p2.position,
    month: 11,
    year: 2026,
    baseSalary: 15000,
    otHours: 0,
    otAmount: 0,
    allowance: 1000,
    absentDays: 0,
    absentDeduction: 0,
    otherDeduction: 0,
    taxRate: 1,
    taxAmount: 160,
    socialSecurityAmount: 0,
    grossIncome: 16000,
    totalDeduction: 160,
    netPay: 15840,
    paymentStatus: 'อนุมัติจ่ายแล้ว',
    note: 'เบิกจ่ายครบถ้วนตามใบตรวจรับงาน',
    createdAt: now,
    updatedAt: now,
  };

  const contract1: ServiceContract = {
    id: 'con_sample_001',
    ownerId,
    personnelId: p1.id,
    contractNumber: 'สจ. 001/2570',
    contractDate: '2026-10-01',
    startDate: '2026-10-01',
    endDate: '2027-09-30',
    durationMonths: 12,
    monthlyFee: 18000,
    totalValue: 216000,
    orgName: orgSetting.orgName,
    orgAddress: orgSetting.orgAddress,
    employerRepresentative: orgSetting.authorizedSignatory,
    employerPosition: orgSetting.signatoryPosition,
    contractorName: `${p1.title}${p1.fullName}`,
    contractorNationalId: p1.nationalId,
    contractorAddress: p1.address,
    contractorPhone: p1.phone,
    positionTitle: p1.position,
    department: p1.department,
    workLocation: orgSetting.orgName,
    workingHours: 'วันจันทร์ - วันศุกร์ เวลา 08.30 - 16.30 น. (เว้นวันหยุดราชการ)',
    scopeOfWork: [
      'ดูแลบำรุงรักษาระบบคอมพิวเตอร์ อุปกรณ์เครือข่าย และแก้ไขปัญหาการใช้งานซอฟต์แวร์แก่เจ้าหน้าที่',
      'จัดทำและปรับปรุงฐานข้อมูล เว็บไซต์ และรายงานสถิติสารสนเทศของหน่วยงานให้เป็นปัจจุบัน',
      'สำรองข้อมูลสำคัญของหน่วยงานและตรวจสอบความปลอดภัยระบบสารสนเทศเป็นประจำทุกเดือน',
    ],
    paymentTerms:
      'ผู้ว่าจ้างตกลงชำระค่าจ้างเป็นรายเดือน เดือนละ 18,000.00 บาท เมื่อผู้รับจ้างส่งมอบงานประจำเดือนและคณะกรรมการตรวจรับพัสดุได้ตรวจรับงานเรียบร้อยแล้ว โดยหักภาษี ณ ที่จ่ายตามกฎหมาย',
    penaltyTerms:
      'หากผู้รับจ้างไม่มาปฏิบัติงานหรือไม่ส่งมอบงานตามกำหนดโดยไม่มีเหตุอันสมควร ผู้ว่าจ้างมีสิทธิหักค่าจ้างตามสัดส่วนวันที่ขาดงาน หรือคิดค่าปรับในอัตราร้อยละ 0.10 ของมูลค่างานที่ยังไม่ได้ส่งมอบต่อวัน',
    witness1: orgSetting.defaultWitness1,
    witness2: orgSetting.defaultWitness2,
    status: 'มีผลบังคับใช้',
    createdAt: now,
    updatedAt: now,
  };

  return {
    orgSetting,
    personnel: [p1, p2, p3],
    payrolls: [pay1, pay2],
    contracts: [contract1],
  };
}
