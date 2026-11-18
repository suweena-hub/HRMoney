import React, { useMemo, useState } from 'react';
import {
  Edit3,
  FileSignature,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ContractStatus,
  FIELD_LIMITS,
  OrganizationSetting,
  Personnel,
  ServiceContract,
} from '../types';
import {
  bahtText,
  calculateMonthsBetween,
  DEFAULT_SCOPE_TEMPLATES,
  formatCurrency,
  formatNationalId,
  formatThaiDate,
  generateSafeId,
} from '../utils/thaiFormat';

interface ContractsViewProps {
  contracts: ServiceContract[];
  personnel: Personnel[];
  orgSetting: OrganizationSetting;
  preselectedPerson?: Personnel | null;
  onClearPreselectedPerson?: () => void;
  onSaveContract: (item: ServiceContract) => Promise<void>;
  onDeleteContract: (id: string) => Promise<void>;
  onPrintContract: (contract: ServiceContract) => void;
  externalOpenCreate?: boolean;
  onConsumedExternalCreate?: () => void;
}

const CONTRACT_STATUSES: ContractStatus[] = [
  'ร่างสัญญา',
  'รอลงนาม',
  'มีผลบังคับใช้',
  'สิ้นสุดสัญญา',
];

export const ContractsView: React.FC<ContractsViewProps> = ({
  contracts,
  personnel,
  orgSetting,
  preselectedPerson,
  onClearPreselectedPerson,
  onSaveContract,
  onDeleteContract,
  onPrintContract,
  externalOpenCreate,
  onConsumedExternalCreate,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [personnelId, setPersonnelId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [monthlyFee, setMonthlyFee] = useState('15000');
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [employerRepresentative, setEmployerRepresentative] = useState('');
  const [employerPosition, setEmployerPosition] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorNationalId, setContractorNationalId] = useState('');
  const [contractorAddress, setContractorAddress] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState<string[]>(['']);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [penaltyTerms, setPenaltyTerms] = useState('');
  const [witness1, setWitness1] = useState('');
  const [witness2, setWitness2] = useState('');
  const [status, setStatus] = useState<ContractStatus>('รอลงนาม');

  const fillContractorFromPerson = (person: Personnel) => {
    setPersonnelId(person.id);
    setContractorName(`${person.title}${person.fullName}`);
    setContractorNationalId(person.nationalId);
    setContractorAddress(person.address);
    setContractorPhone(person.phone || '');
    setPositionTitle(person.position);
    setDepartment(person.department);
    setMonthlyFee(String(person.baseSalary));
    setPaymentTerms(
      `เมื่อผู้รับจ้างส่งมอบงานประจำเดือนและคณะกรรมการตรวจรับงานได้ตรวจรับเรียบร้อยแล้ว โดยหักภาษี ณ ที่จ่ายอัตราร้อยละ ${person.taxRate} ตามที่กฎหมายกำหนด`
    );
  };

  const openCreateModal = (person?: Personnel) => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);
    const endIso = nextYear.toISOString().slice(0, 10);
    const buddhistYear = today.getFullYear() + 543;
    const nextSeq = String(contracts.length + 1).padStart(3, '0');

    setEditingContract(null);
    setContractNumber(`สจ. ${nextSeq}/${buddhistYear}`);
    setContractDate(todayIso);
    setStartDate(todayIso);
    setEndDate(endIso);
    setDurationMonths(String(calculateMonthsBetween(todayIso, endIso)));
    setOrgName(orgSetting.orgName);
    setOrgAddress(orgSetting.orgAddress);
    setEmployerRepresentative(orgSetting.authorizedSignatory);
    setEmployerPosition(orgSetting.signatoryPosition);
    setWorkLocation(orgSetting.orgName);
    setWorkingHours('วันจันทร์ - วันศุกร์ เวลา 08.30 - 16.30 น. (เว้นวันหยุดราชการ)');
    setScopeOfWork(DEFAULT_SCOPE_TEMPLATES['ธุรการและงานสารบรรณ']);
    setPenaltyTerms(
      'หากผู้รับจ้างไม่มาปฏิบัติงานหรือไม่ส่งมอบงานตามกำหนดโดยไม่มีเหตุอันสมควร ผู้ว่าจ้างมีสิทธิหักค่าจ้างตามสัดส่วนวันที่ขาดงาน หรือคิดค่าปรับในอัตราร้อยละ 0.10 ของมูลค่างานที่ยังไม่ได้ส่งมอบต่อวัน'
    );
    setWitness1(orgSetting.defaultWitness1 || '');
    setWitness2(orgSetting.defaultWitness2 || '');
    setStatus('รอลงนาม');
    setFormError('');

    const target = person || personnel.find((p) => p.employmentType === 'จ้างเหมาบริการ') || personnel[0];
    if (target) {
      fillContractorFromPerson(target);
    } else {
      setPersonnelId('');
      setContractorName('');
      setContractorNationalId('');
      setContractorAddress('');
      setContractorPhone('');
      setPositionTitle('');
      setDepartment('');
      setMonthlyFee('15000');
      setPaymentTerms(
        `เมื่อผู้รับจ้างส่งมอบงานประจำเดือนและคณะกรรมการตรวจรับงานได้ตรวจรับเรียบร้อยแล้ว โดยหักภาษี ณ ที่จ่ายอัตราร้อยละ ${orgSetting.defaultWithholdingTaxRate} ตามที่กฎหมายกำหนด`
      );
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

  const openEditModal = (c: ServiceContract) => {
    setEditingContract(c);
    setPersonnelId(c.personnelId);
    setContractNumber(c.contractNumber);
    setContractDate(c.contractDate);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setDurationMonths(String(c.durationMonths));
    setMonthlyFee(String(c.monthlyFee));
    setOrgName(c.orgName);
    setOrgAddress(c.orgAddress);
    setEmployerRepresentative(c.employerRepresentative);
    setEmployerPosition(c.employerPosition);
    setContractorName(c.contractorName);
    setContractorNationalId(c.contractorNationalId);
    setContractorAddress(c.contractorAddress);
    setContractorPhone(c.contractorPhone || '');
    setPositionTitle(c.positionTitle);
    setDepartment(c.department);
    setWorkLocation(c.workLocation);
    setWorkingHours(c.workingHours);
    setScopeOfWork(c.scopeOfWork.length > 0 ? c.scopeOfWork : ['']);
    setPaymentTerms(c.paymentTerms);
    setPenaltyTerms(c.penaltyTerms);
    setWitness1(c.witness1 || '');
    setWitness2(c.witness2 || '');
    setStatus(c.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleDateChange = (nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    if (nextStart && nextEnd) {
      setDurationMonths(String(calculateMonthsBetween(nextStart, nextEnd)));
    }
  };

  const totalContractValue = useMemo(() => {
    const months = Math.max(1, Number(durationMonths) || 1);
    const fee = Math.max(0, Number(monthlyFee) || 0);
    return Number((months * fee).toFixed(2));
  }, [durationMonths, monthlyFee]);

  const handleSubmit = async (e: React.FormEvent, shouldPrintAfter = false) => {
    e.preventDefault();
    setFormError('');
    if (!personnelId) {
      setFormError('กรุณาเลือกบุคลากรผู้รับจ้างจากทะเบียนก่อนจัดทำสัญญา');
      return;
    }
    const cleanScopes = scopeOfWork.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleanScopes.length === 0) {
      setFormError('กรุณาระบุขอบเขตการจ้างอย่างน้อย 1 ข้อ');
      return;
    }
    const cleanId = contractorNationalId.replace(/\D/g, '');
    if (cleanId.length < 13) {
      setFormError('เลขประจำตัวประชาชนของผู้รับจ้างต้องครบ 13 หลัก');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const record: ServiceContract = {
        id: editingContract?.id || generateSafeId('con'),
        ownerId: editingContract?.ownerId || 'local_offline',
        personnelId,
        contractNumber: contractNumber.trim().slice(0, FIELD_LIMITS.contractNumberMax),
        contractDate,
        startDate,
        endDate,
        durationMonths: Math.max(1, Math.round(Number(durationMonths) || 1)),
        monthlyFee: Math.max(0, Number(monthlyFee) || 0),
        totalValue: totalContractValue,
        orgName: orgName.trim().slice(0, FIELD_LIMITS.orgNameMax),
        orgAddress: orgAddress.trim().slice(0, FIELD_LIMITS.orgAddressMax),
        employerRepresentative: employerRepresentative.trim().slice(0, FIELD_LIMITS.signatoryMax),
        employerPosition: employerPosition.trim().slice(0, FIELD_LIMITS.signatoryMax),
        contractorName: contractorName.trim().slice(0, 180),
        contractorNationalId: cleanId,
        contractorAddress: contractorAddress.trim().slice(0, FIELD_LIMITS.addressMax),
        contractorPhone: contractorPhone.trim().slice(0, FIELD_LIMITS.phoneMax),
        positionTitle: positionTitle.trim().slice(0, FIELD_LIMITS.positionMax),
        department: department.trim().slice(0, FIELD_LIMITS.departmentMax),
        workLocation: workLocation.trim().slice(0, FIELD_LIMITS.workLocationMax),
        workingHours: workingHours.trim().slice(0, FIELD_LIMITS.workingHoursMax),
        scopeOfWork: cleanScopes.slice(0, FIELD_LIMITS.scopeMaxItems),
        paymentTerms: paymentTerms.trim().slice(0, FIELD_LIMITS.termsMax),
        penaltyTerms: penaltyTerms.trim().slice(0, FIELD_LIMITS.termsMax),
        witness1: witness1.trim().slice(0, FIELD_LIMITS.signatoryMax),
        witness2: witness2.trim().slice(0, FIELD_LIMITS.signatoryMax),
        status,
        createdAt: editingContract?.createdAt || now,
        updatedAt: now,
      };
      await onSaveContract(record);
      setModalOpen(false);
      if (shouldPrintAfter) {
        onPrintContract(record);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.contractorName.toLowerCase().includes(q) ||
        c.positionTitle.toLowerCase().includes(q)
      );
    });
  }, [contracts, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({contracts.length})
          </button>
          {CONTRACT_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขที่สัญญา ชื่อผู้รับจ้าง..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <button
            type="button"
            onClick={() => openCreateModal()}
            disabled={personnel.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            จัดทำสัญญาจ้าง
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">ยังไม่มีเอกสารสัญญาจ้างเหมาบริการ</p>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              {personnel.length === 0
                ? 'กรุณาเพิ่มข้อมูลบุคลากรในทะเบียนก่อนจัดทำสัญญาจ้าง'
                : 'สร้างสัญญาจ้างเหมาบริการเพื่อดูตัวอย่างและสั่งพิมพ์เป็นเอกสาร A4 สำหรับลงลายมือชื่อ'}
            </p>
            {personnel.length > 0 && (
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                จัดทำสัญญาจ้างฉบับแรก
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">เลขที่สัญญา / วันที่</th>
                  <th className="py-3 px-4 whitespace-nowrap">ผู้รับจ้าง / ตำแหน่ง</th>
                  <th className="py-3 px-4 whitespace-nowrap">ระยะเวลาสัญญา</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ค่าจ้างต่อเดือน / รวมสัญญา</th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะ</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">จัดการและพิมพ์เอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredContracts.map((contract) => {
                  const isLocked = contract.status === 'สิ้นสุดสัญญา';
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-mono-num font-semibold text-slate-900">
                          {contract.contractNumber}
                        </p>
                        <p className="text-xs text-slate-500">{formatThaiDate(contract.contractDate)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{contract.contractorName}</p>
                        <p className="text-xs text-slate-500">
                          {contract.positionTitle} · {formatNationalId(contract.contractorNationalId)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-slate-800">
                          {formatThaiDate(contract.startDate)} – {formatThaiDate(contract.endDate)}
                        </p>
                        <p className="text-xs text-slate-500">{contract.durationMonths} เดือน</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num tabular-nums whitespace-nowrap">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(contract.monthlyFee)} ฿/ด.
                        </p>
                        <p className="text-xs text-slate-500">
                          รวม {formatCurrency(contract.totalValue)} ฿
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            contract.status === 'มีผลบังคับใช้'
                              ? 'text-emerald-700'
                              : contract.status === 'รอลงนาม'
                                ? 'text-amber-700'
                                : contract.status === 'สิ้นสุดสัญญา'
                                  ? 'text-slate-500'
                                  : 'text-blue-700'
                          }`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintContract(contract)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            พิมพ์สัญญา (A4)
                          </button>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => openEditModal(contract)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="แก้ไขสัญญา"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {confirmDeleteId === contract.id ? (
                            <div className="inline-flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => {
                                  void onDeleteContract(contract.id);
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
                              onClick={() => setConfirmDeleteId(contract.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบสัญญา"
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

      {/* Create / Edit Contract Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-slate-900">
                {editingContract ? 'แก้ไขรายละเอียดสัญญาจ้างเหมาบริการ' : 'จัดทำสัญญาจ้างเหมาบริการฉบับใหม่'}
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

            <form
              onSubmit={(e) => void handleSubmit(e, false)}
              className="p-6 overflow-y-auto space-y-6"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Section 1: Contract Meta */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  1. ข้อมูลเลขที่สัญญาและระยะเวลาการจ้าง
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      เลือกบุคลากรผู้รับจ้าง *
                    </label>
                    <select
                      disabled={Boolean(editingContract)}
                      value={personnelId}
                      onChange={(e) => {
                        const found = personnel.find((p) => p.id === e.target.value);
                        if (found) fillContractorFromPerson(found);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                    >
                      {personnel.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.employeeCode} · {p.title}
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">เลขที่สัญญา *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.contractNumberMax}
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วันที่ทำสัญญา *</label>
                    <input
                      type="date"
                      required
                      value={contractDate}
                      onChange={(e) => setContractDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">สถานะสัญญา *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ContractStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {CONTRACT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      วันเริ่มต้นสัญญา *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => handleDateChange(e.target.value, endDate)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      วันสิ้นสุดสัญญา *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => handleDateChange(startDate, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      จำนวนเดือน *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ค่าจ้างรายเดือน (บาท) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">
                    มูลค่าสัญญาจ้างรวมตลอดระยะเวลา ({durationMonths} เดือน):{' '}
                    <strong className="text-slate-900">{bahtText(totalContractValue)}</strong>
                  </span>
                  <span className="font-mono-num font-semibold text-sm text-blue-800">
                    {formatCurrency(totalContractValue)} บาท
                  </span>
                </div>
              </div>

              {/* Section 2: Parties */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">2. ข้อมูลผู้ว่าจ้าง</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อหน่วยงาน *</label>
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">ผู้มีอำนาจลงนาม *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.signatoryMax}
                      value={employerRepresentative}
                      onChange={(e) => setEmployerRepresentative(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่งผู้ลงนาม *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.signatoryMax}
                      value={employerPosition}
                      onChange={(e) => setEmployerPosition(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
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
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">3. ข้อมูลผู้รับจ้าง (ดึงจากทะเบียน)</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ-นามสกุลผู้รับจ้าง *</label>
                    <input
                      type="text"
                      required
                      maxLength={180}
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">เลขบัตรประชาชน *</label>
                      <input
                        type="text"
                        required
                        maxLength={20}
                        value={contractorNationalId}
                        onChange={(e) => setContractorNationalId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">โทรศัพท์</label>
                      <input
                        type="text"
                        maxLength={FIELD_LIMITS.phoneMax}
                        value={contractorPhone}
                        onChange={(e) => setContractorPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่งจ้างงาน *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.positionMax}
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ที่อยู่ผู้รับจ้าง *</label>
                    <textarea
                      rows={2}
                      required
                      maxLength={FIELD_LIMITS.addressMax}
                      value={contractorAddress}
                      onChange={(e) => setContractorAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Scope of Work & Terms */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    4. ขอบเขตของงาน (Scope of Work) และสถานที่ปฏิบัติงาน
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500">ใช้แม่แบบ:</span>
                    {Object.keys(DEFAULT_SCOPE_TEMPLATES).map((tplKey) => (
                      <button
                        key={tplKey}
                        type="button"
                        onClick={() => setScopeOfWork(DEFAULT_SCOPE_TEMPLATES[tplKey])}
                        className="px-2.5 py-1 text-xs text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        {tplKey}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">สถานที่ปฏิบัติงาน *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.workLocationMax}
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">วัน-เวลาปฏิบัติงาน *</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.workingHoursMax}
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">
                    รายการหน้าที่ความรับผิดชอบ ({scopeOfWork.length}/20 ข้อ) *
                  </label>
                  {scopeOfWork.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-xs font-mono-num text-slate-400 pt-2.5 w-6 text-right shrink-0">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        maxLength={FIELD_LIMITS.scopeItemMax}
                        value={item}
                        onChange={(e) => {
                          const next = [...scopeOfWork];
                          next[index] = e.target.value;
                          setScopeOfWork(next);
                        }}
                        placeholder="ระบุภาระงานหรือหน้าที่ที่ต้องส่งมอบ"
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                      {scopeOfWork.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setScopeOfWork((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                          aria-label="ลบข้อนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {scopeOfWork.length < FIELD_LIMITS.scopeMaxItems && (
                    <button
                      type="button"
                      onClick={() => setScopeOfWork((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เพิ่มรายการขอบเขตงาน
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      เงื่อนไขการเบิกจ่ายค่าจ้าง *
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={FIELD_LIMITS.termsMax}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      เงื่อนไขค่าปรับและการผิดสัญญา *
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={FIELD_LIMITS.termsMax}
                      value={penaltyTerms}
                      onChange={(e) => setPenaltyTerms(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อพยานคนที่ 1</label>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.signatoryMax}
                      value={witness1}
                      onChange={(e) => setWitness1(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อพยานคนที่ 2</label>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.signatoryMax}
                      value={witness2}
                      onChange={(e) => setWitness2(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
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
                  className="px-4 py-2 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  บันทึกสัญญาอย่างเดียว
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => void handleSubmit(e, true)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {saving ? 'กำลังบันทึก...' : 'บันทึกและเปิดพิมพ์สัญญา (A4)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
