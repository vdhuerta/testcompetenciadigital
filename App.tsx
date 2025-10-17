
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AreaCard } from './components/AreaCard';
import { AreaList } from './components/AreaList';
import { Results } from './components/Results';
import { TaskPlan } from './components/TaskPlan';
import { Achievements } from './components/Achievements';
import { QuestionModal } from './components/QuestionModal';
import { ProgressBar } from './components/ProgressBar';
import { CompletionModal } from './components/CompletionModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { MobileMenu } from './components/MobileMenu';
import { BadgeUnlockedModal } from './components/BadgeUnlockedModal';
import { NotificationHistoryModal } from './components/NotificationHistoryModal';
import { AREAS, ALL_BADGES } from './constants';
import type { UserData, Area, AppView, SearchResult, Notification, PlanState, Task, Streak, Badge } from './types';
import { BellIcon, ChartBarIcon, LightBulbIcon, SparklesIcon, CheckBadgeIcon, FireIcon, TrophyIcon } from './components/icons/Icons';

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
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);
  const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);


  // State for persisting the generated AI plan
  const [planSummary, setPlanSummary] = useState<PlanState>(() => {
    const saved = localStorage.getItem('planSummary');
    return saved ? JSON.parse(saved) : { content: '', isLoading: false, error: null };
  });

  const [areaPlans, setAreaPlans] = useState<Record<number, PlanState>>(() => {
    const saved = localStorage.getItem('areaPlans');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Gamification state
  const [streak, setStreak] = useState<Streak>(() => {
    const saved = localStorage.getItem('streak');
    return saved ? JSON.parse(saved) : { count: 0, lastVisit: '' };
  });

  const [earnedBadges, setEarnedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('earnedBadges');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [allNotifications, setAllNotifications] = useState<Notification[]>(() => {
      const saved = localStorage.getItem('allNotifications');
      return saved ? JSON.parse(saved) : [];
  });


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

  useEffect(() => {
    localStorage.setItem('planSummary', JSON.stringify(planSummary));
  }, [planSummary]);

  useEffect(() => {
      localStorage.setItem('areaPlans', JSON.stringify(areaPlans));
  }, [areaPlans]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('streak', JSON.stringify(streak));
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
  }, [earnedBadges]);
  
  useEffect(() => {
    localStorage.setItem('allNotifications', JSON.stringify(allNotifications));
  }, [allNotifications]);
  
  const totalQuestions = useMemo(() => AREAS.reduce((sum, area) => sum + area.questions.length, 0), []);
  const answeredCount = Object.keys(answers).length;

  const overallProgress = useMemo(() => {
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  }, [answeredCount, totalQuestions]);
  
  const taskProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(t => t.completed).length;
    return (completedCount / tasks.length) * 100;
  }, [tasks]);
  
    const progressByArea = useMemo(() => {
        const progress: Record<number, number> = {};
        AREAS.forEach(area => {
        const answeredQuestions = area.questions.filter(q => answers[q.id] !== undefined);
        progress[area.id] = (answeredQuestions.length / area.questions.length) * 100;
        });
        return progress;
    }, [answers]);
    
    // Streak Logic
    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (streak.lastVisit !== todayStr) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (streak.lastVisit === yesterdayStr) {
                setStreak({ count: streak.count + 1, lastVisit: todayStr });
            } else {
                setStreak({ count: 1, lastVisit: todayStr });
            }
        }
    }, []); // Runs only once on app load
    
    const addNotification = useCallback((notification: Omit<Notification, 'timestamp' | 'isNew'>) => {
        setAllNotifications(prev => {
            // Prevent duplicate notifications for the same event
            if (prev.some(n => n.id === notification.id && n.text === notification.text)) {
                return prev;
            }
            const newNotification: Notification = {
                ...notification,
                timestamp: new Date().toISOString(),
                isNew: true,
            };
            return [newNotification, ...prev];
        });
    }, []);

    const handleUnlockBadge = useCallback((badgeId: string) => {
        if (!earnedBadges.includes(badgeId)) {
            const badge = ALL_BADGES.find(b => b.id === badgeId);
            if (badge) {
                setEarnedBadges(prev => [...prev, badgeId]);
                setNewlyUnlockedBadge(badge);
                addNotification({
                    id: `badge-${badge.id}`,
                    text: `¡Logro desbloqueado: ${badge.title}!`,
                    icon: TrophyIcon,
                });
            }
        }
    }, [earnedBadges, addNotification]);

    // Badge Unlocking Logic
    useEffect(() => {
        if (userData) handleUnlockBadge('onboarding_complete');

        const completedAreas = Object.values(progressByArea).filter(p => p >= 100).length;
        if (completedAreas > 0) handleUnlockBadge('complete_one_area');
        if (completedAreas === AREAS.length) handleUnlockBadge('complete_all_areas');

        if (planSummary.content) handleUnlockBadge('generate_ai_plan');
        if (tasks.length > 0) handleUnlockBadge('generate_tasks');

        if (streak.count >= 3) handleUnlockBadge('streak_3_days');
        if (streak.count >= 7) handleUnlockBadge('streak_7_days');

        AREAS.forEach(area => {
            const areaQuestions = area.questions.map(q => q.id);
            const areaAnswers = Object.entries(answers)
                .filter(([questionId]) => areaQuestions.includes(Number(questionId)))
                .map(([, optionIndex]) => optionIndex as number);

            if (areaAnswers.length === area.questions.length) {
                // FIX: Explicitly convert `val` to a number to prevent type issues where `val` might be inferred as `unknown`.
                const score = areaAnswers.reduce((sum: number, val) => sum + Number(val), 0) / areaAnswers.length;
                if (score >= 4) { // 'Expert' level
                    handleUnlockBadge(`expert_${area.id}`);
                }
            }
        });

    }, [userData, progressByArea, planSummary, tasks, streak, answers, handleUnlockBadge]);
    
    // General Notification Logic
    useEffect(() => {
        const addOrUpdateNotification = (notification: Omit<Notification, 'timestamp' | 'isNew'>) => {
            setAllNotifications(prev => {
                const existingIndex = prev.findIndex(n => n.id === notification.id);
                const newNotification = { ...notification, timestamp: new Date().toISOString(), isNew: true };
                if (existingIndex !== -1) {
                    if (prev[existingIndex].text === newNotification.text) return prev; // No change
                    const updatedNotifications = [...prev];
                    updatedNotifications[existingIndex] = newNotification;
                    return updatedNotifications;
                }
                return [newNotification, ...prev];
            });
        };

        // Welcome notification on first load
        if (allNotifications.length === 0 && userData) {
             addOrUpdateNotification({
                id: 'welcome',
                text: '¡Te damos la bienvenida a la autoevaluación!',
                icon: SparklesIcon,
            });
        }
        
        if (streak.count > 1) {
            addOrUpdateNotification({
                id: 'streak',
                text: `¡Llevas una racha de ${streak.count} días! ¡Sigue así!`,
                icon: FireIcon,
            });
        }

        const progressInt = Math.round(overallProgress);
        if (progressInt > 0 && progressInt < 100) {
            addOrUpdateNotification({
                id: 'progress',
                text: `Llevas un ${progressInt}% completado. ¡Sigue así!`,
                icon: ChartBarIcon,
            });
        }

        if (tasks.length > 0) {
            addOrUpdateNotification({
                id: 'task-progress',
                text: `Llevas un ${Math.round(taskProgress)}% de tu plan de tareas completado.`,
                icon: CheckBadgeIcon,
            });
        }

        const questionsLeft = totalQuestions - answeredCount;
        if (questionsLeft > 0) {
            addOrUpdateNotification({
                id: 'remaining',
                text: `Te quedan ${questionsLeft} preguntas para finalizar.`,
                icon: LightBulbIcon,
            });
        }

        const areasInProgress = Object.entries(progressByArea)
          .map(([id, progress]) => ({ id: Number(id), progress: progress as number }))
          .filter(p => p.progress > 0 && p.progress < 100)
          .sort((a, b) => a.progress - b.progress);

        if (areasInProgress.length > 0) {
            const leastProgressAreaId = areasInProgress[0].id;
            const areaInfo = AREAS.find(a => a.id === leastProgressAreaId);
            if (areaInfo) {
                addOrUpdateNotification({
                    id: 'next-step',
                    text: `Tu área con menor progreso es ${areaInfo.title}. ¿Continuamos por ahí?`,
                    icon: BellIcon,
                });
            }
        }
    }, [userData, overallProgress, taskProgress, streak.count, answeredCount, progressByArea]);


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
    localStorage.removeItem('planSummary');
    localStorage.removeItem('areaPlans');
    localStorage.removeItem('tasks');
    localStorage.removeItem('streak');
    localStorage.removeItem('earnedBadges');
    localStorage.removeItem('allNotifications');
    
    setUserData(null);
    setAnswers({});
    setHasShownCompletionModal(false);
    setPlanSummary({ content: '', isLoading: false, error: null });
    setAreaPlans({});
    setTasks([]);
    setStreak({ count: 0, lastVisit: '' });
    setEarnedBadges([]);
    setAllNotifications([]);
    setCurrentView('dashboard');

    setIsResetModalOpen(false);
  };

  const displayedNotifications = useMemo((): Notification[] => {
    return [...allNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [allNotifications]);

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
            notifications={displayedNotifications}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onShowAllNotifications={() => setIsNotificationHistoryOpen(true)}
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
                planSummary={planSummary}
                setPlanSummary={setPlanSummary}
                areaPlans={areaPlans}
                setAreaPlans={setAreaPlans}
              />
            )}
            {currentView === 'tasks' && (
              <TaskPlan
                planSummary={planSummary}
                areaPlans={areaPlans}
                areas={AREAS}
                tasks={tasks}
                setTasks={setTasks}
                taskProgress={taskProgress}
              />
            )}
            {currentView === 'achievements' && (
              <Achievements
                earnedBadges={earnedBadges}
                allBadges={ALL_BADGES}
                streak={streak.count}
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
      {newlyUnlockedBadge && (
        <BadgeUnlockedModal
            badge={newlyUnlockedBadge}
            onClose={() => setNewlyUnlockedBadge(null)}
        />
      )}
      {isNotificationHistoryOpen && (
          <NotificationHistoryModal
            isOpen={isNotificationHistoryOpen}
            onClose={() => setIsNotificationHistoryOpen(false)}
            notifications={allNotifications}
          />
      )}
    </div>
  );
}
