export default function HomePage() {
  return (
    <html lang="id">
      <head>
        <title>NotaryOS | Vura Design</title>
      </head>
      <body className="bg-white dark:bg-slate-900">
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="text-center space-y-6 max-w-4xl">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">NotaryOS</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Crafted by Vura Design</p>
              </div>
            </div>

            {/* Hero Section */}
            <div className="space-y-4 mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Sistem Administrasi Kantor Notaris Modern
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Kelola klien, dokumen akta, dan keuangan kantor notaris dengan aman dan efisien.
                Sesuai standar UU PDP untuk perlindungan data pribadi.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3 mb-12 text-left">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Manajemen Klien</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Kelola data klien individual dan korporat dengan lengkap.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Dokumen Akta</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Buat, kelola, dan lacak dokumen akta dengan kontrol versi.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Manajemen Keuangan</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Kelola invoice, pembayaran, dan laporan keuangan.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Masuk ke Sistem
              </a>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-12">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                © 2026 Vura Design. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}