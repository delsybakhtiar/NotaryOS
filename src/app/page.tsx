'use client';

// ============================================
// LANDING PAGE
// Entry point for NotaryOS
// ============================================

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users, FileText, DollarSign, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">NotaryOS</h1>
              <p className="text-xs text-muted-foreground">Sistem Administrasi Kantor Notaris</p>
            </div>
          </div>
          <Button onClick={() => router.push('/login')}>
            Masuk
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sistem Administrasi Kantor Notaris Modern
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Kelola klien, dokumen akta, dan keuangan kantor notaris dengan aman dan efisien.
            Sesuai standar UU PDP untuk perlindungan data pribadi.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/login')} className="gap-2">
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open('#features', '_self')}>
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Manajemen Klien</CardTitle>
                <CardDescription>
                  Kelola data klien individual dan korporat dengan lengkap, termasuk KYC dan verifikasi identitas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Dokumen Akta</CardTitle>
                <CardDescription>
                  Buat, kelola, dan lacak dokumen akta dengan kontrol versi dan workflow approval.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Manajemen Keuangan</CardTitle>
                <CardDescription>
                  Kelola invoice, pembayaran, dan laporan keuangan dengan mudah dan akurat.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Security Features */}
        <div className="max-w-4xl mx-auto mb-16" id="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                Keamanan & Kepatuhan
              </CardTitle>
              <CardDescription>
                Dilindungi dengan standar keamanan berlapis sesuai UU PDP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Enkripsi End-to-End</h4>
                    <p className="text-sm text-muted-foreground">Semua data dienkripsi dengan standar industri</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Audit Log Lengkap</h4>
                    <p className="text-sm text-muted-foreground">Setiap aksi tercatat untuk kepatuhan dan transparansi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Role-Based Access Control</h4>
                    <p className="text-sm text-muted-foreground">Akses terbatas berdasarkan peran dan izin pengguna</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Sesuai UU PDP</h4>
                    <p className="text-sm text-muted-foreground">Mematuhi Undang-Undang Perlindungan Data Pribadi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Siap Memulai?</CardTitle>
              <CardDescription>
                Masuk ke akun Anda untuk mulai menggunakan NotaryOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => router.push('/login')} className="gap-2 w-full md:w-auto">
                Masuk ke Sistem
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Vura Design. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}