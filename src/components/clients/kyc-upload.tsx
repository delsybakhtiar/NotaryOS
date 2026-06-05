"use client";

// ============================================
// KYC UPLOAD COMPONENT
// File upload for KTP and NPWP documents
// ============================================

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { useState } from 'react';

interface KycUploadProps {
  label: string;
  fileUrl?: string | null;
  onFileUpload?: (file: File) => void;
  onFileDelete?: () => void;
  disabled?: boolean;
}

export function KycUpload({
  label,
  fileUrl,
  onFileUpload,
  onFileDelete,
  disabled = false,
}: KycUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      onFileUpload?.(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileUpload?.(file);
    }
  };

  const handleDelete = () => {
    onFileDelete?.();
  };

  if (fileUrl) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {fileUrl}
                </p>
              </div>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-2 transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-dashed'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop atau klik untuk upload
            </p>
          </div>
          {!disabled && (
            <>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id={`upload-${label.replace(/\s+/g, '-')}`}
              />
              <label
                htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
                className="sr-only"
              >
                Upload {label}
              </label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}