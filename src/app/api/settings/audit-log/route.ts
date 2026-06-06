// ============================================
// API ROUTE - AUDIT LOG VIEWING
// GET /api/settings/audit-log - Get audit logs with filters
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get audit logs
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
    const action = searchParams.get('action') || '';
    const status = searchParams.get('status') || '';
    const entityType = searchParams.get('entityType') || '';

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (status) {
      where.status = status;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    // Get logs with pagination
    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to 100 recent logs
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('[GET /api/settings/audit-log] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}