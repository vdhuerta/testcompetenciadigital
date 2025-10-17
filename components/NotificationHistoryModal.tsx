import React from 'react';
import type { DisplayNotification } from '../types';
import { XIcon } from './icons/Icons';
import { formatTimestamp } from '../utils/formatTimestamp';

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: DisplayNotification[];
}

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) {
    return null;
  }

  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Historial de Notificaciones</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Cerrar modal">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-grow overflow-y-auto p-4">
          {sortedNotifications.length > 0 ? (
            <ul className="space-y-2">
              {sortedNotifications.map((notif, index) => (
                <li key={`${notif.id}-${index}`} className="border-b border-slate-100 last:border-b-0 pb-2 mb-2">
                  <div className="flex items-start gap-4 p-2">
                    <div className="mt-1 flex-shrink-0">
                      <notif.icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-slate-600">{notif.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimestamp(notif.timestamp, true)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
                <p className="text-slate-500">No hay notificaciones en tu historial.</p>
            </div>
          )}
        </main>
        
        <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cerrar
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