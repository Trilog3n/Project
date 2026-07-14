'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vendorsApi, usersApi, categoriesApi, servicesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VendorProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => vendorsApi.getMyProfile() as Promise<{
      bio: string; experience: number; address: string; city: string; workingRadius: number; vacationMode: boolean;
    }>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => usersApi.getMe() as Promise<{
      name: string;
      email: string;
      phone?: string;
      about?: string;
      linkedinUrl?: string;
      websiteUrl?: string;
    }>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll() as Promise<Array<{ id: string; name: string; icon?: string }>>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: myServices = [] } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => servicesApi.getMy() as Promise<Array<{
      id: string;
      name: string;
      price: number;
      duration: number;
      category: { name: string };
      description?: string;
    }>>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const [form, setForm] = useState({ bio: '', experience: 0, address: '', city: 'Kochi', workingRadius: 10, vacationMode: false });
  const [userForm, setUserForm] = useState({ about: '', linkedinUrl: '', websiteUrl: '' });
  const [serviceForm, setServiceForm] = useState({ categoryId: '', name: '', price: 0, duration: 60, description: '' });

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) setForm({
      bio: profile.bio || '',
      experience: profile.experience,
      address: profile.address || '',
      city: profile.city,
      workingRadius: profile.workingRadius,
      vacationMode: profile.vacationMode,
    });
  }, [profile]);

  useEffect(() => {
    if (userProfile) {
      setUserForm({
        about: userProfile.about || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        websiteUrl: userProfile.websiteUrl || '',
      });
    }
  }, [userProfile]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => vendorsApi.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-profile'] }),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => servicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setServiceForm({ categoryId: '', name: '', price: 0, duration: 60, description: '' });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-services'] }),
  });

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Vendor Profile</h1>
        <Card>
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updateMutation.mutateAsync(form);
                await usersApi.updateMe(userForm);
                queryClient.invalidateQueries({ queryKey: ['user-profile'] });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Describe your services and experience" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience (years)</Label>
                  <Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Service Radius (km)</Label>
                  <Input type="number" value={form.workingRadius} onChange={(e) => setForm({ ...form, workingRadius: parseInt(e.target.value) || 10 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>About</Label>
                <Input
                  value={userForm.about}
                  onChange={(e) => setUserForm({ ...userForm, about: e.target.value })}
                  placeholder="Short professional summary"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={userForm.linkedinUrl}
                  onChange={(e) => setUserForm({ ...userForm, linkedinUrl: e.target.value })}
                  placeholder="https://www.linkedin.com/in/your-profile"
                />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  value={userForm.websiteUrl}
                  onChange={(e) => setUserForm({ ...userForm, websiteUrl: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.vacationMode} onChange={(e) => setForm({ ...form, vacationMode: e.target.checked })} />
                Vacation Mode (pause bookings)
              </label>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createServiceMutation.mutate({
                  categoryId: serviceForm.categoryId,
                  name: serviceForm.name,
                  price: Number(serviceForm.price),
                  duration: Number(serviceForm.duration),
                  description: serviceForm.description,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Select Category</Label>
                <select
                  className="w-full h-10 rounded-md border border-border bg-background px-3"
                  value={serviceForm.categoryId}
                  onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                  required
                >
                  <option value="">Choose a service category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Example: Wall Painting, Modular Kitchen Repair"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (INR)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) || 60 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Short summary of what is included"
                />
              </div>

              <Button type="submit" loading={createServiceMutation.isPending}>
                Add Service
              </Button>
            </form>

            <div className="pt-2 border-t border-border">
              <h3 className="font-semibold mb-3">Your Current Services</h3>
              {myServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services added yet.</p>
              ) : (
                <div className="space-y-3">
                  {myServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.category.name} • INR {service.price} • {service.duration} min</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                        loading={deleteServiceMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
