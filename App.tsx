
import React, { useState, useMemo, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AreaCard } from './components/AreaCard';
import { AreaList } from './components/AreaList';
import { Results } from './components/Results';
import { QuestionModal } from './components/QuestionModal';
import { ProgressBar } from './components/ProgressBar';
import { CompletionModal } from './components/CompletionModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { MobileMenu } from './components/MobileMenu';
import { AREAS } from './constants';
import type { UserData, Area, AppView, SearchResult, Notification } from './types';
import { BellIcon, ChartBarIcon, LightBulbIcon, SparklesIcon } from './components/icons/Icons';

export default function App(): React.ReactElement {
  const [userData, setUserData] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeArea, setActiveArea] = useState<{ area: Area; initialQuestionIndex?: number } | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState<boolean>(() => {
      return localStorage.getItem('hasShownCompletionModal') === 'true';
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('userData');
    }
  }, [userData]);

  useEffect(() => {
    localStorage.setItem('answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem('hasShownCompletionModal', String(hasShownCompletionModal));
  }, [hasShownCompletionModal]);
  
  const totalQuestions = useMemo(() => AREAS.reduce((sum, area) => sum + area.questions.length, 0), []);
  const answeredCount = Object.keys(answers).length;

  const overallProgress = useMemo(() => {
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  }, [answeredCount, totalQuestions]);

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    setCurrentView('dashboard');
  };
  
  const handleNavigate = (view: AppView) => {
      setCurrentView(view);
      setSearchQuery(''); // Clear search on navigation
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectArea = (area: Area, initialQuestionIndex?: number) => {
    setActiveArea({ area, initialQuestionIndex });
  };

  const handleCloseModal = () => {
    setActiveArea(null);
    if (overallProgress >= 100 && !hasShownCompletionModal) {
      setIsCompletionModalOpen(true);
      setHasShownCompletionModal(true);
    }
  };

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleRequestReset = () => {
    setIsResetModalOpen(true);
  };

  const handleCancelReset = () => {
    setIsResetModalOpen(false);
  };

  const handleConfirmReset = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('answers');
    localStorage.removeItem('hasShownCompletionModal');
    
    setUserData(null);
    setAnswers({});
    setHasShownCompletionModal(false);
    setCurrentView('dashboard');

    setIsResetModalOpen(false);
  };

  const progressByArea = useMemo(() => {
    const progress: Record<number, number> = {};
    AREAS.forEach(area => {
      const answeredQuestions = area.questions.filter(q => answers[q.id] !== undefined);
      progress[area.id] = (answeredQuestions.length / area.questions.length) * 100;
    });
    return progress;
  }, [answers]);

  const notifications = useMemo((): Notification[] => {
    const alerts: Notification[] = [];
    alerts.push({
        id: 'welcome',
        text: '¡Te damos la bienvenida a la autoevaluación!',
        time: 'justo ahora',
        icon: SparklesIcon,
    });
    
    const progressInt = Math.round(overallProgress);
    if (progressInt > 0 && progressInt < 100) {
        alerts.push({
            id: 'progress',
            text: `Llevas un ${progressInt}% completado. ¡Sigue así!`,
            time: 'hace un momento',
            icon: ChartBarIcon,
        });
    }

    const questionsLeft = totalQuestions - answeredCount;

    if (questionsLeft > 0) {
        alerts.push({
            id: 'remaining',
            text: `Te quedan ${questionsLeft} preguntas para finalizar.`,
            time: 'info',
            icon: LightBulbIcon,
        });
    }

    // FIX: Add explicit typing to resolve potential type inference issues under strict checking.
    const areasInProgress = Object.entries(progressByArea)
      // FIX: Cast progress to number to handle cases where Object.entries infers it as unknown.
      .map(([id, progress]): {id: number, progress: number} => ({ id: Number(id), progress: progress as number }))
      .filter(p => p.progress > 0 && p.progress < 100)
      .sort((a, b) => a.progress - b.progress);

    if (areasInProgress.length > 0) {
        const leastProgressAreaId = areasInProgress[0].id;
        const areaInfo = AREAS.find(a => a.id === leastProgressAreaId);
        if (areaInfo) {
            alerts.push({
                id: 'next-step',
                text: `Tu área con menor progreso es ${areaInfo.title}. ¿Continuamos por ahí?`,
                time: 'sugerencia',
                icon: BellIcon,
            });
        }
    }


    return alerts.slice(0, 4);
  }, [overallProgress, progressByArea, answeredCount, totalQuestions]);

  const filteredAreas = useMemo(() => {
    if (!searchQuery) return AREAS;
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return AREAS.filter(area =>
      area.title.toLowerCase().includes(lowerCaseQuery) ||
      area.description.toLowerCase().includes(lowerCaseQuery) ||
      area.questions.some(q => q.text.toLowerCase().includes(lowerCaseQuery))
    );
  }, [searchQuery]);
  
  const searchResults = useMemo((): SearchResult[] => {
    if (searchQuery.length < 3) return [];

    const results: SearchResult[] = [];
    const lowerCaseQuery = searchQuery.toLowerCase();

    AREAS.forEach(area => {
      if (area.title.toLowerCase().includes(lowerCaseQuery)) {
        results.push({
          type: 'area',
          areaId: area.id,
          areaTitle: area.title,
          matchText: area.description,
        });
      }
      
      area.questions.forEach((question, index) => {
        if (question.text.toLowerCase().includes(lowerCaseQuery)) {
          results.push({
            type: 'question',
            areaId: area.id,
            areaTitle: area.title,
            questionId: question.id,
            questionIndex: index,
            matchText: question.text,
          });
        }
      });
    });
    return results.slice(0, 10);
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    const area = AREAS.find(a => a.id === result.areaId);
    if (area) {
      handleSelectArea(area, result.questionIndex);
      setSearchQuery('');
    }
  };

  if (!userData || currentView === 'profile') {
    return <Onboarding onComplete={handleOnboardingComplete} currentUserData={userData} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onReset={handleRequestReset}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        onReset={handleRequestReset}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchResults={searchResults}
            onSearchResultClick={handleSearchResultClick}
            notifications={notifications}
            onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                  <span className="md:hidden">Autoevaluación de CD</span>
                  <span className="hidden md:inline">Autoevaluación Digital</span>
                </h1>
                <p className="mt-2 text-slate-500">Evalúa tus competencias digitales como docente.</p>
                
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-slate-600">Progreso General</h2>
                    <span className="text-lg font-semibold text-brand-primary">{Math.round(overallProgress)}%</span>
                  </div>
                  <ProgressBar percentage={overallProgress} />
                </div>

                {filteredAreas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
                      {filteredAreas.map((area, index) => {
                        const answeredCountForArea = area.questions.filter(q => answers[q.id] !== undefined).length;
                        const totalCountForArea = area.questions.length;
                        return (
                          <AreaCard
                            key={area.id}
                            area={area}
                            progress={progressByArea[area.id] || 0}
                            answeredCount={answeredCountForArea}
                            totalCount={totalCountForArea}
                            onSelect={() => handleSelectArea(area)}
                            colorIndex={index}
                          />
                        );
                      })}
                    </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-slate-500">No se encontraron áreas que coincidan con tu búsqueda.</p>
                  </div>
                )}
              </>
            )}
            {currentView === 'areas' && (
              <AreaList 
                areas={filteredAreas}
                progressByArea={progressByArea}
                onSelectArea={handleSelectArea}
              />
            )}
            {currentView === 'results' && (
              <Results
                answers={answers}
                areas={AREAS}
              />
            )}
          </div>
        </main>
      </div>
      {activeArea && (
        <QuestionModal
          area={activeArea.area}
          initialQuestionIndex={activeArea.initialQuestionIndex}
          answers={answers}
          onAnswer={handleAnswerChange}
          onClose={handleCloseModal}
        />
      )}
      {isCompletionModalOpen && (
        <CompletionModal
            onClose={() => setIsCompletionModalOpen(false)}
            onNavigateToResults={() => {
                setIsCompletionModalOpen(false);
                handleNavigate('results');
            }}
        />
      )}
      {isResetModalOpen && (
        <ResetConfirmationModal
          onConfirm={handleConfirmReset}
          onCancel={handleCancelReset}
        />
      )}
    </div>
  );
}
