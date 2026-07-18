'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingsApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  time: string;
  proposedDate?: string;
  proposedTime?: string;
  address: string;
  notes?: string;
  customer: { name: string; email: string; phone?: string };
  service: { name: string; price: number; category: { name: string } };
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const TIMELINE_STEPS = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function dateBadgeLabel(dateValue: string, status: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDate = new Date(dateValue);
  const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
  const diffDays = Math.round((bookingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return 'Upcoming';
  if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) return 'Past';
  return 'Overdue';
}

function getGroupedByDate(bookings: Booking[]) {
  return bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
    const key = new Date(booking.date).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {});
}

function BookingSkeleton() {
  return (
    <Card className="rounded-2xl border-border/70">
      <CardContent className="space-y-3 p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-52 animate-pulse rounded bg-muted" />
        <div className="h-4 w-60 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function VendorBookingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'UPCOMING'>('UPCOMING');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [draftDate, setDraftDate] = useState<Record<string, string>>({});
  const [draftTime, setDraftTime] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
    if (!loading && user?.role !== 'VENDOR') router.push('/dashboard');
  }, [loading, isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-bookings'],
    queryFn: () => bookingsApi.getVendor() as Promise<{ data: Booking[] }>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const bookings = data?.data || [];

  const filteredBookings = bookings
    .filter((booking) => !status || booking.status === status)
    .filter((booking) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [
        booking.service.name,
        booking.service.category?.name,
        booking.customer.name,
        booking.customer.email,
        booking.customer.phone,
        booking.address,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortBy === 'NEWEST') return dateB - dateA;
      if (sortBy === 'OLDEST') return dateA - dateB;
      return dateA - dateB;
    });

  const groupedBookings = getGroupedByDate(filteredBookings);
  const sortedGroupKeys = Object.keys(groupedBookings).sort((a, b) => {
    const timeA = new Date(a).getTime();
    const timeB = new Date(b).getTime();
    return sortBy === 'NEWEST' ? timeB - timeA : timeA - timeB;
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) => bookingsApi.updateStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] }),
  });

  const proposeMutation = useMutation({
    mutationFn: ({ id, proposedDate, proposedTime }: { id: string; proposedDate: string; proposedTime: string }) =>
      bookingsApi.proposeTime(id, proposedDate, proposedTime),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] }),
  });

  const selectedBooking = expandedBookingId
    ? filteredBookings.find((booking) => booking.id === expandedBookingId) || null
    : null;

  if (loading || isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto space-y-4 px-4 py-8">
          <BookingSkeleton />
          <BookingSkeleton />
          <BookingSkeleton />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto space-y-6 px-4 py-6 pb-28 md:pb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking Requests</h1>
            <p className="text-muted-foreground">Accept, reject, or propose a better time for your customers.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/80 bg-background/80 p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, service, phone or address"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((chip) => (
              <button
                key={chip.value || 'ALL'}
                type="button"
                onClick={() => setStatus(chip.value)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                  status === chip.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST' | 'UPCOMING')}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="NEWEST">Newest</option>
              <option value="OLDEST">Oldest</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/80">
            <CardContent className="p-10 text-center">
              <div className="text-5xl">📭</div>
              <p className="mt-3 text-lg font-semibold">No bookings match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or adjusting search keywords.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                  }}
                >
                  Reset Filters
                </Button>
                <Button onClick={() => router.push('/vendor/profile#services')}>Improve Service Listings</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedGroupKeys.map((groupKey) => (
              <section key={groupKey} className="space-y-3">
                <div className="sticky top-16 z-10 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:top-[74px]">
                  {formatDate(groupKey)}
                </div>

                <div className="grid gap-4">
                  {groupedBookings[groupKey].map((booking) => {
                    const timelineCurrentIndex = TIMELINE_STEPS.indexOf(booking.status);
                    const notesOpen = expandedNotes[booking.id] || false;
                    const noteText = booking.notes || '';
                    const longNote = noteText.length > 120;
                    const contextualLabel = dateBadgeLabel(booking.date, booking.status);
                    const isExpanded = expandedBookingId === booking.id;

                    return (
                      <Card key={booking.id} className="overflow-hidden rounded-[20px] border-border/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.35)]">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-start justify-between gap-3 text-lg">
                            <div>
                              <p className="text-xl font-extrabold leading-tight">{booking.service.name}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{booking.service.category?.name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                {formatStatusLabel(booking.status)}
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                {contextualLabel}
                              </span>
                            </div>
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3 pb-4">
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-primary">
                                {booking.customer.name.slice(0, 1).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{booking.customer.name}</p>
                                <p className="truncate text-muted-foreground">{booking.customer.email}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(booking.date)} at {booking.time}</p>
                              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {booking.address}</p>
                              <p className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Estimated earning: {formatCurrency(booking.service.price || 0)}</p>
                              <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Payment status: {booking.status === 'COMPLETED' ? 'Expected Settlement' : 'Pending Job Completion'}</p>
                              {booking.customer.phone && (
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> Preferred contact: Phone</p>
                              )}
                            </div>

                            {booking.proposedDate && booking.proposedTime && (
                              <p className="rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                                Proposed time: {formatDate(booking.proposedDate)} at {booking.proposedTime}
                              </p>
                            )}

                            {noteText && (
                              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                                <p className="font-semibold">Notes</p>
                                <p className="text-muted-foreground">
                                  {longNote && !notesOpen ? `${noteText.slice(0, 120)}...` : noteText}
                                </p>
                                {longNote && (
                                  <button
                                    type="button"
                                    className="mt-1 text-xs font-semibold text-primary"
                                    onClick={() =>
                                      setExpandedNotes((prev) => ({ ...prev, [booking.id]: !prev[booking.id] }))
                                    }
                                  >
                                    {notesOpen ? 'Read Less' : 'Read More'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="h-12 w-full rounded-xl border border-border font-semibold hover:bg-muted"
                            onClick={() => setExpandedBookingId((prev) => (prev === booking.id ? null : booking.id))}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>

                          {isExpanded && (
                            <div className="space-y-4 rounded-xl border border-border bg-background/80 p-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booking Timeline</p>
                                <div className="space-y-2">
                                  {TIMELINE_STEPS.map((step, index) => {
                                    const isDone = timelineCurrentIndex >= index;
                                    const isCurrent = booking.status === step;
                                    return (
                                      <div key={step} className="flex items-center gap-2 text-sm">
                                        {isDone ? (
                                          <CheckCircle2 className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-emerald-600'}`} />
                                        ) : step === 'REJECTED' || step === 'CANCELLED' ? (
                                          <XCircle className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <Circle className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className={isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                                          {formatStatusLabel(step)}
                                        </span>
                                        {isCurrent && <span className="text-xs text-muted-foreground">{formatDate(booking.updatedAt || booking.createdAt)}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="grid gap-2 md:grid-cols-2">
                                <a
                                  href={booking.customer.phone ? `tel:${booking.customer.phone}` : undefined}
                                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border ${
                                    booking.customer.phone ? 'border-border hover:bg-muted' : 'pointer-events-none border-border/60 text-muted-foreground'
                                  }`}
                                >
                                  <Phone className="h-4 w-4" /> Call Customer
                                </a>
                                <a
                                  href={`mailto:${booking.customer.email}`}
                                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border hover:bg-muted"
                                >
                                  <Mail className="h-4 w-4" /> Chat / Email
                                </a>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="md:col-span-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-border hover:bg-muted"
                                >
                                  <MapPin className="h-4 w-4" /> Navigate to Location
                                </a>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:p-4">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
            {selectedBooking.status === 'PENDING' && (
              <>
                <Input
                  type="date"
                  className="h-12 min-w-[150px] flex-1"
                  value={draftDate[selectedBooking.id] || ''}
                  onChange={(e) => setDraftDate((prev) => ({ ...prev, [selectedBooking.id]: e.target.value }))}
                />
                <Input
                  type="time"
                  className="h-12 min-w-[130px] flex-1"
                  value={draftTime[selectedBooking.id] || ''}
                  onChange={(e) => setDraftTime((prev) => ({ ...prev, [selectedBooking.id]: e.target.value }))}
                />
                <Button
                  variant="outline"
                  className="h-12 px-5"
                  onClick={() => {
                    const proposedDate = draftDate[selectedBooking.id];
                    const proposedTime = draftTime[selectedBooking.id];
                    if (!proposedDate || !proposedTime) return;
                    proposeMutation.mutate({ id: selectedBooking.id, proposedDate, proposedTime });
                  }}
                  loading={proposeMutation.isPending}
                >
                  Reschedule
                </Button>
                <Button
                  className="h-12 px-5"
                  onClick={() => statusMutation.mutate({ id: selectedBooking.id, nextStatus: 'ACCEPTED' })}
                  loading={statusMutation.isPending}
                >
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 px-5"
                  onClick={() => statusMutation.mutate({ id: selectedBooking.id, nextStatus: 'REJECTED' })}
                  loading={statusMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}

            {selectedBooking.status === 'ACCEPTED' && (
              <Button
                className="h-12 px-6"
                onClick={() => statusMutation.mutate({ id: selectedBooking.id, nextStatus: 'IN_PROGRESS' })}
                loading={statusMutation.isPending}
              >
                Start Job
              </Button>
            )}

            {selectedBooking.status === 'IN_PROGRESS' && (
              <Button
                className="h-12 px-6"
                onClick={() => statusMutation.mutate({ id: selectedBooking.id, nextStatus: 'COMPLETED' })}
                loading={statusMutation.isPending}
              >
                Mark Completed
              </Button>
            )}

            <a
              href={selectedBooking.customer.phone ? `tel:${selectedBooking.customer.phone}` : undefined}
              className={`h-12 rounded-xl border px-4 text-sm font-semibold flex items-center justify-center gap-2 ${
                selectedBooking.customer.phone ? 'border-border hover:bg-muted' : 'pointer-events-none border-border/60 text-muted-foreground'
              }`}
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBooking.address)}`}
              target="_blank"
              rel="noreferrer"
              className="h-12 rounded-xl border border-border px-4 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted"
            >
              <MapPin className="h-4 w-4" /> Navigate
            </a>
            <a
              href={`mailto:${selectedBooking.customer.email}`}
              className="h-12 rounded-xl border border-border px-4 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" /> Chat
            </a>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
