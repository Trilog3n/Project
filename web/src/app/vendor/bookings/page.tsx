'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  date: string;
  time: string;
  proposedDate?: string;
  proposedTime?: string;
  address: string;
  notes?: string;
  customer: { name: string; email: string; phone?: string };
  service: { name: string; category: { name: string } };
}

export default function VendorBookingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [draftDate, setDraftDate] = useState<Record<string, string>>({});
  const [draftTime, setDraftTime] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
    if (!loading && user?.role !== 'VENDOR') router.push('/dashboard');
  }, [loading, isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-bookings', status],
    queryFn: () => bookingsApi.getVendor(status ? { status } : {}) as Promise<{ data: Booking[] }>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });
  const bookings = data?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) => bookingsApi.updateStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] }),
  });

  const proposeMutation = useMutation({
    mutationFn: ({ id, proposedDate, proposedTime }: { id: string; proposedDate: string; proposedTime: string }) =>
      bookingsApi.proposeTime(id, proposedDate, proposedTime),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] }),
  });

  if (loading || isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Booking Requests</h1>
            <p className="text-muted-foreground">Accept, reject, or propose a better time for your customers.</p>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {bookings.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No bookings found.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{booking.service.name}</span>
                    <span className="text-sm font-medium text-primary">{booking.status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong>Customer:</strong> {booking.customer.name} ({booking.customer.email})</p>
                  <p><strong>Requested:</strong> {formatDate(booking.date)} at {booking.time}</p>
                  <p><strong>Address:</strong> {booking.address}</p>
                  {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                  {booking.proposedDate && booking.proposedTime && (
                    <p className="text-sm text-primary">
                      Proposed by you: {formatDate(booking.proposedDate)} at {booking.proposedTime}
                    </p>
                  )}

                  {booking.status === 'PENDING' && (
                    <div className="grid md:grid-cols-4 gap-2 pt-2">
                      <Input
                        type="date"
                        value={draftDate[booking.id] || ''}
                        onChange={(e) => setDraftDate((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                      />
                      <Input
                        type="time"
                        value={draftTime[booking.id] || ''}
                        onChange={(e) => setDraftTime((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const proposedDate = draftDate[booking.id];
                          const proposedTime = draftTime[booking.id];
                          if (!proposedDate || !proposedTime) return;
                          proposeMutation.mutate({ id: booking.id, proposedDate, proposedTime });
                        }}
                      >
                        Propose Time
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={() => statusMutation.mutate({ id: booking.id, nextStatus: 'ACCEPTED' })}>Accept</Button>
                        <Button variant="destructive" onClick={() => statusMutation.mutate({ id: booking.id, nextStatus: 'REJECTED' })}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'ACCEPTED' && (
                    <Button onClick={() => statusMutation.mutate({ id: booking.id, nextStatus: 'IN_PROGRESS' })}>Start Job</Button>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <Button onClick={() => statusMutation.mutate({ id: booking.id, nextStatus: 'COMPLETED' })}>Mark Completed</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
