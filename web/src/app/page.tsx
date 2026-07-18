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
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  CheckCircle,
  Clock3,
  Droplets,
  Hammer,
  LocateFixed,
  MapPin,
  MessageCircle,
  Mic,
  Paintbrush,
  Phone,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wind,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

const TRUST_BADGES = ['Government Verified', 'Transparent Pricing', 'Same-Day Booking', 'Secure Payments'];

const TRENDING_SEARCHES = [
  'Electrician near me',
  'Plumbing repair',
  'Home deep cleaning',
  'AC installation',
  'Wall painting experts',
];

const POPULAR_CHIPS = ['Electrician', 'Plumbing', 'Painting', 'Cleaning', 'AC Repair', 'Carpentry', 'Appliance Repair'];

const HOW_IT_WORKS = [
  {
    title: 'Search Professionals',
    description: 'Type your requirement and instantly discover verified experts in your locality.',
    icon: Search,
  },
  {
    title: 'Compare Profiles',
    description: 'Review ratings, completed jobs, pricing and trust badges side by side.',
    icon: Users,
  },
  {
    title: 'Book Instantly',
    description: 'Choose a suitable professional and confirm your booking in seconds.',
    icon: CheckCircle,
  },
  {
    title: 'Get the Job Done',
    description: 'Track progress, make secure payments and share authentic feedback.',
    icon: Shield,
  },
];

const TESTIMONIALS = [
  {
    name: 'Ananya Menon',
    role: 'Apartment Owner, Kochi',
    avatar: 'AM',
    text: 'Booked an electrician in under 5 minutes. The pricing was transparent and the service quality was excellent.',
  },
  {
    name: 'Rohan Nair',
    role: 'Working Professional',
    avatar: 'RN',
    text: 'Diggu feels premium and reliable. Verified professionals and quick responses made the whole process stress-free.',
  },
  {
    name: 'Fathima K',
    role: 'Homeowner',
    avatar: 'FK',
    text: 'The profile details, ratings and trust badges helped me choose confidently. Highly recommended platform.',
  },
];

const HERO_COUNTERS = [
  { label: 'Verified Professionals', target: 10000, suffix: '+' },
  { label: 'Happy Customers', target: 25000, suffix: '+' },
  { label: 'Bookings Completed', target: 50000, suffix: '+' },
  { label: 'Average Rating', target: 49, suffix: '/10', prefix: '' },
];

const CATEGORY_ICON_MAP = {
  tool: Wrench,
  hammer: Hammer,
  sparkles: Sparkles,
  zap: TrendingUp,
  paintbrush: Paintbrush,
  wrench: Wrench,
  droplets: Droplets,
  wind: Wind,
} as const;

function CategoryGlyph({ icon, name }: { icon?: string; name: string }) {
  const iconKey = (icon || '').trim().toLowerCase();
  const Icon = CATEGORY_ICON_MAP[iconKey as keyof typeof CATEGORY_ICON_MAP];

  if (Icon) {
    return <Icon className="h-5 w-5 text-primary" aria-hidden="true" />;
  }

  if (icon && !/^[a-z-]+$/i.test(icon)) {
    return <span className="text-xl leading-none">{icon}</span>;
  }

  const fallbackByName = name.toLowerCase();
  if (fallbackByName.includes('plumb')) return <Droplets className="h-5 w-5 text-primary" aria-hidden="true" />;
  if (fallbackByName.includes('paint')) return <Paintbrush className="h-5 w-5 text-primary" aria-hidden="true" />;
  if (fallbackByName.includes('clean')) return <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />;
  if (fallbackByName.includes('electric')) return <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />;

  return <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />;
}

function parseAiIntent(input: string) {
  const value = input.toLowerCase();
  if (value.includes('washing') || value.includes('fridge') || value.includes('appliance')) return 'Appliance Repair';
  if (value.includes('ac') || value.includes('air conditioner') || value.includes('cooling')) return 'AC Repair';
  if (value.includes('paint') || value.includes('wall') || value.includes('color')) return 'Painting';
  if (value.includes('leak') || value.includes('pipe') || value.includes('water')) return 'Plumbing';
  if (value.includes('switch') || value.includes('power') || value.includes('light')) return 'Electrician';
  if (value.includes('dust') || value.includes('clean') || value.includes('sanitize')) return 'Cleaning';
  return 'General Home Service';
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('My washing machine is making unusual noise');
  const [counterValues, setCounterValues] = useState<number[]>(HERO_COUNTERS.map(() => 0));

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

  const aiRecommendation = useMemo(() => parseAiIntent(aiPrompt), [aiPrompt]);

  const aiMatchedVendors = useMemo(
    () =>
      (featured || [])
        .filter((vendor) =>
          vendor.services.some((service) =>
            `${service.name} ${service.category?.name}`.toLowerCase().includes(aiRecommendation.toLowerCase())
          )
        )
        .slice(0, 3),
    [featured, aiRecommendation]
  );

  useEffect(() => {
    const suggestionTimer = setInterval(() => {
      setActiveSuggestion((prev) => (prev + 1) % TRENDING_SEARCHES.length);
    }, 2500);

    return () => clearInterval(suggestionTimer);
  }, []);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCounterValues(HERO_COUNTERS.map((counter) => Math.round(counter.target * progress)));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { pros: number; ratingTotal: number; ratings: number }>();
    (featured || []).forEach((vendor) => {
      vendor.services.forEach((service) => {
        const key = service.category?.name || service.name;
        const existing = map.get(key) || { pros: 0, ratingTotal: 0, ratings: 0 };
        map.set(key, {
          pros: existing.pros + 1,
          ratingTotal: existing.ratingTotal + vendor.rating,
          ratings: existing.ratings + 1,
        });
      });
    });
    return map;
  }, [featured]);

  return (
    <PageLayout>
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/10 via-background to-background py-12 md:py-20">
        <div className="pointer-events-none absolute -left-14 top-10 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="success" className="mb-5 rounded-full px-4 py-1.5 text-xs md:text-sm">
              Trusted by homeowners across {DEFAULT_CITY}
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-tight md:text-6xl">
              Premium Home Services, <span className="text-primary">Verified Professionals</span>, Zero Guesswork
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              {APP_TAGLINE}. Discover trusted experts, compare transparent pricing and book with confidence.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {TRUST_BADGES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  {item}
                </span>
              ))}
            </div>

            <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-4xl rounded-3xl border border-border/70 bg-background/90 p-3 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search plumbers, electricians, painters, cleaners..."
                    className="h-12 rounded-2xl border-0 bg-transparent pl-11 text-base focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search for professionals"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                    aria-label="Use current location"
                  >
                    <LocateFixed className="h-4 w-4 text-primary" />
                    {DEFAULT_CITY}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                    aria-label="Voice search"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <Button type="submit" className="h-11 rounded-xl px-5">
                    Search
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-left text-xs text-muted-foreground md:text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="animate-fade-in">Try: {TRENDING_SEARCHES[activeSuggestion]}</span>
              </div>
            </form>

            <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2">
              {POPULAR_CHIPS.map((chip) => (
                <Link
                  key={chip}
                  href={`/search?category=${encodeURIComponent(chip)}`}
                  className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted md:text-sm"
                >
                  {chip}
                </Link>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {HERO_COUNTERS.map((counter, index) => (
                <Card key={counter.label} className="rounded-2xl border-border/70 bg-background/75">
                  <CardContent className="p-4 text-left">
                    <p className="text-2xl font-extrabold text-primary md:text-3xl">
                      {counter.label === 'Average Rating'
                        ? `${(counterValues[index] / 10).toFixed(1)}★`
                        : `${counterValues[index].toLocaleString()}${counter.suffix}`}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground md:text-sm">{counter.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold md:text-3xl">Why customers choose Diggu</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Built for trust, speed and transparency from discovery to completion.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: UserCheck,
                title: 'Verified Professionals',
                desc: 'Aadhaar and document checks before anyone gets listed.',
                color: 'from-blue-100 to-cyan-100',
              },
              {
                icon: Wallet,
                title: 'Transparent Pricing',
                desc: 'Starting prices and clear profiles with no hidden surprises.',
                color: 'from-sky-100 to-indigo-100',
              },
              {
                icon: Clock3,
                title: 'Fast Response',
                desc: 'Quick confirmations and same-day booking for urgent needs.',
                color: 'from-cyan-100 to-emerald-100',
              },
              {
                icon: Shield,
                title: 'Secure Experience',
                desc: 'Booking safeguards, support workflows and trusted outcomes.',
                color: 'from-indigo-100 to-blue-100',
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="group rounded-3xl border-border/70 bg-background/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-30px_rgba(0,0,0,0.4)]"
              >
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${item.color}`}>
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Browse Services</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Compare availability, ratings and trusted professionals by category.
              </p>
            </div>
            <Link href="/search" className="hidden text-sm font-semibold text-primary md:inline-flex">
              Explore all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {categories?.map((cat) => {
              const stats = categoryStats.get(cat.name);
              const pros = stats?.pros || 12;
              const avgRating = stats?.ratings ? (stats.ratingTotal / stats.ratings).toFixed(1) : '4.8';

              return (
                <Link key={cat.id} href={`/search?category=${encodeURIComponent(cat.name)}`}>
                  <Card className="h-full rounded-3xl border-border/70 bg-background/80 transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-4 md:p-5">
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <CategoryGlyph icon={cat.icon} name={cat.name} />
                      </div>
                      <h3 className="font-bold">{cat.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground md:text-sm">{pros}+ professionals</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 md:text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {avgRating} average rating
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Professionals</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Premium profiles with pricing, trust badges and quick actions.
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" className="rounded-xl">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured?.map((vendor, index) => {
              const startingPrice = Math.min(...vendor.services.map((service) => service.price));
              const specialty = vendor.services[0]?.category?.name || 'Home Service';
              const responseTimes = ['Responds in ~10 mins', 'Responds in ~20 mins', 'Responds in ~30 mins'];
              const distances = ['1.2 km away', '2.4 km away', '3.8 km away'];

              return (
                <Card
                  key={vendor.id}
                  className="group rounded-3xl border-border/70 bg-background/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-30px_rgba(0,0,0,0.45)]"
                >
                  <CardContent className="p-5 md:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 font-bold text-primary">
                          {vendor.user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold">{vendor.user.name}</h3>
                            {vendor.verified && <Badge variant="success">Verified</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{specialty}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                        {index % 2 === 0 ? 'Top Rated' : 'Fast Response'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:text-sm">
                      <p className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {vendor.rating.toFixed(1)} rating</p>
                      <p className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {vendor.completedJobs}+ jobs</p>
                      <p className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {responseTimes[index % responseTimes.length]}</p>
                      <p className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {distances[index % distances.length]}</p>
                      <p className="inline-flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {vendor.experience}+ years exp</p>
                      <p className="inline-flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-600" /> Available today</p>
                    </div>

                    <div className="mt-4 rounded-2xl bg-primary/6 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starting From</p>
                      <p className="text-xl font-extrabold text-primary">{formatCurrency(startingPrice)}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <span className="rounded-full bg-background px-2 py-0.5">Aadhaar Verified</span>
                        <span className="rounded-full bg-background px-2 py-0.5">Government Verified</span>
                        <span className="rounded-full bg-background px-2 py-0.5">GST Registered</span>
                        <span className="rounded-full bg-background px-2 py-0.5">Satisfaction Guaranteed</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link href={`/vendor/${vendor.id}`} className="col-span-2">
                        <Button className="w-full rounded-xl">View Profile</Button>
                      </Link>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-border text-sm font-semibold text-muted-foreground"
                        aria-label="Call option available on profile"
                      >
                        <Phone className="h-4 w-4" /> Call
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-border text-sm font-semibold text-muted-foreground"
                        aria-label="Chat option available on profile"
                      >
                        <MessageCircle className="h-4 w-4" /> Chat
                      </button>
                      <Link href={`/vendor/${vendor.id}`} className="col-span-2">
                        <Button variant="outline" className="w-full rounded-xl">Book Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              A simple 4-step journey to book trusted professionals quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <Card key={step.title} className="relative rounded-3xl border-border/70 bg-background/80">
                <CardContent className="p-5">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</p>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Loved by customers</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Verified booking reviews from real households.
              </p>
            </div>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
            {TESTIMONIALS.map((item) => (
              <Card key={item.name} className="min-w-[280px] snap-start rounded-3xl border-border/70 bg-background/80 md:min-w-[360px]">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 font-bold text-primary">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{item.text}</p>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Verified Booking
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Repeat booking rate', value: '82%' },
              { label: 'Avg. response time', value: '< 20 min' },
              { label: 'Successful completions', value: '98.2%' },
              { label: 'Customer satisfaction', value: '4.9/5' },
            ].map((metric) => (
              <Card key={metric.label} className="rounded-2xl border-border/70 bg-background/80">
                <CardContent className="p-4">
                  <p className="text-xl font-extrabold text-primary md:text-2xl">{metric.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground md:text-sm">{metric.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-gradient-to-r from-sky-50 via-white to-blue-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="rounded-3xl border-border/70 bg-background/85 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.45)]">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div>
                  <Badge className="mb-3 bg-primary/12 text-primary hover:bg-primary/12">AI Discovery</Badge>
                  <h2 className="text-2xl font-bold md:text-3xl">Describe the problem, get the right service instantly</h2>
                  <p className="mt-2 text-sm text-muted-foreground md:text-base">
                    Enter your issue in natural language and Diggu suggests the best service category with nearby professionals.
                  </p>
                  <div className="mt-4 space-y-2">
                    <label htmlFor="ai-input" className="text-sm font-semibold">What do you need help with?</label>
                    <div className="relative">
                      <Bot className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                      <Input
                        id="ai-input"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended Service</p>
                    <p className="mt-1 text-lg font-extrabold text-primary">{aiRecommendation}</p>
                    <Link href={`/search?category=${encodeURIComponent(aiRecommendation)}`} className="mt-3 inline-flex text-sm font-semibold text-primary">
                      See matching professionals <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Nearby verified professionals</p>
                  {(aiMatchedVendors.length > 0 ? aiMatchedVendors : featured || []).slice(0, 3).map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold">{vendor.user.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.services[0]?.category?.name || 'Home Services'} · {vendor.experience}+ yrs</p>
                      </div>
                      <Link href={`/vendor/${vendor.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <CardContent className="relative p-6 md:p-10">
              <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
                <div>
                  <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">For Professionals</p>
                  <h2 className="mt-3 text-2xl font-extrabold md:text-4xl">Grow Your Business with Diggu</h2>
                  <p className="mt-3 text-sm text-primary-foreground/90 md:text-base">
                    Join a trusted marketplace that helps you get quality leads, improve visibility and build customer confidence.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold md:text-sm">
                    <span className="rounded-full bg-white/20 px-3 py-1">More bookings</span>
                    <span className="rounded-full bg-white/20 px-3 py-1">Verified profile</span>
                    <span className="rounded-full bg-white/20 px-3 py-1">Business growth</span>
                    <span className="rounded-full bg-white/20 px-3 py-1">Customer trust</span>
                  </div>
                </div>
                <div className="md:text-right">
                  <Link href="/register?role=vendor">
                    <Button
                      size="lg"
                      className="h-12 rounded-xl bg-white px-6 font-bold text-primary hover:bg-white/90"
                    >
                      Register as Vendor
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-4">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-xs text-muted-foreground md:text-sm">
            <p className="font-semibold text-foreground">Designed for speed, trust and accessibility</p>
            <p className="mt-1">
              Large touch targets, strong contrast, semantic structure and responsive layouts ensure a smooth experience across devices.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
