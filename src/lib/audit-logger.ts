// ============================================
// AUDIT LOGGING SYSTEM
// Critical for compliance and accountability
// ============================================

import { db } from './db';
import { AuditAction, AuditStatus, Prisma } from '@prisma/client';

export interface AuditLogOptions {
  userId: string;
  action: AuditAction;
  status?: AuditStatus;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an audit log entry for tracking all critical operations
 * This is essential for UU PDP compliance and accountability
 */
export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        status: options.status || AuditStatus.SUCCESS,
        entityType: options.entityType,
        entityId: options.entityId,
        oldValue: options.oldValue ? JSON.stringify(options.oldValue) : null,
        newValue: options.newValue ? JSON.stringify(options.newValue) : null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        description: options.description || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Creates an audit log entry for a CREATE operation
 */
export async function logCreate(
  userId: string,
  entityType: string,
  entityId: string,
  newValue: unknown,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    entityType,
    entityId,
    newValue,
    ipAddress,
    userAgent,
    description: `Created ${entityType} with ID: ${entityId}`,
  });
}

/**
 * Creates an audit log entry for an UPDATE operation
 */
export async function logUpdate(
  userId: string,
  entityType: string,
  entityId: string,
  oldValue: unknown,
  newValue: unknown,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entityType,
    entityId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    description: `Updated ${entityType} with ID: ${entityId}`,
  });
}

/**
 * Creates an audit log entry for a DELETE operation
 */
export async function logDelete(
  userId: string,
  entityType: string,
  entityId: string,
  oldValue: unknown,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    entityType,
    entityId,
    oldValue,
    ipAddress,
    userAgent,
    description: `Deleted ${entityType} with ID: ${entityId}`,
  });
}

/**
 * Creates an audit log entry for a LOGIN operation
 */
export async function logLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  status: AuditStatus = AuditStatus.SUCCESS,
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.LOGIN,
    status,
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
    description: status === AuditStatus.SUCCESS ? 'User logged in' : 'Failed login attempt',
  });
}

/**
 * Creates an audit log entry for a LOGOUT operation
 */
export async function logLogout(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
    description: 'User logged out',
  });
}

/**
 * Retrieves audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 50,
): Promise<unknown[]> {
  return db.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}

/**
 * Retrieves audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
): Promise<unknown[]> {
  return db.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}