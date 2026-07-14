'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vendorsApi, bookingsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Star, Shield, MapPin, Briefcase, Clock } from 'lucide-react';

interface VendorDetail {
  id: string;
  bio: string;
  experience: number;
  rating: number;
  verified: boolean;
  completedJobs: number;
  address: string;
  city: string;
  user: { id: string; name: string; phone: string };
  services: { id: string; name: string; price: number; duration: number; description: string; category: { name: string; icon: string } }[];
  reviews: { id: string; rating: number; comment: string; createdAt: string; customer: { name: string } }[];
  workingHours: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[];
}

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [bookingForm, setBookingForm] = useState({ date: '', time: '10:00', address: '', notes: '' });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsApi.getById(id) as Promise<VendorDetail>,
  });

  const bookingMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setShowBooking(false);
      router.push('/bookings');
    },
  });

  const handleBook = (serviceId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setSelectedService(serviceId);
    setShowBooking(true);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    bookingMutation.mutate({
      vendorId: id,
      serviceId: selectedService,
      ...bookingForm,
    });
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) return <PageLayout><div className="container mx-auto px-4 py-16 text-center">Loading...</div></PageLayout>;
  if (!vendor) return <PageLayout><div className="container mx-auto px-4 py-16 text-center">Vendor not found</div></PageLayout>;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{vendor.user.name}</h1>
                  <p className="text-muted-foreground mt-1">{vendor.services[0]?.category.name} Professional</p>
                </div>
                {vendor.verified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {vendor.rating.toFixed(1)} ({vendor.reviews.length} reviews)
                </span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {vendor.experience} yrs</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {vendor.city}</span>
              </div>
            </div>

            {vendor.bio && (
              <Card>
                <CardHeader><CardTitle>About</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{vendor.bio}</p></CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Services</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {vendor.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {service.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(service.price)}</p>
                      <Button size="sm" className="mt-2" onClick={() => handleBook(service.id)}>Book</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
              <CardContent>
                {vendor.reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {vendor.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{review.customer.name}</span>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{vendor.completedJobs}</p>
                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                </div>
              </CardContent>
            </Card>

            {vendor.workingHours.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Working Hours</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {vendor.workingHours.filter(h => h.isActive).map((h) => (
                    <div key={h.dayOfWeek} className="flex justify-between text-sm">
                      <span>{days[h.dayOfWeek]}</span>
                      <span>{h.startTime} - {h.endTime}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {showBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Book Service</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitBooking} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={bookingForm.address} onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })} required placeholder="Service address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Any special instructions" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBooking(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={bookingMutation.isPending}>Submit Booking</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
