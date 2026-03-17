import { createContext, useContext, useState, type ReactNode } from 'react';

interface DateFilterContextType {
  month: number | null; // null = all months
  year: number;
  day: number | null; // null = all days
  setMonth: (m: number | null) => void;
  setYear: (y: number) => void;
  setDay: (d: number | null) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [month, setMonth] = useState<number | null>(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [day, setDay] = useState<number | null>(null);

  return (
    <DateFilterContext.Provider value={{ month, year, day, setMonth, setYear, setDay }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const ctx = useContext(DateFilterContext);
  if (!ctx) throw new Error('useDateFilter must be used within DateFilterProvider');
  return ctx;
}
