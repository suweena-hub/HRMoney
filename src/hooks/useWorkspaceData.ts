import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  clearAllPendingSync,
  createSampleWorkspaceData,
  DEFAULT_ORG_SETTING,
  enqueuePendingSync,
  loadOfflineSnapshot,
  removeOfflineItem,
  removePendingSync,
  replaceOfflineCollection,
  saveOfflineItem,
} from '../storage/offlineDb';
import {
  CollectionName,
  FIELD_LIMITS,
  OrganizationSetting,
  PayrollRecord,
  PendingSyncItem,
  Personnel,
  ServiceContract,
} from '../types';
import { useOnlineStatus } from './useOnlineStatus';

const FORCE_OFFLINE_KEY = 'hr_force_offline_mode';
const LOCAL_OWNER_ID = 'local_offline';

function clip(val: string | undefined, max: number): string {
  return (val ?? '').trim().slice(0, max);
}

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

function buildOrgEditableFields(org: OrganizationSetting) {
  const base: Record<string, unknown> = {
    orgName: clip(org.orgName, FIELD_LIMITS.orgNameMax) || DEFAULT_ORG_SETTING.orgName,
    orgAddress: clip(org.orgAddress, FIELD_LIMITS.orgAddressMax) || DEFAULT_ORG_SETTING.orgAddress,
    authorizedSignatory:
      clip(org.authorizedSignatory, FIELD_LIMITS.signatoryMax) || DEFAULT_ORG_SETTING.authorizedSignatory,
    signatoryPosition:
      clip(org.signatoryPosition, FIELD_LIMITS.signatoryMax) || DEFAULT_ORG_SETTING.signatoryPosition,
    defaultWithholdingTaxRate: Math.min(15, Math.max(0, Number(org.defaultWithholdingTaxRate) || 0)),
  };
  if (org.orgTaxId !== undefined) base.orgTaxId = clip(org.orgTaxId, FIELD_LIMITS.orgTaxIdMax);
  if (org.defaultWitness1 !== undefined) base.defaultWitness1 = clip(org.defaultWitness1, FIELD_LIMITS.signatoryMax);
  if (org.defaultWitness2 !== undefined) base.defaultWitness2 = clip(org.defaultWitness2, FIELD_LIMITS.signatoryMax);
  return base;
}

function buildPersonnelEditableFields(p: Personnel) {
  const base: Record<string, unknown> = {
    employeeCode: clip(p.employeeCode, FIELD_LIMITS.employeeCodeMax),
    title: clip(p.title, FIELD_LIMITS.titleMax),
    fullName: clip(p.fullName, FIELD_LIMITS.fullNameMax),
    nationalId: clip(p.nationalId, FIELD_LIMITS.nationalIdMax),
    address: clip(p.address, FIELD_LIMITS.addressMax),
    position: clip(p.position, FIELD_LIMITS.positionMax),
    department: clip(p.department, FIELD_LIMITS.departmentMax),
    employmentType: p.employmentType,
    baseSalary: Math.max(0, Number(p.baseSalary) || 0),
    defaultAllowance: Math.max(0, Number(p.defaultAllowance) || 0),
    otHourlyRate: Math.max(0, Number(p.otHourlyRate) || 0),
    taxRate: Math.min(35, Math.max(0, Number(p.taxRate) || 0)),
    socialSecurityRate: Math.min(10, Math.max(0, Number(p.socialSecurityRate) || 0)),
    status: p.status,
  };
  if (p.birthDate !== undefined) base.birthDate = clip(p.birthDate, 20);
  if (p.phone !== undefined) base.phone = clip(p.phone, FIELD_LIMITS.phoneMax);
  if (p.email !== undefined) base.email = clip(p.email, FIELD_LIMITS.emailMax);
  if (p.educationLevel !== undefined) base.educationLevel = clip(p.educationLevel, FIELD_LIMITS.educationLevelMax);
  if (p.bankName !== undefined) base.bankName = clip(p.bankName, FIELD_LIMITS.bankNameMax);
  if (p.bankAccount !== undefined) base.bankAccount = clip(p.bankAccount, FIELD_LIMITS.bankAccountMax);
  if (p.startDate !== undefined) base.startDate = clip(p.startDate, 20);
  return base;
}

function buildPayrollEditableFields(r: PayrollRecord) {
  const base: Record<string, unknown> = {
    personnelName: clip(r.personnelName, 200),
    employeeCode: clip(r.employeeCode, FIELD_LIMITS.employeeCodeMax),
    position: clip(r.position, FIELD_LIMITS.positionMax),
    month: Math.min(12, Math.max(1, Math.round(Number(r.month) || 1))),
    year: Math.min(2700, Math.max(2000, Math.round(Number(r.year) || 2026))),
    baseSalary: Math.max(0, Number(r.baseSalary) || 0),
    otHours: Math.max(0, Number(r.otHours) || 0),
    otAmount: Math.max(0, Number(r.otAmount) || 0),
    allowance: Math.max(0, Number(r.allowance) || 0),
    absentDays: Math.max(0, Number(r.absentDays) || 0),
    absentDeduction: Math.max(0, Number(r.absentDeduction) || 0),
    otherDeduction: Math.max(0, Number(r.otherDeduction) || 0),
    taxRate: Math.min(35, Math.max(0, Number(r.taxRate) || 0)),
    taxAmount: Math.max(0, Number(r.taxAmount) || 0),
    socialSecurityAmount: Math.max(0, Number(r.socialSecurityAmount) || 0),
    grossIncome: Math.max(0, Number(r.grossIncome) || 0),
    totalDeduction: Math.max(0, Number(r.totalDeduction) || 0),
    netPay: Math.max(0, Number(r.netPay) || 0),
    paymentStatus: r.paymentStatus,
  };
  if (r.note !== undefined) base.note = clip(r.note, FIELD_LIMITS.noteMax);
  return base;
}

function buildContractEditableFields(c: ServiceContract) {
  const safeScopes = (c.scopeOfWork || [])
    .map((s) => clip(s, FIELD_LIMITS.scopeItemMax))
    .filter((s) => s.length > 0)
    .slice(0, FIELD_LIMITS.scopeMaxItems);
  if (safeScopes.length === 0) {
    safeScopes.push('ปฏิบัติงานตามขอบเขตหน้าที่ที่ผู้ว่าจ้างมอบหมาย');
  }
  const base: Record<string, unknown> = {
    contractNumber: clip(c.contractNumber, FIELD_LIMITS.contractNumberMax),
    contractDate: clip(c.contractDate, 20),
    startDate: clip(c.startDate, 20),
    endDate: clip(c.endDate, 20),
    durationMonths: Math.min(120, Math.max(1, Math.round(Number(c.durationMonths) || 1))),
    monthlyFee: Math.max(0, Number(c.monthlyFee) || 0),
    totalValue: Math.max(0, Number(c.totalValue) || 0),
    orgName: clip(c.orgName, FIELD_LIMITS.orgNameMax),
    orgAddress: clip(c.orgAddress, FIELD_LIMITS.orgAddressMax),
    employerRepresentative: clip(c.employerRepresentative, FIELD_LIMITS.signatoryMax),
    employerPosition: clip(c.employerPosition, FIELD_LIMITS.signatoryMax),
    contractorName: clip(c.contractorName, 180),
    contractorNationalId: clip(c.contractorNationalId, FIELD_LIMITS.nationalIdMax),
    contractorAddress: clip(c.contractorAddress, FIELD_LIMITS.addressMax),
    positionTitle: clip(c.positionTitle, FIELD_LIMITS.positionMax),
    department: clip(c.department, FIELD_LIMITS.departmentMax),
    workLocation: clip(c.workLocation, FIELD_LIMITS.workLocationMax),
    workingHours: clip(c.workingHours, FIELD_LIMITS.workingHoursMax),
    scopeOfWork: safeScopes,
    paymentTerms: clip(c.paymentTerms, FIELD_LIMITS.termsMax),
    penaltyTerms: clip(c.penaltyTerms, FIELD_LIMITS.termsMax),
    status: c.status,
  };
  if (c.contractorPhone !== undefined) base.contractorPhone = clip(c.contractorPhone, FIELD_LIMITS.phoneMax);
  if (c.witness1 !== undefined) base.witness1 = clip(c.witness1, FIELD_LIMITS.signatoryMax);
  if (c.witness2 !== undefined) base.witness2 = clip(c.witness2, FIELD_LIMITS.signatoryMax);
  return base;
}

export function useWorkspaceData() {
  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [forceOfflineMode, setForceOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FORCE_OFFLINE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [orgSetting, setOrgSetting] = useState<OrganizationSetting>(() => {
    const now = new Date().toISOString();
    return {
      id: LOCAL_OWNER_ID,
      ownerId: LOCAL_OWNER_ID,
      ...DEFAULT_ORG_SETTING,
      createdAt: now,
      updatedAt: now,
    };
  });
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [pendingSync, setPendingSync] = useState<PendingSyncItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isCloudActive = Boolean(user && user.emailVerified && isOnline && !forceOfflineMode);
  const activeOwnerId = user?.uid || LOCAL_OWNER_ID;
  const syncingRef = useRef(false);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshLocalState = useCallback(async () => {
    try {
      const snap = await loadOfflineSnapshot();
      if (snap.orgSettings.length > 0) {
        setOrgSetting(snap.orgSettings[0]);
      }
      setPersonnel(snap.personnel.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode, 'th')));
      setPayrolls(
        snap.payrolls.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month))
      );
      setContracts(snap.contracts.sort((a, b) => b.contractDate.localeCompare(a.contractDate)));
      setPendingSync(snap.pendingSync);
    } catch (err) {
      console.error('Failed loading IndexedDB snapshot:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLocalState();
  }, [refreshLocalState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const toggleForceOffline = useCallback(
    (next: boolean) => {
      setForceOfflineMode(next);
      try {
        localStorage.setItem(FORCE_OFFLINE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      showToast(
        'info',
        next
          ? 'สลับเป็นโหมดทำงานออฟไลน์ (บันทึกในอุปกรณ์นี้)'
          : 'สลับเป็นโหมดออนไลน์พร้อมซิงค์ข้อมูล'
      );
    },
    [showToast]
  );

  const pushDocToFirestore = useCallback(
    async (col: CollectionName, id: string, ownerUid: string, rawItem: unknown) => {
      const docRef = doc(db, col, id);
      try {
        const snap = await getDoc(docRef);
        if (col === 'orgSettings') {
          const item = rawItem as OrganizationSetting;
          const editable = buildOrgEditableFields(item);
          if (!snap.exists()) {
            await setDoc(docRef, {
              ...editable,
              id,
              ownerId: ownerUid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(docRef, { ...editable, updatedAt: serverTimestamp() });
          }
        } else if (col === 'personnel') {
          const item = rawItem as Personnel;
          const editable = buildPersonnelEditableFields(item);
          if (!snap.exists()) {
            await setDoc(docRef, {
              ...editable,
              id,
              ownerId: ownerUid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(docRef, { ...editable, updatedAt: serverTimestamp() });
          }
        } else if (col === 'payrolls') {
          const item = rawItem as PayrollRecord;
          const editable = buildPayrollEditableFields(item);
          if (!snap.exists()) {
            await setDoc(docRef, {
              ...editable,
              id,
              ownerId: ownerUid,
              personnelId: item.personnelId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (snap.data()?.paymentStatus !== 'อนุมัติจ่ายแล้ว') {
            await updateDoc(docRef, { ...editable, updatedAt: serverTimestamp() });
          }
        } else if (col === 'contracts') {
          const item = rawItem as ServiceContract;
          const editable = buildContractEditableFields(item);
          if (!snap.exists()) {
            await setDoc(docRef, {
              ...editable,
              id,
              ownerId: ownerUid,
              personnelId: item.personnelId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (snap.data()?.status !== 'สิ้นสุดสัญญา') {
            await updateDoc(docRef, { ...editable, updatedAt: serverTimestamp() });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${col}/${id}`);
      }
    },
    []
  );

  const syncPendingToCloud = useCallback(async () => {
    if (!user || !user.emailVerified || !isOnline || forceOfflineMode || syncingRef.current) {
      return;
    }
    const snap = await loadOfflineSnapshot();
    if (snap.pendingSync.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const orderWeight: Record<CollectionName, number> = {
        orgSettings: 0,
        personnel: 1,
        payrolls: 2,
        contracts: 3,
      };
      const sorted = [...snap.pendingSync].sort(
        (a, b) => orderWeight[a.collection] - orderWeight[b.collection]
      );

      for (const task of sorted) {
        if (task.operation === 'delete') {
          try {
            await deleteDoc(doc(db, task.collection, task.docId));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `${task.collection}/${task.docId}`);
          }
          await removePendingSync(task.key);
          continue;
        }

        const listMap: Record<CollectionName, Array<{ id: string }>> = {
          orgSettings: snap.orgSettings,
          personnel: snap.personnel,
          payrolls: snap.payrolls,
          contracts: snap.contracts,
        };
        const found = listMap[task.collection].find((item) => item.id === task.docId);
        if (found) {
          await pushDocToFirestore(task.collection, task.docId, user.uid, found);
        }
        await removePendingSync(task.key);
      }

      const latest = await loadOfflineSnapshot();
      setPendingSync(latest.pendingSync);
      showToast('success', 'ซิงค์ข้อมูลจากโหมดออฟไลน์ขึ้นคลาวด์สำเร็จ');
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('error', 'ไม่สามารถซิงค์ข้อมูลบางรายการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [forceOfflineMode, isOnline, pushDocToFirestore, showToast, user]);

  // Trigger sync automatically when coming online + signed in
  useEffect(() => {
    if (isCloudActive && pendingSync.length > 0) {
      void syncPendingToCloud();
    }
  }, [isCloudActive, pendingSync.length, syncPendingToCloud]);

  // Real-time Firestore listeners when authenticated & online & not forced offline
  useEffect(() => {
    if (!authReady || !isCloudActive || !user) return;

    const uid = user.uid;

    const unsubOrg = onSnapshot(
      query(collection(db, 'orgSettings'), where('ownerId', '==', uid)),
      async (snapshot) => {
        const items: OrganizationSetting[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as OrganizationSetting),
            id: d.id,
            createdAt: toIsoTimestamp(data.createdAt),
            updatedAt: toIsoTimestamp(data.updatedAt),
          };
        });
        if (items.length > 0) {
          setOrgSetting(items[0]);
          await replaceOfflineCollection('orgSettings', items);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orgSettings');
      }
    );

    const unsubPersonnel = onSnapshot(
      query(collection(db, 'personnel'), where('ownerId', '==', uid)),
      async (snapshot) => {
        const items: Personnel[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              ...(data as Personnel),
              id: d.id,
              createdAt: toIsoTimestamp(data.createdAt),
              updatedAt: toIsoTimestamp(data.updatedAt),
            };
          })
          .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode, 'th'));
        setPersonnel(items);
        await replaceOfflineCollection('personnel', items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'personnel');
      }
    );

    const unsubPayrolls = onSnapshot(
      query(collection(db, 'payrolls'), where('ownerId', '==', uid)),
      async (snapshot) => {
        const items: PayrollRecord[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              ...(data as PayrollRecord),
              id: d.id,
              createdAt: toIsoTimestamp(data.createdAt),
              updatedAt: toIsoTimestamp(data.updatedAt),
            };
          })
          .sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
        setPayrolls(items);
        await replaceOfflineCollection('payrolls', items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'payrolls');
      }
    );

    const unsubContracts = onSnapshot(
      query(collection(db, 'contracts'), where('ownerId', '==', uid)),
      async (snapshot) => {
        const items: ServiceContract[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              ...(data as ServiceContract),
              id: d.id,
              createdAt: toIsoTimestamp(data.createdAt),
              updatedAt: toIsoTimestamp(data.updatedAt),
            };
          })
          .sort((a, b) => b.contractDate.localeCompare(a.contractDate));
        setContracts(items);
        await replaceOfflineCollection('contracts', items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'contracts');
      }
    );

    return () => {
      unsubOrg();
      unsubPersonnel();
      unsubPayrolls();
      unsubContracts();
    };
  }, [authReady, isCloudActive, user]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      // Queue any local offline records created before sign-in to sync cleanly under user.uid
      const snap = await loadOfflineSnapshot();
      const hasLocalData =
        snap.personnel.some((p) => p.ownerId === LOCAL_OWNER_ID) ||
        snap.payrolls.some((p) => p.ownerId === LOCAL_OWNER_ID) ||
        snap.contracts.some((c) => c.ownerId === LOCAL_OWNER_ID);

      if (hasLocalData) {
        const migratedPersonnel = snap.personnel.map((p) =>
          p.ownerId === LOCAL_OWNER_ID ? { ...p, ownerId: signedInUser.uid } : p
        );
        const migratedPayrolls = snap.payrolls.map((p) =>
          p.ownerId === LOCAL_OWNER_ID ? { ...p, ownerId: signedInUser.uid } : p
        );
        const migratedContracts = snap.contracts.map((c) =>
          c.ownerId === LOCAL_OWNER_ID ? { ...c, ownerId: signedInUser.uid } : c
        );
        await replaceOfflineCollection('personnel', migratedPersonnel);
        await replaceOfflineCollection('payrolls', migratedPayrolls);
        await replaceOfflineCollection('contracts', migratedContracts);

        for (const p of migratedPersonnel) {
          await enqueuePendingSync({
            key: `personnel:${p.id}`,
            collection: 'personnel',
            docId: p.id,
            operation: 'upsert',
            updatedAt: new Date().toISOString(),
          });
        }
        for (const pay of migratedPayrolls) {
          await enqueuePendingSync({
            key: `payrolls:${pay.id}`,
            collection: 'payrolls',
            docId: pay.id,
            operation: 'upsert',
            updatedAt: new Date().toISOString(),
          });
        }
        for (const con of migratedContracts) {
          await enqueuePendingSync({
            key: `contracts:${con.id}`,
            collection: 'contracts',
            docId: con.id,
            operation: 'upsert',
            updatedAt: new Date().toISOString(),
          });
        }
      }
      showToast('success', `เข้าสู่ระบบสำเร็จ (${signedInUser.email || 'Google Account'})`);
    } catch (err) {
      console.error('Google sign in error:', err);
      showToast('error', 'ไม่สามารถเข้าสู่ระบบ Google ได้');
    }
  }, [showToast]);

  const signOutAccount = useCallback(async () => {
    try {
      await signOut(auth);
      showToast('info', 'ออกจากระบบคลาวด์แล้ว (ทำงานในโหมดออฟไลน์ในเครื่องได้ต่อเนื่อง)');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [showToast]);

  const queueOrSyncUpsert = useCallback(
    async <T extends { id: string }>(col: CollectionName, item: T) => {
      await saveOfflineItem(col, item);
      if (isCloudActive && user) {
        await pushDocToFirestore(col, item.id, user.uid, item);
      } else {
        const pendingItem: PendingSyncItem = {
          key: `${col}:${item.id}`,
          collection: col,
          docId: item.id,
          operation: 'upsert',
          updatedAt: new Date().toISOString(),
        };
        await enqueuePendingSync(pendingItem);
        const snap = await loadOfflineSnapshot();
        setPendingSync(snap.pendingSync);
      }
    },
    [isCloudActive, pushDocToFirestore, user]
  );

  const queueOrSyncDelete = useCallback(
    async (col: CollectionName, id: string) => {
      await removeOfflineItem(col, id);
      if (isCloudActive && user) {
        try {
          await deleteDoc(doc(db, col, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `${col}/${id}`);
        }
      } else {
        await enqueuePendingSync({
          key: `${col}:${id}`,
          collection: col,
          docId: id,
          operation: 'delete',
          updatedAt: new Date().toISOString(),
        });
        const snap = await loadOfflineSnapshot();
        setPendingSync(snap.pendingSync);
      }
    },
    [isCloudActive, user]
  );

  const saveOrganizationSetting = useCallback(
    async (next: Omit<OrganizationSetting, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const targetId = user?.uid || orgSetting.id || LOCAL_OWNER_ID;
      const record: OrganizationSetting = {
        ...next,
        id: targetId,
        ownerId: activeOwnerId,
        createdAt: orgSetting.createdAt || now,
        updatedAt: now,
      };
      setOrgSetting(record);
      await queueOrSyncUpsert('orgSettings', record);
      showToast('success', 'บันทึกข้อมูลหน่วยงานและผู้มีอำนาจลงนามแล้ว');
    },
    [activeOwnerId, orgSetting.createdAt, orgSetting.id, queueOrSyncUpsert, showToast, user?.uid]
  );

  const savePersonnel = useCallback(
    async (item: Personnel) => {
      const now = new Date().toISOString();
      const record: Personnel = {
        ...item,
        ownerId: activeOwnerId,
        createdAt: item.createdAt || now,
        updatedAt: now,
      };
      setPersonnel((prev) => {
        const exists = prev.some((p) => p.id === record.id);
        const nextList = exists
          ? prev.map((p) => (p.id === record.id ? record : p))
          : [...prev, record];
        return nextList.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode, 'th'));
      });
      await queueOrSyncUpsert('personnel', record);
      showToast('success', `บันทึกข้อมูลบุคลากร "${record.title}${record.fullName}" แล้ว`);
    },
    [activeOwnerId, queueOrSyncUpsert, showToast]
  );

  const deletePersonnel = useCallback(
    async (id: string) => {
      setPersonnel((prev) => prev.filter((p) => p.id !== id));
      await queueOrSyncDelete('personnel', id);
      showToast('info', 'ลบข้อมูลบุคลากรออกจากทะเบียนแล้ว');
    },
    [queueOrSyncDelete, showToast]
  );

  const savePayroll = useCallback(
    async (item: PayrollRecord) => {
      const now = new Date().toISOString();
      const record: PayrollRecord = {
        ...item,
        ownerId: activeOwnerId,
        createdAt: item.createdAt || now,
        updatedAt: now,
      };
      setPayrolls((prev) => {
        const exists = prev.some((p) => p.id === record.id);
        const nextList = exists
          ? prev.map((p) => (p.id === record.id ? record : p))
          : [record, ...prev];
        return nextList.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
      });
      await queueOrSyncUpsert('payrolls', record);
      showToast('success', `บันทึกการคำนวณเงินเดือนของ ${record.personnelName} แล้ว`);
    },
    [activeOwnerId, queueOrSyncUpsert, showToast]
  );

  const deletePayroll = useCallback(
    async (id: string) => {
      setPayrolls((prev) => prev.filter((p) => p.id !== id));
      await queueOrSyncDelete('payrolls', id);
      showToast('info', 'ลบรายการคำนวณเงินเดือนแล้ว');
    },
    [queueOrSyncDelete, showToast]
  );

  const saveContract = useCallback(
    async (item: ServiceContract) => {
      const now = new Date().toISOString();
      const record: ServiceContract = {
        ...item,
        ownerId: activeOwnerId,
        createdAt: item.createdAt || now,
        updatedAt: now,
      };
      setContracts((prev) => {
        const exists = prev.some((c) => c.id === record.id);
        const nextList = exists
          ? prev.map((c) => (c.id === record.id ? record : c))
          : [record, ...prev];
        return nextList.sort((a, b) => b.contractDate.localeCompare(a.contractDate));
      });
      await queueOrSyncUpsert('contracts', record);
      showToast('success', `บันทึกสัญญาจ้างเลขที่ ${record.contractNumber} แล้ว`);
    },
    [activeOwnerId, queueOrSyncUpsert, showToast]
  );

  const deleteContract = useCallback(
    async (id: string) => {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      await queueOrSyncDelete('contracts', id);
      showToast('info', 'ลบสัญญาจ้างออกจากระบบแล้ว');
    },
    [queueOrSyncDelete, showToast]
  );

  const loadSampleData = useCallback(async () => {
    const sample = createSampleWorkspaceData(activeOwnerId);
    const orgRecord: OrganizationSetting = {
      ...sample.orgSetting,
      id: user?.uid || LOCAL_OWNER_ID,
      ownerId: activeOwnerId,
    };
    setOrgSetting(orgRecord);
    setPersonnel(sample.personnel);
    setPayrolls(sample.payrolls);
    setContracts(sample.contracts);

    await queueOrSyncUpsert('orgSettings', orgRecord);
    for (const p of sample.personnel) {
      await queueOrSyncUpsert('personnel', p);
    }
    for (const pay of sample.payrolls) {
      await queueOrSyncUpsert('payrolls', pay);
    }
    for (const con of sample.contracts) {
      await queueOrSyncUpsert('contracts', con);
    }
    showToast('success', 'เติมข้อมูลตัวอย่าง (บุคลากร เงินเดือน และสัญญาจ้าง) เรียบร้อยแล้ว');
  }, [activeOwnerId, queueOrSyncUpsert, showToast, user?.uid]);

  const exportBackupJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      orgSetting,
      personnel,
      payrolls,
      contracts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'ส่งออกไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  }, [contracts, orgSetting, payrolls, personnel, showToast]);

  const importBackupJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as {
          orgSetting?: OrganizationSetting;
          personnel?: Personnel[];
          payrolls?: PayrollRecord[];
          contracts?: ServiceContract[];
        };
        if (parsed.orgSetting) {
          const org = { ...parsed.orgSetting, id: user?.uid || LOCAL_OWNER_ID, ownerId: activeOwnerId };
          setOrgSetting(org);
          await queueOrSyncUpsert('orgSettings', org);
        }
        if (Array.isArray(parsed.personnel)) {
          const list = parsed.personnel.map((p) => ({ ...p, ownerId: activeOwnerId }));
          setPersonnel(list);
          for (const p of list) await queueOrSyncUpsert('personnel', p);
        }
        if (Array.isArray(parsed.payrolls)) {
          const list = parsed.payrolls.map((p) => ({ ...p, ownerId: activeOwnerId }));
          setPayrolls(list);
          for (const p of list) await queueOrSyncUpsert('payrolls', p);
        }
        if (Array.isArray(parsed.contracts)) {
          const list = parsed.contracts.map((c) => ({ ...c, ownerId: activeOwnerId }));
          setContracts(list);
          for (const c of list) await queueOrSyncUpsert('contracts', c);
        }
        showToast('success', 'นำเข้าข้อมูลสำรองจากไฟล์ JSON เรียบร้อยแล้ว');
      } catch (err) {
        console.error('Import JSON failed:', err);
        showToast('error', 'ไฟล์สำรองข้อมูลไม่ถูกต้อง');
      }
    },
    [activeOwnerId, queueOrSyncUpsert, showToast, user?.uid]
  );

  const resetLocalCache = useCallback(async () => {
    await Promise.all([
      replaceOfflineCollection('personnel', []),
      replaceOfflineCollection('payrolls', []),
      replaceOfflineCollection('contracts', []),
      clearAllPendingSync(),
    ]);
    setPersonnel([]);
    setPayrolls([]);
    setContracts([]);
    setPendingSync([]);
    showToast('info', 'ล้างข้อมูลแคชออฟไลน์ในเครื่องเรียบร้อยแล้ว');
  }, [showToast]);

  const connectionSummary = useMemo(() => {
    if (!isOnline) return { mode: 'offline-network' as const, label: 'ออฟไลน์ (ไม่มีอินเทอร์เน็ต)' };
    if (forceOfflineMode) return { mode: 'offline-forced' as const, label: 'โหมดออฟไลน์ในเครื่อง' };
    if (!user) return { mode: 'local-only' as const, label: 'บันทึกในเครื่อง (ยังไม่ได้เชื่อมบัญชี)' };
    return { mode: 'cloud-online' as const, label: 'ออนไลน์ (ซิงค์คลาวด์อัตโนมัติ)' };
  }, [forceOfflineMode, isOnline, user]);

  return {
    user,
    authReady,
    isOnline,
    forceOfflineMode,
    isCloudActive,
    connectionSummary,
    orgSetting,
    personnel,
    payrolls,
    contracts,
    pendingSyncCount: pendingSync.length,
    loading,
    syncing,
    toast,
    dismissToast: () => setToast(null),
    toggleForceOffline,
    signInWithGoogle,
    signOutAccount,
    syncPendingToCloud,
    saveOrganizationSetting,
    savePersonnel,
    deletePersonnel,
    savePayroll,
    deletePayroll,
    saveContract,
    deleteContract,
    loadSampleData,
    exportBackupJson,
    importBackupJson,
    resetLocalCache,
  };
}
