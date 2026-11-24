export type UserRole =
  | 'SUPER_ADMIN'
  | 'HEAD_LIBRARIAN'
  | 'LIBRARIAN'
  | 'CASHIER'
  | 'INVENTORY_STAFF'
  | 'PROCUREMENT_STAFF'
  | 'AUDITOR'
  | 'MEMBER';

export const USER_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'HEAD_LIBRARIAN',
  'LIBRARIAN',
  'CASHIER',
  'INVENTORY_STAFF',
  'PROCUREMENT_STAFF',
  'AUDITOR',
  'MEMBER',
] as const;

export const STAFF_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'HEAD_LIBRARIAN',
  'LIBRARIAN',
  'CASHIER',
  'INVENTORY_STAFF',
  'PROCUREMENT_STAFF',
  'AUDITOR',
] as const;
