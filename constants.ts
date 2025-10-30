

// FIX: Moved DesignLayer interface here for global access.
export interface DesignLayer {
    id: string;
    type: 'image' | 'text' | 'shape' | 'drawing';
    content: string; // URL for image, text content for text, shape type for shape, dataURL for drawing
    position: { x: number; y: number }; // Center, percentage based
    size: { width: number, height: number }; // Percentage of container
    rotation: number;
    opacity: number;
    visible: boolean;
    // New properties for advanced layers
    blendMode: GlobalCompositeOperation | (string & {});
    lockTransparency: boolean;
    // Text specific
    fontFamily?: string;
    fontSize?: number; // Relative size
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    textDecoration?: 'none' | 'underline' | 'line-through';
    color?: string;
    // Shape specific
    fill?: string;
}


export const AI_IMAGE_MODELS = [
  { name: 'Gemini 2.5 Flash Image', value: 'gemini-2.5-flash-image' },
  { name: 'Imagen 4.0 (High Quality)', value: 'imagen-4.0-generate-001' },
];

export interface MockupConfig {
  easyPrompt: string;
  selectedCategory: string;
  selectedGarment: string;
  selectedDesignStyle: string;
  selectedColor: string;
  aiMaterialPrompt: string;
  fit: string;
  customMaterialTexture?: string;
  selectedStyle: StyleOption;
  selectedViews: string[];
  aiApparelPrompt: string;
  useAiApparel: boolean;
  aiModelPrompt: string;
  aiScenePrompt: string;
  useAiModelScene: boolean;
  useGoogleSearch: boolean;
  selectedModel: string;
}

export interface GeneratedImage {
    view: string;
    url: string;
}

export interface GarmentCategory {
  name: string;
  items: string[];
}

// Added from EditorPanel.tsx for global access
export interface ModificationRequest {
  type: 'Structural' | 'Text' | 'Graphic';
  content: string;
  location: string;
  style: string;
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

export const GARMENT_MATERIALS: Record<string, string[]> = {
    // TOPS - CASUAL
    'T-shirt basic (crew neck)': ['Pima Cotton', 'Supima Cotton', 'Jersey Knit', 'Linen Blend', 'Tri-blend (Cotton/Poly/Rayon)', 'Slub Cotton', 'Hemp Blend', 'Heavyweight Cotton'],
    'T-shirt V-neck': ['Pima Cotton', 'Supima Cotton', 'Jersey Knit', 'Linen Blend', 'Tri-blend (Cotton/Poly/Rayon)', 'Slub Cotton', 'Modal Blend'],
    'T-shirt long sleeve': ['Waffle Knit', 'Thermal', 'Heavyweight Cotton', 'Jersey Knit', 'Merino Wool Blend'],
    'Henley shirt (button placket)': ['Waffle Knit', 'Slub Cotton', 'Jersey', 'Linen Blend', 'Ribbed Knit'],
    'Tank top / A-shirt': ['Ribbed Cotton', 'Jersey Knit', 'Performance Fabric (Moisture-wicking)', 'Cotton/Elastane Blend'],
    'Muscle shirt (athletic fit)': ['Performance Fabric (Moisture-wicking)', 'Cotton/Elastane Blend', 'Jersey', 'Mesh'],
    
    // TOPS - COLLARED
    'Polo shirt (with collar and buttons)': ['Pique Knit Cotton', 'Jersey', 'Performance Polyester', 'Silk Blend', 'Linen'],
    'Button-up shirt (dress shirt)': ['Oxford Cloth', 'Poplin', 'Twill', 'Chambray', 'Broadcloth', 'Linen', 'Dobby Weave', 'Herringbone'],
    'Flannel shirt (casual plaid-ready)': ['Brushed Cotton Flannel', 'Wool Blend Flannel', 'Corduroy'],
    'Denim shirt': ['Lightweight Denim', 'Chambray', 'Tencel Denim', 'Raw Denim'],
    'Oxford shirt': ['Oxford Cloth', 'Pinpoint Oxford', 'Royal Oxford'],
    'Work shirt': ['Heavyweight Canvas', 'Twill', 'Denim', 'Chambray', 'Ripstop'],

    // TOPS - SWEATSHIRTS & HOODIES
    'Crewneck sweatshirt': ['Fleece', 'French Terry', 'Loopback Cotton', 'Scuba Knit (Neoprene)', 'Velour'],
    'Hoodie pullover (with kangaroo pocket)': ['Fleece', 'French Terry', 'Loopback Cotton', 'Tech Fleece', 'Sherpa Lined', 'Waffle Knit'],
    'Zip-up hoodie (full zipper)': ['Fleece', 'French Terry', 'Loopback Cotton', 'Tech Fleece', 'Sherpa Lined'],
    'Quarter-zip pullover': ['Fleece', 'Performance Knit', 'Waffle Knit', 'Merino Wool', 'Cable Knit'],
    'Hoodie cropped style': ['Fleece', 'French Terry', 'Velour', 'Ribbed Knit'],
    'Oversized sweatshirt': ['Heavyweight Fleece', 'Loopback Cotton', 'Scuba Knit (Neoprene)'],

    // OUTERWEAR - JACKETS
    'Bomber jacket': ['Nylon', 'Satin', 'Leather', 'Suede', 'Wool', 'Cotton Twill'],
    'Denim jacket': ['Raw Denim', 'Stonewashed Denim', 'Acid Wash Denim', 'Sherpa Lined Denim', 'Stretch Denim'],
    'Leather jacket (moto style)': ['Cowhide Leather', 'Lambskin Leather', 'Faux Leather', 'Suede'],
    'Windbreaker': ['Nylon', 'Polyester', 'Ripstop Fabric', 'Gore-Tex Active'],
    'Track jacket': ['Tricot (Polyester)', 'Nylon', 'Velour', 'Double-Knit'],
    'Varsity jacket': ['Wool Body with Leather Sleeves', 'Satin', 'Fleece', 'Melton Wool'],
    'Harrington jacket': ['Cotton Twill', 'Polyester Blend', 'Corduroy', 'Waxed Cotton'],
    'Coach jacket': ['Nylon Taffeta', 'Polyester', 'Satin'],
    'Trucker jacket': ['Denim', 'Corduroy', 'Canvas', 'Suede', 'Waxed Canvas'],

    // OUTERWEAR - COATS & BLAZERS
    'Parka / winter coat': ['Down-filled Nylon', 'Gore-Tex', 'Waxed Cotton', 'Wool Blend'],
    'Puffer jacket': ['Down-filled Nylon', 'Synthetic Insulation (PrimaLoft)', 'Ripstop Polyester'],
    'Blazer (sport coat)': ['Wool', 'Tweed', 'Linen', 'Seersucker', 'Corduroy', 'Velvet'],
    'Suit jacket (formal)': ['Worsted Wool', 'Flannel', 'Tweed', 'Linen', 'Velvet'],
    'Trench coat': ['Gabardine', 'Cotton Twill', 'Leather', 'Waterproof Polyester'],
    'Peacoat': ['Melton Wool', 'Cashmere Blend'],
    'Field jacket': ['Cotton Canvas', 'Ripstop', 'Waxed Cotton'],
    'Anorak': ['Nylon', 'Ripstop', 'Gore-Tex', 'Ventile Cotton'],

    // OUTERWEAR - VESTS
    'Vest / Gilet (sleeveless)': ['Canvas', 'Twill', 'Fleece', 'Denim', 'Ripstop'],
    'Puffer vest': ['Down-filled Nylon', 'Synthetic Insulation (PrimaLoft)', 'Ripstop Polyester'],
    'Cardigan (button-up sweater)': ['Merino Wool', 'Cashmere', 'Lambswool', 'Cotton Knit', 'Cable Knit'],
    
    // BOTTOMS - JEANS
    'Jeans straight fit': ['Raw Denim', 'Selvedge Denim', 'Stretch Denim', 'Stonewashed Denim'],
    'Jeans slim fit': ['Stretch Denim', 'Lightweight Denim', 'Black Denim'],
    'Jeans skinny fit': ['High-Stretch Denim', 'Power Stretch Denim'],
    'Jeans relaxed/loose fit': ['Heavyweight Denim', 'Washed Denim', 'Japanese Denim'],
    'Jeans bootcut': ['Stretch Denim', 'Classic Indigo Denim'],
    'Distressed/ripped jeans': ['Any Denim with Distressing'],

    // BOTTOMS - PANTS
    'Chino pants (casual)': ['Cotton Twill', 'Stretch Twill', 'Brushed Cotton'],
    'Cargo pants (with side pockets)': ['Cotton Ripstop', 'Canvas', 'Twill', 'Nylon Blend'],
    'Joggers / sweatpants': ['Fleece', 'French Terry', 'Tech Fleece', 'Tricot'],
    'Track pants (athletic)': ['Nylon', 'Polyester Tricot', 'Double-Knit'],
    'Dress pants / trousers (formal)': ['Worsted Wool', 'Flannel', 'Linen', 'Cotton Sateen'],
    'Corduroy pants': ['8-Wale Corduroy', '14-Wale Corduroy', 'Stretch Corduroy'],
    'Work pants / Dickies style': ['Heavy-duty Twill', 'Duck Canvas'],
    
    // BOTTOMS - SHORTS
    'Casual shorts (chino shorts)': ['Cotton Twill', 'Linen Blend', 'Seersucker'],
    'Athletic shorts (gym shorts)': ['Mesh', 'Performance Polyester', 'Nylon'],
    'Basketball shorts': ['Mesh', 'Dazzle Fabric'],
    'Swim trunks / board shorts': ['Quick-dry Nylon', 'Polyester Microfiber'],
    'Cargo shorts': ['Cotton Ripstop', 'Canvas', 'Twill'],
    'Running shorts': ['Lightweight Nylon', 'Polyester with Spandex'],
    'Denim shorts': ['Stonewashed Denim', 'Stretch Denim', 'Raw Denim'],

    // ATHLETIC & SPORTSWEAR
    'Athletic jersey (basketball/football)': ['Mesh', 'Performance Polyester', 'Dazzle Fabric'],
    'Performance t-shirt (moisture-wicking)': ['Polyester/Spandex Blend', 'Merino Wool', 'Technical Fabric'],
    'Compression shirt long sleeve': ['Nylon/Spandex Blend', 'Polyester/Elastane'],
    'Sports tank top / running singlet': ['Lightweight Mesh', 'Performance Knit'],
    'Cycling jersey': ['Lycra', 'Polyester Knit'],
    'Training shorts': ['Performance Woven', 'Polyester Knit'],
    'Tracksuit (jacket + pants set)': ['Tricot', 'Nylon'],
    'Athletic tights / leggings': ['Nylon/Spandex Blend', 'Polyester/Elastane'],
 
    // HEADWEAR
    'Baseball cap curved brim (6-panel)': ['Cotton Twill', 'Wool', 'Canvas'],
    'Snapback cap flat brim': ['Wool Blend', 'Polyester', 'Cotton Twill'],
    'Dad hat (unstructured)': ['Washed Cotton Twill', 'Canvas'],
    'Trucker hat (mesh back)': ['Cotton Twill Front, Nylon Mesh Back'],
    'Beanie / knit cap': ['Merino Wool', 'Acrylic Knit', 'Cashmere', 'Ribbed Knit'],
    'Bucket hat': ['Cotton Canvas', 'Nylon', 'Denim'],

    // FOOTWEAR
    'Sneakers low-top (athletic shoes)': ['Leather', 'Canvas', 'Suede', 'Knit Fabric', 'Mesh'],
    'High-top sneakers': ['Leather', 'Canvas', 'Suede', 'Patent Leather'],
    'Running shoes': ['Engineered Mesh', 'Knit Upper', 'Synthetic Overlays'],
    'Basketball shoes': ['Leather with Synthetic Mesh', 'Knit Upper (e.g. Flyknit)'],
    'Loafers (slip-on dress shoes)': ['Full-grain Leather', 'Suede', 'Patent Leather'],
    'Dress shoes / oxfords': ['Calfskin Leather', 'Patent Leather', 'Suede'],
    'Boots casual (work boots, chukka)': ['Full-grain Leather', 'Suede', 'Nubuck'],
    'Chelsea boots': ['Suede', 'Leather'],
    'Combat boots': ['Full-grain Leather', 'Canvas'],
    'Slides / sandals': ['EVA Foam', 'Rubber', 'Leather'],
};


export const STYLE_OPTIONS = ['Photorealistic Mockup', 'Technical Sketch Style'] as const;
export type StyleOption = typeof STYLE_OPTIONS[number];

export const VIEWS = ['Front', 'Back', 'Side', 'Close-Up'];

export const FIT_OPTIONS = ["Regular", "Oversized / Baggy", "Cropped", "Slim Fit"];

export const TREND_PRESETS = ["Y2K Juicy", "90s Grunge Tee", "Gorpcore Tech", "Minimalist Streetwear", "Darkwear Utility"];

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

export const BLEND_MODES: { name: string, value: GlobalCompositeOperation }[] = [
    { name: 'Normal', value: 'source-over' },
    { name: 'Multiply', value: 'multiply' },
    { name: 'Screen', value: 'screen' },
    { name: 'Overlay', value: 'overlay' },
    { name: 'Darken', value: 'darken' },
    { name: 'Lighten', value: 'lighten' },
    { name: 'Color Dodge', value: 'color-dodge' },
    { name: 'Color Burn', value: 'color-burn' },
    { name: 'Hard Light', value: 'hard-light' },
    { name: 'Soft Light', value: 'soft-light' },
    { name: 'Difference', value: 'difference' },
    { name: 'Exclusion', value: 'exclusion' },
    { name: 'Hue', value: 'hue' },
    { name: 'Saturation', value: 'saturation' },
    { name: 'Color', value: 'color' },
    { name: 'Luminosity', value: 'luminosity' },
];

export const GARMENT_3D_MODELS: Record<string, string> = {
  'T-shirt basic (crew neck)': 'https://storage.googleapis.com/maker-suite-3d-models/shirt_v2.glb',
  'Hoodie pullover (with kangaroo pocket)': 'https://storage.googleapis.com/maker-suite-3d-models/hoodie_v3.glb',
  'Zip-up hoodie (full zipper)': 'https://storage.googleapis.com/maker-suite-3d-models/hoodie_v3.glb',
  'Crewneck sweatshirt': 'https://storage.googleapis.com/maker-suite-3d-models/shirt_v2.glb',
  'Bomber jacket': 'https://storage.googleapis.com/maker-suite-3d-models/bomber_v2.glb',
  'Baseball cap curved brim (6-panel)': 'https://storage.googleapis.com/maker-suite-3d-models/cap_v2.glb',
};


// --- NEW DYNAMIC PROMPTS ---

export const EASY_PROMPT_PARSER = `DEPRECATED`;
export const PHOTOREALISTIC_APPAREL_PROMPT = `DEPRECATED`;
export const PHOTOREALISTIC_APPAREL_PROMPT_WITH_SEARCH = `DEPRECATED`;
export const PHOTOREALISTIC_SCENE_PROMPT = `DEPRECATED`;
export const TECHNICAL_SKETCH_PROMPT = `DEPRECATED`;
export const TECHNICAL_SKETCH_PROMPT_WITH_SEARCH = `DEPRECATED`;
export const ADDITIONAL_VIEW_PHOTO_PROMPT = `DEPRECATED`;
export const ADDITIONAL_VIEW_SKETCH_PROMPT = `DEPRECATED`;
export const AI_APPAREL_PROMPT = `DEPRECATED`;
export const AI_SCENE_PROMPT = `DEPRECATED`;
export const FOOTWEAR_SKETCH_PROMPT = `DEPRECATED`;