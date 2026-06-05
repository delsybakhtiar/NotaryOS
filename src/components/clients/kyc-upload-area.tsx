'use client';

// ============================================
// KYC UPLOAD AREA COMPONENT
// Upload UI for KTP/NPWP documents
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';

interface KycUploadAreaProps {
  clientId: string;
  documentType: 'KTP' | 'NPWP';
  fileUrl: string | null;
}

export function KycUploadArea({ clientId, documentType, fileUrl }: KycUploadAreaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(fileUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
    }
  };

  const handleUpload = async () => {
    if (!currentFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('clientId', clientId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFile(result.fileUrl);
        setCurrentFile(null);
      } else {
        alert('Gagal mengupload file: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat mengupload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) return;

    try {
      const response = await fetch('/api/kyc/delete', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          documentType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFile(null);
      } else {
        alert('Gagal menghapus file: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus file');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Dokumen {documentType}</h3>
              <p className="text-sm text-muted-foreground">
                Upload scan {documentType.toLowerCase()} dalam format PDF, JPG, atau PNG
              </p>
            </div>
            {uploadedFile && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Terupload
              </Badge>
            )}
          </div>

          {/* Upload Area */}
          {!uploadedFile ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id={`upload-${documentType}-${clientId}`}
              />
              <label
                htmlFor={`upload-${documentType}-${clientId}`}
                className="cursor-pointer block"
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium mb-1">
                  Drag & drop atau klik untuk upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG (maks. 10MB)
                </p>
              </label>

              {currentFile && (
                <div className="mt-4 p-3 bg-accent rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{currentFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(currentFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-accent rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">File {documentType}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {uploadedFile}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}