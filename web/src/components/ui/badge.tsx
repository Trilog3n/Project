import { cn } from '@/lib/utils';

export function Badge({ className, children, variant = 'default' }: {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const variants = {
    default: 'bg-secondary/90 text-secondary-foreground border border-border/80',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    destructive: 'bg-rose-100 text-rose-800 border border-rose-200',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}
