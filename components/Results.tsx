import React, { useMemo, useState } from 'react';
import type { Area } from '../types';
import { RECOMMENDATIONS } from '../recommendations';
import { AIAssistantModal } from './AIAssistantModal';
import { SparklesIcon, DownloadIcon } from './icons/Icons';

interface ResultsProps {
  answers: Record<number, number>;
  areas: Area[];
}
export type AreaScore = {
    id: number;
    title: string;
    shortTitle: string;
    score: number;
    level: { name: string; color: string; };
};


const cardColors = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#e11d48', '#f59e0b', '#84cc16', '#6366f1'];
const MAX_SCORE = 5; // Options are 0-5

const getCompetencyLevel = (score: number): { name: string; color: string } => {
  if (score <= 2.0) return { name: 'Novato (A1-A2)', color: 'text-rose-500' };
  if (score <= 4.0) return { name: 'Integrador (B1-B2)', color: 'text-amber-500' };
  return { name: 'Experto (C1-C2)', color: 'text-teal-500' };
};

const RadarChart: React.FC<{ data: { label: string; score: number }[] }> = ({ data }) => {
    const size = 480;
    const center = size / 2;
    const chartRadius = 150;
    const numSides = data.length;
    if (numSides === 0) return null;

    const angleSlice = (Math.PI * 2) / numSides;

    const getPoint = (angle: number, value: number) => {
        const x = center + (chartRadius * value * Math.sin(angle));
        const y = center - (chartRadius * value * Math.cos(angle));
        return `${x},${y}`;
    };

    const gridLines = Array.from({ length: 5 }, (_, i) => {
        const radius = (chartRadius / 5) * (i + 1);
        const points = Array.from({ length: numSides }, (_, j) => {
            const angle = j * angleSlice;
            const x = center + radius * Math.sin(angle);
            const y = center - radius * Math.cos(angle);
            return `${x},${y}`;
        }).join(' ');
        return <polygon key={i} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
    });

    const dataPoints = data.map(d => d.score / MAX_SCORE);
    const shapePoints = dataPoints.map((value, i) => getPoint(i * angleSlice, value)).join(' ');

    const labels = data.map((d, i) => {
        const angle = i * angleSlice;
        const labelRadius = chartRadius * 1.3;
        const x = center + labelRadius * Math.sin(angle);
        const y = center + 5 + labelRadius * -Math.cos(angle);

        const epsilon = 0.001;
        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        if (Math.sin(angle) > epsilon) {
            textAnchor = 'start';
        } else if (Math.sin(angle) < -epsilon) {
            textAnchor = 'end';
        }
        
        const words = d.label.split(' ');
        return (
            <text
                key={i}
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="#475569"
            >
                {words.map((word, j) => (
                  <tspan key={j} x={x} dy={j === 0 ? "0" : "1.2em"}>{word}</tspan>
                ))}
            </text>
        );
    });

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
            {gridLines}
            {Array.from({ length: numSides }, (_, i) => (
                <line key={i} x1={center} y1={center} x2={parseFloat(getPoint(i * angleSlice, 1).split(',')[0])} y2={parseFloat(getPoint(i * angleSlice, 1).split(',')[1])} stroke="#e2e8f0" strokeWidth="1"/>
            ))}
            <polygon points={shapePoints} fill="rgba(14, 165, 233, 0.4)" stroke="#0ea5e9" strokeWidth="2" />
            {dataPoints.map((value, i) => (
                <circle key={i} cx={parseFloat(getPoint(i * angleSlice, value).split(',')[0])} cy={parseFloat(getPoint(i * angleSlice, value).split(',')[1])} r="4" fill="#0ea5e9" />
            ))}
            {labels}
        </svg>
    );
};

const DynamicSummary: React.FC<{ areaScores: AreaScore[] }> = ({ areaScores }) => {
    const sortedScores = useMemo(() => [...areaScores].sort((a, b) => b.score - a.score), [areaScores]);
    
    if (sortedScores.length === 0) return null;

    const strengths = sortedScores.filter(s => s.score >= 4.0);
    const weaknesses = sortedScores.filter(s => s.score <= 2.0).reverse();

    const renderAreaNames = (areas: AreaScore[]) => areas.map((area, i) => (
        <React.Fragment key={area.id}>
            <strong className="text-slate-800">{area.title}</strong>
            {i < areas.length - 1 && (i === areas.length - 2 ? ' y ' : ', ')}
        </React.Fragment>
    ));

    return (
        <div className="mt-8 p-5 bg-sky-50 border border-sky-200 rounded-lg text-slate-600 space-y-3 text-base leading-relaxed">
            <p>
                Este gráfico de radar representa visualmente tu perfil de competencia digital. Cada eje corresponde a un área, y la distancia del punto al centro indica tu nivel de dominio: un punto más alejado significa una mayor competencia.
            </p>
            <p>
                {strengths.length > 0
                    ? <>Tu perfil destaca especialmente en {renderAreaNames(strengths)}, lo que indica un uso consolidado y de experto en este ámbito. </>
                    : 'Tu perfil muestra un desarrollo equilibrado en un nivel de integración, sin áreas que destaquen significativamente por encima de las demás. '
                }
                {weaknesses.length > 0
                    ? <>Por otro lado, el área de {renderAreaNames(weaknesses)} representa tu mayor oportunidad de crecimiento en una etapa inicial. </>
                    : 'No se identifican áreas en un nivel de novato, lo cual es un excelente punto de partida para seguir avanzando.'
                }
                Las recomendaciones a continuación te ayudarán a fortalecer tus competencias.
            </p>
        </div>
    );
};


export const Results: React.FC<ResultsProps> = ({ answers, areas }) => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const areaScores = useMemo(() => {
    return areas.map(area => {
      const answeredQuestions = area.questions.filter(q => answers[q.id] !== undefined);
      const totalScore = answeredQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
      const averageScore = answeredQuestions.length > 0 ? totalScore / answeredQuestions.length : 0;
      return {
        id: area.id,
        title: area.title,
        shortTitle: area.shortTitle,
        score: parseFloat(averageScore.toFixed(2)),
        level: getCompetencyLevel(averageScore),
      };
    }).sort((a,b) => a.id - b.id);
  }, [answers, areas]);

  const overallLevel = useMemo(() => {
    if (areaScores.length === 0) {
      return getCompetencyLevel(0);
    }
    const totalScore = areaScores.reduce((sum, area) => sum + area.score, 0);
    const averageScore = totalScore / areaScores.length;
    return getCompetencyLevel(averageScore);
  }, [areaScores]);

  const handleGenerateAndShowAiPlan = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiPlan('');
    setIsAiModalOpen(true);

    try {
      const response = await fetch('/.netlify/functions/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ areaScores }),
      });

      if (!response.ok) {
        throw new Error(`Error from server: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error("Response body is empty.");
      }
      
      setIsAiLoading(false); // Stop loading spinner once stream starts

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        setAiPlan(prevPlan => prevPlan + chunk);
      }

    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      setAiError("Lo sentimos, no se pudo generar el plan de desarrollo. Por favor, inténtalo de nuevo más tarde.");
      setIsAiLoading(false);
    }
  };
  
  const handleDownloadPlan = () => {
    const areaSections = areaScores.map((area, index) => {
        const recommendationKey = area.level.name.startsWith('Novato') ? 'novice' : area.level.name.startsWith('Integrador') ? 'integrator' : 'expert';
        const recommendation = RECOMMENDATIONS[area.id]?.[recommendationKey] || 'No hay recomendaciones específicas para este nivel.';
        const levelColorClass = area.level.color.replace('text-', '');
        
        return `
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid mb-6">
            <div class="p-5 border-b-4" style="border-color: ${cardColors[index % cardColors.length]};">
              <h3 class="text-xl font-bold text-slate-800">${area.title}</h3>
              <div class="flex justify-between items-baseline mt-2">
                <span class="text-lg font-semibold text-${levelColorClass}">${area.level.name}</span>
                <span class="text-sm font-bold text-slate-600">Puntuación: ${area.score} / ${MAX_SCORE}</span>
              </div>
            </div>
            <div class="p-5 bg-slate-50">
               <h4 class="font-semibold text-slate-600 mb-2">Sugerencias para tu desarrollo:</h4>
               <p class="text-sm text-slate-500 leading-relaxed">${recommendation}</p>
            </div>
          </div>
        `;
      }).join('');

    // This robustly formats the AI-generated markdown into clean HTML.
    const formattedAiPlan = aiPlan
      // 1. First, fix potential formatting issues from the AI, ensuring a newline after a sentence and before a bolded skill.
      .replace(/([.?!"])\s*(\*\*)/g, '$1\n\n$2')
      // 2. Convert markdown elements to HTML.
      .replace(/^## (.*)$/gm, '<h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h3>')
      .replace(/\*\*([^\*]+)\*\*/g, '<strong class="font-semibold text-slate-700">$1</strong>')
      .replace(/^\s*\*\s(.*)$/gm, '<li class="ml-5 list-disc mb-1">$1</li>')
      // 3. Wrap consecutive list items in <ul> tags.
      .replace(/(<li.*<\/li>(?:\s*<li.*<\/li>)*)/g, '<ul>$1</ul>')
      // 4. Convert any remaining newlines into <br> tags for paragraph spacing.
      .replace(/\n/g, '<br />')
      // 5. Clean up any extra <br> tags that might appear around lists.
      .replace(/<br \/>\s*<ul>/g, '<ul>')
      .replace(/<\/ul>\s*<br \/>/g, '</ul>');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plan de Desarrollo Profesional</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .text-rose-500 { color: #f43f5e; }
            .text-amber-500 { color: #f59e0b; }
            .text-teal-500 { color: #14b8a6; }
          </style>
        </head>
        <body class="bg-slate-100 font-sans p-4 sm:p-8">
          <main class="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-lg">
            <header class="text-center border-b-2 border-slate-200 pb-6 mb-10">
              <h1 class="text-4xl font-extrabold text-slate-800">Plan de Desarrollo Profesional</h1>
              <p class="mt-3 text-lg text-slate-500">Análisis de competencias y plan de acción personalizado basado en el marco DigCompEdu.</p>
              <div class="mt-6">
                <span class="inline-block bg-slate-100 text-slate-600 rounded-full px-4 py-2 text-lg">
                  Nivel General: <strong class="${overallLevel.color}">${overallLevel.name}</strong>
                </span>
              </div>
            </header>

            <section>
              <h2 class="text-3xl font-bold text-slate-700 mb-8">Desglose y Recomendaciones por Área</h2>
              <div class="columns-1 lg:columns-2 gap-6">
                ${areaSections}
              </div>
            </section>

            <section class="mt-16">
              <h2 class="text-3xl font-bold text-slate-700 mb-8">Plan de Desarrollo Generado por IA</h2>
              <div class="prose max-w-none text-slate-600 leading-relaxed">${formattedAiPlan}</div>
            </section>
          </main>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan-de-desarrollo.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (Object.keys(answers).length === 0) {
    return (
        <div className="text-center bg-white p-12 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-slate-700">Tu informe de resultados está casi listo</h1>
            <p className="mt-4 text-slate-500">
                Aún no has respondido ninguna pregunta.
                <br />
                Completa la autoevaluación para ver un análisis detallado de tus competencias digitales.
            </p>
        </div>
    );
  }

  const chartData = areaScores.map(area => ({ label: area.shortTitle, score: area.score }));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Informe de Resultados</h1>
        <div className="flex items-baseline gap-2 bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-slate-600">Nivel General:</span>
            <span className={`text-lg font-bold ${overallLevel.color}`}>{overallLevel.name}</span>
        </div>
      </div>
      <p className="mt-2 text-slate-500">Un análisis de tus competencias digitales basado en tus respuestas.</p>
      
      <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-700 text-center">Tu Perfil de Competencia Digital</h2>
        <div className="w-full max-w-lg mx-auto aspect-square mt-4">
            <RadarChart data={chartData} />
        </div>
        <DynamicSummary areaScores={areaScores} />
      </div>

      <div className="mt-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-700">Desglose y Recomendaciones</h2>
          <div className="flex flex-col sm:flex-row gap-3">
             <button
                onClick={handleGenerateAndShowAiPlan}
                disabled={isAiLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                {isAiLoading ? 'Generando...' : (
                    <>
                        <SparklesIcon className="h-5 w-5" />
                        Generar Plan de Desarrollo con IA
                    </>
                )}
            </button>
             <button
                onClick={handleDownloadPlan}
                disabled={!aiPlan || isAiLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 border border-transparent rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <DownloadIcon className="h-5 w-5" />
                Descargar Plan
             </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {areaScores.map((area, index) => {
                const recommendationKey = area.level.name.startsWith('Novato') ? 'novice' : area.level.name.startsWith('Integrador') ? 'integrator' : 'expert';
                const recommendation = RECOMMENDATIONS[area.id]?.[recommendationKey];
                
                return (
                    <div key={area.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b-4" style={{ borderColor: cardColors[index % cardColors.length] }}>
                            <h3 className="text-xl font-bold text-slate-800">{area.title}</h3>
                            <div className="flex justify-between items-baseline mt-2">
                                <span className={`text-lg font-semibold ${area.level.color}`}>{area.level.name}</span>
                                <span className="text-sm font-bold text-slate-600">Puntuación: {area.score} / ${MAX_SCORE}</span>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50/50">
                           <h4 className="font-semibold text-slate-600 mb-2">Sugerencias para tu desarrollo:</h4>
                           <p className="text-sm text-slate-500 leading-relaxed">{recommendation}</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
      {isAiModalOpen && (
        <AIAssistantModal 
            recommendations={aiPlan}
            isLoading={isAiLoading}
            error={aiError}
            onClose={() => setIsAiModalOpen(false)}
        />
      )}
    </div>
  );
};