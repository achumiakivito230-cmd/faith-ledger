import { type ElementType } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  trend?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card border border-border/40 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
          {(trend || subtitle) && <p className="mt-1 text-xs text-muted-foreground">{trend || subtitle}</p>}
        </div>
        <div className="ml-4 rounded-lg bg-accent/50 p-2 text-accent-foreground flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
