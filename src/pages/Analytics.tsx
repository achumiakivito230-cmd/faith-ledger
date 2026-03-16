import AppLayout from '@/components/AppLayout';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';

export default function AnalyticsPage() {
  const allOfferings = [...mockOfferings, ...getLocalOfferings()];
  const total = allOfferings.reduce((s, o) => s + o.total_amount, 0);

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Analytics</h1>
        <div style={{ padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <p>Total Offerings: {allOfferings.length}</p>
          <p>Total Amount: ₹{total}</p>
        </div>
      </div>
    </AppLayout>
  );
}

