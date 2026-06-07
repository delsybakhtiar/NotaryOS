// ============================================
// FINANCE DASHBOARD API
// Returns placeholder data for finance role
// Coming Soon - Phase 6
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

    // RBAC Check: FINANCE role can access (ADMIN also for testing)
    if (session.user?.role !== 'FINANCE' && session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Finance access only' },
        { status: 403 }
      );
    }

    // Placeholder data - will be implemented in Phase 6
    const stats = {
      totalInvoices: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      overdueInvoices: 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Finance module coming soon in Phase 6',
    });
  } catch (error) {
    console.error('Error fetching finance dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}