'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingsApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  date: string;
  time: string;
  proposedDate?: string;
  proposedTime?: string;
  address: string;
  notes: string;
  service: { name: string; price: number; category: { name: string } };
  vendor: { user: { name: string } };
  review?: { id: string };
}

export default function BookingsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [reviewBooking, setReviewBooking] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', filter],
    queryFn: () => bookingsApi.getMy(filter ? { status: filter } : {}) as Promise<{ data: Booking[] }>,
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { bookingId: string; rating: number; comment: string }) => reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setReviewBooking(null);
    },
  });

  const confirmTimeMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.confirmTime(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const statuses = ['', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(s)}
            >
              {s || 'All'}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No bookings found</div>
        ) : (
          <div className="space-y-4">
            {data?.data?.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{booking.service.name}</h3>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(booking.status))}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.vendor.user.name} · {booking.service.category.name}
                      </p>
                      <p className="text-sm mt-1">{formatDate(booking.date)} at {booking.time}</p>
                      <p className="text-sm text-muted-foreground">{booking.address}</p>
                      <p className="font-medium mt-2">{formatCurrency(booking.service.price)}</p>
                    </div>
                    <div className="flex gap-2">
                      {booking.proposedDate && booking.proposedTime && booking.status === 'PENDING' && (
                        <Button size="sm" onClick={() => confirmTimeMutation.mutate(booking.id)}>
                          Confirm {formatDate(booking.proposedDate)} {booking.proposedTime}
                        </Button>
                      )}
                      {['PENDING', 'ACCEPTED'].includes(booking.status) && (
                        <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(booking.id)}>
                          Cancel
                        </Button>
                      )}
                      {booking.status === 'COMPLETED' && !booking.review && (
                        <Button size="sm" onClick={() => setReviewBooking(booking.id)}>Leave Review</Button>
                      )}
                    </div>
                    {booking.proposedDate && booking.proposedTime && (
                      <p className="text-xs text-primary mt-2">
                        Vendor suggested: {formatDate(booking.proposedDate)} at {booking.proposedTime}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {reviewBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Leave a Review</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Rating</Label>
                    <select
                      className="w-full h-10 rounded-md border border-border px-3 mt-1"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Comment</Label>
                    <Input
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setReviewBooking(null)}>Cancel</Button>
                    <Button
                      className="flex-1"
                      loading={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ bookingId: reviewBooking, ...reviewForm })}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
