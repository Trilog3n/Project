'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function MobileTabbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const dashboardHref =
    user?.role === 'VENDOR'
      ? '/vendor/dashboard'
      : user?.role === 'ADMIN'
        ? '/admin'
        : '/dashboard';

  const profileHref = user?.role === 'VENDOR' ? '/vendor/profile' : '/profile';

  const items = [
    { key: 'home', href: '/', label: 'Home', icon: Home },
    { key: 'search', href: '/search', label: 'Search', icon: Search },
    {
      key: 'bookings',
      href: isAuthenticated ? '/bookings' : '/login',
      label: 'Bookings',
      icon: Calendar,
    },
    {
      key: 'dashboard',
      href: isAuthenticated ? dashboardHref : '/login',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'profile',
      href: isAuthenticated ? profileHref : '/login',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
