// ============================================
// STAFF DASHBOARD API
// Returns stats and tasks for staff role
// ============================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // RBAC Check: STAFF role can access
    if (session.user?.role !== 'STAFF' && session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Staff access only' },
        { status: 403 }
      );
    }

    // Mock data for now - replace with actual database queries
    const stats = {
      myTasks: 8,
      dueToday: 3,
      overdueTasks: 2,
      recentDocuments: 5,
      completedToday: 4,
    };

    // Mock tasks data
    const tasks = [
      {
        id: '1',
        title: 'Verifikasi Dokumen Klien',
        transactionNumber: 'TRX-2024-0001',
        status: 'IN_PROGRESS' as const,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: '2',
        title: 'Review Draft Akta',
        transactionNumber: 'TRX-2024-0002',
        status: 'PENDING' as const,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Overdue
      },
      {
        id: '3',
        title: 'Upload Dokumen Pendukung',
        transactionNumber: 'TRX-2024-0003',
        status: 'PENDING' as const,
        dueDate: new Date().toISOString(), // Due today
      },
      {
        id: '4',
        title: 'Jadwalkan Penandatanganan',
        transactionNumber: 'TRX-2024-0004',
        status: 'IN_PROGRESS' as const,
        dueDate: new Date(Date.now() + 172800000).toISOString(),
      },
      {
        id: '5',
        title: 'Koordinasi dengan Klien',
        transactionNumber: 'TRX-2024-0005',
        status: 'BLOCKED' as const,
        dueDate: new Date(Date.now() + 259200000).toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        stats,
        tasks,
      },
    });
  } catch (error) {
    console.error('Error fetching staff dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}