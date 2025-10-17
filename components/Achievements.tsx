import React from 'react';
import type { Badge } from '../types';
import { FireIcon } from './icons/Icons';

interface AchievementsProps {
  earnedBadges: string[];
  allBadges: Badge[];
  streak: number;
}

const BadgeCard: React.FC<{ badge: Badge; isEarned: boolean }> = ({ badge, isEarned }) => {
    const cardClasses = isEarned 
        ? 'bg-white shadow-md' 
        : 'bg-slate-50 border-dashed border-2 border-slate-300';
    const iconContainerClasses = isEarned
        ? 'bg-amber-100 text-amber-500'
        : 'bg-slate-200 text-slate-400';
    const textClasses = isEarned ? 'text-slate-800' : 'text-slate-400';
    const descriptionClasses = isEarned ? 'text-slate-500' : 'text-slate-400';

    return (
        <div className={`p-6 rounded-xl flex flex-col items-center text-center transition-all duration-300 ${cardClasses}`}>
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${iconContainerClasses}`}>
                <badge.icon className="h-8 w-8" />
            </div>
            <h3 className={`font-bold text-lg ${textClasses}`}>{badge.title}</h3>
            <p className={`mt-1 text-sm ${descriptionClasses}`}>{badge.description}</p>
        </div>
    );
};

export const Achievements: React.FC<AchievementsProps> = ({ earnedBadges, allBadges, streak }) => {
  return (
    <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Logros y Recompensas</h1>
        <p className="mt-2 text-slate-500">Celebra tu progreso y mantén la motivación con insignias y rachas.</p>
        
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-700">Racha de Días Consecutivos</h2>
                <p className="text-sm text-slate-500 mt-1">
                    {streak > 0 
                        ? '¡Sigue así para mantener viva la llama del aprendizaje!' 
                        : 'Usa la aplicación mañana para iniciar una nueva racha.'}
                </p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <span className="text-5xl font-bold text-orange-500">{streak}</span>
                <FireIcon className="h-12 w-12 text-orange-400" />
            </div>
        </div>

        <div className="mt-8">
             <h2 className="text-2xl font-bold text-slate-800 mb-4">Insignias</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allBadges.map(badge => (
                    <BadgeCard 
                        key={badge.id}
                        badge={badge}
                        isEarned={earnedBadges.includes(badge.id)}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};