// ============================================
// KURIR DASHBOARD API
// Returns stats and deliveries for courier role
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

    // RBAC Check: KURIR role can access (ADMIN also for testing)
    if (session.user?.role !== 'KURIR' && session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Courier access only' },
        { status: 403 }
      );
    }

    // Mock data for now - replace with actual database queries
    const stats = {
      pickupQueue: 4,
      onDelivery: 3,
      deliveredToday: 7,
      failedDeliveries: 1,
      totalToday: 15,
    };

    // Mock deliveries data
    const deliveries = [
      {
        id: '1',
        transactionNumber: 'TRX-2024-0001',
        recipientName: 'Budi Santoso',
        recipientPhone: '081234567890',
        deliveryAddress: 'Jl. Sudirman No. 123, Jakarta Pusat',
        pickupAddress: 'Kantor Notaris - Jl. Thamrin No. 45',
        status: 'PENDING' as const,
        assignedTo: session.user?.id,
      },
      {
        id: '2',
        transactionNumber: 'TRX-2024-0002',
        recipientName: 'Siti Rahayu',
        recipientPhone: '081234567891',
        deliveryAddress: 'Jl. Gatot Subroto No. 789, Jakarta Selatan',
        pickupAddress: 'Kantor Notaris - Jl. Thamrin No. 45',
        status: 'ASSIGNED' as const,
        assignedTo: session.user?.id,
      },
      {
        id: '3',
        transactionNumber: 'TRX-2024-0003',
        recipientName: 'Ahmad Wijaya',
        recipientPhone: '081234567892',
        deliveryAddress: 'Jl. MH Thamrin No. 567, Jakarta Pusat',
        pickupAddress: null,
        status: 'IN_TRANSIT' as const,
        assignedTo: session.user?.id,
      },
      {
        id: '4',
        transactionNumber: 'TRX-2024-0004',
        recipientName: 'Dewi Lestari',
        recipientPhone: '081234567893',
        deliveryAddress: 'Jl. Rasuna Said No. 890, Jakarta Selatan',
        pickupAddress: null,
        status: 'IN_TRANSIT' as const,
        assignedTo: session.user?.id,
      },
      {
        id: '5',
        transactionNumber: 'TRX-2024-0005',
        recipientName: 'Rudi Hartono',
        recipientPhone: '081234567894',
        deliveryAddress: 'Jl. Sudirman No. 234, Jakarta Pusat',
        pickupAddress: null,
        status: 'FAILED' as const,
        assignedTo: session.user?.id,
      },
      {
        id: '6',
        transactionNumber: 'TRX-2024-0006',
        recipientName: 'Maya Sari',
        recipientPhone: '081234567895',
        deliveryAddress: 'Jl. Gatot Subroto No. 123, Jakarta Selatan',
        pickupAddress: 'Kantor Notaris - Jl. Thamrin No. 45',
        status: 'PENDING' as const,
        assignedTo: session.user?.id,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        stats,
        deliveries,
      },
    });
  } catch (error) {
    console.error('Error fetching kurir dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}