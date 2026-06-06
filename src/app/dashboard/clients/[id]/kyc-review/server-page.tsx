// ============================================
// KYC REVIEW PAGE (Server Component)
// Fetches client data and passes to client component
// ============================================

import { getClientById } from '@/lib/actions/client';
import { redirect } from 'next/navigation';
import KycReviewPage from './KycReviewPage';

export default async function KycReviewServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const result = await getClientById(resolvedParams.id);

  if (!result.success || !result.client) {
    redirect('/dashboard/clients');
  }

  return <KycReviewPage client={result.client} />;
}