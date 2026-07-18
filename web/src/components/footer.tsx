"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/lib/config';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, ShieldCheck, Smartphone, Twitter } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const isVendorPage = pathname.startsWith('/vendor');

  if (isVendorPage) {
    return (
      <footer className="mt-auto border-t border-border/70 bg-background/80">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Need help with onboarding? We are here to assist.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:support@diggu.in" className="hover:text-foreground">support@diggu.in</a>
            <a href="tel:+919876543210" className="hover:text-foreground">+91 98765 43210</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-border/80 bg-gradient-to-b from-white/90 via-muted/20 to-muted/50">
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <h3 className="text-xl font-extrabold">{APP_NAME}</h3>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Premium marketplace for verified home service professionals with transparent pricing and secure bookings.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Kochi, Kerala</p>
              <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +91 98765 43210</p>
              <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> support@diggu.in</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[Facebook, Instagram, Linkedin, Twitter].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label="Social link"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
              <li><Link href="/search" className="hover:text-foreground">Find Professionals</Link></li>
              <li><Link href="/bookings" className="hover:text-foreground">My Bookings</Link></li>
              <li><Link href="/profile" className="hover:text-foreground">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Customer Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:support@diggu.in" className="hover:text-foreground">Help Center</a></li>
              <li><a href="mailto:support@diggu.in" className="hover:text-foreground">Report an Issue</a></li>
              <li><a href="tel:+919876543210" className="hover:text-foreground">Call Support</a></li>
              <li><Link href="/login" className="hover:text-foreground">Account Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Vendor Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register?role=vendor" className="hover:text-foreground">Register as Vendor</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Vendor Login</Link></li>
              <li><Link href="/vendor/profile" className="hover:text-foreground">Manage Profile</Link></li>
              <li><Link href="/vendor/bookings" className="hover:text-foreground">Booking Requests</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Government Verified</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Aadhaar Verified</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure Payments</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Transparent Pricing</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border/80 pt-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
            <a href="mailto:support@diggu.in?subject=Privacy%20Policy%20Request" className="hover:text-foreground">Privacy Policy</a>
            <a href="mailto:support@diggu.in?subject=Terms%20of%20Service%20Request" className="hover:text-foreground">Terms of Service</a>
            <a href="mailto:support@diggu.in?subject=Trust%20and%20Safety" className="hover:text-foreground">Trust & Safety</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><Smartphone className="h-4 w-4" /> Get the app:</span>
            <button
              type="button"
              aria-label="Download on App Store"
              className="rounded-lg border border-border px-2 py-1 hover:bg-muted"
            >
              App Store
            </button>
            <button
              type="button"
              aria-label="Get it on Play Store"
              className="rounded-lg border border-border px-2 py-1 hover:bg-muted"
            >
              Play Store
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
