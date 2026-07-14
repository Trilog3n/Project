'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vendorsApi, categoriesApi, bookingsApi } from '@/lib/api';
import { DEFAULT_CITY } from '@/lib/config';
import { formatCurrency } from '@/lib/utils';
import { Search, Star, Calendar, ArrowRight } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  const { data: featured } = useQuery({
    queryKey: ['featured'],
    queryFn: () => vendorsApi.featured(DEFAULT_CITY),
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    enabled: isAuthenticated,
  });

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMy({ limit: '5' }) as Promise<{ data: unknown[] }>,
    enabled: isAuthenticated,
  });

  if (loading) return <PageLayout><div className="container mx-auto px-4 py-16 text-center">Loading...</div></PageLayout>;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Find verified professionals in {DEFAULT_CITY}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/search">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <Search className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Search Professionals</h3>
                  <p className="text-sm text-muted-foreground">Find by category or name</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/bookings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">My Bookings</h3>
                  <p className="text-sm text-muted-foreground">{bookings?.data?.length || 0} recent bookings</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <Star className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">My Profile</h3>
                  <p className="text-sm text-muted-foreground">Manage your account</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(categories as { id: string; name: string; icon: string }[])?.map((cat) => (
              <Link key={cat.id} href={`/search?category=${encodeURIComponent(cat.name)}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="text-sm font-medium mt-1">{cat.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Nearby Professionals</h2>
            <Link href="/search"><Button variant="ghost" size="sm">View all <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(featured as { id: string; rating: number; verified: boolean; user: { name: string }; services: { name: string; price: number }[] }[])?.slice(0, 3).map((v) => (
              <Link key={v.id} href={`/vendor/${v.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{v.user.name}</h3>
                      {v.verified && <Badge variant="success">Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{v.rating.toFixed(1)}</span>
                    </div>
                    {v.services[0] && (
                      <p className="text-sm text-muted-foreground mt-2">
                        From {formatCurrency(v.services[0].price)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
