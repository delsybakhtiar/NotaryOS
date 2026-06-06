// ============================================
// API ROUTE - DATA BREACH (Individual)
// PATCH /api/settings/data-breach/[id] - Update breach
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

    const existingBreach = await db.dataBreach.findUnique({
      where: { id: params.id },
    });

    if (!existingBreach) {
      return NextResponse.json(
        { success: false, error: 'Data breach not found' },
        { status: 404 },
      );
    }

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.affectedDataTypes !== undefined) {
      updateData.affectedDataTypes = body.affectedDataTypes
        ? JSON.stringify(body.affectedDataTypes.split(',').map((s: string) => s.trim()))
        : null;
    }
    if (body.affectedClientIds !== undefined) {
      updateData.affectedClientIds = body.affectedClientIds
        ? JSON.stringify(body.affectedClientIds.split(',').map((s: string) => s.trim()))
        : null;
    }
    if (body.estimatedAffectedCount !== undefined) {
      updateData.estimatedAffectedCount = parseInt(body.estimatedAffectedCount) || 0;
    }
    if (body.detectedAt !== undefined) updateData.detectedAt = body.detectedAt ? new Date(body.detectedAt) : new Date();
    if (body.occurredAt !== undefined) updateData.occurredAt = body.occurredAt ? new Date(body.occurredAt) : null;
    if (body.containedAt !== undefined) updateData.containedAt = body.containedAt ? new Date(body.containedAt) : null;
    if (body.resolvedAt !== undefined) updateData.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
    if (body.notifiedAt !== undefined) updateData.notifiedAt = body.notifiedAt ? new Date(body.notifiedAt) : null;
    if (body.notifiedTo !== undefined) {
      updateData.notifiedTo = body.notifiedTo
        ? JSON.stringify(body.notifiedTo.split(',').map((s: string) => s.trim()))
        : null;
    }
    if (body.notificationMethod !== undefined) updateData.notificationMethod = body.notificationMethod;
    if (body.rootCause !== undefined) updateData.rootCause = body.rootCause;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedBreach = await db.dataBreach.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log the action
    await logUpdate(
      session.user.id,
      'DataBreach',
      params.id,
      { status: existingBreach.status },
      { status: updatedBreach.status }
    );

    return NextResponse.json({
      success: true,
      breach: updatedBreach,
    });
  } catch (error: any) {
    console.error('[PATCH /api/settings/data-breach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}