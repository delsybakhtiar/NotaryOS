// ============================================
// API ROUTE - NOTARIS SETTINGS
// GET /api/settings/notaris - Get notaris settings
// POST /api/settings/notaris - Save/update notaris settings
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get notaris settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get settings (should be only one row)
    let settings = await db.notarisSettings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await db.notarisSettings.create({
        data: {
          officeName: 'Kantor Notaris',
          officeAddress: '',
          city: '',
          province: '',
          postalCode: '',
          phone: '',
          email: '',
          notarisName: '',
          documentPrefix: 'AKTA',
          invoicePrefix: 'INV',
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[GET /api/settings/notaris] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST - Save/update notaris settings
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
    const {
      officeName,
      officeAddress,
      city,
      province,
      postalCode,
      phone,
      email,
      website,
      notarisName,
      notarisNumber,
      notarisRegion,
      documentPrefix,
      invoicePrefix,
      notes,
    } = body;

    // Get existing settings
    let settings = await db.notarisSettings.findFirst();

    if (settings) {
      // Update existing
      settings = await db.notarisSettings.update({
        where: { id: settings.id },
        data: {
          officeName,
          officeAddress,
          city,
          province,
          postalCode,
          phone,
          email,
          website,
          notarisName,
          notarisNumber,
          notarisRegion,
          documentPrefix,
          invoicePrefix,
          notes,
        },
      });
    } else {
      // Create new
      settings = await db.notarisSettings.create({
        data: {
          officeName,
          officeAddress,
          city,
          province,
          postalCode,
          phone,
          email,
          website,
          notarisName,
          notarisNumber,
          notarisRegion,
          documentPrefix,
          invoicePrefix,
          notes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan',
      settings,
    });
  } catch (error: any) {
    console.error('[POST /api/settings/notaris] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}