import React from 'react';
import { ProgressBar } from './ProgressBar';
import type { Area } from '../types';

interface AreaCardProps {
  area: Area;
  progress: number;
  onSelect: () => void;
  colorIndex: number;
}

const cardColors = [
  'bg-sky-500', 'bg-teal-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-indigo-500'
];

const progressColors = cardColors;

export const AreaCard: React.FC<AreaCardProps> = ({ area, progress, onSelect, colorIndex }) => {
  const bgColor = cardColors[colorIndex % cardColors.length];
  const progressColor = progressColors[colorIndex % progressColors.length];

  return (
    <div 
      onClick={onSelect} 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col overflow-hidden"
    >
      <div className={`${bgColor} p-6 text-white`}>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">{area.title}</h3>
            <div className="bg-white/30 rounded-full p-2">
              <area.icon className="h-6 w-6" />
            </div>
        </div>
        <p className="text-sm mt-1 opacity-90">{area.description}</p>
      </div>
      <div className="p-6 flex-grow flex flex-col justify-end">
        <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar percentage={progress} color={progressColor} />
      </div>
    </div>
  );
};