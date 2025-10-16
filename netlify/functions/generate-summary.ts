import { GoogleGenAI } from '@google/genai';
import type { Context } from '@netlify/functions';

type AreaScore = {
    title: string;
    score: number;
    level: { name: string; };
};

const generatePrompt = (scores: AreaScore[]): string => {
  const scoresText = scores.map(s => `- ${s.title}: Puntuación ${s.score.toFixed(2)} (Nivel ${s.level.name})`).join('\n');
  
  const lowestScores = [...scores].sort((a, b) => a.score - b.score).slice(0, 4);
  const areasToImprove = lowestScores.map(s => `**${s.title}**`).join(', ');

  return `
    Actúa como un coach educativo experto en el marco DigCompEdu. Eres conciso y alentador.
    Basado en los siguientes resultados de un docente:
    ${scoresText}

    Analiza el perfil y escribe un único párrafo de resumen (máximo 80 palabras). Tu respuesta DEBE seguir esta estructura:
    1. Comienza con una frase general sobre el perfil (ej. "Tu perfil muestra un desarrollo equilibrado en un nivel de integración..." o "Tu perfil muestra fortalezas claras en...").
    2. Identifica las áreas con menor puntuación como la principal oportunidad de crecimiento. Usa la siguiente frase casi textual: "Por otro lado, las áreas de ${areasToImprove} representan tu mayor oportunidad de crecimiento...". Usa **negrita** para los nombres de las áreas.
    3. Termina con la frase de cierre: "Las recomendaciones a continuación te ayudarán a fortalecer tus competencias.".

    No incluyas encabezados ni la explicación de qué es un gráfico de radar. Solo el párrafo de análisis.
  `;
};

export const handler = async (request: Request, context: Context): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { areaScores } = await request.json();
    
    if (!Array.isArray(areaScores) || areaScores.length === 0) {
        return new Response(JSON.stringify({ error: 'Bad Request: areaScores is required.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = generatePrompt(areaScores);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const summaryText = response.text ?? "No se pudo generar un resumen en este momento.";

    return new Response(JSON.stringify({ summary: summaryText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-summary function:", error);
    return new Response(JSON.stringify({ error: "An error occurred while generating the summary." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};