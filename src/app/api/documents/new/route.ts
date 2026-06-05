// ============================================
// NEW DOCUMENT API ROUTE
// POST /api/documents/new - Create a new document
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createDocument } from '@/lib/actions/document';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const result = await createDocument(formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/documents/new:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}