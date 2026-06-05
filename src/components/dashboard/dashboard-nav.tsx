'use client';

// ============================================
// DASHBOARD NAVIGATION
// Navigation menu for dashboard
// ============================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, FileText, DollarSign, Settings, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Klien & KYC',
    href: '/dashboard/clients',
    icon: <Users className="h-4 w-4" />,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    title: 'Dokumen Akta',
    href: '/dashboard/documents',
    icon: <FileText className="h-4 w-4" />,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    title: 'Keuangan',
    href: '/dashboard/finance',
    icon: <DollarSign className="h-4 w-4" />,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: <Settings className="h-4 w-4" />,
    roles: ['ADMIN'],
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="p-4 space-y-1">
      {navItems.map((item) => (
        <NavItem key={item.href} item={item} pathname={pathname} />
      ))}
      
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </nav>
  );
}

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  // TODO: Check user role from session
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {item.icon}
      {item.title}
    </Link>
  );
}