import React, { useState, useMemo, useCallback } from 'react';
import type { Area } from '../types';
import { RadarChart } from './RadarChart';
import { SparklesIcon, DownloadIcon } from './icons/Icons';
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

const directivaTaxonomia = `
La Taxonomía de Bloom para la Era Digital, actualizada por Andrew Churches, toma como base la Taxonomía Revisada (que usa verbos en lugar de sustantivos) y la adapta a los nuevos comportamientos y oportunidades de aprendizaje que brindan las Tecnologías de la Información y las Comunicaciones (TIC).

Esta adaptación se enfoca en el uso de las TIC como medios para desarrollar habilidades cognitivas, sin restringirse únicamente al ámbito cognitivo, sino incluyendo métodos y herramientas. El objetivo es impulsar a los estudiantes de las Habilidades de Pensamiento de Orden Inferior (LOTS) a las Habilidades de Pensamiento de Orden Superior (HOTS).

A continuación, se presenta un mapa detallado de los niveles, sus definiciones, verbos clave y las herramientas digitales asociadas:

***

## Habilidades de Pensamiento de Orden Inferior (LOTS)

### 1. RECORDAR
*   **Definición:** Recuperar, rememorar o reconocer conocimiento.
*   **Verbos Clave (Digitales):** Utilizar viñetas, resaltar, marcar, participar en red social, buscar.
*   **Herramientas/Actividades:** Motores de búsqueda, Evernote, Google Drive, Diigo, Pinterest, Flashcards.

### 2. COMPRENDER (Entender)
*   **Definición:** Construir significado a partir de diferentes tipos de funciones.
*   **Verbos Clave (Digitales):** Búsquedas avanzadas, “Twittering”, categorizar, etiquetar, comentar.
*   **Herramientas/Actividades:** Wordle, Tagxedo, Thinglink, Mapas Conceptuales, Blogs, Foros.

### 3. APLICAR
*   **Definición:** Llevar a cabo o utilizar un procedimiento.
*   **Verbos Clave (Digitales):** Correr, cargar, jugar, operar, subir archivos, compartir, editar.
*   **Herramientas/Actividades:** Infografías (Piktochart, Canva), Presentaciones (Google Drive, Prezi), Simulación, edición de video.

***

## Habilidades de Pensamiento de Orden Superior (HOTS)

### 4. ANALIZAR
*   **Definición:** Descomponer materiales o conceptos en partes.
*   **Verbos Clave (Digitales):** Recombinar, enlazar, validar, ingeniería inversa, mapas mentales.
*   **Herramientas/Actividades:** Mapas mentales (Popplet, Mindmeister), Ejes cronológicos, Bases de Datos, GIS (Google Earth).

### 5. EVALUAR
*   **Definición:** Hacer juicios en base a criterios y estándares.
*   **Verbos Clave (Digitales):** Comentar en blog, revisar, publicar, moderar, colaborar, validar.
*   **Herramientas/Actividades:** Murales digitales (Padlet), Debatir, Wikis, Skype, investigar con GIS.

### 6. CREAR
*   **Definición:** Juntar los elementos para formar un todo coherente y funcional.
*   **Verbos Clave (Digitales):** Programar, filmar, animar, blogear, mezclar, publicar, “videocasting”.
*   **Herramientas/Actividades:** Producción de Películas (Movie Maker), Podcasting (Audacity), Programación (Scratch), Moldear (Sketchup), Realidad Aumentada.
  `;

const generatePlanSummaryPrompt = (scores: { title: string; score: number; level: { name: string; code: string; } }[]): string => {
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const averageScore = scores.length > 0 ? totalScore / scores.length : 0;
  const overallLevel = getProficiencyLevel(averageScore);

  return `
    Actúa como un experto en Educación Universitaria y Tecnología Educativa.
    Basado en los resultados de un docente, genera un resumen para su plan de desarrollo.
    La salida DEBE ser un texto plano con la siguiente estructura exacta:
    Línea 1: Un título. Ejemplo: Plan de Desarrollo para la Competencia Digital Docente.
    Línea 2: El nivel y puntuación. Ejemplo: Nivel General: ${overallLevel.name} (${overallLevel.code}) - Puntuación Promedio: ${averageScore.toFixed(2)}/5.
    Líneas 3-5: Un párrafo conciso (3-4 líneas) describiendo los objetivos del plan, basado en el marco DigCompEdu y la Taxonomía de Bloom digital, destacando que el plan ofrece acciones concretas para pasar de habilidades de orden inferior a superior.
  `;
};

const generateAreaDevelopmentPrompt = (area: { title: string; score: number; }): string => {
  return `
    Actúa como un experto en Educación Universitaria y Tecnología Educativa. Tu tarea es ser rápido y eficiente.

    **Directiva de Taxonomía (Fuente de Verdad Absoluta):**
    ${directivaTaxonomia}

    **Datos del Área:**
    - Competencia: ${area.title}
    - Puntuación: ${area.score.toFixed(2)}/5

    **Tarea:**
    Genera un plan de desarrollo para esta área siguiendo un proceso de dos pasos para optimizar la velocidad:

    **Paso 1: Identificación Rápida.**
    Basado en la puntuación de ${area.score.toFixed(2)}, determina qué niveles taxonómicos ya están dominados.
    - Puntuación < 2: Ninguno dominado.
    - Puntuación 2 a 3: 'Recordar' está dominado.
    - Puntuación 3 a 4: 'Recordar' y 'Comprender' están dominados.
    - Puntuación > 4: 'Recordar', 'Comprender' y 'Aplicar' están dominados.

    **Paso 2: Generación de Salida.**
    Produce un texto plano listando los 6 niveles taxonómicos (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear).
    - Para los niveles que identificaste como **dominados** en el Paso 1, NO realices ningún análisis. Simplemente escribe la siguiente frase exacta. Por ejemplo para Recordar: "Recordar: Competencia demostrada. No se requieren acciones de desarrollo específicas."
    - Para los niveles que **NO están dominados**, realiza un análisis y proporciona acciones concretas basadas en la Directiva de Taxonomía, siguiendo estas reglas:
      - Para los niveles 'Analizar' y 'Evaluar', proporciona **exactamente una** acción concreta.
      - Para los demás niveles no dominados ('Recordar', 'Comprender', 'Aplicar', 'Crear'), puedes proporcionar 1 o 2 acciones.
      - Cada acción debe empezar en una nueva línea con un guion ("- ").

    La salida debe ser un texto plano, sin títulos ni introducciones, empezando directamente con "Recordar: ...".
  `;
};


const FormattedPlanContent: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return (
        <div className="space-y-3">
            {lines.map((line, index) => {
                if (line.startsWith('- ')) {
                    return (
                        <p key={index} className="text-slate-600 text-sm ml-4">{line}</p>
                    );
                }
                const parts = line.split(':');
                const level = parts[0];
                const rest = parts.slice(1).join(':').trim();
                
                return (
                    <div key={index}>
                        <p className="font-semibold text-slate-700 text-sm">
                            {level}: <span className="font-normal text-slate-600">{rest}</span>
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

const PlanSkeletonLoader: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4 mt-4"></div>
        <div className="h-3 bg-slate-200 rounded w-full"></div>
    </div>
);


export const Results: React.FC<ResultsProps> = ({ answers, areas }) => {
  interface PlanState {
    content: string;
    isLoading: boolean;
    error: string | null;
  }
  
  const [planSummary, setPlanSummary] = useState<PlanState>({ content: '', isLoading: false, error: null });
  const [areaPlans, setAreaPlans] = useState<Record<number, PlanState>>({});
  const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);
  
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

  const allPlansGenerated = useMemo(() => (
    planSummary.content &&
    areaScores.every(area => areaPlans[area.id]?.content && !areaPlans[area.id]?.isLoading)
  ), [planSummary, areaPlans, areaScores]);

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
    setIsGeneratingPlans(true);
    setPlanSummary({ content: '', isLoading: true, error: null });

    const initialAreaPlans: Record<number, PlanState> = {};
    areas.forEach(area => {
        initialAreaPlans[area.id] = { content: '', isLoading: true, error: null };
    });
    setAreaPlans(initialAreaPlans);

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key is not configured. Please set it up in the environment secrets.");
        }
        const ai = new GoogleGenAI({ apiKey });

        const allPromises: Promise<any>[] = [];

        // Summary promise
        const summaryPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: generatePlanSummaryPrompt(areaScores),
        }).then(response => {
            setPlanSummary({ content: response.text ?? '', isLoading: false, error: null });
        }).catch(error => {
            const errorMessage = error instanceof Error ? error.message : "Error generando resumen.";
            setPlanSummary({ content: '', isLoading: false, error: errorMessage });
        });
        allPromises.push(summaryPromise);
        
        // Area promises
        areaScores.forEach(area => {
            const areaPromise = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generateAreaDevelopmentPrompt(area),
            }).then(response => {
                setAreaPlans(prev => ({
                    ...prev,
                    [area.id]: { content: response.text ?? '', isLoading: false, error: null }
                }));
            }).catch(error => {
                const errorMessage = error instanceof Error ? error.message : `Error en ${area.title}.`;
                 setAreaPlans(prev => ({
                    ...prev,
                    [area.id]: { content: '', isLoading: false, error: errorMessage }
                }));
            });
            allPromises.push(areaPromise);
        });

        await Promise.allSettled(allPromises);

    } catch (error) {
        console.error("Error setting up AI plan generation:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setPlanSummary({ content: '', isLoading: false, error: errorMessage });
    } finally {
        setIsGeneratingPlans(false);
    }
  }, [areaScores, areas]);

  const handleDownloadPlan = useCallback(() => {
    if (!allPlansGenerated) {
        return;
    }

    const formatPlanContentHTML = (content: string): string => {
        return content.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                if (line.startsWith('- ')) {
                    return `<p class="plan-action">${line.substring(2)}</p>`;
                }
                const parts = line.split(':');
                const level = parts[0];
                const rest = parts.slice(1).join(':').trim();
                return `<p class="plan-level"><strong>${level}:</strong> ${rest}</p>`;
            }).join('');
    };

    const generateRadarChartSVG = (data: { label: string; value: number }[]): string => {
        const width = 500;
        const height = 400;
        const maxScore = 5;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        const numSides = data.length;
        const angleSlice = (Math.PI * 2) / numSides;

        const getPoint = (value: number, index: number) => {
            const angle = angleSlice * index - Math.PI / 2;
            const r = (value / maxScore) * radius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            return `${x},${y}`;
        };

        const dataPoints = data.map((d, i) => getPoint(d.value, i)).join(' ');
        const gridLevels = 4;
        const gridPolygons = Array.from({ length: gridLevels }, (_, i) => {
            const level = (maxScore / gridLevels) * (i + 1);
            return data.map((_, j) => getPoint(level, j)).join(' ');
        });
        const axes = data.map((_, i) => getPoint(maxScore, i));
        const labels = data.map((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const labelRadius = radius * 1.25;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            return { x, y, label: d.label };
        });

        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<g>`;
        gridPolygons.reverse().forEach(points => {
            svg += `<polygon points="${points}" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />`;
        });
        axes.forEach(point => {
            const [x2, y2] = point.split(',');
            svg += `<line x1="${centerX}" y1="${centerY}" x2="${x2}" y2="${y2}" stroke="#e2e8f0" stroke-width="1" />`;
        });
        svg += `<polygon points="${dataPoints}" fill="rgba(14, 165, 233, 0.3)" stroke="#0ea5e9" stroke-width="2" />`;
        labels.forEach(l => {
             const parts = l.label.split(' ');
             const tspan1 = `<tspan x="${l.x}" dy="${parts.length > 1 ? "-0.5em" : "0.3em"}">${parts[0]}</tspan>`;
             const tspan2 = parts[1] ? `<tspan x="${l.x}" dy="1.2em">${parts[1]}</tspan>` : '';
             svg += `<text x="${l.x}" y="${l.y}" text-anchor="middle" font-family="sans-serif" font-size="12px" font-weight="600" fill="#475569">${tspan1}${tspan2}</text>`;
        });
        svg += `</g></svg>`;
        return svg;
    };

    const summaryLines = planSummary.content.split('\n');
    const summaryTitle = summaryLines[0] || 'Plan de Desarrollo Profesional';
    const summaryLevel = summaryLines[1] || '';
    const summaryDescription = summaryLines.slice(2).join(' ');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan de Desarrollo de Competencia Digital</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; background-color: #f8fafc; color: #334155; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 0.75rem; }
                h1, h2, h3 { color: #1e293b; line-height: 1.2; }
                h1 { font-size: 2.25rem; text-align: center; margin-bottom: 0.5rem; }
                h2 { font-size: 1.5rem; margin-top: 2.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
                h3 { font-size: 1.25rem; }
                .summary-level { text-align: center; font-weight: 600; color: #64748b; margin-bottom: 1.5rem; }
                .summary-desc { margin-bottom: 2rem; }
                .chart-container { text-align: center; margin: 2rem 0; }
                .area-card { margin-top: 1.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
                .area-header { padding: 1rem 1.5rem; background-color: #f1f5f9; }
                .area-header .level { font-weight: 700; color: #1e293b; }
                .area-header .score { font-size: 0.875rem; color: #64748b; }
                .area-body { padding: 1.5rem; }
                .plan-level { margin: 0.5rem 0; }
                .plan-action { margin: 0.25rem 0 0.25rem 1.5rem; text-indent: -1.5rem; }
                .plan-action::before { content: "- "; }
                @media print {
                  body { background-color: #fff; }
                  .container { box-shadow: none; border: none; padding: 0; margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${summaryTitle}</h1>
                <p class="summary-level">${summaryLevel}</p>
                <p class="summary-desc">${summaryDescription}</p>

                <h2>Resumen de Competencias</h2>
                <div class="chart-container">
                    ${generateRadarChartSVG(radarChartData)}
                </div>

                <h2>Desglose y Plan de Desarrollo por Área</h2>
                ${areaScores.map(area => `
                    <div class="area-card">
                        <div class="area-header">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <h3>${area.title}</h3>
                                <span class="score">Puntuación: <strong>${area.score.toFixed(2)} / 5</strong></span>
                            </div>
                            <p class="level">${area.level.name} (${area.level.code})</p>
                        </div>
                        <div class="area-body">
                            ${formatPlanContentHTML(areaPlans[area.id]?.content || '')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plan-de-desarrollo.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [allPlansGenerated, planSummary, areaScores, areaPlans, radarChartData]);

  const renderPlanSummary = () => {
    if (!planSummary.isLoading && !planSummary.content && !planSummary.error) return null;
    
    const lines = planSummary.content.split('\n');
    const title = lines[0] || 'Plan de Desarrollo Profesional';
    const level = lines[1] || '';
    const description = lines.slice(2).join(' ');

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-8">
            {planSummary.isLoading ? (
                <PlanSkeletonLoader />
            ) : planSummary.error ? (
                 <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{planSummary.error}</div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{level}</p>
                    <p className="mt-4 text-slate-600 leading-relaxed">{description}</p>
                </>
            )}
        </div>
    );
  };

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
                <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                        onClick={handleGeneratePlan}
                        disabled={!allQuestionsAnswered || isGeneratingPlans}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand-accent border border-transparent rounded-lg shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                    >
                        <SparklesIcon className="h-5 w-5"/>
                        <span>{isGeneratingPlans ? "Generando Planes..." : "Generar Plan"}</span>
                    </button>
                    <button
                        onClick={handleDownloadPlan}
                        disabled={!allPlansGenerated || isGeneratingPlans}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand-secondary border border-transparent rounded-lg shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                    >
                        <DownloadIcon className="h-5 w-5"/>
                        <span>Descargar Plan</span>
                    </button>
                </div>
            </div>
        </div>
        
        {renderPlanSummary()}

        <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center md:text-left">Desglose y Plan de Desarrollo por Área</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {areaScores.map((area, index) => {
                const color = cardColors[index % cardColors.length];
                const plan = areaPlans[area.id];
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
                        
                        <div className="p-5 bg-slate-50 flex-grow">
                             {area.answeredCount < area.totalCount ? (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 text-center">
                                    Completa esta área para generar sugerencias.
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600 mb-4 italic">"{area.level.description}"</p>
                                    <h4 className="text-sm font-bold text-slate-600">Sugerencias de la IA para tu desarrollo:</h4>
                                    <div className="mt-4">
                                        {plan?.isLoading && <PlanSkeletonLoader />}
                                        {plan?.error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{plan.error}</div>}
                                        {plan?.content && <FormattedPlanContent content={plan.content} />}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </>
  );
};