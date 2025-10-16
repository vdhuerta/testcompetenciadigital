import React, { useState, useMemo, useCallback } from 'react';
import type { Area } from '../types';
import { RECOMMENDATIONS } from '../recommendations';
import { AIAssistantModal } from './AIAssistantModal';
import { RadarChart } from './RadarChart';
import { SparklesIcon } from './icons/Icons';
import { GoogleGenAI } from '@google/genai';

interface ResultsProps {
  answers: Record<number, number>;
  areas: Area[];
}

const getProficiencyLevel = (score: number): { name: string; code: string; description: string; key: 'novice' | 'integrator' | 'expert' } => {
  if (score < 2) return { name: 'Novato', code: 'A1-A2', description: 'Reconoce el potencial de las herramientas digitales y está comenzando a explorar su uso con apoyo.', key: 'novice' };
  if (score < 4) return { name: 'Integrador', code: 'B1-B2', description: 'Utiliza las tecnologías digitales de forma autónoma y las integra en su práctica docente para mejorarla.', key: 'integrator' };
  return { name: 'Experto', code: 'C1-C2', description: 'Aplica las tecnologías con confianza y de forma creativa. Es un referente que guía a otros en su desarrollo.', key: 'expert' };
};

const cardColors = [
    'bg-sky-500', 'bg-teal-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-indigo-500'
];

// Helper function to generate the prompt for the AI
const generatePromptForPlan = (scores: { title: string; level: { name: string; } }[]): string => {
  const scoresText = scores.map(s => `- ${s.title}: Nivel ${s.level.name}`).join('\n');

  return `
    Actúa como un coach educativo experto en el marco DigCompEdu.
    Basado en los siguientes resultados de un docente:
    ${scoresText}

    Crea un plan de desarrollo profesional simple y accionable.
    Para cada área, da 2 o 3 sugerencias concretas y fáciles de seguir.
    Usa un formato claro en Markdown con un encabezado para cada área.
    Sé breve y directo.
  `;
};


export const Results: React.FC<ResultsProps> = ({ answers, areas }) => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const areaScores = useMemo(() => {
    return areas.map(area => {
      const areaQuestions = area.questions.map(q => q.id);
      const areaAnswers = Object.entries(answers)
        .filter(([questionId]) => areaQuestions.includes(Number(questionId)))
        .map(([, optionIndex]) => optionIndex as number);
      
      const score = areaAnswers.length > 0 ? areaAnswers.reduce((sum, val) => sum + val, 0) / areaAnswers.length : 0;
      const level = getProficiencyLevel(score);

      return {
        id: area.id,
        title: area.title,
        shortTitle: area.shortTitle,
        icon: area.icon,
        score: score,
        level: level,
        answeredCount: areaAnswers.length,
        totalCount: area.questions.length,
      };
    });
  }, [answers, areas]);

  const allQuestionsAnswered = useMemo(() => {
    const totalQuestions = areas.reduce((sum, area) => sum + area.questions.length, 0);
    return Object.keys(answers).length >= totalQuestions;
  }, [answers, areas]);
  
  const radarChartData = useMemo(() => {
      return areaScores.map(area => ({
          label: area.shortTitle,
          value: area.score,
      }));
  }, [areaScores]);

  const profileSummary = useMemo(() => {
    if (!allQuestionsAnswered) return null;

    const sortedScores = [...areaScores].sort((a, b) => a.score - b.score);
    const areasForGrowth = sortedScores.slice(0, 4);
    const scoreRange = sortedScores[sortedScores.length - 1].score - sortedScores[0].score;
    const isBalanced = scoreRange < 1.5;

    const formatAreaList = (areaList: typeof areaScores) => {
        if (areaList.length === 0) return '';
        const boldedNames = areaList.map(s => `<strong>${s.title}</strong>`);
        if (areaList.length === 1) return boldedNames[0];
        const lastArea = boldedNames.pop();
        return `${boldedNames.join(', ')} y ${lastArea}`;
    };

    let summary = `Tu perfil muestra un desarrollo ${isBalanced ? 'equilibrado' : 'con fortalezas notables'}, sin áreas que destaquen significativamente por encima de las demás. `;
    
    const growthAreasText = formatAreaList(areasForGrowth);
    
    summary += `Por otro lado, el área de ${growthAreasText} representa tu mayor oportunidad de crecimiento en una etapa inicial. Las recomendaciones a continuación te ayudarán a fortalecer tus competencias.`;
    
    return summary;
  }, [allQuestionsAnswered, areaScores]);


  const handleGeneratePlan = useCallback(async () => {
    setIsAIAssistantOpen(true);
    setIsLoadingAI(true);
    setAiError(null);
    setAiRecommendations('');

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key is not configured. Please set it up in the environment secrets.");
        }

        const ai = new GoogleGenAI({ apiKey });
        const scoresForPrompt = areaScores.map(s => ({
            title: s.title,
            level: { name: s.level.name }
        }));
        
        const prompt = generatePromptForPlan(scoresForPrompt);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const planText = response.text ?? "";
        setAiRecommendations(planText);

    } catch (error) {
        console.error("Error generating AI plan:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred. Please try again later.";
        setAiError(errorMessage);
    } finally {
        setIsLoadingAI(false);
    }
  }, [areaScores]);


  return (
    <>
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Resultados de la Autoevaluación</h1>
        <p className="mt-2 text-slate-500">Este es un resumen de tus competencias digitales, basado en tus respuestas.</p>
      </div>
      
      <div className="mt-8 max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-slate-700 text-center">Resumen de Competencias</h2>
            <p className="text-sm text-slate-500 mt-1 text-center">Visualización de tu perfil competencial.</p>
            
            {allQuestionsAnswered ? (
                <>
                    <div className="mt-6 flex justify-center items-center">
                        <RadarChart data={radarChartData} />
                    </div>
                    <div className="mt-6 flex justify-center items-center gap-6 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-sky-500/30 border border-sky-600"></div>
                            <span>Tu Perfil Actual</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-slate-100 border border-slate-200"></div>
                            <span>Niveles de Competencia</span>
                        </div>
                    </div>
                    <div className="mt-6 bg-sky-50 border border-sky-200 p-4 rounded-lg text-slate-700">
                        <p className="text-sm">
                            Este gráfico de radar representa visualmente tu perfil de competencia digital. Cada eje corresponde a un área, y la distancia del punto al centro indica tu nivel de dominio: un punto más alejado significa una mayor competencia.
                        </p>
                        {profileSummary && (
                            <p className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: profileSummary }} />
                        )}
                    </div>
                </>
            ) : (
                <div className="mt-6 h-[300px] w-full flex items-center justify-center text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-sm">Completa todas las áreas para visualizar tu perfil de competencias aquí.</p>
                </div>
            )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-700">Plan de Desarrollo Profesional con IA</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {allQuestionsAnswered 
                        ? "Genera un plan de acción personalizado basado en tus resultados." 
                        : "Completa todas las áreas para desbloquear tu plan de desarrollo personalizado."}
                    </p>
                </div>
                <button 
                    onClick={handleGeneratePlan}
                    disabled={!allQuestionsAnswered || isLoadingAI}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand-accent border border-transparent rounded-lg shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                >
                    <SparklesIcon className="h-5 w-5"/>
                    <span>{isLoadingAI ? "Generando..." : "Generar Plan"}</span>
                </button>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center md:text-left">Desglose y Recomendaciones por Área</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {areaScores.map((area, index) => {
                const color = cardColors[index % cardColors.length];
                return (
                    <div key={area.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-slate-800">{area.title}</h3>
                            <div className="flex justify-between items-baseline mt-2">
                                <p className="font-bold text-slate-700">{area.level.name} ({area.level.code})</p>

                                <p className="text-sm text-slate-500">Puntuación: <span className="font-semibold text-slate-700">{area.score.toFixed(2)} / 5</span></p>
                            </div>
                        </div>
                        <div className={`h-1.5 w-full ${color}`}></div>
                        
                        {area.answeredCount < area.totalCount ? (
                            <div className="p-5 bg-slate-50 flex-grow flex items-center">
                                <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 text-center">
                                    Completa esta área para ver tus sugerencias.
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 bg-slate-50 flex-grow">
                                <p className="text-sm text-slate-600 mb-4 italic">"{area.level.description}"</p>
                                <h4 className="text-sm font-bold text-slate-600">Sugerencias para tu desarrollo:</h4>
                                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                    {RECOMMENDATIONS[area.id]?.[area.level.key] ?? 'No hay recomendaciones disponibles para este nivel.'}
                                </p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
      </div>
      {isAIAssistantOpen && (
        <AIAssistantModal
            recommendations={aiRecommendations}
            isLoading={isLoadingAI}
            error={aiError}
            onClose={() => setIsAIAssistantOpen(false)}
        />
      )}
    </>
  );
};