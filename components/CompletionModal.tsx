import React from 'react';
import { SparklesIcon, XIcon, ArrowRightIcon } from './icons/Icons';

interface CompletionModalProps {
  onClose: () => void;
  onNavigateToResults: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({ onClose, onNavigateToResults }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <header className="flex items-center justify-end p-2">
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 md:p-8 pt-0 text-center">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-8 w-8" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">¡Felicitaciones!</h2>
            <p className="mt-3 text-slate-600">
                Has completado exitosamente la autoevaluación de competencias digitales.
            </p>
            <p className="mt-2 text-sm text-slate-500">
                El siguiente paso es explorar tu informe detallado y generar un plan de desarrollo profesional personalizado para potenciar tus habilidades.
            </p>
        </main>
        
        <footer className="flex flex-col sm:flex-row items-center justify-center gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
                Cerrar
            </button>
            <button
              onClick={onNavigateToResults}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-md hover:bg-teal-600 transition-colors w-full sm:w-auto"
            >
              Ir a Resultados
              <ArrowRightIcon className="h-4 w-4" />
            </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};
