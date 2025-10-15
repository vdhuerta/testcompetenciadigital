import React, { useState, useEffect, useCallback } from 'react';
import type { Area } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from './icons/Icons';

interface QuestionModalProps {
  area: Area;
  answers: Record<number, number>;
  onAnswer: (questionId: number, optionIndex: number) => void;
  onClose: () => void;
  initialQuestionIndex?: number;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ area, answers, onAnswer, onClose, initialQuestionIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex ?? 0);
  const currentQuestion = area.questions[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < area.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, area.questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        if (currentIndex < area.questions.length - 1) {
            handleNext();
        }
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, area.questions.length, handleNext, handlePrev, onClose]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <header className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{area.title}</h2>
            <p className="text-sm text-slate-500">
              Pregunta {currentIndex + 1} de {area.questions.length}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 md:p-8 flex-grow overflow-y-auto">
          <p className="text-lg text-slate-700 font-medium mb-6">{currentQuestion.text}</p>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  answers[currentQuestion.id] === index
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500'
                    : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={answers[currentQuestion.id] === index}
                  onChange={() => onAnswer(currentQuestion.id, index)}
                  className="h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                />
                <span className="ml-3 text-sm font-medium text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </main>
        
        <footer className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4"/>
            Anterior
          </button>
          
          {currentIndex === area.questions.length - 1 ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-md hover:bg-teal-600 transition-colors"
            >
              Finalizar
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-md hover:bg-sky-600 transition-colors"
            >
              Siguiente
              <ArrowRightIcon className="h-4 w-4"/>
            </button>
          )}

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