// ============================================
// DOCUMENT API ROUTE
// GET /api/documents - Fetch documents with filters
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/lib/actions/document';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      documentType: searchParams.get('documentType') || undefined,
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
    };

    const result = await getDocuments(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}