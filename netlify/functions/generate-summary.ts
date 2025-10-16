import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import type { GenerateSummaryPayload, AreaScore } from '../../types';

const getProficiencyLevel = (score: number): { name: string; code: string; } => {
  if (score < 2) return { name: 'Novato', code: 'A1-A2' };
  if (score < 4) return { name: 'Integrador', code: 'B1-B2' };
  return { name: 'Experto', code: 'C1-C2' };
};

const generatePlanSummaryPrompt = (scores: AreaScore[]): string => {
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


export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { scores } = JSON.parse(event.body || '{}') as GenerateSummaryPayload;
    if (!scores || !Array.isArray(scores)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Payload incorrecto para el resumen.' }),
        };
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API key no está configurada en el entorno del servidor.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = generatePlanSummaryPrompt(scores);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ plan: response.text }),
    };

  } catch (error) {
    console.error('Error en la función generate-summary:', error);
    const message = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error interno del servidor: ${message}` }),
    };
  }
};