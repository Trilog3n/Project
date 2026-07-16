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
import { ApiError } from '@/lib/api';

type Category = { id: string; name: string; icon?: string };
type ServiceItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  category?: { name: string };
  description?: string;
};

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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.getAll() as unknown;
      if (Array.isArray(res)) return res as Category[];
      if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown[] }).data)) {
        return (res as { data: Category[] }).data;
      }
      return [];
    },
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: myServices = [] } = useQuery<ServiceItem[]>({
    queryKey: ['my-services'],
    queryFn: async () => {
      const res = await servicesApi.getMy() as unknown;
      if (Array.isArray(res)) return res as ServiceItem[];
      if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown[] }).data)) {
        return (res as { data: ServiceItem[] }).data;
      }
      return [];
    },
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const [form, setForm] = useState({ bio: '', experience: 0, address: '', city: 'Kochi', workingRadius: 10, vacationMode: false });
  const [userForm, setUserForm] = useState({ about: '', linkedinUrl: '', websiteUrl: '' });
  const [serviceForm, setServiceForm] = useState({ categoryId: '', name: '', price: 0, duration: 60, description: '' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceForm, setEditingServiceForm] = useState({ categoryId: '', name: '', price: 0, duration: 60, description: '' });
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [serviceMessage, setServiceMessage] = useState<string>('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== 'VENDOR') {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

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

  useEffect(() => {
    if (!serviceForm.categoryId && categories.length > 0) {
      setServiceForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, serviceForm.categoryId]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => vendorsApi.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-profile'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => servicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setServiceForm({ categoryId: categories[0]?.id || '', name: '', price: 0, duration: 60, description: '' });
      setServiceMessage('Service added successfully.');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to add service.';
      setServiceMessage(message);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setEditingServiceId(null);
      setServiceMessage('Service updated successfully.');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to update service.';
      setServiceMessage(message);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setServiceMessage('Service removed.');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to remove service.';
      setServiceMessage(message);
    },
  });

  const saveProfile = async () => {
    setProfileMessage('');
    try {
      await Promise.all([
        updateMutation.mutateAsync(form),
        updateUserMutation.mutateAsync(userForm),
      ]);
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update profile.';
      setProfileMessage(message);
    }
  };

  const addService = async () => {
    setServiceMessage('');
    if (!serviceForm.categoryId) {
      setServiceMessage('Please select a category.');
      return;
    }
    if (!serviceForm.name.trim()) {
      setServiceMessage('Please enter a service name.');
      return;
    }
    if (serviceForm.price < 0) {
      setServiceMessage('Price cannot be negative.');
      return;
    }
    if (serviceForm.duration < 15 || serviceForm.duration > 480) {
      setServiceMessage('Duration must be between 15 and 480 minutes.');
      return;
    }

    await createServiceMutation.mutateAsync({
      categoryId: serviceForm.categoryId,
      name: serviceForm.name.trim(),
      price: Number(serviceForm.price),
      duration: Number(serviceForm.duration),
      description: serviceForm.description.trim() || undefined,
    });
  };

  const startEditService = (service: ServiceItem) => {
    setServiceMessage('');
    setEditingServiceId(service.id);
    setEditingServiceForm({
      categoryId: service.categoryId,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || '',
    });
  };

  const saveEditedService = async (serviceId: string) => {
    setServiceMessage('');
    if (!editingServiceForm.categoryId) {
      setServiceMessage('Please select a category.');
      return;
    }
    if (!editingServiceForm.name.trim()) {
      setServiceMessage('Please enter a service name.');
      return;
    }
    if (editingServiceForm.price < 0) {
      setServiceMessage('Price cannot be negative.');
      return;
    }
    if (editingServiceForm.duration < 15 || editingServiceForm.duration > 480) {
      setServiceMessage('Duration must be between 15 and 480 minutes.');
      return;
    }

    await updateServiceMutation.mutateAsync({
      id: serviceId,
      data: {
        categoryId: editingServiceForm.categoryId,
        name: editingServiceForm.name.trim(),
        price: Number(editingServiceForm.price),
        duration: Number(editingServiceForm.duration),
        description: editingServiceForm.description.trim() || undefined,
      },
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Vendor Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Keep your profile complete to improve customer trust and bookings.</p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveProfile();
              }}
              className="space-y-4"
            >
              {profileMessage && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{profileMessage}</div>
              )}
              <div className="space-y-2">
                <Label>Bio</Label>
                <textarea
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Describe your services and experience"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience (years)</Label>
                  <Input type="number" min={0} value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Service Radius (km)</Label>
                  <Input type="number" min={1} max={50} value={form.workingRadius} onChange={(e) => setForm({ ...form, workingRadius: parseInt(e.target.value) || 10 })} />
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

        <Card className="mt-6" id="services">
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
            <p className="text-sm text-muted-foreground">Add clear, specific services with realistic pricing and duration.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await addService();
              }}
            >
              {serviceMessage && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{serviceMessage}</div>
              )}
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
                <textarea
                  className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <div key={service.id} className="border rounded-lg p-3 space-y-3">
                      {editingServiceId === service.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <select
                                className="w-full h-10 rounded-md border border-border bg-background px-3"
                                value={editingServiceForm.categoryId}
                                onChange={(e) => setEditingServiceForm({ ...editingServiceForm, categoryId: e.target.value })}
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input value={editingServiceForm.name} onChange={(e) => setEditingServiceForm({ ...editingServiceForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Price (INR)</Label>
                              <Input type="number" min={0} value={editingServiceForm.price} onChange={(e) => setEditingServiceForm({ ...editingServiceForm, price: Number(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input type="number" min={15} max={480} value={editingServiceForm.duration} onChange={(e) => setEditingServiceForm({ ...editingServiceForm, duration: Number(e.target.value) || 60 })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                              className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={editingServiceForm.description}
                              onChange={(e) => setEditingServiceForm({ ...editingServiceForm, description: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => saveEditedService(service.id)} loading={updateServiceMutation.isPending}>Save</Button>
                            <Button type="button" variant="outline" onClick={() => setEditingServiceId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.category?.name || 'Uncategorized'} • INR {service.price} • {service.duration} min</p>
                            {service.description && <p className="text-sm mt-1">{service.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" type="button" onClick={() => startEditService(service)}>Edit</Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => deleteServiceMutation.mutate(service.id)}
                              loading={deleteServiceMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
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
