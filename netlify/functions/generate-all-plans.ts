// FIX: Implemented the full serverless function to generate AI-based development plans.
// This file was previously empty or contained invalid content, causing multiple errors.

import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gemini API client
// The API key must be set as an environment variable `API_KEY` in your Netlify settings.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AreaScore {
    id: number;
    title: string;
    score: number;
    level: {
        name: string;
        description: string;
    };
}

/**
 * Generates content using the Gemini API with error handling.
 * @param prompt The prompt to send to the model.
 * @returns An object with the generated content and an error if one occurred.
 */
async function generateContent(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // Use the .text property to get the text output
    return { content: response.text, error: null };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with the AI service.";
    return { content: '', error: `AI Generation Failed: ${errorMessage}` };
  }
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!process.env.API_KEY) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: 'API key is not configured.' }),
      };
  }
  
  try {
    const body = JSON.parse(event.body || '{}');
    const areaScores: AreaScore[] = body.areaScores;

    if (!areaScores || !Array.isArray(areaScores) || areaScores.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid areaScores in request body' }) };
    }

    // --- Generate Summary Plan ---
    const summaryPrompt = `
Eres un coach experto en desarrollo profesional para docentes, especializado en competencias digitales.
Basado en los siguientes resultados de una autoevaluación de competencias digitales, genera un resumen de un plan de desarrollo profesional.
El resumen debe tener el siguiente formato, en 3 líneas exactas:
1. Un título inspirador para el plan.
2. El nivel de competencia general (ej: Novato Digital, Integrador Digital, Experto Digital), basado en el promedio de las puntuaciones.
3. Un párrafo conciso (2-3 frases) que resuma el perfil del docente, destacando su estado actual y el objetivo del plan.

Resultados de la autoevaluación:
${areaScores.map(area => `- ${area.title}: Nivel ${area.level.name} (Puntuación: ${area.score.toFixed(2)}/5).`).join('\n')}

Genera solo el texto del resumen, sin añadir introducciones, conclusiones ni formato markdown.`;

    const summaryPromise = generateContent(summaryPrompt);

    // --- Generate Plan for Each Area in Parallel ---
    const areaPlanPromises = areaScores.map(area => {
      const areaPrompt = `
Eres un coach experto en desarrollo profesional para docentes, especializado en competencias digitales para el área de "${area.title}".
Un docente ha obtenido el nivel "${area.level.name}" con una puntuación de ${area.score.toFixed(2)} sobre 5. Su nivel se describe como: "${area.level.description}".

Genera un plan de desarrollo conciso y accionable para esta área específica. El plan debe tener el siguiente formato:
- Una descripción de 1-2 frases del siguiente nivel de competencia al que debe aspirar.
- Una lista de 2 o 3 acciones o estrategias concretas para mejorar, comenzando cada una con "- ".

Ejemplo de formato de respuesta:
Para progresar al siguiente nivel, deberías enfocarte en aplicar estas tecnologías de manera más colaborativa y creativa.
- Explora herramientas de trabajo en equipo como Google Docs o Microsoft Teams para co-crear materiales con colegas.
- Participa activamente en una comunidad de práctica en línea sobre tu área de especialización.

Genera solo el texto del plan para el área, sin añadir introducciones, conclusiones ni formato markdown.`;
      
      return generateContent(areaPrompt).then(result => ({ id: area.id, ...result }));
    });

    // Await all promises
    const [summaryResult, areaPlanResults] = await Promise.all([
      summaryPromise,
      Promise.all(areaPlanPromises),
    ]);

    const areaPlans = areaPlanResults.reduce((acc, result) => {
        acc[result.id] = { content: result.content, error: result.error };
        return acc;
    }, {} as Record<number, { content: string; error: string | null }>);


    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: summaryResult,
        areaPlans: areaPlans,
      }),
    };

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { statusCode: 500, body: JSON.stringify({ error: `Server Error: ${errorMessage}` }) };
  }
};

export { handler };
