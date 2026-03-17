import { type ElementType } from 'react';
import AnimatedNumber from '@/components/AnimatedNumber';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  trend?: string;
  subtitle?: string;
  bgColor?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, subtitle, bgColor }: StatCardProps) {
  // Extract numeric value for NumberFlow animation
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(value.replace(/[^\d.-]/g, ''));
  const isINR = typeof value === 'string' && value.includes('₹');
  const useNumberFlow = !isNaN(numericValue);

  return (
    <div
      className={`rounded-2xl p-4 ${bgColor || 'bg-card border border-border/40 shadow-card'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className="mt-1.5 text-xl font-bold text-foreground">
            {useNumberFlow ? (
              <AnimatedNumber
                value={numericValue}
                format={isINR ? {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                } : undefined}
              />
            ) : (
              value
            )}
          </div>
          {(trend || subtitle) && (
            <p className="mt-1 text-[10px] text-muted-foreground">{trend || subtitle}</p>
          )}
        </div>
        <div className="ml-2 rounded-xl bg-white/60 p-2 flex-shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>
    </div>
  );
}
