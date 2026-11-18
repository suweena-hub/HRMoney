# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity & Ownership**: Every document in `orgSettings`, `personnel`, `payrolls`, and `contracts` MUST carry `ownerId == request.auth.uid` on create and retain `incoming().ownerId == existing().ownerId` on update.
2. **Email Verification**: All authenticated writes require `request.auth.token.email_verified == true`.
3. **Referential Integrity**: A `PayrollRecord` or `ServiceContract` cannot be created unless `personnelId` points to an existing document in `/personnel/{personnelId}` whose `ownerId == request.auth.uid`.
4. **PII Protection**: Personnel records (`nationalId`, `phone`, `address`, `bankAccount`) and contracts are strictly private to the owning user (`ownerId == request.auth.uid`). Blanket signed-in reads are forbidden.
5. **Terminal State Locking**: Once a `PayrollRecord` reaches `paymentStatus == 'อนุมัติจ่ายแล้ว'` or a `ServiceContract` reaches `status == 'สิ้นสุดสัญญา'`, non-admin owners cannot mutate it via standard updates.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`, and `createdAt` is immutable after creation.

## 2. The "Dirty Dozen" Attack Payloads
1. **Identity Spoofing on Create**: Creating `/personnel/p1` with `ownerId: "attacker_other_uid"`. -> Expected: `PERMISSION_DENIED`.
2. **Unverified Email Write**: Creating `/personnel/p1` when `request.auth.token.email_verified == false`. -> Expected: `PERMISSION_DENIED`.
3. **Shadow / Ghost Field Injection**: Creating `/personnel/p1` with all required fields plus `isAdmin: true`. -> Expected: `PERMISSION_DENIED`.
4. **ID Poisoning**: Creating `/personnel/../../bad_id` or a 200-char ID failing `^[a-zA-Z0-9_-]+$`. -> Expected: `PERMISSION_DENIED`.
5. **Orphan Payroll Creation**: Creating `/payrolls/pay1` referencing non-existent `personnelId: "missing_person"`. -> Expected: `PERMISSION_DENIED`.
6. **Cross-Tenant Contract Link**: Creating `/contracts/c1` referencing `personnelId` belonging to another user. -> Expected: `PERMISSION_DENIED`.
7. **PII Cross-Tenant Get**: User B calling `get(/personnel/userA_person)`. -> Expected: `PERMISSION_DENIED`.
8. **Unfiltered List Scraping**: User B querying `collection('personnel')` without `where('ownerId', '==', userB.uid)`. -> Expected: `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Creating `/personnel/p1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`. -> Expected: `PERMISSION_DENIED`.
10. **Immortal Field Mutation**: Updating `/personnel/p1` to change `ownerId` or `createdAt`. -> Expected: `PERMISSION_DENIED`.
11. **Terminal State Bypass**: Updating a `/contracts/c1` whose existing `status == 'สิ้นสุดสัญญา'`. -> Expected: `PERMISSION_DENIED`.
12. **Array Exhaustion / Type Poisoning**: Creating `/contracts/c1` with `scopeOfWork` having 25 items or `scopeOfWork[0] = 12345` (non-string). -> Expected: `PERMISSION_DENIED`.
