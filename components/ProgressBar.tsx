
import React from 'react';

interface ProgressBarProps {
  percentage: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color = 'bg-brand-primary' }) => {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
