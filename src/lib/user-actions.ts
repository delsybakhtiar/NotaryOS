'use server';

// ============================================
// USER CREATION API
// Create initial admin user for NotaryOS
// ============================================

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { logCreate } from '@/lib/audit-logger';

interface CreateUserOptions {
  email: string;
  password: string;
  name: string;
  role: string;
  isActive?: boolean;
}

export async function createUser(options: CreateUserOptions) {
  const { email, password, name, role, isActive = true } = options;

  // Validate input
  if (!email || !password || !name) {
    return {
      success: false,
      error: 'Email, password, dan nama wajib diisi',
    };
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: 'Email sudah terdaftar',
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as 'ADMIN' | 'STAFF' | 'FINANCE',
      isActive,
    },
  });

  // Log user creation
  await logCreate(
    user.id,
    'User',
    user.id,
    {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  );

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function createInitialAdmin() {
  // Check if admin user already exists by email
  const existingAdmin = await db.user.findUnique({
    where: { email: 'admin@notaryos.com' },
  });

  if (existingAdmin) {
    return {
      success: false,
      error: 'Admin user already exists',
    };
  }

  // Create admin user
  const result = await createUser({
    email: 'admin@notaryos.com',
    password: 'Admin@123456',
    name: 'Administrator',
    role: 'ADMIN',
    isActive: true,
  });

  return result;
}