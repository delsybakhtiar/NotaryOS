// ============================================
// API ROUTE - DATA BREACH
// GET /api/settings/data-breach - List breaches
// POST /api/settings/data-breach - Create breach
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logCreate, logUpdate } from '@/lib/audit-logger';

// GET - List data breaches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const severity = searchParams.get('severity') || '';

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const breaches = await db.dataBreach.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      breaches,
    });
  } catch (error: any) {
    console.error('[GET /api/settings/data-breach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Create data breach
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();

    const breach = await db.dataBreach.create({
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: body.status || 'DETECTED',
        affectedDataTypes: body.affectedDataTypes ? JSON.stringify(body.affectedDataTypes.split(',').map(s => s.trim())) : null,
        affectedClientIds: body.affectedClientIds ? JSON.stringify(body.affectedClientIds.split(',').map(s => s.trim())) : null,
        estimatedAffectedCount: parseInt(body.estimatedAffectedCount) || 0,
        detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : null,
        containedAt: body.containedAt ? new Date(body.containedAt) : null,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
        notifiedAt: body.notifiedAt ? new Date(body.notifiedAt) : null,
        notifiedTo: body.notifiedTo ? JSON.stringify(body.notifiedTo.split(',').map(s => s.trim())) : null,
        notificationMethod: body.notificationMethod,
        rootCause: body.rootCause,
        notes: body.notes,
        reportedBy: session.user.id,
      },
    });

    // Log the action
    await logCreate(
      session.user.id,
      'DataBreach',
      breach.id,
      { title: breach.title, severity: breach.severity }
    );

    return NextResponse.json({
      success: true,
      breach,
    });
  } catch (error: any) {
    console.error('[POST /api/settings/data-breach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}