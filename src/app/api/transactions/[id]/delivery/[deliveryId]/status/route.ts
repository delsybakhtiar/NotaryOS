import { NextRequest, NextResponse } from 'next/server';
import { updateDeliveryStatus } from '@/lib/actions/transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; deliveryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const status = formData.get('status') as string;
    const trackingNumber = formData.get('trackingNumber') as string | undefined;
    const notes = formData.get('notes') as string | undefined;
    const failureReason = formData.get('failureReason') as string | undefined;

    const result = await updateDeliveryStatus(
      params.id,
      params.deliveryId,
      status,
      trackingNumber,
      notes,
      failureReason
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}