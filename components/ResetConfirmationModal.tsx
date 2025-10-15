import React from 'react';
import { ExclamationTriangleIcon } from './icons/Icons';

interface ResetConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <main className="p-6 md:p-8 text-center">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Confirmar Eliminación de Datos</h2>
            <p className="mt-3 text-slate-600">
                ¿Estás seguro de que quieres borrar todos tus datos?
            </p>
            <p className="mt-2 text-sm text-slate-500">
                Esta acción es irreversible. Se eliminará tu perfil y todas tus respuestas guardadas.
            </p>
        </main>
        
        <footer className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-500 border border-transparent rounded-md hover:bg-rose-600 transition-colors w-full sm:w-auto"
            >
              Sí, eliminar todo
            </button>
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
                Cancelar
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