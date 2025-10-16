import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import type { GeneratePlanPayload } from '../../types';

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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { area } = JSON.parse(event.body || '{}') as GeneratePlanPayload;
    if (!area || typeof area.title !== 'string' || typeof area.score !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payload incorrecto para el plan de área.' }),
      };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API key no está configurada en el entorno del servidor.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = generateAreaDevelopmentPrompt(area);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ plan: response.text }),
    };

  } catch (error) {
    console.error('Error en la función generate-plan:', error);
    const message = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error interno del servidor: ${message}` }),
    };
  }
};