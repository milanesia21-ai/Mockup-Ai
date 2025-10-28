
import { MockupConfig as TMockupConfig } from './components/ControlPanel';
export type MockupConfig = TMockupConfig;

export interface GarmentCategory {
  name: string;
  items: string[];
}

export const GARMENT_CATEGORIES: GarmentCategory[] = [
  {
    name: 'TOPS - CASUAL',
    items: ['T-shirt basic (crew neck)', 'T-shirt V-neck', 'T-shirt long sleeve', 'Henley shirt (button placket)', 'Tank top / A-shirt', 'Muscle shirt (athletic fit)']
  },
  {
    name: 'TOPS - COLLARED',
    items: ['Polo shirt (with collar and buttons)', 'Button-up shirt (dress shirt)', 'Flannel shirt (casual plaid-ready)', 'Denim shirt', 'Oxford shirt', 'Work shirt']
  },
  {
    name: 'TOPS - SWEATSHIRTS & HOODIES',
    items: ['Crewneck sweatshirt', 'Hoodie pullover (with kangaroo pocket)', 'Zip-up hoodie (full zipper)', 'Quarter-zip pullover', 'Hoodie cropped style', 'Oversized sweatshirt']
  },
  {
    name: 'OUTERWEAR - JACKETS',
    items: ['Bomber jacket', 'Denim jacket', 'Leather jacket (moto style)', 'Windbreaker', 'Track jacket', 'Varsity jacket', 'Harrington jacket', 'Coach jacket', 'Trucker jacket']
  },
  {
    name: 'OUTERWEAR - COATS & BLAZERS',
    items: ['Parka / winter coat', 'Puffer jacket', 'Blazer (sport coat)', 'Suit jacket (formal)', 'Trench coat', 'Peacoat', 'Field jacket', 'Anorak']
  },
  {
    name: 'OUTERWEAR - VESTS',
    items: ['Vest / Gilet (sleeveless)', 'Puffer vest', 'Cardigan (button-up sweater)']
  },
  {
    name: 'BOTTOMS - JEANS',
    items: ['Jeans straight fit', 'Jeans slim fit', 'Jeans skinny fit', 'Jeans relaxed/loose fit', 'Jeans bootcut', 'Distressed/ripped jeans']
  },
  {
    name: 'BOTTOMS - PANTS',
    items: ['Chino pants (casual)', 'Cargo pants (with side pockets)', 'Joggers / sweatpants', 'Track pants (athletic)', 'Dress pants / trousers (formal)', 'Corduroy pants', 'Work pants / Dickies style']
  },
  {
    name: 'BOTTOMS - SHORTS',
    items: ['Casual shorts (chino shorts)', 'Athletic shorts (gym shorts)', 'Basketball shorts', 'Swim trunks / board shorts', 'Cargo shorts', 'Running shorts', 'Denim shorts']
  },
  {
    name: 'ATHLETIC & SPORTSWEAR',
    items: ['Athletic jersey (basketball/football)', 'Performance t-shirt (moisture-wicking)', 'Compression shirt long sleeve', 'Sports tank top / running singlet', 'Cycling jersey', 'Training shorts', 'Tracksuit (jacket + pants set)', 'Athletic tights / leggings']
  },
  {
    name: 'HEADWEAR',
    items: ['Baseball cap curved brim (6-panel)', 'Snapback cap flat brim', 'Dad hat (unstructured)', 'Trucker hat (mesh back)', 'Beanie / knit cap', 'Bucket hat']
  },
  {
    name: 'FOOTWEAR',
    items: ['Sneakers low-top (athletic shoes)', 'High-top sneakers', 'Running shoes', 'Basketball shoes', 'Loafers (slip-on dress shoes)', 'Dress shoes / oxfords', 'Boots casual (work boots, chukka)', 'Chelsea boots', 'Combat boots', 'Slides / sandals']
  }
];

export const STYLE_OPTIONS = ['Photorealistic Mockup', 'Technical Sketch Style'] as const;
export type StyleOption = typeof STYLE_OPTIONS[number];

export const VIEWS = ['Front', 'Back', 'Side', 'Close-Up'];

export interface DesignStyleCategory {
  name: string;
  items: string[];
}

export const DESIGN_STYLE_CATEGORIES: DesignStyleCategory[] = [
  {
    name: 'Modern Aesthetics',
    items: [
      '[Minimalist/Normcore]',
      '[Athleisure/Cozywear]',
      '[Cyberpunk/Techwear]',
      '[Gorpcore/Outdoor]',
      '[Streetwear]',
      '[Skater]',
    ],
  },
  {
    name: 'Vintage & Retro',
    items: [
      '[Y2K/Early 2000s]',
      '[90s Grunge]',
      '[80s Synthwave/Vaporwave]',
      '[70s Psychedelic/Boho]',
      '[50s Rockabilly]',
      '[Workwear/Utilitarian]',
    ],
  },
  {
    name: 'Artistic & Luxury',
    items: [
      '[Haute Couture/Luxury]',
      '[Abstract Art/Expressionist]',
      '[Tattoo Style]',
      '[Gothic/Darkwear]',
      '[Avant-Garde]',
    ],
  },
  {
    name: 'Cultural & Geographic',
    items: [
      '[Japanese Streetwear (Harajuku)]',
      '[Scandinavian Minimalist]',
      '[Western/Americana]',
      '[Tropical/Vacation]',
      '[Nautical/Maritime]',
    ],
  },
  {
    name: 'Niche & Subculture',
    items: [
      '[Preppy/Ivy League]',
      '[Punk Rock]',
      '[Hip-Hop/Urban]',
      '[Cottagecore/Pastoral]',
      '[Biker/Moto]',
    ],
  },
];


export const GARMENT_COLORS = [
  "White (#FFFFFF)",
  "Black (#000000)",
  "Heather Grey (#B2B2B2)",
  "Charcoal (#36454F)",
  "Navy Blue (#000080)",
  "Royal Blue (#4169E1)",
  "Red (#FF0000)",
  "Maroon (#800000)",
  "Forest Green (#228B22)",
  "Olive Green (#808000)",
  "Yellow (#FFFF00)",
  "Orange (#FFA500)",
  "Beige (#F5F5DC)",
  "Khaki (#C3B091)",
  "Brown (#A52A2A)",
];

export const MATERIALS_BY_GARMENT_TYPE: { [key: string]: string[] } = {
  'TOPS - CASUAL': ['Cotton Jersey', 'Polyester Blend', 'Tri-Blend (Cotton/Poly/Rayon)', 'Linen', 'Pima Cotton', 'Modal'],
  'TOPS - COLLARED': ['Oxford Cloth', 'Poplin', 'Chambray', 'Flannel', 'Denim', 'Linen', 'Twill'],
  'TOPS - SWEATSHIRTS & HOODIES': ['Fleece', 'French Terry', 'Sherpa', 'Cotton/Poly Blend', 'Scuba Knit'],
  'OUTERWEAR - JACKETS': ['Denim', 'Leather', 'Nylon (for Windbreakers)', 'Satin (for Bombers)', 'Twill', 'Canvas', 'Wool'],
  'OUTERWEAR - COATS & BLAZERS': ['Wool', 'Cashmere Blend', 'Tweed', 'Gabardine (for Trench coats)', 'Down-filled Nylon (for Puffers)'],
  'OUTERWEAR - VESTS': ['Quilted Nylon', 'Fleece', 'Wool', 'Knit Cotton'],
  'BOTTOMS - JEANS': ['Raw Denim', 'Stretch Denim', 'Selvedge Denim', 'Washed Denim'],
  'BOTTOMS - PANTS': ['Cotton Twill (for Chinos)', 'Corduroy', 'Wool', 'Ripstop Cotton (for Cargo)', 'Fleece (for Joggers)'],
  'BOTTOMS - SHORTS': ['Cotton Twill', 'Nylon', 'Polyester Mesh', 'Denim', 'Seersucker'],
  'ATHLETIC & SPORTSWEAR': ['Moisture-Wicking Polyester', 'Spandex/Elastane Blend', 'Nylon', 'Mesh', 'Performance Cotton'],
  'HEADWEAR': ['Cotton Twill', 'Canvas', 'Wool', 'Acrylic Knit (for Beanies)', 'Polyester Mesh'],
  'FOOTWEAR': ['Leather', 'Suede', 'Canvas', 'Knit Mesh', 'Rubber', 'Synthetic Leather'],
};

// New constants for Text Tool
export const FONT_OPTIONS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 
    'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 
    'Lucida Console', 'Tahoma', 'Trebuchet MS', 'Arial Black'
];

export const GARMENT_PART_PLACEMENTS: Record<string, string[]> = {
  'T-shirt': ['Center Chest', 'Left Chest', 'Right Chest', 'Full Front', 'Upper Back', 'Left Sleeve', 'Right Sleeve'],
  'Shirt': ['Center Chest', 'Left Chest Pocket', 'Right Chest Pocket', 'Full Front', 'Upper Back', 'Left Sleeve', 'Right Sleeve'],
  'Hoodie': ['Center Chest', 'Left Chest', 'Full Front', 'Kangaroo Pocket', 'Upper Back', 'On the Hood', 'Left Sleeve', 'Right Sleeve'],
  'Sweatshirt': ['Center Chest', 'Left Chest', 'Full Front', 'Upper Back', 'Left Sleeve', 'Right Sleeve'],
  'Jacket': ['Left Chest', 'Right Chest', 'Full Back', 'Left Sleeve', 'Right Sleeve'],
  'Pants': ['Front Thigh Left', 'Front Thigh Right', 'Back Pocket Left', 'Back Pocket Right', 'Side Leg Left', 'Side Leg Right'],
  'Jeans': ['Front Thigh Left', 'Front Thigh Right', 'Back Pocket Left', 'Back Pocket Right', 'Side Leg Left', 'Side Leg Right'],
  'Shorts': ['Front Thigh Left', 'Front Thigh Right', 'Back Pocket Left', 'Back Pocket Right', 'Side Leg Left', 'Side Leg Right'],
  'Cap': ['Front Panel', 'Side Panel Left', 'Side Panel Right', 'Back Panel'],
  'Hat': ['Front Panel', 'Side Panel Left', 'Side Panel Right', 'Back Panel'],
};

export const PLACEMENT_COORDINATES: Record<string, { x: number; y: number }> = {
  'Center Chest': { x: 0.5, y: 0.4 },
  'Left Chest': { x: 0.35, y: 0.35 },
  'Right Chest': { x: 0.65, y: 0.35 },
  'Left Chest Pocket': { x: 0.35, y: 0.38 },
  'Right Chest Pocket': { x: 0.65, y: 0.38 },
  'Full Front': { x: 0.5, y: 0.5 },
  'Upper Back': { x: 0.5, y: 0.3 },
  'Full Back': { x: 0.5, y: 0.5 },
  'Left Sleeve': { x: 0.15, y: 0.45 },
  'Right Sleeve': { x: 0.85, y: 0.45 },
  'Kangaroo Pocket': { x: 0.5, y: 0.65 },
  'On the Hood': { x: 0.5, y: 0.15 },
  'Front Thigh Left': { x: 0.35, y: 0.5 },
  'Front Thigh Right': { x: 0.65, y: 0.5 },
  'Back Pocket Left': { x: 0.35, y: 0.6 },
  'Back Pocket Right': { x: 0.65, y: 0.6 },
  'Side Leg Left': { x: 0.2, y: 0.6 },
  'Side Leg Right': { x: 0.8, y: 0.6 },
  'Front Panel': { x: 0.5, y: 0.5 },
  'Side Panel Left': { x: 0.25, y: 0.5 },
  'Side Panel Right': { x: 0.75, y: 0.5 },
  'Back Panel': { x: 0.5, y: 0.5 },
};


// --- NEW DYNAMIC PROMPTS ---

export const EASY_PROMPT_PARSER = `
You are an expert fashion assistant AI. Analyze the user's request and extract the key details for a mockup generation.
User Request: "{{prompt}}"

Based on the request, find the closest matching options from the lists below and return them in a valid JSON object.
- Garment list: ${GARMENT_CATEGORIES.map(c => c.items).flat().join(', ')}
- Design Style list: ${DESIGN_STYLE_CATEGORIES.map(c => c.items).flat().join(', ')}
- Color: Infer the color and provide its HEX code.
- Material list: ${Object.values(MATERIALS_BY_GARMENT_TYPE).flat().join(', ')}
- Style list: 'Photorealistic Mockup', 'Technical Sketch Style'

The JSON object must have keys: "selectedGarment", "selectedDesignStyle", "selectedColor", "selectedMaterial", "selectedStyle".
If a detail is not mentioned, you can omit the key or leave its value empty.
`;

export const PHOTOREALISTIC_APPAREL_PROMPT = `
Create a high-end, e-commerce style photorealistic mockup of a single garment.
The garment is a {{garment}} in the color {{color}}, made of {{material}}. The visual texture, wrinkles, and drape must accurately represent this material.
The design aesthetic is {{designStyle}}.
The image must show the {{view}} of the garment, presented in a "ghost mannequin" or "flat lay" style.
The background must be a neutral light gray studio background (#E0E0E0) with a subtle floor shadow.
The final image must be purely visual. It must NOT contain any text, labels, hangers, props, or human figures.
`;

export const PHOTOREALISTIC_APPAREL_PROMPT_WITH_SEARCH = `
You are a world-class AI fashion photographer. Your goal is to create an ultra-realistic product photo of a garment, using Google Search to find real-world visual references for maximum accuracy.

**Action:**
1.  **Search Google:** Use Google Search to find high-quality reference images for the following query: "photorealistic {{color}} {{material}} {{garment}} {{designStyle}}".
2.  **Analyze References:** Analyze the search results for key visual details, paying close attention to material texture, fabric weight, how the garment drapes and folds, common seam placements, and typical lighting for this style.
3.  **Generate Image:** Based on your analysis, create a single, high-end, e-commerce style photorealistic mockup.

**Image Requirements:**
- **Garment:** A {{garment}}
- **Color:** {{color}}
- **Material:** {{material}} (The visual texture, wrinkles, and drape must accurately represent this material based on your search)
- **Design Style:** {{designStyle}}
- **View:** Show the {{view}} of the garment.
- **Presentation:** Use a "ghost mannequin" or "flat lay" style.
- **Background:** A neutral light gray studio background (#E0E0E0) with a subtle floor shadow.
- **CRITICAL:** The final image must be purely visual. It must NOT contain any text, labels, hangers, props, or human figures.
`;


export const PHOTOREALISTIC_SCENE_PROMPT = `
Create a high-end, photorealistic fashion photograph for an e-commerce campaign.
The scene is: {{scene}}. The model is described as: {{model}}. The lighting should be professional and match the scene description.
The model is wearing a {{garment}} in the color {{color}}, made of {{material}}. The design aesthetic is {{designStyle}}.
The final image must showcase the {{view}} of the garment on the model, with the focus on the apparel.
The image must be high-resolution and photorealistic. Do not add any text, logos, or watermarks.
`;

export const TECHNICAL_SKETCH_PROMPT = `
Generate a clean, 2D technical flat sketch of a single apparel item for a fashion tech pack.

- Garment: A {{garment}}
- Design Style: {{designStyle}}
- View: Show the {{view}} view.

**CRITICAL RULES:**
1.  The output MUST be a clean, 2D vector-style line drawing with black outlines.
2.  The background MUST be a pure, solid white (#FFFFFF).
3.  **ABSOLUTELY NO TEXT.** Do not add any text, labels, annotations, measurements, or callouts. The image must be purely visual.
4.  Do not include shadows, textures, wrinkles, colors, or any photographic elements. It must be a simple line drawing.
`;

export const ADDITIONAL_VIEW_PHOTO_PROMPT = `
You are an expert AI fashion visualizer. The user has provided an image of a garment and wants to see another view of it.
Your task is to generate a photorealistic {{view}} view of the EXACT SAME garment shown in the provided image.

**CRITICAL RULES:**
1.  **Consistency is Key:** The generated image MUST be of the same garment. Match the color, material, texture, design style, and any unique features or graphics from the reference image perfectly.
2.  **Maintain Style:** The new view should match the presentation style of the reference image (e.g., if it's a "ghost mannequin", the new view should also be a "ghost mannequin").
3.  **Output:** The output must ONLY be the image of the garment from the new perspective. Do not add text or watermarks.
`;

export const ADDITIONAL_VIEW_SKETCH_PROMPT = `
You are an expert AI fashion technical illustrator. The user has provided a technical flat sketch of a garment and wants another view.
Your task is to generate a technical flat sketch of the {{view}} view of the EXACT SAME garment shown in the provided sketch.

**CRITICAL RULES:**
1.  **Consistency is Key:** The new sketch must perfectly match the design, proportions, and style details (like seams, stitching, etc.) of the reference sketch.
2.  **Maintain Format:** The output MUST be a clean, 2D vector-style line drawing with black outlines on a pure white background.
3.  **NO TEXT:** Do not add any text, labels, or annotations.
`;


// --- DEPRECATED ---
// Old prompts are kept for reference but are no longer used by the new system.
export const AI_APPAREL_PROMPT = `DEPRECATED`;
export const AI_SCENE_PROMPT = `DEPRECATED`;
export const FOOTWEAR_SKETCH_PROMPT = `DEPRECATED`;
