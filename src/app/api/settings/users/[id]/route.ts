// ============================================
// API ROUTE - INDIVIDUAL USER MANAGEMENT
// PUT /api/settings/users/[id] - Update user
// DELETE /api/settings/users/[id] - Delete user
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const body = await request.json();
    const { name, role, isActive } = body;

    // Update user
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('[PUT /api/settings/users/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Prevent deleting self
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus user sendiri' },
        { status: 400 },
      );
    }

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (error: any) {
    console.error('[DELETE /api/settings/users/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}