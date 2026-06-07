'use client';

// ============================================
// DASHBOARD NAVIGATION
// Role-based navigation menu
// ============================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Users, FileText, DollarSign, Settings, LayoutDashboard, LogOut, Briefcase } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { UserRole } from '@prisma/client';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Transaksi',
    href: '/dashboard/transactions',
    icon: <Briefcase className="h-4 w-4" />,
    allowedRoles: [UserRole.ADMIN, UserRole.STAFF, UserRole.KURIR, UserRole.FINANCE],
  },
  {
    title: 'Klien & KYC',
    href: '/dashboard/clients',
    icon: <Users className="h-4 w-4" />,
    allowedRoles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    title: 'Dokumen Akta',
    href: '/dashboard/documents',
    icon: <FileText className="h-4 w-4" />,
    allowedRoles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    title: 'Keuangan',
    href: '/dashboard/finance',
    icon: <DollarSign className="h-4 w-4" />,
    allowedRoles: [UserRole.ADMIN, UserRole.FINANCE],
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: <Settings className="h-4 w-4" />,
    allowedRoles: [UserRole.ADMIN],
  },
];

interface DashboardNavProps {
  userRole?: UserRole;
}

export function DashboardNav({ userRole: serverRole }: DashboardNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Use server-provided role, fall back to session role (for safety)
  const userRole = serverRole || (session?.user?.role as UserRole | undefined);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Filter nav items based on user role
  const filteredNavItems = userRole
    ? navItems.filter((item) => item.allowedRoles.includes(userRole))
    : [];

  return (
    <nav className="p-4 space-y-1">
      {filteredNavItems.map((item) => (
        <NavItem key={item.href} item={item} pathname={pathname} />
      ))}

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors mt-4"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </nav>
  );
}

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
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