'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Clock, History, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateDocument, transitionStatus, deleteDocument } from '@/lib/actions/document';
import {
  DocumentStatus,
  DocumentType,
} from '@prisma/client';
import {
  getStatusLabel,
  getStatusColor,
  getNextStatuses,
  getAllowedTransitionsForUser,
  getTransitionDetails,
} from '@/lib/document-state-machine';
import { toast } from 'sonner';

interface Version {
  id: string;
  version: number;
  content: string;
  changeNotes: string | null;
  createdAt: Date;
}

interface Client {
  id: string;
  name: string;
  clientCode: string;
  clientType: string;
}

interface Creator {
  id: string;
  name: string | null;
  email: string;
}

interface DocumentDetailProps {
  document: {
    id: string;
    documentNumber: string;
    title: string;
    documentType: DocumentType;
    status: DocumentStatus;
    description: string | null;
    content: string | null;
    documentDate: Date | null;
    effectiveDate: Date | null;
    notes: string | null;
    qrCode: string;
    createdAt: Date;
    updatedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    signedBy: string | null;
    signedAt: Date | null;
    client: Client | null;
    createdBy: Creator | null;
    versions: Version[];
  };
  userRole: string;
  availableClients: Client[];
}

export function DocumentDetail({ document, userRole, availableClients }: DocumentDetailProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const [formData, setFormData] = useState({
    title: document.title,
    documentType: document.documentType,
    description: document.description || '',
    content: document.content || '',
    clientId: document.client?.id || '',
    documentDate: document.documentDate ? document.documentDate.toISOString().split('T')[0] : '',
    effectiveDate: document.effectiveDate ? document.effectiveDate.toISOString().split('T')[0] : '',
    notes: document.notes || '',
  });

  const [transitionNotes, setTransitionNotes] = useState('');
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<DocumentStatus | null>(null);

  // Get allowed transitions for the user
  const allowedTransitions = getAllowedTransitionsForUser(
    userRole,
    document.status
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await updateDocument({
        id: document.id,
        title: formData.title,
        documentType: formData.documentType as DocumentType,
        description: formData.description || undefined,
        content: formData.content,
        clientId: formData.clientId || undefined,
        documentDate: formData.documentDate ? new Date(formData.documentDate) : undefined,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        toast.success('Dokumen berhasil disimpan');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menyimpan dokumen');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Terjadi kesalahan saat menyimpan dokumen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransition = async () => {
    if (!selectedTransition) return;

    setIsTransitioning(true);

    try {
      const result = await transitionStatus({
        documentId: document.id,
        toStatus: selectedTransition,
        notes: transitionNotes,
      });

      if (result.success) {
        toast.success(`Status dokumen berhasil diubah ke ${getStatusLabel(selectedTransition)}`);
        setTransitionDialogOpen(false);
        setSelectedTransition(null);
        setTransitionNotes('');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal mengubah status dokumen');
      }
    } catch (error) {
      console.error('Error transitioning document:', error);
      toast.error('Terjadi kesalahan saat mengubah status dokumen');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteDocument(document.id);

      if (result.success) {
        toast.success('Dokumen berhasil dihapus');
        router.push('/dashboard/documents');
      } else {
        toast.error(result.error || 'Gagal menghapus dokumen');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Terjadi kesalahan saat menghapus dokumen');
    }
  };

  const viewVersion = (version: Version) => {
    setSelectedVersion(version);
  };

  const restoreVersion = (version: Version) => {
    setFormData((prev) => ({
      ...prev,
      content: version.content,
    }));
    toast.success(`Versi ${version.version} dipulihkan ke editor. Simpan untuk menerapkan.`);
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      [DocumentType.AKTA_PENDIRIAN]: 'Akta Pendirian',
      [DocumentType.AKTA_PERUBAHAN]: 'Akta Perubahan',
      [DocumentType.AKTA_PEMBERIAN_HAK_TANGGUNGAN]: 'APHT',
      [DocumentType.AKTA_WARIS]: 'Akta Waris',
      [DocumentType.SURAT_KUASA]: 'Surat Kuasa',
      [DocumentType.PERJANJIAN]: 'Perjanjian',
      [DocumentType.LAINNYA]: 'Lainnya',
    };
    return labels[type] || type;
  };

  const documentTypes = [
    { value: DocumentType.AKTA_PENDIRIAN, label: 'Akta Pendirian' },
    { value: DocumentType.AKTA_PERUBAHAN, label: 'Akta Perubahan' },
    { value: DocumentType.AKTA_PEMBERIAN_HAK_TANGGUNGAN, label: 'APHT' },
    { value: DocumentType.AKTA_WARIS, label: 'Akta Waris' },
    { value: DocumentType.SURAT_KUASA, label: 'Surat Kuasa' },
    { value: DocumentType.PERJANJIAN, label: 'Perjanjian' },
    { value: DocumentType.LAINNYA, label: 'Lainnya' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
              <Badge className={getStatusColor(document.status)}>
                {getStatusLabel(document.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {document.documentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Dokumen</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus dokumen "{document.title}"? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="versions">
            Versi
            {document.versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {document.versions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info">Informasi</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Document Editor */}
          <div className="grid gap-6 max-w-6xl">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Judul Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentType">
                      Tipe Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => handleInputChange('documentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Klien</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => handleInputChange('clientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih klien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tanpa Klien</SelectItem>
                      {availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.clientCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentDate">Tanggal Dokumen</Label>
                    <Input
                      id="documentDate"
                      type="date"
                      value={formData.documentDate}
                      onChange={(e) => handleInputChange('documentDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Tanggal Berlaku</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Content */}
            <Card>
              <CardHeader>
                <CardTitle>Isi Dokumen</CardTitle>
                <CardDescription>
                  Edit isi dokumen di sini. Setiap perubahan akan dicatat sebagai versi baru.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder="Catatan internal..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Versi Dokumen</CardTitle>
              <CardDescription>
                Semua perubahan konten dokumen dicatat di sini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document.versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Belum ada versi dokumen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {document.versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            Versi {version.version}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                        {version.changeNotes && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {version.changeNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewVersion(version)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Lihat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreVersion(version)}
                        >
                          Pulihkan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 max-w-3xl">
            {/* Document Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nomor Dokumen</p>
                    <p className="text-base">{document.documentNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">QR Code</p>
                    <p className="text-base font-mono text-xs">{document.qrCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipe Dokumen</p>
                    <p className="text-base">{getDocumentTypeLabel(document.documentType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusLabel(document.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
                    <p className="text-base">
                      {new Date(document.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</p>
                    <p className="text-base">
                      {new Date(document.updatedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            {document.client && (
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Klien</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Nama Klien</p>
                    <Link
                      href={`/dashboard/clients/${document.client.id}`}
                      className="text-primary hover:underline"
                    >
                      {document.client.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2">
                      Kode: {document.client.clientCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Transition */}
            {allowedTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ubah Status Dokumen</CardTitle>
                  <CardDescription>
                    Ubah status dokumen sesuai alur kerja
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {allowedTransitions.map((transition) => (
                      <Button
                        key={`${transition.from}-${transition.to}`}
                        variant="outline"
                        onClick={() => {
                          setSelectedTransition(transition.to);
                          setTransitionDialogOpen(true);
                        }}
                      >
                        {transition.description}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Trail */}
            {document.reviewedBy && (
              <Card>
                <CardHeader>
                  <CardTitle>Trail Audit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {document.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Direview Oleh</span>
                      <span className="text-sm text-muted-foreground">{document.reviewedBy}</span>
                    </div>
                  )}
                  {document.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tanggal Review</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(document.reviewedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {document.signedBy && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Ditandatangani Oleh</span>
                      <span className="text-sm text-muted-foreground">{document.signedBy}</span>
                    </div>
                  )}
                  {document.signedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tanggal Tanda Tangan</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(document.signedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ubah Status ke {selectedTransition && getStatusLabel(selectedTransition)}
            </DialogTitle>
            <DialogDescription>
              {selectedTransition && getTransitionDetails(document.status, selectedTransition)?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transitionNotes">Catatan Perubahan (Opsional)</Label>
              <Textarea
                id="transitionNotes"
                placeholder="Masukkan catatan untuk perubahan status..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTransitionDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleTransition} disabled={isTransitioning}>
              {isTransitioning ? 'Memproses...' : 'Ubah Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version View Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Versi {selectedVersion?.version}</DialogTitle>
            <DialogDescription>
              {selectedVersion && new Date(selectedVersion.createdAt).toLocaleString('id-ID')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[60vh]">
              {selectedVersion?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}