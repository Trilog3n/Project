'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vendorsApi, categoriesApi } from '@/lib/api';
import { APP_TAGLINE, DEFAULT_CITY } from '@/lib/config';
import { formatCurrency } from '@/lib/utils';
import { Search, Shield, Star, CheckCircle, Users } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Vendor {
  id: string;
  rating: number;
  verified: boolean;
  experience: number;
  completedJobs: number;
  user: { name: string };
  services: { name: string; price: number; category: { name: string; icon: string } }[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featured } = useQuery({
    queryKey: ['featured-vendors'],
    queryFn: () => vendorsApi.featured(DEFAULT_CITY) as Promise<Vendor[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll() as Promise<Category[]>,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/50 py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="success" className="mb-4">Trusted by homeowners in {DEFAULT_CITY}</Badge>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-6xl">
            Find Verified Local<br />Professionals
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            {APP_TAGLINE}. Every professional is verified, rated, and ready to serve you.
          </p>

          <form onSubmit={handleSearch} className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plumbers, electricians, cleaners..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Search</Button>
          </form>
        </div>
      </section>

      {/* Trust Features */}
      <section className="border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
            {[
              { icon: Shield, title: 'Verified Identities', desc: 'Government ID & document verification' },
              { icon: Star, title: 'Real Reviews', desc: 'Only from completed bookings' },
              { icon: CheckCircle, title: 'Transparent Profiles', desc: 'Experience, services & pricing' },
              { icon: Users, title: 'Dispute Resolution', desc: 'Admin-moderated complaint center' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-background/80 p-4 text-center md:border-0 md:bg-transparent md:p-0">
                <item.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/search?category=${encodeURIComponent(cat.name)}`}>
                <Card className="cursor-pointer rounded-2xl border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4 text-center md:p-6">
                    <span className="text-3xl mb-2 block">{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Featured Professionals</h2>
            <Link href="/search">
              <Button variant="outline" size="sm" className="md:size-default">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {featured?.map((vendor) => (
              <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                <Card className="h-full rounded-2xl border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{vendor.user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vendor.services[0]?.category.name} · {vendor.experience} yrs exp
                        </p>
                      </div>
                      {vendor.verified && <Badge variant="success">Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({vendor.completedJobs} jobs)</span>
                    </div>
                    <div className="space-y-1">
                      {vendor.services.slice(0, 2).map((s, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{s.name}</span>
                          <span className="font-medium">{formatCurrency(s.price)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-extrabold md:text-3xl">Are you a local professional?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Diggu to get verified, build your reputation, and connect with customers in {DEFAULT_CITY}.
          </p>
          <Link href="/register?role=vendor">
            <Button size="lg">Register as Vendor</Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
