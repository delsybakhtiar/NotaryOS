'use client';

// ============================================
// DOCUMENT DETAIL / EDITOR PAGE
// Editor with version control and status management
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Save,
  History,
  Clock,
  User,
  Calendar,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

// Document type labels
const DocumentTypeLabels: Record<string, string> = {
  AKTA_PENDIRIAN: 'Akta Pendirian',
  AKTA_PERUBAHAN: 'Akta Perubahan',
  AKTA_PEMBERIAN_HAK_TANGGUNGAN: 'APHT',
  AKTA_WARIS: 'Akta Waris',
  SURAT_KUASA: 'Surat Kuasa',
  PERJANJIAN: 'Perjanjian',
  LAINNYA: 'Lainnya',
};

// Status labels
const StatusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  REVIEW: 'Review',
  SIGNING: 'Tanda Tangan',
  ARCHIVED: 'Arsip',
};

// Status badge variants
const StatusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'default',
  REVIEW: 'secondary',
  SIGNING: 'destructive',
  ARCHIVED: 'outline',
};

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  status: string;
  description: string | null;
  content: string | null;
  documentDate: string | null;
  effectiveDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  qrCode: string;
  client?: {
    id: string;
    clientCode: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  versions: Array<{
    id: string;
    version: number;
    content: string;
    changeNotes: string | null;
    createdBy: string;
    createdAt: string;
  }>;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [changeNotes, setChangeNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    documentDate: '',
    effectiveDate: '',
    notes: '',
  });

  // Allowed transitions based on status
  const allowedTransitions: Record<string, { value: string; label: string }[]> = {
    DRAFT: [
      { value: 'REVIEW', label: 'Kirim ke Review' },
      { value: 'ARCHIVED', label: 'Arsipkan' },
    ],
    REVIEW: [
      { value: 'DRAFT', label: 'Kembali ke Draf' },
      { value: 'SIGNING', label: 'Siap Tanda Tangan' },
      { value: 'ARCHIVED', label: 'Arsipkan' },
    ],
    SIGNING: [
      { value: 'ARCHIVED', label: 'Arsipkan' },
    ],
    ARCHIVED: [],
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}`);
      const data = await response.json();

      if (data.success) {
        setDocument(data.document);
        setFormData({
          title: data.document.title,
          description: data.document.description || '',
          content: data.document.content || '',
          documentDate: data.document.documentDate
            ? new Date(data.document.documentDate).toISOString().split('T')[0]
            : '',
          effectiveDate: data.document.effectiveDate
            ? new Date(data.document.effectiveDate).toISOString().split('T')[0]
            : '',
          notes: data.document.notes || '',
        });
      } else {
        toast.error(data.error || 'Gagal mengambil dokumen');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Terjadi kesalahan saat mengambil dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!changeNotes && formData.content !== document?.content) {
      toast.error('Mohon isi catatan perubahan untuk versioning');
      return;
    }

    try {
      setSaving(true);
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, value);
      });
      formDataObj.append('changeNotes', changeNotes);

      const response = await fetch(`/api/documents/${documentId}/update`, {
        method: 'POST',
        body: formDataObj,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dokumen berhasil disimpan');
        setIsDirty(false);
        setChangeNotes('');
        fetchDocument();
      } else {
        toast.error(data.error || 'Gagal menyimpan dokumen');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Terjadi kesalahan saat menyimpan dokumen');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Status berhasil diubah');
        fetchDocument();
      } else {
        toast.error(data.error || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Terjadi kesalahan saat mengubah status');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dokumen berhasil dihapus');
        router.push('/dashboard/documents');
      } else {
        toast.error(data.error || 'Gagal menghapus dokumen');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Terjadi kesalahan saat menghapus dokumen');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="mt-4 text-muted-foreground">Memuat dokumen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Dokumen tidak ditemukan</p>
            <Link href="/dashboard/documents">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const transitions = allowedTransitions[document.status] || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{document.documentNumber}</span>
            <Badge variant={StatusBadgeVariant[document.status]}>
              {StatusLabels[document.status]}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <p className="text-muted-foreground mt-1">
            {DocumentTypeLabels[document.documentType]}
          </p>
        </div>

        <div className="flex gap-2">
          {isDirty && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Dokumen akan dihapus permanen dari sistem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Document Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dibuat</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {format(new Date(document.createdAt), 'dd MMM yyyy', { locale: id })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(document.createdAt), 'HH:mm', { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terakhir Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {format(new Date(document.updatedAt), 'dd MMM yyyy', { locale: id })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(document.updatedAt), 'HH:mm', { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dibuat Oleh</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {document.createdBy?.name || document.createdBy?.email || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {document.createdBy?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versi</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              v{document.versions[0]?.version || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {document.versions.length} versi tersedia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Info */}
      {document.client && (
        <Card>
          <CardHeader>
            <CardTitle>Klien Terkait</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/clients/${document.client.id}`}>
                <Button variant="outline" size="sm">
                  {document.client.name}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Badge variant="outline">{document.client.clientCode}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="info">Informasi</TabsTrigger>
          <TabsTrigger value="versions">
            Riwayat Versi ({document.versions.length})
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Isi Dokumen</CardTitle>
              <CardDescription>
                Edit isi dokumen. Setiap perubahan akan membuat versi baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Isi Dokumen</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Tulis isi dokumen di sini..."
                />
              </div>

              {isDirty && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="changeNotes">
                    Catatan Perubahan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="changeNotes"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    rows={2}
                    placeholder="Jelaskan perubahan yang dilakukan untuk versioning..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Catatan ini akan disimpan dalam riwayat versi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dokumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentDate">Tanggal Dokumen</Label>
                  <Input
                    id="documentDate"
                    name="documentDate"
                    type="date"
                    value={formData.documentDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Tanggal Berlaku</Label>
                  <Input
                    id="effectiveDate"
                    name="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>QR Code</Label>
                <div className="mt-2 p-4 bg-muted rounded-md font-mono text-sm">
                  {document.qrCode}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Transition */}
          {transitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ubah Status</CardTitle>
                <CardDescription>
                  Ubah status dokumen sesuai tahapan yang sesuai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {transitions.map((transition) => (
                    <Button
                      key={transition.value}
                      variant="outline"
                      onClick={() => handleStatusChange(transition.value)}
                    >
                      {transition.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Versi</CardTitle>
              <CardDescription>
                Melihat semua perubahan yang dilakukan pada dokumen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document.versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p>Belum ada riwayat versi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {document.versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{version.version}</Badge>
                          <span className="text-sm font-medium">
                            {version.changeNotes || 'Tanpa catatan'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(version.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: id,
                          })}
                        </span>
                      </div>
                      {version.content && (
                        <div className="mt-2 p-3 bg-muted rounded text-sm max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{version.content}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}