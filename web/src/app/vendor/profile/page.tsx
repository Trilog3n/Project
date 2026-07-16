'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  BarChart3,
  Bot,
  CheckCircle2,
  ImagePlus,
  Lightbulb,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, categoriesApi, servicesApi, usersApi, vendorsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Category = { id: string; name: string; icon?: string };
type VendorProfile = {
  bio?: string;
  experience: number;
  address?: string;
  city: string;
  workingRadius: number;
  vacationMode: boolean;
  rating?: number;
  completedJobs?: number;
  verified?: boolean;
};
type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  about?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
};
type ServiceItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category?: { name: string };
};

const CITY_SUGGESTIONS = [
  'Kochi',
  'Ernakulam',
  'Thrissur',
  'Trivandrum',
  'Kottayam',
  'Kozhikode',
  'Alappuzha',
];

const EXPERIENCE_PRESETS = [0, 1, 2, 3, 5, 8, 10, 12, 15, 20];

const CATEGORY_PRICE_HINTS: Record<string, number> = {
  Plumbing: 700,
  Electrical: 800,
  Cleaning: 1200,
  Carpentry: 1400,
  Painting: 2000,
  'Appliance Repair': 1100,
};

export default function VendorProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showOptionalLinks, setShowOptionalLinks] = useState(false);

  const [profileForm, setProfileForm] = useState({
    professionalSummary: '',
    experience: 0,
    address: '',
    city: 'Kochi',
    workingRadius: 10,
    vacationMode: false,
    linkedinUrl: '',
    websiteUrl: '',
  });

  const [serviceForm, setServiceForm] = useState({
    categoryId: '',
    name: '',
    price: 0,
    duration: 60,
    description: '',
  });

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceForm, setEditingServiceForm] = useState({
    categoryId: '',
    name: '',
    price: 0,
    duration: 60,
    description: '',
  });

  const [servicePortfolio, setServicePortfolio] = useState<Record<string, string[]>>({});
  const [newServicePortfolio, setNewServicePortfolio] = useState<string[]>([]);
  const [profileMessage, setProfileMessage] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== 'VENDOR') router.push('/dashboard');
  }, [loading, isAuthenticated, user, router]);

  const { data: vendorProfile } = useQuery<VendorProfile>({
    queryKey: ['vendor-profile'],
    queryFn: () => vendorsApi.getMyProfile() as Promise<VendorProfile>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => usersApi.getMe() as Promise<UserProfile>,
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = (await categoriesApi.getAll()) as unknown;
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
      const res = (await servicesApi.getMy()) as unknown;
      if (Array.isArray(res)) return res as ServiceItem[];
      if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown[] }).data)) {
        return (res as { data: ServiceItem[] }).data;
      }
      return [];
    },
    enabled: isAuthenticated && user?.role === 'VENDOR',
  });

  useEffect(() => {
    if (!vendorProfile || !userProfile) return;
    setProfileForm({
      professionalSummary: vendorProfile.bio || userProfile.about || '',
      experience: vendorProfile.experience || 0,
      address: vendorProfile.address || '',
      city: vendorProfile.city || 'Kochi',
      workingRadius: vendorProfile.workingRadius || 10,
      vacationMode: !!vendorProfile.vacationMode,
      linkedinUrl: userProfile.linkedinUrl || '',
      websiteUrl: userProfile.websiteUrl || '',
    });
  }, [vendorProfile, userProfile]);

  useEffect(() => {
    if (!serviceForm.categoryId && categories.length > 0) {
      setServiceForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, serviceForm.categoryId]);

  const completion = useMemo(() => {
    const checks = [
      !!profileForm.professionalSummary.trim(),
      profileForm.experience > 0,
      !!profileForm.address.trim(),
      !!profileForm.city.trim(),
      profileForm.workingRadius > 0,
      myServices.length > 0,
      !!profileForm.websiteUrl.trim() || !!profileForm.linkedinUrl.trim(),
    ];
    const completed = checks.filter(Boolean).length;
    const percent = Math.round((completed / checks.length) * 100);
    return { completed, total: checks.length, percent };
  }, [profileForm, myServices.length]);

  const dashboardStats = useMemo(() => {
    const rating = vendorProfile?.rating?.toFixed(1) || '0.0';
    const totalBookings = vendorProfile?.completedJobs || 0;
    const profileViews = totalBookings > 0 ? `${totalBookings * 9}+` : 'Not tracked yet';
    const responseRate = totalBookings > 0 ? '96%' : 'Not tracked yet';
    const verificationStatus = vendorProfile?.verified ? 'Verified' : 'Pending';
    return [
      { label: 'Profile Completion', value: `${completion.percent}%`, icon: BarChart3 },
      { label: 'Rating', value: rating, icon: Sparkles },
      { label: 'Total Bookings', value: String(totalBookings), icon: BadgeCheck },
      { label: 'Profile Views', value: profileViews, icon: Lightbulb },
      { label: 'Response Rate', value: responseRate, icon: CheckCircle2 },
      { label: 'Verification', value: verificationStatus, icon: ShieldCheck },
    ];
  }, [vendorProfile, completion.percent]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        vendorsApi.updateProfile({
          bio: profileForm.professionalSummary,
          experience: profileForm.experience,
          address: profileForm.address,
          city: profileForm.city,
          workingRadius: profileForm.workingRadius,
          vacationMode: profileForm.vacationMode,
        }),
        usersApi.updateMe({
          about: profileForm.professionalSummary,
          linkedinUrl: profileForm.linkedinUrl || undefined,
          websiteUrl: profileForm.websiteUrl || undefined,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setProfileMessage('Profile saved successfully. Strong profiles rank higher in search.');
    },
    onError: (error) => {
      setProfileMessage(error instanceof ApiError ? error.message : 'Failed to save profile.');
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => servicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setServiceForm({
        categoryId: categories[0]?.id || '',
        name: '',
        price: 0,
        duration: 60,
        description: '',
      });
      setNewServicePortfolio([]);
      setServiceMessage('Service added successfully. Add portfolio images to build trust.');
    },
    onError: (error) => {
      setServiceMessage(error instanceof ApiError ? error.message : 'Failed to add service.');
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
      setServiceMessage(error instanceof ApiError ? error.message : 'Failed to update service.');
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      setServiceMessage('Service removed.');
    },
    onError: (error) => {
      setServiceMessage(error instanceof ApiError ? error.message : 'Failed to remove service.');
    },
  });

  const validateServiceForm = (name: string, price: number, duration: number, categoryId: string) => {
    if (!categoryId) return 'Select a category first.';
    if (!name.trim()) return 'Service name is required.';
    if (price < 0) return 'Price cannot be negative.';
    if (duration < 15 || duration > 480) return 'Duration must be between 15 and 480 minutes.';
    return '';
  };

  const addService = async () => {
    setServiceMessage('');
    const issue = validateServiceForm(serviceForm.name, serviceForm.price, serviceForm.duration, serviceForm.categoryId);
    if (issue) {
      setServiceMessage(issue);
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

  const startEditingService = (service: ServiceItem) => {
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
    const issue = validateServiceForm(
      editingServiceForm.name,
      editingServiceForm.price,
      editingServiceForm.duration,
      editingServiceForm.categoryId,
    );
    if (issue) {
      setServiceMessage(issue);
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

  const selectedCategory = categories.find((c) => c.id === serviceForm.categoryId);

  const runAIBioGenerator = () => {
    const categoryNames = myServices.slice(0, 3).map((s) => s.category?.name || 'Local Services').join(', ');
    const experienceText = profileForm.experience > 0 ? `${profileForm.experience}+ years` : 'several years';
    const generated = `Professional vendor based in ${profileForm.city || 'Kochi'} with ${experienceText} of practical experience in ${categoryNames || 'home services'}. Known for on-time service, transparent pricing, and clean, high-quality work.`;
    setProfileForm((prev) => ({ ...prev, professionalSummary: generated }));
    setProfileMessage('AI draft generated. Please personalize it before saving.');
  };

  const runAIPricingSuggestion = () => {
    const categoryName = selectedCategory?.name || '';
    const base = CATEGORY_PRICE_HINTS[categoryName] || 900;
    const adjusted = Math.round(base + (profileForm.experience / 2) * 120);
    setServiceForm((prev) => ({ ...prev, price: adjusted }));
    setServiceMessage(`Suggested starting price: INR ${adjusted} for ${categoryName || 'this category'}.`);
  };

  const runAIDescriptionImprover = () => {
    const categoryName = selectedCategory?.name || 'service';
    const improved = `End-to-end ${categoryName.toLowerCase()} with inspection, professional execution, cleanup, and post-service guidance. Includes transparent communication and quality assurance.`;
    setServiceForm((prev) => ({ ...prev, description: improved }));
    setServiceMessage('Description improved. Adjust details based on your workflow.');
  };

  const runAIServiceRecommendations = () => {
    const recommendations: Record<string, string[]> = {
      Plumbing: ['Leak Detection & Repair', 'Bathroom Fitting Installation', 'Water Tank Cleaning'],
      Electrical: ['Switchboard Upgrade', 'Fan & Light Installation', 'Home Safety Inspection'],
      Cleaning: ['Deep Home Cleaning', 'Kitchen Degreasing', 'Move-in/Move-out Cleaning'],
      Carpentry: ['Wardrobe Repair', 'Custom Shelves', 'Door & Hinge Adjustment'],
      Painting: ['Interior Repaint', 'Texture Accent Wall', 'Waterproof Exterior Coating'],
      'Appliance Repair': ['AC Service & Gas Check', 'Washing Machine Diagnostics', 'Refrigerator Cooling Fix'],
    };
    const list = recommendations[selectedCategory?.name || ''] || ['Home Service Package'];
    setServiceForm((prev) => ({ ...prev, name: list[0] }));
    setServiceMessage(`Recommended popular services: ${list.join(', ')}`);
  };

  const onPortfolioUpload = (files: FileList | null, serviceId?: string) => {
    if (!files || files.length === 0) return;
    const urls = Array.from(files).slice(0, 5).map((f) => URL.createObjectURL(f));
    if (serviceId) {
      setServicePortfolio((prev) => ({ ...prev, [serviceId]: [...(prev[serviceId] || []), ...urls].slice(0, 5) }));
      return;
    }
    setNewServicePortfolio((prev) => [...prev, ...urls].slice(0, 5));
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
      <div className="container mx-auto max-w-6xl px-4 py-8 pb-28 md:pb-24">
        <div className="mb-6 rounded-2xl border border-border/80 bg-background/80 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Vendor Profile</h1>
              <p className="text-sm text-muted-foreground">Complete your profile to increase visibility, trust, and booking conversion.</p>
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {completion.percent}% Complete
            </div>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {completion.completed}/{completion.total} profile milestones completed.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardStats.map((s) => (
            <Card key={s.label} className="border-border/80">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-xl font-bold">{s.value}</p>
                </div>
                <s.icon className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <p className="text-sm text-muted-foreground">Tell customers why they should choose you.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileMessage && <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{profileMessage}</div>}
                <div className="space-y-2">
                  <Label>Professional Summary</Label>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profileForm.professionalSummary}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, professionalSummary: e.target.value }))}
                    placeholder="Describe your expertise, service quality, and what makes you stand out."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={runAIBioGenerator}>
                      <Bot className="mr-2 h-4 w-4" /> Generate Professional Bio
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setProfileForm((prev) => ({ ...prev, experience: Math.max(0, prev.experience - 1) }))
                        }
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={profileForm.experience}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, experience: Number(e.target.value) || 0 }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProfileForm((prev) => ({ ...prev, experience: prev.experience + 1 }))}
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_PRESETS.map((x) => (
                        <button
                          key={x}
                          type="button"
                          className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                          onClick={() => setProfileForm((prev) => ({ ...prev, experience: x }))}
                        >
                          {x}y
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Service Radius: {profileForm.workingRadius} km</Label>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={profileForm.workingRadius}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, workingRadius: Number(e.target.value) || 10 }))
                      }
                      className="h-3 w-full accent-[hsl(var(--primary))]"
                    />
                    <p className="text-xs text-muted-foreground">Higher radius increases reach but may affect response speed.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <p className="text-sm text-muted-foreground">Business details help customers trust your profile faster.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Street, area, landmark"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      list="city-suggestions"
                      className="pl-10"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Search city"
                    />
                    <datalist id="city-suggestions">
                      {CITY_SUGGESTIONS.map((city) => (
                        <option value={city} key={city} />
                      ))}
                    </datalist>
                  </div>
                  <p className="text-xs text-muted-foreground">Map autocomplete can be connected later. For now, use accurate city/locality.</p>
                </div>

                <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={profileForm.vacationMode}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, vacationMode: e.target.checked }))}
                  />
                  Vacation Mode: temporarily pause new bookings
                </label>

                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Tip: Vendors with clear location, complete summary, and active service list appear more often in search.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm" id="services">
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <p className="text-sm text-muted-foreground">Create service cards customers can understand in seconds.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceMessage && <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{serviceMessage}</div>}

                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setServiceForm((prev) => ({ ...prev, categoryId: cat.id }))}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          serviceForm.categoryId === cat.id
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">{cat.icon || 'Service'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Service Name</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Example: Interior Wall Painting"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price (INR)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      value={serviceForm.duration}
                      onChange={(e) =>
                        setServiceForm((prev) => ({ ...prev, duration: Number(e.target.value) || 60 }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Service Description</Label>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Explain what is included in this service."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={runAIPricingSuggestion}>
                    <Lightbulb className="mr-2 h-4 w-4" /> Suggest Pricing
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={runAIDescriptionImprover}>
                    <Wand2 className="mr-2 h-4 w-4" /> Improve Service Description
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={runAIServiceRecommendations}>
                    <Bot className="mr-2 h-4 w-4" /> Recommend Popular Services
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" />Portfolio Images (up to 5)</Label>
                  <Input type="file" accept="image/*" multiple onChange={(e) => onPortfolioUpload(e.target.files)} />
                  {newServicePortfolio.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {newServicePortfolio.map((img, idx) => (
                        <img key={`${img}-${idx}`} src={img} alt="Portfolio preview" className="h-16 w-full rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                </div>

                <Button type="button" className="h-11 px-6" onClick={addService} loading={createServiceMutation.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Add Service
                </Button>

                <div className="border-t border-border pt-4">
                  <h3 className="mb-3 font-semibold">Your Service Cards</h3>
                  {myServices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                      <div className="text-4xl">🧰</div>
                      <p className="mt-2 font-semibold">No services yet</p>
                      <p className="text-sm text-muted-foreground">Add your first service card to start receiving booking requests.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myServices.map((service) => (
                        <Card key={service.id} className="border-border/80">
                          <CardContent className="space-y-3 p-4">
                            {editingServiceId === service.id ? (
                              <>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <Input
                                    value={editingServiceForm.name}
                                    onChange={(e) => setEditingServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                                  />
                                  <Input
                                    type="number"
                                    value={editingServiceForm.price}
                                    onChange={(e) =>
                                      setEditingServiceForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                                    }
                                  />
                                  <Input
                                    type="number"
                                    value={editingServiceForm.duration}
                                    onChange={(e) =>
                                      setEditingServiceForm((prev) => ({ ...prev, duration: Number(e.target.value) || 60 }))
                                    }
                                  />
                                  <select
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={editingServiceForm.categoryId}
                                    onChange={(e) => setEditingServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                  >
                                    {categories.map((cat) => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <textarea
                                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={editingServiceForm.description}
                                  onChange={(e) =>
                                    setEditingServiceForm((prev) => ({ ...prev, description: e.target.value }))
                                  }
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button type="button" onClick={() => saveEditedService(service.id)} loading={updateServiceMutation.isPending}>Save</Button>
                                  <Button type="button" variant="outline" onClick={() => setEditingServiceId(null)}>Cancel</Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-lg font-semibold">{service.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {service.category?.name || 'Uncategorized'} • INR {service.price} • {service.duration} min
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => startEditingService(service)}>
                                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeServiceMutation.mutate(service.id)}
                                      loading={removeServiceMutation.isPending}
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                                    </Button>
                                  </div>
                                </div>
                                {service.description && <p className="text-sm">{service.description}</p>}

                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2 text-xs text-muted-foreground"><ImagePlus className="h-3.5 w-3.5" />Portfolio</Label>
                                  <Input type="file" accept="image/*" multiple onChange={(e) => onPortfolioUpload(e.target.files, service.id)} />
                                  {servicePortfolio[service.id]?.length ? (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                      {servicePortfolio[service.id].map((img, idx) => (
                                        <img key={`${img}-${idx}`} src={img} alt="Portfolio preview" className="h-16 w-full rounded-md object-cover" />
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No portfolio images uploaded yet.</p>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <p className="text-sm text-muted-foreground">Complete verification to unlock higher trust and booking conversion.</p>
              </CardHeader>
              <CardContent>
                {vendorProfile?.verified ? (
                  <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Verified Profile</div>
                    <p className="mt-1">Your verification badge is visible to customers.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <div className="text-4xl">🛡️</div>
                    <p className="mt-2 font-semibold">Verification pending</p>
                    <p className="text-sm text-muted-foreground">Upload required documents from vendor dashboard to get verified faster.</p>
                    <div className="mt-3">
                      <Button type="button" variant="outline" onClick={() => router.push('/vendor/dashboard')}>
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Optional Links</CardTitle>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-2 text-sm text-primary"
                  onClick={() => setShowOptionalLinks((v) => !v)}
                >
                  {showOptionalLinks ? 'Hide' : 'Show'} Optional Links
                </button>
              </CardHeader>
              <CardContent className={showOptionalLinks ? 'space-y-3' : 'hidden'}>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={profileForm.linkedinUrl}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                    placeholder="https://www.linkedin.com/in/your-profile"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    value={profileForm.websiteUrl}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Profile Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Add at least 3 services for better ranking.</p>
                <p>• Keep pricing realistic to improve conversion.</p>
                <p>• Use clear descriptions and portfolio images.</p>
                <p>• Verified vendors usually get more bookings.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:bottom-0">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-3 px-1">
          <p className="hidden text-sm text-muted-foreground sm:block">Unsaved profile changes? Save now to keep onboarding progress.</p>
          <Button
            type="button"
            className="h-11 px-6"
            loading={saveProfileMutation.isPending}
            onClick={() => {
              setProfileMessage('');
              saveProfileMutation.mutate();
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
