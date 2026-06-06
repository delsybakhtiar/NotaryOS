// ============================================
// API ROUTE - DATA SUBJECT REQUESTS (Individual)
// PATCH /api/settings/data-subject-requests/[id] - Update request
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logUpdate } from '@/lib/audit-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    const existingRequest = await db.dataSubjectRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 },
      );
    }

    const updatedRequest = await db.dataSubjectRequest.update({
      where: { id: params.id },
      data: {
        status,
        rejectionReason,
        processedBy: session.user.id,
        processedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await logUpdate(
      session.user.id,
      'DataSubjectRequest',
      params.id,
      { status: existingRequest.status },
      { status, rejectionReason }
    );

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error('[PATCH /api/settings/data-subject-requests] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}