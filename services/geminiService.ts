


import { GoogleGenAI, Modality, Type } from "@google/genai";
import { 
    MockupConfig,
    ModificationRequest,
    GARMENT_CATEGORIES,
    DESIGN_STYLE_CATEGORIES,
    STYLE_OPTIONS,
    DesignLayer,
} from '../constants';


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("Variabile d'ambiente API_KEY non impostata");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface GroundingSource {
  uri: string;
  title: string;
}

// Helper to convert data URL to base64 string
function dataUrlToBase64(dataUrl: string): string {
  const regex = /^data:image\/(png|jpeg|gif|webp);base64,/;
  return dataUrl.replace(regex, '');
}

function cleanAndParseJson(jsonString: string): any {
  // AI can sometimes wrap the JSON in markdown-style code blocks or add conversation.
  // This extracts the JSON object from the string.
  const match = jsonString.match(/\{[\s\S]*\}/);
  if (match && match[0]) {
    try {
      return JSON.parse(match[0]);
    } catch (error) {
      console.error("Impossibile analizzare la stringa JSON estratta:", match[0], error);
      // Fall through to the generic error
    }
  }
  
  console.error("Impossibile trovare o analizzare l'oggetto JSON nella stringa:", jsonString);
  // Re-throw a more specific error to be caught by the UI handler.
  throw new Error("L'IA ha restituito un formato di dati non valido. Si prega di riprovare.");
}

const getAIPersonaPrompt = (designStyle: string): string => {
    const style = designStyle.toLowerCase();
    if (style.includes('grunge anni \'90')) {
        return "Sei un designer di t-shirt per band vintage specializzato in look 'usati' e 'invecchiati'. Pensa a flanella pesante, grafiche sbiadite e colori cupi.";
    }
    if (style.includes('y2k') || style.includes('primi anni 2000')) {
        return "Sei un designer per un marchio Y2K. Pensa a colori vivaci, tessuti iridescenti, font 'a bolle', strass e vestibilità aderenti o cropped.";
    }
    if (style.includes('gorpcore') || style.includes('outdoor')) {
        return "Sei un designer di abbigliamento tecnico e funzionale. Pensa a GORE-TEX, nylon ripstop, cerniere impermeabili, cuciture nastrate e una palette di colori naturali o 'di sicurezza'.";
    }
    if (style.includes('streetwear')) {
        return "Sei un moderno designer di streetwear. Ti concentri sulla cultura hype, vestibilità oversize, loghi audaci e materiali premium come il pile pesante.";
    }
    if (style.includes('cyberpunk') || style.includes('techwear')) {
        return "Sei un designer di techwear futuristico. La tua estetica include cinghie funzionali, tagli asimmetrici, tessuti tecnici e una palette di colori scuri e distopici.";
    }
    if (style.includes('minimalista')) {
        return "Sei un designer minimalista. La tua attenzione è rivolta a linee pulite, palette di colori neutri, materiali di alta qualità e l'assenza di branding o decorazioni eccessive.";
    }
    // Default persona if no specific match
    return "Sei un maestro fotografo e designer di moda IA. La tua specialità è creare immagini di prodotto iperrealistiche e avvincenti per l'e-commerce di lusso.";
};


export async function parseEasyPrompt(prompt: string): Promise<Partial<MockupConfig>> {
  // Build the context for the AI
  const garmentCatalog = GARMENT_CATEGORIES.map(cat => 
    `- ${cat.name}: ${cat.items.join(', ')}`
  ).join('\n');

  const styleCatalog = DESIGN_STYLE_CATEGORIES.map(cat => 
    `- ${cat.name}: ${cat.items.join(', ')}`
  ).join('\n');

  const finalPrompt = `
    Sei un assistente di moda IA iper-attento. La tua funzione principale è tradurre il testo libero di un utente in una configurazione JSON precisa. Devi attenerti rigorosamente ai cataloghi forniti.

    **Richiesta Utente:** "${prompt}"

    **Catalogo Opzioni Disponibili:**
    **Tipi di Indumento (selectedGarment):**
${garmentCatalog}
    
    **Stili di Design (selectedDesignStyle):**
${styleCatalog}

    **Stili di Mockup (selectedStyle):**
    ${STYLE_OPTIONS.join(', ')}

    **Ragionamento a Catena di Pensiero:**
    1.  **Identifica Parole Chiave Esplicite:** Per prima cosa, scansiona il prompt alla ricerca di corrispondenze esatte o quasi esatte con gli elementi nei cataloghi. Una menzione esplicita come "giacca di jeans" dovrebbe avere la priorità.
    2.  **Deduci dal Contesto:** Se non viene trovata alcuna corrispondenza esatta, analizza il linguaggio descrittivo. Una richiesta per una "maglietta per un concerto rock anni '90" implica fortemente lo stile di design "[Grunge Anni '90]". Una "camicia da lavoro resistente" implica un tipo di indumento "Camicia da lavoro".
    3.  **Sintetizza Indumento:** Determina il singolo miglior \`selectedGarment\` dal catalogo "Tipi di Indumento".
    4.  **Sintetizza Stile:** Determina il singolo miglior \`selectedDesignStyle\` dal catalogo "Stili di Design".
    5.  **Estrai Materiale:** Identifica qualsiasi descrizione di materiale come "cotone pesante" o "denim acid wash". Questo sarà l'\`aiMaterialPrompt\`.
    6.  **Estrai Colore:** Identifica il colore e convertilo in un codice esadecimale standard. "Carbone" -> "#36454F".
    7.  **Determina Stile Mockup:** "Foto" o "realistico" mappa a "Mockup Fotorealistico". "Disegno" o "schizzo" mappa a "Stile Schizzo Tecnico". Predefinito a "Mockup Fotorealistico" se ambiguo.
    8.  **Costruisci JSON:** Assembla l'oggetto JSON finale. Ometti qualsiasi chiave per cui non è stato possibile trovare una mappatura sicura.

    **Output Finale:**
    Basandoti sul tuo ragionamento, fornisci SOLO l'oggetto JSON finale e valido con le chiavi "selectedGarment", "selectedDesignStyle", "selectedColor", "aiMaterialPrompt", "selectedStyle". Ometti qualsiasi chiave per cui non hai trovato una corrispondenza sicura.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedGarment: { type: Type.STRING },
            selectedDesignStyle: { type: Type.STRING },
            selectedColor: { type: Type.STRING },
            aiMaterialPrompt: { type: Type.STRING },
            selectedStyle: { type: Type.STRING },
          }
        },
      },
    });

    const jsonString = response.text.trim();
    return cleanAndParseJson(jsonString) as Partial<MockupConfig>;
  } catch (error) {
    if (error instanceof Error && error.message.includes("formato di dati non valido")) {
        throw error;
    }
    console.error("Errore nell'analisi del prompt semplice:", error);
    throw new Error("L'IA non è riuscita a capire la richiesta. Prova a riformularla.");
  }
}

export async function generateMockup(
  config: MockupConfig,
  view: string
): Promise<{ imageUrl: string; groundingSources: GroundingSource[] }> {
  const garmentDescription = config.useAiApparel ? config.aiApparelPrompt : config.selectedGarment;
  const cleanDesignStyle = config.selectedDesignStyle.replace(/\[|\]/g, '');
  const personaPrompt = getAIPersonaPrompt(config.selectedDesignStyle);

  let finalPrompt = '';

  if (config.useAiModelScene) {
    finalPrompt = `
      ${personaPrompt}
      **OBIETTIVO PRINCIPALE:** Generare una singola immagine fotorealistica di un modello umano che indossa un indumento in una scena specifica.
      
      **Processo di Analisi e Visualizzazione (Pensa Passo-passo):**
      1.  **Decostruzione Indumento:** Indumento: ${garmentDescription}, Vestibilità: ${config.fit}, Materiale: ${config.aiMaterialPrompt}, Colore: ${config.selectedColor}, Estetica: ${cleanDesignStyle}.
      2.  **Visualizzazione Modello:** Il modello dovrebbe essere: "${config.aiModelPrompt}". La posa e l'espressione del modello dovrebbero corrispondere all'estetica dell'indumento.
      3.  **Visualizzazione Scena:** La scena/sfondo dovrebbe essere: "${config.aiScenePrompt}". L'illuminazione deve essere coerente tra il modello e la scena.
      4.  **Composizione:** Combina tutti gli elementi in una fotografia in stile e-commerce di alta moda. L'indumento è il protagonista dello scatto.
      
      **Regole di Esecuzione CRITICHE:**
      - **Obiettivo:** Generare una singola immagine fotorealistica. L'output finale deve sembrare una vera fotografia.
      - **NESSUNA Distrazione:** L'immagine finale NON deve contenere testo, etichette o watermark.
      - **Focus sull'Indumento:** L'indumento deve essere chiaramente visibile e reso accuratamente secondo tutte le specifiche.
      - **Vista:** Mostra l'indumento dalla vista ${view}.
    `;
// FIX: Changed 'Stile Schizzo Tecnico' to 'Technical Sketch Style' to match type definition.
  } else if (config.selectedStyle === 'Technical Sketch Style') {
     finalPrompt = `
      ${personaPrompt}
      **OBIETTIVO PRINCIPALE: SOLO VISIVO. NESSUN TESTO.**
      Il tuo compito è generare un singolo schizzo tecnico piatto e pulito in 2D di un capo di abbigliamento. Questo è per un mockup di moda professionale.

      **ISTRUZIONI CRITICHE (DA SEGUIRE OBBLIGATORIAMENTE):**
      1.  **TIPO DI OUTPUT:** L'output DEVE essere uno schizzo piatto 2D (stile vettoriale).
      2.  **SFONDO:** Lo sfondo DEVE essere bianco solido (#FFFFFF).
      3.  **NESSUN TESTO:** L'immagine finale deve contenere ZERO testo, annotazioni, descrizioni o etichette. Deve essere una pura rappresentazione visiva.
      4.  **COLORE:** Riempi l'intero indumento con questo colore esadecimale solido: ${config.selectedColor}.
      5.  **STILE LINEA:** Usa contorni neri puliti, sottili e coerenti.

      **NON FARE:**
      - NON creare un rendering 3D o un'immagine fotorealistica.
      - NON aggiungere ombreggiature, gradienti o effetti artistici.
      - NON includere testo, numeri o misurazioni.
      - NON aggiungere loghi, watermark o qualsiasi altro elemento oltre all'indumento.

      **Dettagli Indumento:**
      - **Indumento da Disegnare:** ${garmentDescription}
      - **Estetica del Design:** ${cleanDesignStyle}
      - **Vestibilità/Silhouette:** ${config.fit}
      - **Vista:** ${view}
    `;
  } else {
     finalPrompt = `
      ${personaPrompt}
      **Processo di Analisi e Visualizzazione (Pensa Passo-passo):**
      1.  **Decostruisci:** Indumento: ${garmentDescription}, Vestibilità: ${config.fit}, Materiale: ${config.aiMaterialPrompt}, Colore: ${config.selectedColor}, Estetica: ${cleanDesignStyle}, Vista: ${view}.
      2.  **Visualizza Materiale:** Rendi accuratamente la texture, la lucentezza e il drappeggio di "${config.aiMaterialPrompt}", influenzato dall'estetica principale.
      3.  **Visualizza Stile:** Traduci l'estetica "${cleanDesignStyle}" e la vestibilità "${config.fit}" in dettagli visivi (silhouette, taglio, indizi sottili come cuciture o hardware).
      4.  **Componi lo Scatto:** Combina gli elementi in uno stile "manichino fantasma" o "flat lay" su uno sfondo da studio grigio chiaro neutro (#E0E0E0) con un'ombra morbida.
      **Regole di Esecuzione CRITICHE:**
      - **Obiettivo:** Generare una singola immagine fotorealistica.
      - **NESSUNA Distrazione:** L'immagine finale NON deve contenere testo, etichette, watermark, grucce, oggetti di scena o figure umane.
    `;
  }
    
    const model = config.selectedModel || 'gemini-2.5-flash-image';

    if (model.startsWith('imagen')) {
        // Imagen Path
        try {
            const response = await ai.models.generateImages({
                model: model,
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '1:1', // Default aspect ratio for Imagen
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                return { imageUrl, groundingSources: [] }; // Imagen does not support grounding
            } else {
                throw new Error("L'API di Imagen non ha restituito alcuna immagine. Prova un prompt o un modello diverso.");
            }
        } catch (error: any) {
            console.error("Errore durante la generazione con Imagen:", error);
            throw new Error("Impossibile generare il mockup con Imagen. L'IA potrebbe avere problemi.");
        }
    } else {
      // Gemini Path
      try {
        const apiConfig: any = { responseModalities: [Modality.IMAGE] };
        if (config.useGoogleSearch) {
            apiConfig.tools = [{googleSearch: {}}];
        }

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: finalPrompt }] },
          config: apiConfig,
        });
        
        const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const groundingSources: GroundingSource[] = rawSources
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || '',
            }))
            .filter((source: GroundingSource) => source.uri && source.title);

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          return { imageUrl, groundingSources };
        } else {
          const candidate = response.candidates?.[0];
          const finishReason = candidate?.finishReason;
          const finishMessage = candidate?.finishMessage || "Nessun motivo specifico fornito.";
          
          switch (finishReason) {
              case 'SAFETY':
                  throw new Error("Generazione bloccata a causa delle politiche di sicurezza. Modifica il tuo prompt.");
              case 'RECITATION':
                  throw new Error("Generazione bloccata per impedire la recitazione da fonti. Riformula il tuo prompt.");
              case 'OTHER':
                    throw new Error(`Generazione fallita: ${finishMessage}. Si prega di riprovare.`);
              default:
                  console.error("L'API di Gemini non ha restituito alcuna immagine per il mockup:", JSON.stringify(response, null, 2));
                  throw new Error("Nessuna immagine è stata generata dall'API. La risposta era vuota.");
          }
        }
      } catch (error: any) {
        console.error("Errore durante la generazione del mockup fotorealistico:", error);
        
        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('api key not valid')) {
            throw new Error("Chiave API non valida. Controlla la tua configurazione.");
        }
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new Error("Limite di richieste raggiunto. Attendi un momento e riprova.");
        }
        if (errorMessage.includes('400') || errorMessage.includes('invalid_argument')) {
            throw new Error("Richiesta non valida. La configurazione dell'IA potrebbe essere errata.");
        }
        
        // Re-throw specific errors from the try block or fall back to a generic message
        if (error?.message) throw error;
        throw new Error("Impossibile generare il mockup. L'IA potrebbe avere problemi.");
      }
    }
}

export async function generateAdditionalView(
  baseImage: string,
  config: MockupConfig,
  view: string
): Promise<string> {
  let promptTemplate: string;
  const model = 'gemini-2.5-flash-image';
  const personaPrompt = getAIPersonaPrompt(config.selectedDesignStyle);

// FIX: Changed 'Stile Schizzo Tecnico' to 'Technical Sketch Style' to match type definition.
  if (config.selectedStyle === 'Technical Sketch Style') {
    promptTemplate = `
        ${personaPrompt}
        **OBIETTIVO PRINCIPALE: SOLO VISIVO. NESSUN TESTO.**
        Sei un esperto illustratore tecnico di moda IA. L'utente ha fornito uno schizzo di riferimento e necessita di un'altra vista.
        Il tuo compito è generare uno schizzo tecnico piatto 2D della vista {{view}} DELLO STESSO IDENTICO indumento nell'immagine di riferimento.

        **ISTRUZIONI CRITICHE (NON NEGOZIABILI):**
        1.  **COERENZA PERFETTA:** Il nuovo schizzo deve corrispondere perfettamente al design, alle proporzioni, al colore e allo stile di linea del riferimento.
        2.  **TIPO DI OUTPUT:** L'output DEVE essere un disegno piatto pulito in stile vettoriale 2D.
        3.  **SFONDO:** Lo sfondo DEVE essere bianco puro (#FFFFFF).
        4.  **NESSUN TESTO:** L'immagine finale deve contenere SOLO lo schizzo dell'indumento. NON aggiungere ALCUN testo, etichetta o annotazione.
        5.  **NO 3D/OMBREGGIATURA:** Non aggiungere effetti 3D, fotorealismo o ombreggiature artistiche.
    `;
  } else {
    promptTemplate = `
        ${personaPrompt}
        Sei un esperto visualizzatore di moda IA. L'utente ha fornito un'immagine di un indumento e vuole vederne un'altra vista.
        Il tuo compito è generare una vista fotorealistica {{view}} DELLO STESSO IDENTICO indumento mostrato nell'immagine fornita.

        **REGOLE CRITICHE:**
        1.  **La Coerenza è la Chiave:** L'immagine generata DEVE essere dello stesso indumento. Corrispondi perfettamente al colore, materiale, texture, stile di design e a qualsiasi caratteristica o grafica unica dell'immagine di riferimento.
        2.  **Mantieni lo Stile:** La nuova vista dovrebbe corrispondere allo stile di presentazione dell'immagine di riferimento (es. se è un "manichino fantasma", anche la nuova vista dovrebbe esserlo; se è su un modello, la nuova vista dovrebbe essere sullo stesso modello in una posa e ambientazione coerenti).
        3.  **Output:** L'output deve essere SOLO l'immagine dell'indumento dalla nuova prospettiva. Non aggiungere testo o watermark.
    `;
  }
  
  const finalPrompt = promptTemplate.replace('{{view}}', view);

  const referenceImagePart = { 
    inlineData: { 
      mimeType: 'image/png',
      data: dataUrlToBase64(baseImage) 
    } 
  };
  const textPart = { text: finalPrompt };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [referenceImagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    } else {
      console.error(`L'API di Gemini non ha restituito alcuna immagine per la vista aggiuntiva (${view}):`, JSON.stringify(response, null, 2));
      throw new Error(`L'IA non è riuscita a generare la vista ${view}.`);
    }
  } catch (error: any) {
    console.error(`Errore durante la generazione della vista aggiuntiva (${view}):`, error);
    if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
        throw new Error("Limite di richieste raggiunto. Attendi un momento e riprova.");
    }
    throw new Error(`Impossibile generare la vista ${view}. Si prega di riprovare.`);
  }
}


export async function generateGraphic(
    prompt: string, 
    garment: string, 
    placement: string, 
    color: string,
    designStyle: string,
    texturePrompt?: string,
    model: string = 'gemini-2.5-flash-image'
): Promise<string> {
  const personaPrompt = getAIPersonaPrompt(designStyle);
  let fullPrompt = `
    ${personaPrompt}
    Genera un singolo asset grafico isolato con sfondo trasparente. La grafica deve essere adatta per l'abbigliamento.

    **Dettagli Grafica:**
    - **Descrizione:** Una grafica di "${prompt}".
    - **Colore Dominante:** Dovrebbe incorporare "${color}".
    - **Stile Estetico:** Deve corrispondere all'estetica ${designStyle}.
    - **Uso Previsto:** Sarà posizionato su '${placement}' di un '${garment}'. Il design deve essere adatto a questo contesto.
    ${texturePrompt ? `- **Texture:** La grafica deve avere una texture visiva di "${texturePrompt}".` : ''}

    **REGOLE DI OUTPUT CRITICHE:**
    1.  **SFONDO TRASPARENTE:** Il file immagine finale DEVE avere uno sfondo trasparente.
    2.  **SOLO GRAFICA ISOLATA:** NON includere l'indumento, ombre o qualsiasi altro elemento. L'output deve essere SOLO la grafica stessa.
  `;
  
  const finalModel = model || 'gemini-2.5-flash-image';

  if (finalModel.startsWith('imagen')) {
    // Imagen Path
    try {
        const response = await ai.models.generateImages({
            model: finalModel,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png', // Request PNG for potential transparency
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("L'API di Imagen non ha restituito alcuna immagine per la grafica.");
        }
    } catch (error: any) {
        console.error("Errore nella chiamata all'API di Imagen per la generazione di grafica:", error);
        throw new Error("Impossibile generare la grafica con Imagen.");
    }
  } else {
    // Gemini Path
    try {
      const response = await ai.models.generateContent({
          model: finalModel,
          contents: { parts: [{ text: fullPrompt }] },
          config: { responseModalities: [Modality.IMAGE] },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw new Error("L'IA non è stata in grado di generare una grafica per questo prompt. Ciò può accadere a causa delle politiche di sicurezza o se la richiesta non è chiara. Prova a riformulare il tuo prompt.");
        }
        console.error("L'API di Gemini non ha restituito alcuna immagine per la grafica:", JSON.stringify(response, null, 2));
        throw new Error("Nessuna grafica è stata generata dall'API.");
      }
    } catch (error: any) {
      console.error("Errore nella chiamata all'API di Gemini per la generazione di grafica:", error);
      if (error?.message) throw error;
      if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
          throw new Error("Limite di richieste raggiunto. Attendi un momento e riprova.");
      }
      throw new Error("Impossibile generare la grafica. Controlla la console per maggiori dettagli.");
    }
  }
}

export async function generateColorPalette(
    garmentColor: string, 
    designStyle: string
): Promise<string[]> {
  const prompt = `
    Sei un esperto teorico del colore e stilista di moda.
    Il colore primario del mio indumento è "${garmentColor}".
    Lo stile di design è "${designStyle}".

    Crea una palette di 5 colori (inclusi colori neutri e d'accento) che si abbinino perfettamente a questo indumento e stile.

    Restituisci SOLO un array JSON di stringhe contenenti i codici esadecimali.
    Esempio: ["#FFFFFF", "#000000", "#FFD700", "#BDB76B", "#8A2BE2"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        }
      },
    });

    const palette = JSON.parse(response.text.trim());
    if (Array.isArray(palette) && palette.every(item => typeof item === 'string' && item.startsWith('#'))) {
        return palette as string[];
    }
    throw new Error("L'IA ha restituito un formato di palette non valido.");
  } catch (error) {
    console.error("Errore durante la generazione della palette di colori:", error);
    throw new Error("L'IA non è riuscita a suggerire una palette di colori. Si prega di riprovare.");
  }
}


export async function generateInspirationPrompt(garment: string, designStyle: string, color: string, selectedStyle: string): Promise<string> {
  // Added a random number to the prompt to ensure uniqueness and bypass any potential caching.
  const cacheBuster = Math.random();
  let prompt = '';

// FIX: Changed 'Stile Schizzo Tecnico' to 'Technical Sketch Style' to match type definition.
  if (selectedStyle === 'Technical Sketch Style') {
    prompt = `
      Sei un maestro designer tecnico di moda che crea specifiche per un nuovo indumento. Il tuo compito è fare brainstorming su un prompt chiaro e conciso per un'IA per generare uno schizzo tecnico di un capo di abbigliamento unico.

      **Indumento Base:** ${garment}
      **Estetica Principale:** ${designStyle}
      **Colore Primario:** ${color}

      // Numero per cache-busting (ignora nella tua risposta): ${cacheBuster}

      Basandoti su questi input, crea una descrizione breve (una frase) ma precisa, concentrandoti su **dettagli strutturali e funzionali**. Pensa a posizionamenti di cuciture non convenzionali, chiusure uniche (bottoni, cerniere), tipi di tasche specifici o manipolazioni interessanti del tessuto (pieghe, pinces). **Evita un linguaggio vago e artistico.**

      Restituisci SOLO la descrizione, senza preamboli o spiegazioni.
      Esempio: "Una giacca di jeans con chiusura a zip asimmetrica e un sistema di imbracatura integrato e rimovibile."
    `;
  } else {
    prompt = `
      Sei un direttore creativo visionario per un'etichetta di moda d'avanguardia nota per rompere le convenzioni. Il tuo compito è fare brainstorming su un prompt avvincente e descrittivo per un'IA per generare un capo di abbigliamento veramente unico.

      **Indumento Base:** ${garment}
      **Estetica Principale:** ${designStyle}
      **Colore Primario:** ${color}

      // Numero per cache-busting (ignora nella tua risposta): ${cacheBuster}

      Basandoti su questi input, crea una descrizione breve (una frase) ma altamente evocativa e inaspettata. Pensa a materiali non convenzionali, tagli asimmetrici, dettagli sorprendenti o una fusione di estetiche. **Evita a tutti i costi cliché e descrizioni comuni.**

      Restituisci SOLO la descrizione, senza preamboli o spiegazioni.
    `;
  }

  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            // Increased temperature to maximum for highest creativity and randomness.
            temperature: 1.0,
        }
      });
      return response.text.trim();
  } catch (error) {
      console.error("Errore durante la generazione del prompt di ispirazione:", error);
      throw new Error("L'IA non è riuscita a generare un'idea. Si prega di riprovare.");
  }
}

export async function renderDesignOnMockup(
  baseGarmentUrl: string,
  layers: DesignLayer[],
  designStyle: string
): Promise<string> {
    const visibleLayers = layers.filter(l => l.visible);
    if (visibleLayers.length === 0) {
        throw new Error("Nessun livello visibile fornito per il rendering.");
    }
    const personaPrompt = getAIPersonaPrompt(designStyle);

    const imageParts: { inlineData: { mimeType: string; data: string } }[] = [];
    const layerRecipe: Partial<DesignLayer>[] = [];
    let imageCounter = 0;

    // Add base garment as the first image
    imageParts.push({ inlineData: { mimeType: 'image/png', data: dataUrlToBase64(baseGarmentUrl) } });

    visibleLayers.forEach(layer => {
        const layerCopy: any = { ...layer };
        delete layerCopy.id; // The AI doesn't need the UUID

        if ((layer.type === 'image' || layer.type === 'drawing') && layer.content) {
            imageParts.push({ inlineData: { mimeType: 'image/png', data: dataUrlToBase64(layer.content) } });
            imageCounter++;
            layerCopy.content = `REFERENCE_IMAGE_${imageCounter}`; // Placeholder for the prompt
        }
        layerRecipe.push(layerCopy);
    });

    const prompt = `
        ${personaPrompt}
        Sei un motore di rendering IA di livello mondiale per il design di abbigliamento. Il tuo compito è applicare una "ricetta di design" (un array JSON di livelli) su un'immagine di indumento base per creare un mockup finale fotorealistico.

        **Immagini di Input:**
        - La prima immagine fornita è l'**Indumento Base**.
        - Le immagini successive (se presenti) sono referenziate nella ricetta JSON come "REFERENCE_IMAGE_1", "REFERENCE_IMAGE_2", ecc.

        **Ricetta di Design JSON:**
        \`\`\`json
        ${JSON.stringify(layerRecipe, null, 2)}
        \`\`\`

        **Istruzioni di Rendering CRITICHE:**
        1.  **Itera attraverso i Livelli:** Elabora ogni oggetto livello dall'array JSON in ordine.
        2.  **Applica Trasformazioni:** Per ogni livello, applica le sue proprietà con precisione:
            -   \`position\`: Posiziona il centro del livello alle coordinate percentuali {x, y} date (0,0 è in alto a sinistra, 1,1 è in basso a destra).
            -   \`size\`: Scala il livello alle dimensioni percentuali {width, height} date rispetto alle dimensioni dell'indumento base.
            -   \`rotation\`: Ruota il livello dei gradi specificati.
            -   \`opacity\`: Applica l'opacità specificata.
            -   \`blendMode\`: Usa l'operazione di compositing specificata quando si fonde con i livelli sottostanti.
        3.  **Rendi Contenuto:**
            -   Se \`content\` è "REFERENCE_IMAGE_X", usa l'immagine di input corrispondente.
            -   Se \`type\` è "text", rendi il contenuto testuale usando le sue proprietà \`fontFamily\`, \`fontWeight\`, \`color\` e \`textAlign\`. Il testo dovrebbe scalare per adattarsi alla dimensione del livello.
            -   Se \`type\` è "shape", rendi la forma (es. 'rectangle', 'circle') e riempila con il suo colore \`fill\`.
        4.  **Integrazione Fotorealistica (Simulazione di Mappatura di Spostamento):**
            -   **Deforma e Distorci:** Questo è il passo più importante. Deforma e distorci realisticamente ogni livello applicato per seguire i contorni, le pieghe, le grinze e le cuciture del tessuto sottostante.
            -   **Applica Illuminazione e Ombre:** L'illuminazione e le ombre dell'Indumento Base devono influenzare realisticamente tutti i livelli applicati.
            -   **Imita la Texture:** Miscela sottilmente la texture del tessuto nei livelli in modo che sembrino stampati o tessuti nel materiale, non semplicemente incollati sopra.

        **Output Finale:**
        Restituisci SOLO l'immagine finale, singola e fotorealistica dell'indumento con tutti i livelli della ricetta perfettamente resi e integrati. Non aggiungere testo, etichette o watermark.
    `;

    const allParts = [{ text: prompt }, ...imageParts];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: allParts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        } else {
            const candidate = response.candidates?.[0];
            const finishReason = candidate?.finishReason;
            const finishMessage = candidate?.finishMessage || "Nessun motivo specifico fornito.";
            console.error("L'API di Gemini non ha restituito alcuna immagine per il mockup di design:", JSON.stringify(response, null, 2));
            if (finishReason === 'SAFETY') {
                throw new Error("Il rendering è stato bloccato a causa delle politiche di sicurezza. Modifica il tuo design.");
            }
            throw new Error(`L'IA non è riuscita a renderizzare il design: ${finishMessage}`);
        }
    } catch (error: any) {
        console.error("Errore durante il rendering del mockup di design:", error);
        if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
            throw new Error("Limite di richieste raggiunto. Attendi un momento e riprova.");
        }
        if (error?.message) throw error;
        throw new Error("Impossibile renderizzare il design. L'IA potrebbe avere problemi.");
    }
}


export async function propagateDesignToView(
    designedViewUrl: string,
    cleanTargetViewUrl: string,
    sourceViewName: string,
    targetViewName: string,
    designStyle: string
): Promise<string> {
    const personaPrompt = getAIPersonaPrompt(designStyle);
    const prompt = `
        ${personaPrompt}
        Sei un esperto designer di abbigliamento IA. Ti vengono fornite due immagini:
        1. Un indumento da una vista specifica (${sourceViewName}) con un design applicato.
        2. Una versione pulita e vuota DELLO STESSO indumento da una vista diversa (${targetViewName}).

        Il tuo compito è propagare intelligentemente il design dalla prima immagine alla seconda.

        **Istruzioni:**
        1. **Analizza il Design:** Identifica tutti gli elementi grafici, il testo e le loro posizioni sulla vista ${sourceViewName} con design.
        2. **Posizionamento Logico:** Determina dove quegli elementi di design apparirebbero logicamente sulla vista ${targetViewName}. Ad esempio, una grafica sul davanti di una maglietta potrebbe non essere visibile dal retro, ma una grafica sulla manica potrebbe avvolgersi ed essere parzialmente visibile.
        3. **Applica e Rendi:** Applica il design alla vista ${targetViewName} pulita, assicurandoti che sia reso realisticamente, seguendo le pieghe del tessuto, l'illuminazione e la prospettiva per quel nuovo angolo.

        **Output:**
        Restituisci SOLO l'immagine della vista ${targetViewName} con il design correttamente propagato.
    `;
    
    const designedImagePart = { inlineData: { mimeType: 'image/png', data: dataUrlToBase64(designedViewUrl) } };
    const cleanImagePart = { inlineData: { mimeType: 'image/png', data: dataUrlToBase64(cleanTargetViewUrl) } };
    const textPart = { text: prompt };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [designedImagePart, cleanImagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        } else {
            console.error(`L'API di Gemini non ha restituito alcuna immagine per la propagazione alla vista ${targetViewName}:`, JSON.stringify(response, null, 2));
            throw new Error(`L'IA non è riuscita a propagare il design alla vista ${targetViewName}.`);
        }
    } catch (error) {
        console.error(`Errore durante la propagazione del design alla vista ${targetViewName}:`, error);
        throw new Error(`Impossibile propagare il design alla vista ${targetViewName}. Si prega di riprovare.`);
    }
}

export async function modifyGarmentImage(
  baseImageUrl: string,
  modification: ModificationRequest,
  designStyle: string,
): Promise<string> {
  const personaPrompt = getAIPersonaPrompt(designStyle);
  let prompt = `
    ${personaPrompt}
    Sei un esperto foto-editor IA specializzato in abbigliamento. Il tuo compito è applicare una modifica specifica all'immagine dell'indumento fornita. Devi cambiare SOLO ciò che è richiesto e mantenere identico il resto dell'immagine (stile, illuminazione, sfondo, indumento base).

    **Dettagli Modifica:**
    - **Tipo di Modifica:** ${modification.type}
    - **Richiesta:** "${modification.content}"
  `;

// FIX: Changed 'Strutturale' to 'Structural' to match type definition.
  if (modification.type !== 'Structural') {
    prompt += `
    - **Posizione sull'Indumento:** ${modification.location}
    - **Stile della Modifica:** ${modification.style}
    `;
  } else {
     prompt += `
    - **Stile della Modifica:** La modifica dovrebbe fondersi perfettamente con lo stile esistente dell'indumento (${modification.style}).
    `;
  }
  
  prompt += `
    **REGOLE CRITICHE:**
    1.  **Modifica Mirata:** Applica solo la modifica richiesta. Non alterare il colore, la texture, la vestibilità dell'indumento o lo sfondo a meno che non sia esplicitamente richiesto.
    2.  **Realismo:** La modifica deve apparire fotorealistica e naturalmente integrata con il tessuto dell'indumento, seguendone le pieghe e l'illuminazione.
    3.  **Output:** Restituisci solo l'immagine completamente modificata. Non aggiungere testo o watermark.
  `;
  
  const imagePart = { 
    inlineData: { 
      mimeType: 'image/png', // Assume PNG from data URL
      data: dataUrlToBase64(baseImageUrl) 
    } 
  };
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    } else {
      console.error("L'API di Gemini non ha restituito alcuna immagine per la modifica dell'indumento:", JSON.stringify(response, null, 2));
      throw new Error("L'IA non è riuscita a modificare l'indumento.");
    }
  } catch (error: any) {
    console.error("Errore durante la modifica dell'immagine dell'indumento:", error);
    if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
        throw new Error("Limite di richieste raggiunto. Attendi un momento e riprova.");
    }
    throw new Error("Impossibile modificare l'indumento. L'IA potrebbe avere problemi.");
  }
}


export async function applyGraphicFilter(
  imageUrl: string,
  filterType: 'vintage' | 'glitch' | 'distress'
): Promise<string> {
  let prompt = '';
  switch (filterType) {
    case 'vintage':
      prompt = `Sei un esperto di stampa di t-shirt vintage. Prendi questa grafica. Rendila ESATTAMENTE come apparirebbe su una t-shirt di una band degli anni '90 che è stata lavata 100 volte. Applica colori sbiaditi, una sottile 'screpolatura' dell'inchiostro e una minima sfocatura per simulare l'usura. Lo sfondo DEVE rimanere trasparente.`;
      break;
    case 'glitch':
      prompt = `Sei un artista digitale cyberpunk. Rendi la grafica fornita con un effetto 'glitch' o 'cyber'. Applica artefatti digitali, aberrazione cromatica e scan lines. Il design principale deve rimanere riconoscibile. Lo sfondo DEVE essere trasparente.`;
      break;
    case 'distress':
      prompt = `Sei un maestro nell'invecchiamento dell'abbigliamento. Rendi la grafica fornita come se fosse stampata su una maglietta che è stata fisicamente rovinata. Aggiungi strappi, lacerazioni e aree di forte usura dall'aspetto realistico che influenzano la stampa. Lo sfondo DEVE rimanere trasparente.`;
      break;
  }

  const imagePart = { inlineData: { mimeType: 'image/png', data: dataUrlToBase64(imageUrl) } };
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    } else {
      throw new Error(`L'IA non è riuscita ad applicare il filtro ${filterType}.`);
    }
  } catch (error) {
    console.error(`Errore nell'applicazione del filtro ${filterType}:`, error);
    throw new Error(`Impossibile applicare il filtro ${filterType}. Si prega di riprovare.`);
  }
}

export async function generateGarmentConcept(baseGarment: string, styleA: string, styleB: string): Promise<string> {
  const prompt = `
    Descrivi un capo di abbigliamento ibrido. Prendi l'indumento base ('${baseGarment}') e fondi le estetiche di '${styleA}' e '${styleB}'. 
    Concentrati sui dettagli strutturali, sui materiali e sulle caratteristiche uniche. 
    Restituisci SOLO la descrizione testuale dell'indumento risultante. Sii conciso ed evocativo.

    Esempio: "Una felpa con cappuccio minimalista in neoprene nero opaco, caratterizzata da un taglio asimmetrico sul petto che rivela un pannello LED ciano."
  `;

  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text.trim();
  } catch (error) {
      console.error("Errore durante la generazione del concept dell'indumento:", error);
      throw new Error("L'IA non è riuscita a generare un concept. Si prega di riprovare.");
  }
}