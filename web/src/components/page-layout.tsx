import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MobileTabbar } from '@/components/mobile-tabbar';

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileTabbar />
    </div>
  );
}
