// Test page without auth dependency
export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">NotaryOS</h1>
        <p className="text-xl text-muted-foreground">
          Crafted by Vura Design
        </p>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <p className="text-green-600">✅ Aplikasi berjalan dengan baik!</p>
        </div>
        <footer className="border-t mt-auto">
          <p className="text-center text-sm text-muted-foreground pt-6">
            © 2026 Vura Design. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}