import { useMemo } from 'react';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';

export interface SaleDataPoint {
  time: string;
  sales: number;
}

export interface LatestPayment {
  id: string;
  amount: number;
  product: string;
  customer: string;
  time: string;
}

export function useOfferingDashboardData() {
  const allOfferings = useMemo(() => {
    return [...mockOfferings, ...getLocalOfferings()];
  }, []);

  const totalRevenue = useMemo(
    () => allOfferings.reduce((sum, o) => sum + o.total_amount, 0),
    [allOfferings],
  );

  const salesCount = allOfferings.length;

  const averageSale = useMemo(
    () => (salesCount > 0 ? totalRevenue / salesCount : 0),
    [totalRevenue, salesCount],
  );

  // Build chart data — one point per offering, sorted by date
  const salesChartData: SaleDataPoint[] = useMemo(() => {
    return [...allOfferings]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((o) => ({
        time: new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: o.total_amount,
      }));
  }, [allOfferings]);

  // Cumulative revenue over time
  const cumulativeRevenueData: SaleDataPoint[] = useMemo(() => {
    let cumulative = 0;
    return [...allOfferings]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((o) => {
        cumulative += o.total_amount;
        return {
          time: new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          sales: cumulative,
        };
      });
  }, [allOfferings]);

  // Latest offerings as "payments"
  const latestPayments: LatestPayment[] = useMemo(() => {
    return [...allOfferings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        amount: o.total_amount,
        product: o.notes || 'General Offering',
        customer: o.counted_by?.name || 'Unknown',
        time: new Date(o.created_at).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
  }, [allOfferings]);

  return {
    totalRevenue,
    cumulativeRevenueData,
    salesCount,
    averageSale,
    salesChartData,
    latestPayments,
  };
}
