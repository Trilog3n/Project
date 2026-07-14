'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api';

function RegisterForm() {
  const { register, registerVendor } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVendor = searchParams.get('role') === 'vendor';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', bio: '', experience: '', city: 'Kochi', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isVendor) {
        const vendorPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          bio: form.bio,
          experience: parseInt(form.experience) || 0,
          city: form.city,
          address: form.address,
        };
        await registerVendor({
          ...vendorPayload,
        });
        router.push('/vendor/profile');
      } else {
        const customerPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        };
        await register(customerPayload);
        router.push('/profile');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{isVendor ? 'Register as Vendor' : 'Create Account'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isVendor ? 'Join Diggu and get verified' : 'Find trusted local professionals'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          {isVendor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Brief description of your services" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input id="experience" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            {isVendor ? 'Register as Vendor' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
        {!isVendor && (
          <p className="mt-2 text-center text-sm">
            <Link href="/register?role=vendor" className="text-primary hover:underline">Register as a vendor instead</Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </PageLayout>
  );
}
