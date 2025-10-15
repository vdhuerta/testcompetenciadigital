import { GoogleGenAI } from '@google/genai';
import type { Handler } from '@netlify/functions';

// Definimos el tipo para los puntajes que esperamos recibir
type AreaScore = {
    id: number;
    title: string;
    score: number;
    level: { name: string; };
};

// La función para generar el prompt se copia aquí, en el backend
const generatePrompt = (scores: AreaScore[]): string => {
  const scoresText = scores.map(s => `- ${s.title}: Puntuación ${s.score} de 5 (Nivel: ${s.level.name})`).join('\n');

  return `
    Actúe como un académico experto en tecnología educativa y diseño curricular, con nivel de doctorado. Su análisis debe ser formal, preciso y basado en evidencia pedagógica.

    A continuación, se presenta el perfil de competencias digitales de un docente, basado en el marco DigCompEdu:
    ${scoresText}

    Su tarea es generar un plan de desarrollo profesional fundamentado en estos resultados. Siga estrictamente las siguientes directrices:

    1.  **Introducción:** Comience el plan con una introducción directa que explique qué es, su propósito y su fundamentación pedagógica. No se presente ni mencione sus credenciales (ej. "Como experto..."). La introducción debe establecer que el plan se basa en sus resultados, utiliza la Taxonomía de Bloom como marco de progresión y busca fortalecer sus competencias digitales.
    2.  **Fundamentación Pedagógica:** Las recomendaciones deben estructurarse siguiendo una progresión lógica basada en la Taxonomía Digital de Bloom (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear).
    3.  **Nivel de Progresión:**
        -   Para áreas con puntuaciones bajas (inferiores a 2.5), céntrese en los niveles de **Recordar, Comprender y Aplicar**.
        -   Para áreas con puntuaciones intermedias (entre 2.5 y 4.0), proponga actividades de **Aplicar y Analizar**.
        -   Para áreas con puntuaciones altas (superiores a 4.0), plantee desafíos en los niveles de **Analizar, Evaluar y Crear**.
    4.  **Especificidad y Aplicabilidad:** Evite generalidades. Cada sugerencia debe incluir **herramientas digitales concretas** (ej. "Utilice Edpuzzle para..."), **recursos específicos** (ej. "Consulte el repositorio OER Commons...") y **estrategias metodológicas claras**.
    5.  **Estructura por Área:** Para cada área de competencia, primero explique brevemente (1-2 frases) por qué las siguientes recomendaciones se centran en niveles taxonómicos específicos, basándose en la puntuación del docente. Por ejemplo: "Dado su nivel de Integrador, el enfoque aquí es consolidar la aplicación y avanzar hacia el análisis crítico". Inmediatamente después de esta justificación, presente las actividades.
    6.  **Manejo de Niveles Superados:** Para los niveles de la taxonomía de Bloom que, según la puntuación, ya se consideran dominados (ej. "Recordar" y "Comprender" para una puntuación alta), no los deje en blanco. En su lugar, indique explícitamente que la competencia está demostrada. Utilice el formato exacto: "**Recordar:** Competencia demostrada. No se requieren acciones de desarrollo específicas."
    7.  **Formato de Salida:** Después de la introducción, la respuesta debe estar formateada en Markdown. Utilice un encabezado de nivel 2 (##) para cada área de competencia. Dentro de cada área, utilice negritas para indicar los niveles de la taxonomía (ej. **Aplicar:**) seguido de una lista de recomendaciones.

    El lenguaje debe ser formal, académico y directo. Evite frases clichés, superlativos o un tono excesivamente motivacional. El objetivo es proporcionar una guía estructurada y profesional que el docente pueda implementar para su desarrollo competencial.
    `;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { areaScores } = JSON.parse(event.body || '{}');
    
    if (!areaScores || !Array.isArray(areaScores) || areaScores.length === 0) {
        return { statusCode: 400, body: 'Bad Request: areaScores is missing or invalid.' };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API key not configured.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = generatePrompt(areaScores);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    const plan = response.text;

    return {
      statusCode: 200,
      body: JSON.stringify({ plan }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate AI plan." }),
    };
  }
};