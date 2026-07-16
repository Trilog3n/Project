'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { vendorsApi } from '@/lib/api';
import { Calendar, Star, CheckCircle, Clock } from 'lucide-react';

export default function VendorDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
    if (!loading && user?.role !== 'VENDOR') router.push('/dashboard');
  }, [loading, isAuthenticated, user, router]);

  const { data: stats } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => vendorsApi.getDashboard() as Promise<{
      todayBookings: number;
      upcoming: number;
      completed: number;
      rating: number;
    }>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  if (loading) return <PageLayout><div className="container mx-auto px-4 py-16 text-center">Loading...</div></PageLayout>;

  const cards = [
    { label: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: Calendar, href: '/vendor/bookings' },
    { label: 'Upcoming', value: stats?.upcoming ?? 0, icon: Clock, href: '/vendor/bookings?status=ACCEPTED' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle, href: '/vendor/bookings?status=COMPLETED' },
    { label: 'Rating', value: stats?.rating?.toFixed(1) ?? '0.0', icon: Star, href: '/vendor/profile' },
  ];

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Link href="/vendor/bookings"><Button>View Bookings</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                    <card.icon className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/vendor/profile#services"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-6"><h3 className="font-semibold">Manage Services</h3><p className="text-sm text-muted-foreground mt-1">Add or edit your services</p></CardContent></Card></Link>
          <Link href="/vendor/documents"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-6"><h3 className="font-semibold">Upload Documents</h3><p className="text-sm text-muted-foreground mt-1">Verification documents</p></CardContent></Card></Link>
          <Link href="/vendor/profile"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-6"><h3 className="font-semibold">Edit Profile</h3><p className="text-sm text-muted-foreground mt-1">Update your public profile</p></CardContent></Card></Link>
        </div>
      </div>
    </PageLayout>
  );
}
