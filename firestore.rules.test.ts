/**
 * Security rules verification suite (Dirty Dozen payloads) for Firestore emulator testing.
 * Run with @firebase/rules-unit-testing against the Firestore Emulator when testing locally.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: 'orgSettings' | 'personnel' | 'payrolls' | 'contracts';
  operation: 'create' | 'update' | 'get' | 'list';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create',
    collection: 'personnel',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'other-uid-999' },
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'personnel',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Ghost Field Injection',
    collection: 'personnel',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { isAdmin: true },
  },
  {
    id: 4,
    name: 'Document ID Poisoning',
    collection: 'personnel',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphan Payroll Record',
    collection: 'payrolls',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { personnelId: 'non-existent-personnel' },
  },
  {
    id: 6,
    name: 'Cross-Tenant Contract Link',
    collection: 'contracts',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { personnelId: 'victim-personnel-id' },
  },
  {
    id: 7,
    name: 'Cross-Tenant PII Read',
    collection: 'personnel',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unfiltered Collection List Scraping',
    collection: 'personnel',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    collection: 'personnel',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 10,
    name: 'Immortal ownerId Mutation',
    collection: 'personnel',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'attacker-uid' },
  },
  {
    id: 11,
    name: 'Terminal State Contract Mutation',
    collection: 'contracts',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'มีผลบังคับใช้' },
  },
  {
    id: 12,
    name: 'Array Size & Type Poisoning on scopeOfWork',
    collection: 'contracts',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { scopeOfWork: [12345] },
  },
];
