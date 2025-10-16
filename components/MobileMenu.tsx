import React from 'react';
import { HomeIcon, MenuIcon as AreasIcon, UserCircleIcon, ChartBarIcon, TrashIcon, XIcon, CheckBadgeIcon } from './icons/Icons';
import type { AppView } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onReset: () => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
    isActive?: boolean;
    isDestructive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, onClick, isActive, isDestructive = false }) => {
    const baseClasses = 'flex items-center p-3 rounded-lg transition-colors duration-200 w-full text-left';
    const activeClasses = isActive ? 'bg-sky-100 text-brand-primary font-semibold' : 'text-slate-600 hover:bg-slate-100';
    const destructiveClasses = isDestructive ? 'text-rose-600 hover:bg-rose-50' : '';

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : ''} ${isDestructive ? destructiveClasses : activeClasses}`}>
            <div className="mr-4">{icon}</div>
            <span className="text-sm font-medium">{text}</span>
        </button>
    );
};

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, currentView, onNavigate, onReset }) => {
  const handleNavigate = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 transition-opacity duration-300 ease-in-out" onClick={onClose} aria-hidden="true"></div>
      
      <div className="fixed inset-y-0 left-0 flex">
          <div className="w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out transform">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Menú</span>
                  <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100">
                      <XIcon className="h-6 w-6" />
                  </button>
              </div>
              
              <nav className="flex-grow p-4 space-y-2">
                  <NavItem 
                      icon={<HomeIcon className="h-6 w-6"/>} 
                      text="Dashboard" 
                      onClick={() => handleNavigate('dashboard')}
                      isActive={currentView === 'dashboard'}
                  />
                  <NavItem 
                      icon={<AreasIcon className="h-6 w-6"/>} 
                      text="Áreas" 
                      onClick={() => handleNavigate('areas')}
                      isActive={currentView === 'areas'}
                  />
                  <NavItem 
                      icon={<UserCircleIcon className="h-6 w-6"/>} 
                      text="Perfil" 
                      onClick={() => handleNavigate('profile')}
                      isActive={currentView === 'profile'}
                  />
                  <NavItem 
                      icon={<ChartBarIcon className="h-6 w-6"/>} 
                      text="Resultados"
                      onClick={() => handleNavigate('results')}
                      isActive={currentView === 'results'}
                  />
                  <NavItem 
                      icon={<CheckBadgeIcon className="h-6 w-6"/>} 
                      text="Plan de Tareas"
                      onClick={() => handleNavigate('tasks')}
                      isActive={currentView === 'tasks'}
                  />
              </nav>

              <div className="p-4 border-t border-slate-200">
                  <NavItem 
                      icon={<TrashIcon className="h-6 w-6"/>} 
                      text="Limpiar Datos"
                      onClick={handleReset}
                      isDestructive={true}
                  />
              </div>
          </div>
      </div>
       <style>{`
        .fixed[role="dialog"] > div:first-of-type {
            animation: fadeIn 0.3s ease-in-out forwards;
        }
         .fixed[role="dialog"] > div:last-of-type > div {
            animation: slideIn 0.3s ease-in-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};