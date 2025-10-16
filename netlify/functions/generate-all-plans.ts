import type { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

// Correctly initialize with process.env for server-side execution
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

// Define the expected JSON structure from the AI for robustness
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        level: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ['title', 'level', 'description']
    },
    areaPlans: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          nextLevelDescription: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'nextLevelDescription', 'actions']
      },
    },
  },
  required: ['summary', 'areaPlans']
};


const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!process.env.API_KEY) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: 'La clave API no está configurada en el servidor.' }),
      };
  }
  
  try {
    const body = JSON.parse(event.body || '{}');
    const areaScores: AreaScore[] = body.areaScores;

    if (!areaScores || !Array.isArray(areaScores) || areaScores.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Datos de puntuación de área inválidos o faltantes.' }) };
    }
    
    // Construct a single, powerful prompt for a single API call
    const fullPrompt = `
Eres un coach experto en desarrollo profesional para docentes, especializado en competencias digitales.
Basado en los siguientes resultados de una autoevaluación, genera un plan de desarrollo completo en formato JSON.

Resultados de la autoevaluación:
${areaScores.map(area => `- Área "${area.title}": Nivel ${area.level.name} (Puntuación: ${area.score.toFixed(2)}/5). Descripción: "${area.level.description}"`).join('\n')}

Por favor, genera una respuesta JSON que siga estrictamente este esquema:
{
  "summary": {
    "title": "Un título inspirador para el plan.",
    "level": "El nivel de competencia general (ej: Novato Digital, Integrador Digital, Experto Digital).",
    "description": "Un párrafo conciso (2-3 frases) que resuma el perfil del docente, su estado actual y el objetivo del plan."
  },
  "areaPlans": [
    {
      "id": 1,
      "nextLevelDescription": "Una descripción de 1-2 frases del siguiente nivel de competencia al que aspirar para el área con id 1.",
      "actions": [
        "Una acción o estrategia concreta para mejorar.",
        "Otra acción o estrategia concreta."
      ]
    }
  ]
}
Asegúrate de que el 'id' en cada objeto de 'areaPlans' corresponda al ID numérico del área en los resultados proporcionados y que haya un objeto por cada área.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const aiResponseJson = JSON.parse(response.text);

    // Transform the AI response into the format the frontend expects
    const summaryContent = `${aiResponseJson.summary.title}\n${aiResponseJson.summary.level}\n${aiResponseJson.summary.description}`;
    const formattedSummary = { content: summaryContent, error: null };

    const formattedAreaPlans = areaScores.reduce((acc, area) => {
      const planData = aiResponseJson.areaPlans.find((p: {id: number}) => p.id === area.id);
      if (planData) {
        const planContent = `${planData.nextLevelDescription}\n${planData.actions.map((action: string) => `- ${action}`).join('\n')}`;
        acc[area.id] = { content: planContent, error: null };
      } else {
        acc[area.id] = { content: '', error: 'No se pudo generar un plan para esta área.' };
      }
      return acc;
    }, {} as Record<number, { content: string; error: string | null }>);


    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: formattedSummary,
        areaPlans: formattedAreaPlans,
      }),
    };

  } catch (error) {
    console.error('Error in serverless function:', error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido en el servidor.";
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        summary: { content: '', error: errorMessage },
        areaPlans: {} 
      }) 
    };
  }
};

export { handler };
