import React from 'react';
import type { Badge } from '../types';

interface BadgeUnlockedModalProps {
  badge: Badge;
  onClose: () => void;
}

export const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({ badge, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <main className="p-6 md:p-8 text-center">
            <div className="flex justify-center mb-5">
                <div className="h-20 w-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center animate-bounce-slow">
                    <badge.icon className="h-10 w-10" />
                </div>
            </div>
            <h2 className="text-xs font-bold uppercase text-amber-500 tracking-wider">¡Nuevo Logro Desbloqueado!</h2>
            <p className="mt-2 text-2xl font-bold text-slate-800">
                {badge.title}
            </p>
            <p className="mt-3 text-sm text-slate-500">
                {badge.description}
            </p>
        </main>
        
        <footer className="p-4 bg-slate-50 rounded-b-2xl">
            <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-violet-700 transition-colors"
            >
                ¡Genial!
            </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
            0%, 100% {
                transform: translateY(-15%);
                animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
            }
            50% {
                transform: translateY(0);
                animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
            }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-slow { animation: bounce-slow 1.5s infinite; }
      `}</style>
    </div>
  );
};