import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDocuments } from '@/lib/actions/document';
import { DocumentList } from '@/components/documents/document-list';

export default async function DocumentsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const result = await getDocuments();

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Gagal memuat dokumen: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DocumentList documents={result.data} />
    </div>
  );
}