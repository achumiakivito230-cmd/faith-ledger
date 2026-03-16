import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'verified' | 'rejected';
}

const statusConfig = {
  pending: { label: 'Pending Verification', className: 'bg-warning/10 text-warning' },
  verified: { label: 'Verified & Locked', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.className}`}
    >
      {status === 'verified' && <ShieldCheck className="h-3 w-3" />}
      {config.label}
    </motion.span>
  );
}
