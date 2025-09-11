import React from 'react';
import { cn } from '@/lib/utils';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function MiniChart({ 
  data, 
  color = 'currentColor', 
  height = 40,
  className 
}: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Normalize data points to fit within the chart height
  const normalizedData = data.map(value => {
    if (range === 0) return height / 2;
    return height - ((value - min) / range) * height;
  });

  // Create SVG path
  const pathData = normalizedData
    .map((y, index) => {
      const x = (index / (data.length - 1)) * 100;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className={cn("w-full", className)}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="25"
            height={height / 2}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 25 0 L 0 0 0 ${height / 2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.2"
              opacity="0.1"
            />
          </pattern>
        </defs>
        
        {/* Background grid */}
        <rect width="100" height={height} fill="url(#grid)" />
        
        {/* Area under curve */}
        <path
          d={`${pathData} L 100 ${height} L 0 ${height} Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {normalizedData.map((y, index) => (
          <circle
            key={index}
            cx={(index / (data.length - 1)) * 100}
            cy={y}
            r="1.5"
            fill={color}
            className="opacity-60"
          />
        ))}
      </svg>
    </div>
  );
}