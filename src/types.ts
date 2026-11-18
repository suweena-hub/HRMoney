export type EmploymentType =
  | 'จ้างเหมาบริการ'
  | 'ลูกจ้างชั่วคราว'
  | 'พนักงานราชการ'
  | 'อัตราจ้างทั่วไป';

export type PersonnelStatus = 'ปฏิบัติงาน' | 'รอทำสัญญา' | 'สิ้นสุดสัญญา';

export type PaymentStatus = 'รอเบิกจ่าย' | 'อนุมัติจ่ายแล้ว';

export type ContractStatus = 'ร่างสัญญา' | 'รอลงนาม' | 'มีผลบังคับใช้' | 'สิ้นสุดสัญญา';

export const FIELD_LIMITS = {
  idMax: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  employeeCodeMax: 40,
  titleMax: 30,
  fullNameMax: 160,
  nationalIdMin: 13,
  nationalIdMax: 20,
  phoneMax: 30,
  emailMax: 160,
  addressMax: 400,
  positionMax: 160,
  departmentMax: 160,
  educationLevelMax: 120,
  bankNameMax: 100,
  bankAccountMax: 40,
  orgNameMax: 200,
  orgAddressMax: 400,
  orgTaxIdMax: 40,
  signatoryMax: 160,
  contractNumberMax: 60,
  workLocationMax: 240,
  workingHoursMax: 200,
  scopeItemMax: 300,
  scopeMaxItems: 20,
  termsMax: 600,
  noteMax: 300,
} as const;

export interface OrganizationSetting {
  id: string;
  ownerId: string;
  orgName: string;
  orgAddress: string;
  orgTaxId?: string;
  authorizedSignatory: string;
  signatoryPosition: string;
  defaultWitness1?: string;
  defaultWitness2?: string;
  defaultWithholdingTaxRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Personnel {
  id: string;
  ownerId: string;
  employeeCode: string;
  title: string;
  fullName: string;
  nationalId: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  address: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  educationLevel?: string;
  bankName?: string;
  bankAccount?: string;
  baseSalary: number;
  defaultAllowance: number;
  otHourlyRate: number;
  taxRate: number;
  socialSecurityRate: number;
  status: PersonnelStatus;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  ownerId: string;
  personnelId: string;
  personnelName: string;
  employeeCode: string;
  position: string;
  month: number;
  year: number;
  baseSalary: number;
  otHours: number;
  otAmount: number;
  allowance: number;
  absentDays: number;
  absentDeduction: number;
  otherDeduction: number;
  taxRate: number;
  taxAmount: number;
  socialSecurityAmount: number;
  grossIncome: number;
  totalDeduction: number;
  netPay: number;
  paymentStatus: PaymentStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceContract {
  id: string;
  ownerId: string;
  personnelId: string;
  contractNumber: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  monthlyFee: number;
  totalValue: number;
  orgName: string;
  orgAddress: string;
  employerRepresentative: string;
  employerPosition: string;
  contractorName: string;
  contractorNationalId: string;
  contractorAddress: string;
  contractorPhone?: string;
  positionTitle: string;
  department: string;
  workLocation: string;
  workingHours: string;
  scopeOfWork: string[];
  paymentTerms: string;
  penaltyTerms: string;
  witness1?: string;
  witness2?: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export type SyncOperationType = 'upsert' | 'delete';
export type CollectionName = 'orgSettings' | 'personnel' | 'payrolls' | 'contracts';

export interface PendingSyncItem {
  key: string;
  collection: CollectionName;
  docId: string;
  operation: SyncOperationType;
  updatedAt: string;
}

export type ActiveTab = 'overview' | 'personnel' | 'payroll' | 'contracts' | 'settings';
