'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vendorsApi, categoriesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search, Star, Filter } from 'lucide-react';

type CategoryItem = { id: string; name: string; icon: string };
type VendorItem = {
  id: string;
  rating: number;
  verified: boolean;
  experience: number;
  completedJobs: number;
  bio: string;
  user: { name: string };
  services: { name: string; price: number; category: { name: string; icon: string } }[];
};

function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const wrapped = value as { data?: unknown };
    if (Array.isArray(wrapped.data)) return wrapped.data as T[];
  }
  return [];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll() as Promise<CategoryItem[]>,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, category, verifiedOnly, sortBy],
    queryFn: () =>
      vendorsApi.search({ query, category, verifiedOnly, sortBy, city: 'Kochi' }) as Promise<{
        data: VendorItem[];
        total: number;
      }>,
  });

  const categoryList = extractArray<CategoryItem>(categories);
  const vendorList = extractArray<VendorItem>(data);

  const total = typeof (data as { total?: unknown } | undefined)?.total === 'number'
    ? (data as { total: number }).total
    : vendorList.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Professionals</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or service..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-border px-3 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border px-3 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rating">Sort by Rating</option>
          <option value="experience">Sort by Experience</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified only
        </label>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Searching...</div>
      ) : vendorList.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No professionals found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{total} professionals found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorList.map((vendor) => (
              <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{vendor.user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(Array.isArray(vendor.services) ? vendor.services[0] : undefined)?.category.icon}{' '}
                          {(Array.isArray(vendor.services) ? vendor.services[0] : undefined)?.category.name} · {vendor.experience} yrs
                        </p>
                      </div>
                      {vendor.verified && <Badge variant="success">Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">· {vendor.completedJobs} jobs</span>
                    </div>
                    {vendor.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.bio}</p>}
                    <div className="space-y-1 border-t pt-3">
                      {(Array.isArray(vendor.services) ? vendor.services : []).slice(0, 3).map((s, i) => (
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
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center">Loading...</div>}>
        <SearchContent />
      </Suspense>
    </PageLayout>
  );
}
