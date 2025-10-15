import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon } from './icons/Icons';
import type { SearchResult, Notification } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  onSearchResultClick: (result: SearchResult) => void;
  notifications: Notification[];
}

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="text-slate-800 bg-sky-100">{part}</strong>
        ) : (
          part
        )
      )}
    </>
  );
};

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, searchResults, onSearchResultClick, notifications }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const truncate = (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  return (
    <header className="flex-shrink-0 bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4 h-20">
        <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-700">Herramienta de Autoevaluación de Competencias Digitales</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar áreas o preguntas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="block w-full bg-slate-100 border border-transparent rounded-md py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-sky-500"
            />
            {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-20">
                    <ul className="max-h-96 overflow-y-auto">
                        {searchResults.map((result, index) => (
                            <li 
                                key={`${result.areaId}-${result.questionId || index}`} 
                                className="border-b border-slate-100 last:border-b-0"
                                onClick={() => {
                                    onSearchResultClick(result)
                                    setIsSearchFocused(false);
                                }}
                            >
                                <div className="block p-4 hover:bg-slate-50 cursor-pointer">
                                    <p className="text-xs font-bold uppercase text-sky-600 tracking-wide">{result.areaTitle}</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        <Highlight text={truncate(result.matchText, 100)} query={searchQuery} />
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          <div className="relative" ref={notificationRef}>
            <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200">
                    <div className="py-2 px-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-700">Notificaciones</h3>
                    </div>
                    <ul>
                        {notifications.map(notif => (
                            <li key={notif.id} className="border-b border-slate-100 last:border-b-0">
                                <div className="flex items-start gap-4 p-4 hover:bg-slate-50">
                                    <div className="mt-1">
                                      <notif.icon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-600">{notif.text}</p>
                                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
           </div>
          <div className="w-10 h-10 rounded-full bg-slate-200">
            <img src="https://picsum.photos/100" alt="User" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
};