// ============================================
// NOTARIS DASHBOARD API
// Returns stats for notaris role
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

    // RBAC Check: Only ADMIN (notaris) can access
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Notaris access only' },
        { status: 403 }
      );
    }

    // Mock data for now - replace with actual database queries
    const stats = {
      waitingReview: 5,
      waitingSignature: 3,
      urgentTransactions: 2,
      deadlineToday: 4,
      totalClients: 45,
      todaySignatures: 7,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching notaris dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}