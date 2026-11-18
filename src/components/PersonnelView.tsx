import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Edit3,
  FileSignature,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  EmploymentType,
  FIELD_LIMITS,
  Personnel,
  PersonnelStatus,
} from '../types';
import {
  formatCurrency,
  formatNationalId,
  generateSafeId,
  validateThaiNationalId,
} from '../utils/thaiFormat';

interface PersonnelViewProps {
  personnel: Personnel[];
  defaultTaxRate: number;
  onSavePersonnel: (item: Personnel) => Promise<void>;
  onDeletePersonnel: (id: string) => Promise<void>;
  onGoToPayroll: (person: Personnel) => void;
  onGoToContract: (person: Personnel) => void;
  externalOpenCreate?: boolean;
  onConsumedExternalCreate?: () => void;
}

const TITLES = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ว่าที่ ร.ต.'];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  'จ้างเหมาบริการ',
  'ลูกจ้างชั่วคราว',
  'พนักงานราชการ',
  'อัตราจ้างทั่วไป',
];
const STATUSES: PersonnelStatus[] = ['ปฏิบัติงาน', 'รอทำสัญญา', 'สิ้นสุดสัญญา'];

export const PersonnelView: React.FC<PersonnelViewProps> = ({
  personnel,
  defaultTaxRate,
  onSavePersonnel,
  onDeletePersonnel,
  onGoToPayroll,
  onGoToContract,
  externalOpenCreate,
  onConsumedExternalCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EmploymentType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Personnel | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [employeeCode, setEmployeeCode] = useState('');
  const [title, setTitle] = useState('นาย');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('จ้างเหมาบริการ');
  const [educationLevel, setEducationLevel] = useState('');
  const [bankName, setBankName] = useState('ธนาคารกรุงไทย');
  const [bankAccount, setBankAccount] = useState('');
  const [baseSalary, setBaseSalary] = useState('15000');
  const [defaultAllowance, setDefaultAllowance] = useState('0');
  const [otHourlyRate, setOtHourlyRate] = useState('93.75');
  const [taxRate, setTaxRate] = useState(String(defaultTaxRate));
  const [socialSecurityRate, setSocialSecurityRate] = useState('0');
  const [status, setStatus] = useState<PersonnelStatus>('ปฏิบัติงาน');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const openCreateModal = () => {
    const nextNum = String(personnel.length + 1).padStart(3, '0');
    const buddhistYear = new Date().getFullYear() + 543;
    setEditingItem(null);
    setEmployeeCode(`EMP-${buddhistYear}-${nextNum}`);
    setTitle('นาย');
    setFullName('');
    setNationalId('');
    setBirthDate('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPosition('');
    setDepartment('ฝ่ายบริหารงานทั่วไป');
    setEmploymentType('จ้างเหมาบริการ');
    setEducationLevel('ปริญญาตรี');
    setBankName('ธนาคารกรุงไทย');
    setBankAccount('');
    setBaseSalary('15000');
    setDefaultAllowance('0');
    setOtHourlyRate('93.75');
    setTaxRate(String(defaultTaxRate));
    setSocialSecurityRate('0');
    setStatus('ปฏิบัติงาน');
    setStartDate(new Date().toISOString().slice(0, 10));
    setFormError('');
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (externalOpenCreate) {
      openCreateModal();
      onConsumedExternalCreate?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenCreate]);

  const openEditModal = (person: Personnel) => {
    setEditingItem(person);
    setEmployeeCode(person.employeeCode);
    setTitle(person.title);
    setFullName(person.fullName);
    setNationalId(person.nationalId);
    setBirthDate(person.birthDate || '');
    setPhone(person.phone || '');
    setEmail(person.email || '');
    setAddress(person.address);
    setPosition(person.position);
    setDepartment(person.department);
    setEmploymentType(person.employmentType);
    setEducationLevel(person.educationLevel || '');
    setBankName(person.bankName || '');
    setBankAccount(person.bankAccount || '');
    setBaseSalary(String(person.baseSalary));
    setDefaultAllowance(String(person.defaultAllowance));
    setOtHourlyRate(String(person.otHourlyRate));
    setTaxRate(String(person.taxRate));
    setSocialSecurityRate(String(person.socialSecurityRate));
    setStatus(person.status);
    setStartDate(person.startDate || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleBaseSalaryChange = (val: string) => {
    setBaseSalary(val);
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) {
      // Standard Thai hourly rate estimate: monthly / (30 * 8) * 1.5 OT or monthly / 160
      setOtHourlyRate((num / 160).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cleanNationalId = nationalId.replace(/\D/g, '');
    if (cleanNationalId.length !== 13) {
      setFormError('กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ครบถ้วน');
      return;
    }
    if (!fullName.trim() || !address.trim() || !position.trim() || !department.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุล ที่อยู่ ตำแหน่ง และสังกัดให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const record: Personnel = {
        id: editingItem?.id || generateSafeId('per'),
        ownerId: editingItem?.ownerId || 'local_offline',
        employeeCode: employeeCode.trim().slice(0, FIELD_LIMITS.employeeCodeMax),
        title: title.trim().slice(0, FIELD_LIMITS.titleMax),
        fullName: fullName.trim().slice(0, FIELD_LIMITS.fullNameMax),
        nationalId: cleanNationalId,
        birthDate: birthDate.trim(),
        phone: phone.trim().slice(0, FIELD_LIMITS.phoneMax),
        email: email.trim().slice(0, FIELD_LIMITS.emailMax),
        address: address.trim().slice(0, FIELD_LIMITS.addressMax),
        position: position.trim().slice(0, FIELD_LIMITS.positionMax),
        department: department.trim().slice(0, FIELD_LIMITS.departmentMax),
        employmentType,
        educationLevel: educationLevel.trim().slice(0, FIELD_LIMITS.educationLevelMax),
        bankName: bankName.trim().slice(0, FIELD_LIMITS.bankNameMax),
        bankAccount: bankAccount.trim().slice(0, FIELD_LIMITS.bankAccountMax),
        baseSalary: Math.max(0, Number(baseSalary) || 0),
        defaultAllowance: Math.max(0, Number(defaultAllowance) || 0),
        otHourlyRate: Math.max(0, Number(otHourlyRate) || 0),
        taxRate: Math.max(0, Number(taxRate) || 0),
        socialSecurityRate: Math.max(0, Number(socialSecurityRate) || 0),
        status,
        startDate: startDate.trim(),
        createdAt: editingItem?.createdAt || now,
        updatedAt: now,
      };
      await onSavePersonnel(record);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredPersonnel = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return personnel.filter((p) => {
      if (typeFilter !== 'all' && p.employmentType !== typeFilter) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.employeeCode.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.nationalId.includes(q)
      );
    });
  }, [personnel, searchQuery, typeFilter]);

  const idCheckValid = nationalId.replace(/\D/g, '').length === 13 ? validateThaiNationalId(nationalId) : null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              typeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({personnel.length})
          </button>
          {EMPLOYMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === type
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ รหัส ตำแหน่ง เลขบัตร..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            เพิ่มบุคลากร
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredPersonnel.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">ไม่พบข้อมูลบุคลากร</p>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              {personnel.length === 0
                ? 'เริ่มต้นเพิ่มทะเบียนบุคลากรเพื่อนำไปคำนวณเงินเดือนและจัดทำสัญญาจ้างเหมาบริการ'
                : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองประเภทการจ้าง'}
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มบุคลากรใหม่
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">รหัส</th>
                  <th className="py-3 px-4 whitespace-nowrap">ชื่อ-นามสกุล / เลขบัตรประชาชน</th>
                  <th className="py-3 px-4 whitespace-nowrap">ตำแหน่ง / สังกัด</th>
                  <th className="py-3 px-4 whitespace-nowrap">ประเภทและสถานะ</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ค่าตอบแทน/เดือน (บาท)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                      {person.employeeCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">
                        {person.title}
                        {person.fullName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        {formatNationalId(person.nationalId)}
                        {person.phone ? ` · ${person.phone}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800">{person.position}</p>
                      <p className="text-xs text-slate-500">{person.department}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-800">{person.employmentType}</p>
                      <p
                        className={`text-xs ${
                          person.status === 'ปฏิบัติงาน'
                            ? 'text-emerald-700'
                            : person.status === 'รอทำสัญญา'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {person.status}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num tabular-nums whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{formatCurrency(person.baseSalary)}</p>
                      <p className="text-xs text-slate-500">หักภาษี {person.taxRate}%</p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onGoToPayroll(person)}
                          className="p-2 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="คำนวณเงินเดือน"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onGoToContract(person)}
                          className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="จัดทำสัญญาจ้างเหมาบริการ"
                        >
                          <FileSignature className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(person)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === person.id ? (
                          <div className="inline-flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => {
                                void onDeletePersonnel(person.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                            >
                              ยืนยันลบ
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
                            onClick={() => setConfirmDeleteId(person.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-slate-900">
                {editingItem ? 'แก้ไขทะเบียนข้อมูลบุคลากร' : 'เพิ่มทะเบียนข้อมูลบุคลากรใหม่'}
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
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">1. ข้อมูลส่วนตัวและบัตรประชาชน</h4>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">รหัสบุคลากร *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.employeeCodeMax}
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">คำนำหน้า *</label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {TITLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ-นามสกุล *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.fullNameMax}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="เช่น สมหญิง ใจดี"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      เลขประจำตัวประชาชน 13 หลัก *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={17}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value.replace(/[^\d-]/g, ''))}
                      placeholder="1100400512345"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                    {idCheckValid === false && (
                      <p className="text-xs text-amber-700 mt-1">
                        หมายเหตุ: หลักตรวจสอบเลขบัตรไม่ตรงตามสูตรมาตรฐาน (ยังคงบันทึกได้)
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.phoneMax}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">วัน/เดือน/ปีเกิด</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">อีเมล</label>
                    <input
                      type="email"
                      maxLength={FIELD_LIMITS.emailMax}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.th"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ที่อยู่ตามทะเบียนบ้าน (สำหรับระบุในสัญญาจ้าง) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      maxLength={FIELD_LIMITS.addressMax}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">2. ตำแหน่งงานและการจ้าง</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่ง / ลักษณะงาน *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.positionMax}
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="เช่น เจ้าหน้าที่บริหารงานทั่วไป"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">สังกัด / ฝ่าย / กอง *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.departmentMax}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ประเภทการจ้าง *</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">สถานะปฏิบัติงาน *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PersonnelStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วุฒิการศึกษา</label>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.educationLevelMax}
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วันที่เริ่มปฏิบัติงาน</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">3. อัตราค่าตอบแทนและบัญชีธนาคาร</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ค่าตอบแทน / เงินเดือน (บาท) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={baseSalary}
                      onChange={(e) => handleBaseSalaryChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ค่าครองชีพ / ค่าตอบแทนอื่น (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={defaultAllowance}
                      onChange={(e) => setDefaultAllowance(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">อัตรา OT (บาท/ชั่วโมง)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={otHourlyRate}
                      onChange={(e) => setOtHourlyRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      หักภาษี ณ ที่จ่าย (%)
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">ประกันสังคม (%)</label>
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
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ธนาคาร / เลขที่บัญชี</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={FIELD_LIMITS.bankNameMax}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="ธนาคาร"
                        className="w-1/2 px-2.5 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        maxLength={FIELD_LIMITS.bankAccountMax}
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="เลขบัญชี"
                        className="w-1/2 px-2.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
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
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลบุคลากร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
