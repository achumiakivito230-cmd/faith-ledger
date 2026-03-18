import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextMarquee } from '@/components/ui/text-marquee';
import { getDaysInMonth } from 'date-fns';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface DateFilterBarProps {
  month: number | null;
  year: number;
  day: number | null;
  setMonth: (m: number | null) => void;
  setYear: (y: number) => void;
  setDay: (d: number | null) => void;
}

export default function DateFilterBar({ month, year, day, setMonth, setYear, setDay }: DateFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Decorative scrolling months */}
      <div>
        <TextMarquee
          height={28}
          speed={0.6}
          className="text-[11px] font-medium text-muted-foreground/60"
        >
          {SHORT_MONTHS.map((m) => (
            <span key={m} className="whitespace-nowrap">{m}</span>
          ))}
        </TextMarquee>
      </div>

      {/* Day selector (only when month is selected) */}
      {month !== null && (
        <Select value={day === null ? 'all' : String(day)} onValueChange={(v) => setDay(v === 'all' ? null : Number(v))}>
          <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Array.from({ length: getDaysInMonth(new Date(year, month)) }, (_, i) => i + 1).map((d) => (
              <SelectItem key={d} value={String(d)}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Month selector */}
      <Select value={month === null ? 'all' : String(month)} onValueChange={(v) => { setMonth(v === 'all' ? null : Number(v)); setDay(null); }}>
        <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year selector */}
      <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setDay(null); }}>
        <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[2024, 2025, 2026, 2027].map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
