import React from 'react';
import type { Area } from '../types';
import { ProgressBar } from './ProgressBar';

interface AreaListProps {
  areas: Area[];
  progressByArea: Record<number, number>;
  onSelectArea: (area: Area) => void;
}

const cardColors = [
  '#0ea5e9', '#14b8a6', '#8b5cf6', '#e11d48', '#f59e0b', '#84cc16', '#6366f1'
];

export const AreaList: React.FC<AreaListProps> = ({ areas, progressByArea, onSelectArea }) => {
  if (areas.length === 0) {
      return (
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Áreas de Competencia</h1>
          <p className="mt-2 text-slate-500">Selecciona un área para comenzar o continuar con la evaluación.</p>
          <div className="text-center py-16">
            <p className="text-slate-500">No se encontraron áreas que coincidan con tu búsqueda.</p>
          </div>
        </div>
      );
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Áreas de Competencia</h1>
      <p className="mt-2 text-slate-500">Selecciona un área para comenzar o continuar con la evaluación.</p>
      <div className="mt-8 space-y-4">
        {areas.map((area, index) => (
          <div
            key={area.id}
            onClick={() => onSelectArea(area)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer p-4 border border-slate-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center flex-1">
                <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: cardColors[index % cardColors.length] }}>
                    <area.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-800">{area.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 hidden sm:block">{area.description}</p>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 w-full sm:w-40 flex-shrink-0">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                      <span>Progreso</span>
                      <span>{Math.round(progressByArea[area.id] || 0)}%</span>
                  </div>
                  <ProgressBar percentage={progressByArea[area.id] || 0} color={`bg-[${cardColors[index % cardColors.length]}]`} />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3 sm:hidden">{area.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};