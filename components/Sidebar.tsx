import React from 'react';
import { MenuIcon, UserCircleIcon, ChartBarIcon, HomeIcon, TrashIcon, CheckBadgeIcon, StarIcon } from './icons/Icons';
import type { AppView } from '../types';

interface SidebarIconProps {
    icon: React.ReactNode;
    text?: string;
    onClick: () => void;
    isActive?: boolean;
    isDestructive?: boolean;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ icon, text = 'tooltip', onClick, isActive, isDestructive = false }) => {
    const activeClasses = isActive 
        ? 'bg-sky-100 text-brand-primary rounded-xl' 
        : isDestructive
        ? 'text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-3xl hover:rounded-xl'
        : 'text-slate-500 hover:bg-sky-100 hover:text-brand-primary rounded-3xl hover:rounded-xl';
    
    return (
        <div 
            onClick={onClick}
            className={`relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto transition-all duration-300 ease-linear cursor-pointer group ${activeClasses}`}
        >
            {icon}
            <span className="absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-slate-800 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
                {text}
            </span>
        </div>
    );
}

interface SidebarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onReset }) => {
    return (
        <div className="hidden md:flex flex-col w-20 bg-white text-slate-700 shadow-sm border-r border-slate-200">
            <div className="flex-shrink-0 flex items-center justify-center h-28">
                <span className="font-bold text-sm tracking-wider transform -rotate-90 whitespace-nowrap">DigCompEdu</span>
            </div>
            <div className="flex-grow mt-4">
                 <SidebarIcon 
                    icon={<HomeIcon className="h-6 w-6"/>} 
                    text="Dashboard" 
                    onClick={() => onNavigate('dashboard')}
                    isActive={currentView === 'dashboard'}
                 />
                 <SidebarIcon 
                    icon={<MenuIcon className="h-6 w-6"/>} 
                    text="Áreas" 
                    onClick={() => onNavigate('areas')}
                    isActive={currentView === 'areas'}
                 />
                 <SidebarIcon 
                    icon={<UserCircleIcon className="h-6 w-6"/>} 
                    text="Perfil" 
                    onClick={() => onNavigate('profile')}
                    isActive={currentView === 'profile'}
                 />
                 <SidebarIcon 
                    icon={<ChartBarIcon className="h-6 w-6"/>} 
                    text="Resultados"
                    onClick={() => onNavigate('results')}
                    isActive={currentView === 'results'}
                 />
                 <SidebarIcon 
                    icon={<CheckBadgeIcon className="h-6 w-6"/>} 
                    text="Plan de Tareas"
                    onClick={() => onNavigate('tasks')}
                    isActive={currentView === 'tasks'}
                 />
                 <SidebarIcon 
                    icon={<StarIcon className="h-6 w-6"/>} 
                    text="Logros"
                    onClick={() => onNavigate('achievements')}
                    isActive={currentView === 'achievements'}
                 />
            </div>
            <div className="pb-4">
                <div className="h-px w-10 bg-slate-200 mx-auto my-2" />
                <SidebarIcon 
                    icon={<TrashIcon className="h-6 w-6"/>} 
                    text="Limpiar Datos"
                    onClick={onReset}
                    isDestructive={true}
                 />
            </div>
        </div>
    );
};