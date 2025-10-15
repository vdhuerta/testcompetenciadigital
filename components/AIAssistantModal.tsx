import React from 'react';
import { SparklesIcon, XIcon } from './icons/Icons';

interface AIAssistantModalProps {
  recommendations: string;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ recommendations, isLoading, error, onClose }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <SparklesIcon className="h-12 w-12 text-violet-400 animate-pulse" />
            <p className="mt-4 text-slate-600 font-semibold">Analizando su perfil...</p>
            <p className="mt-2 text-sm text-slate-500">La IA está construyendo un plan de desarrollo profesional basado en sus resultados. Esto puede tardar unos segundos.</p>
        </div>
      );
    }

    if (error) {
      return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }
    
    // This robustly formats the AI-generated markdown into clean HTML for live preview.
    const formattedRecommendations = recommendations
      .replace(/([.?!"])\s*(\*\*)/g, '$1\n\n$2')
      .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h2>')
      .replace(/\*\*([^\*]+)\*\*/g, '<strong class="font-semibold text-slate-700">$1</strong>')
      .replace(/^\s*\*\s(.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>(?:\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br />')
      .replace(/<br \/>\s*<ul>/g, '<ul>')
      .replace(/<\/ul>\s*<br \/>/g, '</ul>');

    return (
        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedRecommendations }} />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <header className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-brand-accent"/>
            <h2 className="text-xl font-bold text-slate-800">Plan de Desarrollo Profesional</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 md:p-8 flex-grow overflow-y-auto">
          {renderContent()}
        </main>
        
        <footer className="p-4 border-t border-slate-200 bg-slate-50 text-center rounded-b-2xl">
            <p className="text-xs text-slate-500">
                Sugerencias generadas por IA y destinadas a orientar el desarrollo profesional docente.
            </p>
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
