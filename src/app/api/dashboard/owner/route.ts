// ============================================
// OWNER DASHBOARD API
// Returns stats for owner/admin role
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

    // RBAC Check: Only ADMIN (owner) can access
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Owner access only' },
        { status: 403 }
      );
    }

    // Mock data for now - replace with actual database queries
    const stats = {
      activeTransactions: 12,
      overdueTransactions: 2,
      pendingDeliveries: 5,
      slaAtRisk: 3,
      totalClients: 45,
      totalDocuments: 128,
      monthlyRevenue: 25000000,
      todayActivities: 24,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching owner dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}