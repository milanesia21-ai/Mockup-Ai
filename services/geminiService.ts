

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
  throw new Error("API_KEY environment variable not set");
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
      console.error("Failed to parse extracted JSON string:", match[0], error);
      // Fall through to the generic error
    }
  }
  
  console.error("Could not find or parse JSON object in string:", jsonString);
  // Re-throw a more specific error to be caught by the UI handler.
  throw new Error("The AI returned an invalid data format. Please try again.");
}

const getAIPersonaPrompt = (designStyle: string): string => {
    const style = designStyle.toLowerCase();
    if (style.includes('90s grunge')) {
        return "You are a vintage band t-shirt designer specializing in 'used' and 'distressed' looks. Think heavy flannel, faded graphics, and moody colors.";
    }
    if (style.includes('y2k') || style.includes('early 2000s')) {
        return "You are a designer for a Y2K brand. Think bright colors, iridescent fabrics, 'bubble' fonts, rhinestones, and tight or cropped fits.";
    }
    if (style.includes('gorpcore') || style.includes('outdoor')) {
        return "You are a technical and functional apparel designer. Think GORE-TEX, ripstop nylon, waterproof zippers, taped seams, and a palette of natural or 'safety' colors.";
    }
    if (style.includes('streetwear')) {
        return "You are a modern streetwear designer. You focus on hype culture, oversized fits, bold logos, and premium materials like heavy fleece.";
    }
    if (style.includes('cyberpunk') || style.includes('techwear')) {
        return "You are a futuristic techwear designer. Your aesthetic involves functional straps, asymmetric cuts, technical fabrics, and a dark, dystopian color palette.";
    }
    if (style.includes('minimalist')) {
        return "You are a minimalist designer. Your focus is on clean lines, neutral color palettes, high-quality materials, and a lack of excessive branding or decoration.";
    }
    // Default persona if no specific match
    return "You are a master AI fashion photographer and designer. Your specialty is creating compelling, hyper-realistic product imagery for luxury e-commerce.";
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
    You are a hyper-attentive AI fashion assistant. Your primary function is to translate a user's freeform text into a precise JSON configuration. You must adhere strictly to the provided catalogs.

    **User Request:** "${prompt}"

    **Available Options Catalog:**
    **Garment Types (selectedGarment):**
${garmentCatalog}
    
    **Design Styles (selectedDesignStyle):**
${styleCatalog}

    **Mockup Styles (selectedStyle):**
    ${STYLE_OPTIONS.join(', ')}

    **Chain-of-Thought Reasoning:**
    1.  **Identify Explicit Keywords:** First, scan the prompt for exact or near-exact matches to items in the catalogs. An explicit mention like "denim jacket" should be prioritized.
    2.  **Infer from Context:** If no exact match is found, analyze the descriptive language. A request for a "shirt for a 90s rock concert" strongly implies the "[90s Grunge]" design style. A "tough work shirt" implies a "Work shirt" garment type.
    3.  **Synthesize Garment:** Determine the single best \`selectedGarment\` from the "Garment Types" catalog.
    4.  **Synthesize Style:** Determine the single best \`selectedDesignStyle\` from the "Design Styles" catalog.
    5.  **Extract Material:** Identify any material descriptions like "heavy cotton" or "acid wash denim". This will be the \`aiMaterialPrompt\`.
    6.  **Extract Color:** Identify the color and convert it to a standard HEX code. "Charcoal" -> "#36454F".
    7.  **Determine Mockup Style:** "Photo" or "realistic" maps to "Photorealistic Mockup". "Drawing" or "sketch" maps to "Technical Sketch Style". Default to "Photorealistic Mockup" if ambiguous.
    8.  **Construct JSON:** Assemble the final JSON object. Omit any keys where a confident mapping could not be made.

    **Final Output:**
    Based on your reasoning, provide ONLY the final, valid JSON object with the keys "selectedGarment", "selectedDesignStyle", "selectedColor", "aiMaterialPrompt", "selectedStyle". Omit any keys where you couldn't find a confident match.
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
    if (error instanceof Error && error.message.includes("invalid data format")) {
        throw error;
    }
    console.error("Error parsing easy prompt:", error);
    throw new Error("The AI couldn't understand that request. Please try rephrasing.");
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

  if (config.selectedStyle === 'Technical Sketch Style') {
     finalPrompt = `
      ${personaPrompt}
      **PRIMARY GOAL: VISUAL ONLY. NO TEXT.**
      Your task is to generate a single, clean, 2D technical flat sketch of an apparel item. This is for a professional fashion mockup.

      **CRITICAL INSTRUCTIONS (MUST FOLLOW):**
      1.  **OUTPUT TYPE:** The output MUST be a 2D flat sketch (vector style).
      2.  **BACKGROUND:** The background MUST be solid white (#FFFFFF).
      3.  **NO TEXT:** The final image must contain ZERO text, annotations, descriptions, or labels. It must be a pure visual representation.
      4.  **COLOR:** Fill the entire garment with this solid hex color: ${config.selectedColor}.
      5.  **LINE STYLE:** Use clean, thin, consistent black outlines.

      **DO NOT:**
      - Do NOT create a 3D render or photorealistic image.
      - Do NOT add shading, gradients, or artistic effects.
      - Do NOT include any text, numbers, or measurements.
      - Do NOT add logos, watermarks, or any other elements besides the garment.

      **Garment Details:**
      - **Garment to Sketch:** ${garmentDescription}
      - **Design Aesthetic:** ${cleanDesignStyle}
      - **Fit/Silhouette:** ${config.fit}
      - **View:** ${view}
    `;
  } else {
     finalPrompt = `
      ${personaPrompt}
      **Analysis & Visualization Process (Think Step-by-Step):**
      1.  **Deconstruct:** Garment: ${garmentDescription}, Fit: ${config.fit}, Material: ${config.aiMaterialPrompt}, Color: ${config.selectedColor}, Aesthetic: ${cleanDesignStyle}, View: ${view}.
      2.  **Visualize Material:** Render the texture, sheen, and drape of "${config.aiMaterialPrompt}" accurately, influenced by the core aesthetic.
      3.  **Visualize Style:** Translate the "${cleanDesignStyle}" aesthetic and "${config.fit}" fit into visual details (silhouette, cut, subtle cues like stitching or hardware).
      4.  **Compose Shot:** Combine elements into a "ghost mannequin" or "flat lay" style on a neutral light gray studio background (#E0E0E0) with a soft shadow.
      **CRITICAL Execution Rules:**
      - **Goal:** Generate a single, photorealistic image.
      - **NO Distractions:** The final image must NOT contain any text, labels, watermarks, hangers, props, or human figures.
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
                throw new Error("The Imagen API returned no image. Please try a different prompt or model.");
            }
        } catch (error: any) {
            console.error("Error generating with Imagen:", error);
            throw new Error("Failed to generate mockup with Imagen. The AI may be experiencing issues.");
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
          const finishMessage = candidate?.finishMessage || "No specific reason provided.";
          
          switch (finishReason) {
              case 'SAFETY':
                  throw new Error("Generation blocked due to safety policies. Please adjust your prompt.");
              case 'RECITATION':
                  throw new Error("Generation blocked to prevent recitation from sources. Please rephrase your prompt.");
              case 'OTHER':
                    throw new Error(`Generation failed: ${finishMessage}. Please try again.`);
              default:
                  console.error("Gemini API returned no image for mockup:", JSON.stringify(response, null, 2));
                  throw new Error("No image was generated by the API. The response was empty.");
          }
        }
      } catch (error: any) {
        console.error("Error generating photorealistic mockup:", error);
        
        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('api key not valid')) {
            throw new Error("Invalid API Key. Please check your configuration.");
        }
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new Error("Request limit reached. Please wait a moment and try again.");
        }
        if (errorMessage.includes('400') || errorMessage.includes('invalid_argument')) {
            throw new Error("Invalid request. The AI configuration may be incorrect.");
        }
        
        // Re-throw specific errors from the try block or fall back to a generic message
        if (error?.message) throw error;
        throw new Error("Failed to generate mockup. The AI may be experiencing issues.");
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

  if (config.selectedStyle === 'Technical Sketch Style') {
    promptTemplate = `
        ${personaPrompt}
        **PRIMARY GOAL: VISUAL ONLY. NO TEXT.**
        You are an expert AI fashion technical illustrator. The user has provided a reference sketch and needs another view.
        Your task is to generate a 2D technical flat sketch of the {{view}} view of the EXACT SAME garment in the reference image.

        **CRITICAL INSTRUCTIONS (NON-NEGOTIABLE):**
        1.  **PERFECT CONSISTENCY:** The new sketch must perfectly match the reference's design, proportions, color, and line style.
        2.  **OUTPUT TYPE:** The output MUST be a clean, 2D vector-style flat drawing.
        3.  **BACKGROUND:** The background MUST be pure white (#FFFFFF).
        4.  **NO TEXT:** The final image must contain ONLY the garment sketch. Do NOT add ANY text, labels, or annotations.
        5.  **NO 3D/SHADING:** Do not add 3D effects, photorealism, or artistic shading.
    `;
  } else {
    promptTemplate = `
        ${personaPrompt}
        You are an expert AI fashion visualizer. The user has provided an image of a garment and wants to see another view of it.
        Your task is to generate a photorealistic {{view}} view of the EXACT SAME garment shown in the provided image.

        **CRITICAL RULES:**
        1.  **Consistency is Key:** The generated image MUST be of the same garment. Match the color, material, texture, design style, and any unique features or graphics from the reference image perfectly.
        2.  **Maintain Style:** The new view should match the presentation style of the reference image (e.g., if it's a "ghost mannequin", the new view should also be a "ghost mannequin").
        3.  **Output:** The output must ONLY be the image of the garment from the new perspective. Do not add text or watermarks.
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
      console.error(`Gemini API returned no image for additional view (${view}):`, JSON.stringify(response, null, 2));
      throw new Error(`The AI failed to generate the ${view} view.`);
    }
  } catch (error: any) {
    console.error(`Error generating additional view (${view}):`, error);
    if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
        throw new Error("Request limit reached. Please wait a moment and try again.");
    }
    throw new Error(`Failed to generate the ${view} view. Please try again.`);
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
    Generate a single, isolated graphic asset with a transparent background. The graphic should be suitable for apparel.

    **Graphic Details:**
    - **Description:** A graphic of "${prompt}".
    - **Dominant Color:** Should incorporate "${color}".
    - **Aesthetic Style:** Must match the ${designStyle} aesthetic.
    - **Intended Use:** This will be placed on the '${placement}' of a '${garment}'. The design should be suitable for this context.
    ${texturePrompt ? `- **Texture:** The graphic must have a visual texture of "${texturePrompt}".` : ''}

    **CRITICAL OUTPUT RULES:**
    1.  **TRANSPARENT BACKGROUND:** The final image file MUST have a transparent background.
    2.  **ISOLATED GRAPHIC ONLY:** Do NOT include the garment, shadows, or any other elements. The output must be ONLY the graphic itself.
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
            throw new Error("Imagen API returned no image for graphic.");
        }
    } catch (error: any) {
        console.error("Error calling Imagen API for graphic generation:", error);
        throw new Error("Failed to generate graphic with Imagen.");
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
          throw new Error("The AI was unable to generate a graphic for this prompt. This can happen due to safety policies or if the request is unclear. Please try rephrasing your prompt.");
        }
        console.error("Gemini API returned no image for graphic:", JSON.stringify(response, null, 2));
        throw new Error("No graphic was generated by the API.");
      }
    } catch (error: any) {
      console.error("Error calling Gemini API for graphic generation:", error);
      if (error?.message) throw error;
      if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
          throw new Error("Request limit reached. Please wait a moment and try again.");
      }
      throw new Error("Failed to generate graphic. Please check the console for more details.");
    }
  }
}

export async function generateColorPalette(
    garmentColor: string, 
    designStyle: string
): Promise<string[]> {
  const prompt = `
    You are an expert color theorist and fashion designer.
    My garment's primary color is "${garmentColor}".
    The design style is "${designStyle}".

    Create a palette of 5 colors (including neutral and accent colors) that would complement this garment and style perfectly.

    Return ONLY a JSON array of strings containing the HEX codes.
    Example: ["#FFFFFF", "#000000", "#FFD700", "#BDB76B", "#8A2BE2"]
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
    throw new Error("AI returned an invalid palette format.");
  } catch (error) {
    console.error("Error generating color palette:", error);
    throw new Error("The AI failed to suggest a color palette. Please try again.");
  }
}


export async function generateInspirationPrompt(garment: string, designStyle: string, color: string, selectedStyle: string): Promise<string> {
  // Added a random number to the prompt to ensure uniqueness and bypass any potential caching.
  const cacheBuster = Math.random();
  let prompt = '';

  if (selectedStyle === 'Technical Sketch Style') {
    prompt = `
      You are a master technical fashion designer creating specifications for a new garment. Your task is to brainstorm a clear, concise prompt for an AI to generate a technical sketch of a unique piece of apparel.

      **Base Garment:** ${garment}
      **Core Aesthetic:** ${designStyle}
      **Primary Color:** ${color}

      // Cache-busting number (ignore in your response): ${cacheBuster}

      Based on these inputs, create a short (one-sentence) but precise description focusing on **structural and functional details**. Think about unconventional seam placements, unique closures (buttons, zippers), specific pocket types, or interesting fabric manipulations (pleats, darts). **Avoid vague, artistic language.**

      Return ONLY the description, with no preamble or explanation.
      Example: "A denim jacket with asymmetrical zip closure and an integrated, detachable harness system."
    `;
  } else {
    prompt = `
      You are a visionary creative director for an avant-garde fashion label known for breaking conventions. Your task is to brainstorm a compelling, descriptive prompt for an AI to generate a truly unique piece of apparel.

      **Base Garment:** ${garment}
      **Core Aesthetic:** ${designStyle}
      **Primary Color:** ${color}

      // Cache-busting number (ignore in your response): ${cacheBuster}

      Based on these inputs, create a short (one-sentence) but highly evocative and unexpected description. Think about unconventional materials, asymmetrical cuts, surprising details, or a fusion of aesthetics. **Avoid clichés and common descriptions at all costs.**

      Return ONLY the description, with no preamble or explanation.
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
      console.error("Error generating inspiration prompt:", error);
      throw new Error("The AI failed to generate an idea. Please try again.");
  }
}

export async function renderDesignOnMockup(
  baseGarmentUrl: string,
  layers: DesignLayer[],
  designStyle: string
): Promise<string> {
    const visibleLayers = layers.filter(l => l.visible);
    if (visibleLayers.length === 0) {
        throw new Error("No visible layers were provided to render.");
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
        You are a world-class AI rendering engine for apparel design. Your task is to apply a "design recipe" (a JSON array of layers) onto a base garment image to create a photorealistic final mockup.

        **Input Images:**
        - The first image provided is the **Base Garment**.
        - Subsequent images (if any) are referenced in the JSON recipe as "REFERENCE_IMAGE_1", "REFERENCE_IMAGE_2", etc.

        **JSON Design Recipe:**
        \`\`\`json
        ${JSON.stringify(layerRecipe, null, 2)}
        \`\`\`

        **CRITICAL Rendering Instructions:**
        1.  **Iterate Through Layers:** Process each layer object from the JSON array in order.
        2.  **Apply Transformations:** For each layer, apply its properties precisely:
            -   \`position\`: Place the center of the layer at the given {x, y} percentage coordinates (0,0 is top-left, 1,1 is bottom-right).
            -   \`size\`: Scale the layer to the given {width, height} percentage of the base garment's dimensions.
            -   \`rotation\`: Rotate the layer by the specified degrees.
            -   \`opacity\`: Apply the specified opacity.
            -   \`blendMode\`: Use the specified composite operation when blending with layers below.
        3.  **Render Content:**
            -   If \`content\` is "REFERENCE_IMAGE_X", use the corresponding input image.
            -   If \`type\` is "text", render the text content using its \`fontFamily\`, \`fontWeight\`, \`color\`, and \`textAlign\` properties. The text should scale to fit the layer's size.
            -   If \`type\` is "shape", render the shape (e.g., 'rectangle', 'circle') and fill it with its \`fill\` color.
        4.  **Photorealistic Integration (Displacement Mapping Simulation):**
            -   **Warp & Distort:** This is the most important step. Realistically warp and distort each applied layer to follow the underlying fabric's contours, folds, wrinkles, and seams.
            -   **Apply Lighting & Shadows:** The lighting and shadows from the Base Garment must realistically affect all applied layers.
            -   **Mimic Texture:** Subtly blend the fabric's texture into the layers so they look printed on or woven into the material, not just pasted on top.

        **Final Output:**
        Return ONLY the final, single, photorealistic image of the garment with all layers from the recipe perfectly rendered and integrated. Do not add any text, labels, or watermarks.
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
            const finishMessage = candidate?.finishMessage || "No specific reason provided.";
            console.error("Gemini API returned no image for design mockup:", JSON.stringify(response, null, 2));
            if (finishReason === 'SAFETY') {
                throw new Error("Rendering was blocked due to safety policies. Please adjust your design.");
            }
            throw new Error(`The AI failed to render the design: ${finishMessage}`);
        }
    } catch (error: any) {
        console.error("Error rendering design mockup:", error);
        if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
            throw new Error("Request limit reached. Please wait a moment and try again.");
        }
        if (error?.message) throw error;
        throw new Error("Failed to render the design. The AI may be experiencing issues.");
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
        You are an expert AI apparel designer. You are given two images:
        1. A garment from a specific view (${sourceViewName}) that has a design applied to it.
        2. A clean, blank version of the SAME garment from a different view (${targetViewName}).

        Your task is to intelligently propagate the design from the first image onto the second one.

        **Instructions:**
        1. **Analyze the Design:** Identify all the graphic elements, text, and their placements on the designed ${sourceViewName} view.
        2. **Logical Placement:** Determine where those design elements would logically appear on the ${targetViewName} view. For example, a graphic on the front of a shirt might not be visible from the back, but a sleeve graphic might wrap around and be partially visible.
        3. **Apply and Render:** Apply the design to the clean ${targetViewName} view, ensuring it's realistically rendered, following the fabric's folds, lighting, and perspective for that new angle.

        **Output:**
        Return ONLY the image of the ${targetViewName} view with the design correctly propagated.
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
            console.error(`Gemini API returned no image for propagating to ${targetViewName} view:`, JSON.stringify(response, null, 2));
            throw new Error(`The AI failed to propagate the design to the ${targetViewName} view.`);
        }
    } catch (error) {
        console.error(`Error propagating design to ${targetViewName} view:`, error);
        throw new Error(`Failed to propagate the design to the ${targetViewName} view. Please try again.`);
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
    You are an expert AI photo editor specializing in apparel. Your task is to apply a specific modification to the provided garment image. You must ONLY change what is requested and keep the rest of the image (style, lighting, background, base garment) identical.

    **Modification Details:**
    - **Type of Change:** ${modification.type}
    - **Request:** "${modification.content}"
  `;

  if (modification.type !== 'Structural') {
    prompt += `
    - **Location on Garment:** ${modification.location}
    - **Style of Modification:** ${modification.style}
    `;
  } else {
     prompt += `
    - **Style of Modification:** The modification should seamlessly blend with the existing garment's style (${modification.style}).
    `;
  }
  
  prompt += `
    **CRITICAL RULES:**
    1.  **Targeted Edit:** Only apply the requested change. Do not alter the garment's color, texture, fit, or the background unless explicitly told to.
    2.  **Realism:** The modification must look photorealistic and naturally integrated with the garment's fabric, following its folds and lighting.
    3.  **Output:** Return only the fully modified image. Do not add text or watermarks.
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
      console.error("Gemini API returned no image for garment modification:", JSON.stringify(response, null, 2));
      throw new Error("The AI failed to modify the garment.");
    }
  } catch (error: any) {
    console.error("Error modifying garment image:", error);
    if (error.toString().includes('RESOURCE_EXHAUSTED') || (error.message && error.message.includes('429'))) {
        throw new Error("Request limit reached. Please wait a moment and try again.");
    }
    throw new Error("Failed to modify the garment. The AI may be experiencing issues.");
  }
}


export async function applyGraphicFilter(
  imageUrl: string,
  filterType: 'vintage' | 'glitch' | 'distress'
): Promise<string> {
  let prompt = '';
  switch (filterType) {
    case 'vintage':
      prompt = `You are an expert of vintage t-shirt printing. Take this graphic. Rerender it EXACTLY as it would appear on a 90s band t-shirt that has been washed 100 times. Apply faded colors, a subtle 'cracking' of the ink, and minimal blurring to simulate wear. The background MUST remain transparent.`;
      break;
    case 'glitch':
      prompt = `You are a cyberpunk digital artist. Rerender the provided graphic with a 'glitch' or 'cyber' effect. Apply digital artifacts, chromatic aberration, and scan lines. The core design should remain recognizable. The background MUST be transparent.`;
      break;
    case 'distress':
      prompt = `You are a master of apparel distressing. Rerender the provided graphic as if it were printed on a shirt that has been physically distressed. Add realistic-looking rips, tears, and areas of heavy wear that affect the print. The background MUST remain transparent.`;
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
      throw new Error(`The AI failed to apply the ${filterType} filter.`);
    }
  } catch (error) {
    console.error(`Error applying ${filterType} filter:`, error);
    throw new Error(`Failed to apply the ${filterType} filter. Please try again.`);
  }
}

export async function generateGarmentConcept(baseGarment: string, styleA: string, styleB: string): Promise<string> {
  const prompt = `
    Describe a hybrid apparel item. Take the base garment ('${baseGarment}') and fuse the aesthetics of '${styleA}' and '${styleB}'. 
    Focus on structural details, materials, and unique features. 
    Return ONLY the text description of the resulting garment. Be concise and evocative.

    Example: "A minimalist pullover hoodie in matte black neoprene, featuring an asymmetric cut on the chest that reveals a cyan LED panel."
  `;

  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text.trim();
  } catch (error) {
      console.error("Error generating garment concept:", error);
      throw new Error("The AI failed to generate a concept. Please try again.");
  }
}
