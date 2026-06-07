// ============================================
// SECURITY UTILITIES
// Encryption, validation, and security helpers
// ============================================

import crypto from 'crypto';

/**
 * Generate a random secure token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using bcrypt (via bcryptjs)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12; // Higher is more secure but slower
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * Encrypt sensitive data (for audit logs, etc.)
 */
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    iv,
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate NIK (Indonesian National ID)
 */
export function isValidNIK(nik: string): boolean {
  // NIK must be 16 digits
  if (!/^\d{16}$/.test(nik)) {
    return false;
  }

  // Additional validation can be added here
  // Province code (first 2 digits) should be valid

  return true;
}

/**
 * Validate NPWP (Indonesian Tax ID)
 */
export function isValidNPWP(npwp: string): boolean {
  // Remove dashes and spaces
  const cleaned = npwp.replace(/[\s-]/g, '');

  // NPWP must be 15 digits
  if (!/^\d{15}$/.test(cleaned)) {
    return false;
  }

  return true;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'nik' | 'npwp'): string {
  if (!data) return '';

  switch (type) {
    case 'email':
      const [username, domain] = data.split('@');
      return `${username.slice(0, 2)}***@${domain}`;

    case 'phone':
      return data.slice(0, 4) + '***' + data.slice(-3);

    case 'nik':
      return data.slice(0, 4) + '********' + data.slice(-4);

    case 'npwp':
      return data.slice(0, 4) + '*******' + data.slice(-4);

    default:
      return data.slice(0, 2) + '***';
  }
}

/**
 * Generate a QR code data string
 */
export function generateQRCodeData(entityType: string, entityId: string): string {
  const timestamp = Date.now();
  const data = {
    type: entityType,
    id: entityId,
    timestamp,
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Validate QR code data
 */
export function validateQRCodeData(qrCode: string): {
  valid: boolean;
  data?: any;
} {
  try {
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);

    if (!data.type || !data.id || !data.timestamp) {
      return { valid: false };
    }

    return { valid: true, data };
  } catch {
    return { valid: false };
  }
}

/**
 * Rate limit check (server-side helper)
 */
export function checkBruteForceProtection(
  failedAttempts: number,
  lastFailedAt?: Date | null,
): { allowed: boolean; retryAfter?: number } {
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  if (failedAttempts >= MAX_ATTEMPTS && lastFailedAt) {
    const timeSinceLastFail = Date.now() - lastFailedAt.getTime();
    if (timeSinceLastFail < LOCKOUT_TIME) {
      const retryAfter = Math.ceil((LOCKOUT_TIME - timeSinceLastFail) / 1000);
      return { allowed: false, retryAfter };
    }
  }

  return { allowed: true };
}

/**
 * Generate audit log hash for integrity
 */
export function generateAuditHash(logData: any): string {
  const dataString = JSON.stringify(logData, Object.keys(logData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Verify audit log integrity
 */
export function verifyAuditIntegrity(logData: any, hash: string): boolean {
  const computedHash = generateAuditHash(logData);
  return computedHash === hash;
}