import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  BarChart,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  BarSeries,
  Bar,
  BarLabel,
  GridlineSeries,
  Gridline,
  type ChartData,
} from 'reaviz';

// Type definitions
interface TimePeriodOption {
  value: string;
  label: string;
}

interface OfferingStat {
  id: string;
  title: string;
  count: number;
  countFrom?: number;
  comparisonText: string;
  percentage: number;
  TrendIconSvg: React.FC<{ strokeColor: string }>;
  trendColor: string;
  trendBgColor: string;
}

interface DetailedMetric {
  id: string;
  Icon: React.FC<{ className?: string; fill?: string }>;
  label: string;
  tooltip: string;
  value: string;
  TrendIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }>;
  trendBaseColor: string;
  trendStrokeColor: string;
  delay: number;
  iconFillColor?: string;
}

// Props for dynamic data
interface BarChartMediumProps {
  chartData?: ChartData[];
  stats?: OfferingStat[];
  metrics?: DetailedMetric[];
}

// SVG Icon Components
const CircleCheckIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill = "#40E5D1" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.667C5.405 1.667 1.667 5.405 1.667 10S5.405 18.333 10 18.333 18.333 14.595 18.333 10 14.595 1.667 10 1.667zm0 1.25c3.92 0 7.083 3.164 7.083 7.083S13.92 17.083 10 17.083 2.917 13.92 2.917 10 6.08 2.917 10 2.917zm3.09 4.326a.625.625 0 0 0-.424.192L9.167 11.1 7.334 9.434a.625.625 0 1 0-.834.934l2.292 2.083a.625.625 0 0 0 .875-.042l3.917-4.375a.625.625 0 0 0-.494-1.091z" fill={fill} />
  </svg>
);

const ClockIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill = "#F5A623" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.667C5.405 1.667 1.667 5.405 1.667 10S5.405 18.333 10 18.333 18.333 14.595 18.333 10 14.595 1.667 10 1.667zm0 1.25c3.92 0 7.083 3.164 7.083 7.083S13.92 17.083 10 17.083 2.917 13.92 2.917 10 6.08 2.917 10 2.917zM10 5a.625.625 0 0 0-.625.625v4.375H6.25a.625.625 0 1 0 0 1.25h3.75a.625.625 0 0 0 .625-.625v-5A.625.625 0 0 0 10 5z" fill={fill} />
  </svg>
);

const TrendingIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill = "#5B14C5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.667 3.333h5v5M16.667 3.333l-6.25 6.25-3.334-3.333L2.5 10.833" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const DetailedTrendUpIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }> = ({ baseColor, strokeColor, className }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill={baseColor} fillOpacity="0.4" />
    <path d="M9.501 12.611L14.001 8.167M14.001 8.167L18.501 12.611M14.001 8.167L14.001 19.833" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const DetailedTrendDownIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }> = ({ baseColor, strokeColor, className }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill={baseColor} fillOpacity="0.4" />
    <path d="M18.499 15.389L13.999 19.833M13.999 19.833L9.499 15.389M13.999 19.833V8.167" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const SummaryUpArrowIcon: React.FC<{ strokeColor: string }> = ({ strokeColor }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
    <path d="M5.501 9.111L10.001 4.667M10.001 4.667L14.501 9.111M10.001 4.667L10.001 16.333" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const SummaryDownArrowIcon: React.FC<{ strokeColor: string }> = ({ strokeColor }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
    <path d="M14.499 11.889L9.999 16.333M9.999 16.333L5.499 11.889M9.999 16.333V4.667" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

// Data and Constants
const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'last-90-days', label: 'Last 90 Days' },
];

const DEFAULT_CHART_DATA: ChartData[] = [
  { key: 'Sunday AM', data: 15450 },
  { key: 'Sunday PM', data: 8200 },
  { key: 'Wednesday', data: 12800 },
  { key: 'Special', data: 18900 },
  { key: 'Tithe', data: 22000 },
  { key: 'Mission', data: 9500 },
  { key: 'Youth', data: 6300 },
];

const BAR_CHART_COLOR_SCHEME = ['#5B14C5', '#9152EE', '#40E5D1', '#A840E8', '#4C86FF', '#0D4ED2', '#40D3F4'];

const validateBarChartData = (data: ChartData[]): ChartData[] => {
  return data.map(item => ({
    ...item,
    data: (typeof item.data !== 'number' || isNaN(item.data)) ? 0 : Number(item.data),
  }));
};

const DEFAULT_STATS: OfferingStat[] = [
  {
    id: 'total',
    title: 'Total Collected',
    count: 47150,
    countFrom: 0,
    comparisonText: 'Compared to ₹42,300 last month',
    percentage: 11,
    TrendIconSvg: SummaryUpArrowIcon,
    trendColor: 'text-[#40E5D1]',
    trendBgColor: 'bg-[rgb(64,229,209)]/40',
  },
  {
    id: 'services',
    title: 'Services Recorded',
    count: 12,
    countFrom: 0,
    comparisonText: 'Compared to 10 last month',
    percentage: 20,
    TrendIconSvg: SummaryUpArrowIcon,
    trendColor: 'text-[#40E5D1]',
    trendBgColor: 'bg-[rgb(64,229,209)]/40',
  },
];

const DEFAULT_METRICS: DetailedMetric[] = [
  {
    id: 'verified',
    Icon: CircleCheckIcon,
    label: 'Verified Offerings',
    tooltip: 'Amount verified by treasurer',
    value: '₹28,250',
    TrendIcon: DetailedTrendUpIcon,
    trendBaseColor: '#40E5D1',
    trendStrokeColor: '#40E5D1',
    delay: 0,
    iconFillColor: '#40E5D1',
  },
  {
    id: 'pending',
    Icon: ClockIcon,
    label: 'Pending Verification',
    tooltip: 'Awaiting treasurer verification',
    value: '₹18,900',
    TrendIcon: DetailedTrendDownIcon,
    trendBaseColor: '#F5A623',
    trendStrokeColor: '#F5A623',
    delay: 0.05,
    iconFillColor: '#F5A623',
  },
  {
    id: 'average',
    Icon: TrendingIcon,
    label: 'Average per Service',
    tooltip: 'Average offering amount per service',
    value: '₹3,929',
    TrendIcon: DetailedTrendUpIcon,
    trendBaseColor: '#5B14C5',
    trendStrokeColor: '#9152EE',
    delay: 0.1,
    iconFillColor: '#5B14C5',
  },
];

const BarChartMedium: React.FC<BarChartMediumProps> = ({
  chartData,
  stats,
  metrics,
}) => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(TIME_PERIOD_OPTIONS[0].value);

  const validatedChartData = validateBarChartData(chartData || DEFAULT_CHART_DATA);
  const displayStats = stats || DEFAULT_STATS;
  const displayMetrics = metrics || DEFAULT_METRICS;

  return (
    <>
      <style>{`
        :root {
          --reaviz-tick-fill: #9A9AAF;
          --reaviz-gridline-stroke: #7E7E8F75;
        }
        .dark {
          --reaviz-tick-fill: #A0AEC0;
          --reaviz-gridline-stroke: rgba(74, 85, 104, 0.6);
        }
      `}</style>
      <div className="flex flex-col justify-between pt-4 pb-4 bg-[#F5F0FA] rounded-3xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-1 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Offering Report
          </h3>
          <select
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
            className="bg-white/60 text-slate-700 p-1.5 rounded-xl text-xs font-medium outline-none"
            aria-label="Select time period for offering report"
          >
            {TIME_PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bar Chart — horizontally scrollable on small screens */}
        <div className="overflow-x-auto px-2 mb-3">
          <div style={{ minWidth: `${Math.max(validatedChartData.length * 56, 300)}px` }} className="h-[220px]">
            <BarChart
              height={220}
              id="offering-bar-chart"
              data={validatedChartData}
              yAxis={
                <LinearYAxis
                  axisLine={null}
                  tickSeries={<LinearYAxisTickSeries line={null} label={null} tickSize={10} />}
                />
              }
              xAxis={
                <LinearXAxis
                  type="category"
                  tickSeries={
                    <LinearXAxisTickSeries
                      label={
                        <LinearXAxisTickLabel
                          padding={8}
                          rotation={-35}
                          format={text => typeof text === 'string' ? text : ''}
                          fill="var(--reaviz-tick-fill)"
                        />
                      }
                      tickSize={10}
                    />
                  }
                />
              }
              series={
                <BarSeries
                  bar={
                    <Bar
                      glow={{ blur: 15, opacity: 0.4 }}
                      gradient={null}
                      label={<BarLabel position="top" fill="#64748b" fontSize={10} padding={4} />}
                    />
                  }
                  colorScheme={BAR_CHART_COLOR_SCHEME}
                  padding={0.25}
                />
              }
              gridlines={<GridlineSeries line={<Gridline strokeColor="var(--reaviz-gridline-stroke)" />} />}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-2 pt-5">
          {displayStats.map(stat => (
            <div key={stat.id} className="bg-white/50 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{stat.title}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <CountUp
                  className="font-mono text-xl font-bold text-slate-900"
                  start={stat.countFrom || 0}
                  end={stat.count}
                  duration={2.5}
                  prefix={stat.id === 'total' ? '₹' : ''}
                  separator=","
                />
                <div className={`flex ${stat.trendBgColor} p-0.5 px-1.5 items-center rounded-full ${stat.trendColor} text-[10px]`}>
                  <stat.TrendIconSvg strokeColor={stat.trendColor === 'text-[#F08083]' ? '#F08083' : '#40E5D1'} />
                  {stat.percentage}%
                </div>
              </div>
              <span className="text-slate-400 text-[10px] leading-tight">
                {stat.comparisonText}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Metrics List */}
        <div className="flex flex-col px-5 divide-y divide-white/40 mt-3">
          {displayMetrics.map((metric) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: metric.delay }}
              className="flex w-full py-3 items-center gap-1.5"
            >
              <div className="flex flex-row gap-1.5 items-center text-xs w-[55%] text-slate-500 min-w-0">
                <metric.Icon fill={metric.iconFillColor} className="shrink-0" />
                <span className="break-words leading-tight" title={metric.tooltip}>
                  {metric.label}
                </span>
              </div>
              <div className="flex gap-1.5 w-[45%] justify-end items-center">
                <span className="font-bold text-base text-slate-900 whitespace-nowrap">{metric.value}</span>
                <metric.TrendIcon baseColor={metric.trendBaseColor} strokeColor={metric.trendStrokeColor} className="shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BarChartMedium;
