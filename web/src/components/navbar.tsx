'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/config';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardLink =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'VENDOR'
        ? '/vendor/dashboard'
        : '/dashboard';

  const links = isAuthenticated
    ? user?.role === 'ADMIN'
      ? [
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/vendors', label: 'Vendors' },
          { href: '/admin/bookings', label: 'Bookings' },
        ]
      : user?.role === 'VENDOR'
        ? [
            { href: '/vendor/dashboard', label: 'Dashboard' },
            { href: '/vendor/bookings', label: 'Bookings' },
            { href: '/vendor/services', label: 'Services' },
          ]
        : [
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/search', label: 'Search' },
            { href: '/bookings', label: 'Bookings' },
          ]
    : [];

  return (
    <header className="safe-top sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-[72px]">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold md:text-xl">
          <Shield className="h-5 w-5 text-primary md:h-6 md:w-6" />
          {APP_NAME}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {!isAuthenticated && (
            <>
              <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
                Find Professionals
              </Link>
              <Link href="/register?role=vendor" className="text-sm text-muted-foreground hover:text-foreground">
                Become a Vendor
              </Link>
            </>
          )}
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href={user?.role === 'VENDOR' ? '/vendor/profile' : '/profile'}>
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <button className="rounded-md p-1.5 hover:bg-muted md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 shadow-lg space-y-3">
          {!isAuthenticated && (
            <>
              <Link href="/search" className="block text-sm" onClick={() => setMobileOpen(false)}>
                Find Professionals
              </Link>
              <Link href="/register?role=vendor" className="block text-sm" onClick={() => setMobileOpen(false)}>
                Become a Vendor
              </Link>
            </>
          )}
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Login</Button></Link>
              <Link href="/register" className="flex-1"><Button className="w-full">Sign Up</Button></Link>
            </div>
          )}
          {isAuthenticated && (
            <Button variant="outline" className="w-full" onClick={logout}>Logout</Button>
          )}
        </div>
      )}
    </header>
  );
}
