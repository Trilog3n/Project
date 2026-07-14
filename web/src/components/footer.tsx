import Link from 'next/link';
import { APP_NAME } from '@/lib/config';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-gradient-to-b from-muted/20 to-muted/40">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="font-bold text-lg mb-3">{APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              Trust infrastructure for local professionals in Kochi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Customers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-foreground">Find Professionals</Link></li>
              <li><Link href="/register" className="hover:text-foreground">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Vendors</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register?role=vendor" className="hover:text-foreground">Register as Vendor</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Vendor Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Verified Identities</li>
              <li>Document Verification</li>
              <li>Review System</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground md:pt-8">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
