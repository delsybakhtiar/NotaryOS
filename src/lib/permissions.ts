// ============================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// NotaryOS - Permission System
// ============================================

import { UserRole } from '@prisma/client';

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Client Management
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  CLIENT_KYC_VERIFY = 'client:kyc_verify',

  // Document Management
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_REVIEW = 'document:review',
  DOCUMENT_APPROVE = 'document:approve',
  DOCUMENT_SIGN = 'document:sign',
  DOCUMENT_ARCHIVE = 'document:archive',

  // Financial Management
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_READ = 'payment:read',
  PAYMENT_UPDATE = 'payment:update',
  PAYMENT_DELETE = 'payment:delete',

  // Audit Logs
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',

  // System Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
}

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access for Notaris
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,
    Permission.CLIENT_KYC_VERIFY,
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,
    Permission.DOCUMENT_REVIEW,
    Permission.DOCUMENT_APPROVE,
    Permission.DOCUMENT_SIGN,
    Permission.DOCUMENT_ARCHIVE,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,
    Permission.PAYMENT_DELETE,
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
  ],

  STAFF: [
    // Staff has limited access (no financial, no critical operations)
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.AUDIT_READ,
  ],

  FINANCE: [
    // Finance only has access to financial modules
    Permission.CLIENT_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,
    Permission.AUDIT_READ,
  ],
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Helper function to check if a role has any of the given permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Helper function to check if a role has all of the given permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}