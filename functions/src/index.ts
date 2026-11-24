import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { registerMemberSchema, calculateDueDate, calculateFine, canTransitionCopy } from '@libraryos/shared';

admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Function: registerMember
 * Validates self-registration input, ensures role is strictly MEMBER,
 * assigns PENDING status, and creates an audit entry.
 */
export const registerMember = functions.https.onCall(async (request) => {
  const parseResult = registerMemberSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Validation failed',
      parseResult.error.format()
    );
  }

  const data = parseResult.data;
  const uid = request.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated through Firebase Auth before profile creation'
    );
  }

  // Set Custom Claims: strictly MEMBER
  await admin.auth().setCustomUserClaims(uid, {
    role: 'MEMBER',
    branchIds: [data.homeBranchId],
  });

  const memberRef = db.collection('members').doc(uid);
  const now = Date.now();

  const newMemberProfile = {
    id: uid,
    memberIdNumber: `LIB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    dob: data.dob,
    address: data.address,
    district: data.district,
    nic: data.nic || null,
    membershipType: data.membershipType,
    status: 'PENDING', // Always PENDING for self-registration
    homeBranchId: data.homeBranchId,
    preferredLanguage: data.preferredLanguage,
    borrowingHistoryOptIn: data.borrowingHistoryOptIn,
    activeLoansCount: 0,
    unpaidFinesTotal: 0,
    guardianName: data.guardianName || null,
    guardianPhone: data.guardianPhone || null,
    expiryDate: now + 365 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(memberRef, newMemberProfile);
    
    // Add to registrationRequests queue for staff review
    const requestRef = db.collection('registrationRequests').doc(uid);
    transaction.set(requestRef, {
      ...newMemberProfile,
      submittedAt: now,
      status: 'PENDING',
    });

    // Write audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      timestamp: now,
      action: 'MEMBER_SELF_REGISTER',
      entityType: 'MEMBER',
      entityId: uid,
      performedBy: uid,
      performerRole: 'MEMBER',
      branchId: data.homeBranchId,
      details: { email: data.email, fullName: data.fullName },
    });
  });

  return {
    success: true,
    memberIdNumber: newMemberProfile.memberIdNumber,
    status: 'PENDING',
  };
});
