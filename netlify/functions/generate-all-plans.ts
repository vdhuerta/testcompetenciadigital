import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Helper types for clarity
interface AreaScore {
  id: number;
  title: string;
  score: number;
  level: { name: string; code: string; };
}

interface PlanGenerationResult {
    content: string;
    error: string | null;
}

// --- Logic moved from frontend to backend ---

const getProficiencyLevel = (score: number): { name: string; code: string; } => {
  if (score < 2) return { name: 'Novato', code: 'A1-A2' };
  if (score < 4) return { name: 'Integrador', code: 'B1-B2' };
  return { name: 'Experto', code: 'C1-C2' };
};

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

// --- Netlify Function Handler ---

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is not configured." }),
    };
  }
  
  try {
    const { areaScores } = JSON.parse(event.body || '{}') as { areaScores: AreaScore[] };

    if (!areaScores || !Array.isArray(areaScores) || areaScores.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing or invalid areaScores in request body.' }),
        }
    }

    const ai = new GoogleGenAI({ apiKey });

    const allPromises = [];

    // Summary promise
    const summaryPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generatePlanSummaryPrompt(areaScores),
    }).then(response => ({
        status: 'fulfilled',
        value: { content: response.text ?? '', error: null }
    })).catch(error => ({
        status: 'rejected',
        reason: { content: '', error: error instanceof Error ? error.message : "Error generando resumen." }
    }));

    allPromises.push(summaryPromise);
    
    // Area promises
    areaScores.forEach(area => {
        const areaPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: generateAreaDevelopmentPrompt(area),
        }).then(response => ({
            status: 'fulfilled',
            value: { id: area.id, content: response.text ?? '', error: null }
        })).catch(error => ({
            status: 'rejected',
            reason: { id: area.id, content: '', error: error instanceof Error ? error.message : `Error en ${area.title}.` }
        }));
        allPromises.push(areaPromise);
    });

    const results = await Promise.all(allPromises);
    
    const summaryResult = (results[0].status === 'fulfilled' ? results[0].value : results[0].reason) as PlanGenerationResult;

    const areaPlansResult: Record<number, PlanGenerationResult> = {};
    results.slice(1).forEach((res: any) => {
        const result = res.status === 'fulfilled' ? res.value : res.reason;
        areaPlansResult[result.id] = { content: result.content, error: result.error };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: summaryResult,
        areaPlans: areaPlansResult,
      }),
    };

  } catch (error) {
    console.error("Error in generate-all-plans function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : "An internal server error occurred." }),
    };
  }
};

export { handler };
