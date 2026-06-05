// ============================================
// CREATE INITIAL ADMIN USER API
// Creates the first admin user for NotaryOS
// ============================================

import { createInitialAdmin } from '@/lib/user-actions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await createInitialAdmin();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.user,
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}