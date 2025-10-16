import { GoogleGenAI } from '@google/genai';
import type { Context } from '@netlify/functions';

// Define la estructura esperada para los puntajes de área en el cuerpo de la solicitud
type AreaScore = {
    title: string;
    level: { name: string; };
};

// Función de generación de prompt simplificada
const generatePrompt = (scores: AreaScore[]): string => {
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

export const handler = async (request: Request, context: Context): Promise<Response> => {
  // Solo permitir solicitudes POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { areaScores } = await request.json();
    
    // Validación básica de los datos entrantes
    if (!Array.isArray(areaScores) || areaScores.length === 0) {
        return new Response(JSON.stringify({ error: 'Bad Request: areaScores is required and must be an array.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Asegurarse de que la clave de API esté disponible en las variables de entorno
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set.");
      return new Response(JSON.stringify({ error: "Server configuration error: API key is missing." }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inicializar el cliente de Gemini
    const ai = new GoogleGenAI({ apiKey });
    const prompt = generatePrompt(areaScores);

    // Llamar a la API de Gemini para generar contenido
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Usar el modelo rápido para evitar timeouts
        contents: prompt,
    });

    const text = response.text ?? "";

    // Devolver el plan generado con éxito
    return new Response(JSON.stringify({ plan: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Registrar el error detallado para la depuración
    console.error("Error in generate-plan function:", error);
    
    // Devolver un mensaje de error genérico al cliente
    return new Response(JSON.stringify({ error: "An error occurred while generating the development plan. Please try again later." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};