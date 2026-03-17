import { useState, useEffect } from 'react';
import NumberFlow from '@number-flow/react';

interface AnimatedNumberProps {
  value: number;
  format?: Intl.NumberFormatOptions;
  className?: string;
}

export default function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Small delay so NumberFlow sees 0 → real value transition
    const id = requestAnimationFrame(() => setDisplay(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return <NumberFlow value={display} format={format} className={className} />;
}
