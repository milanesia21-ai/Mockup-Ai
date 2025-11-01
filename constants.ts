// La DesignLayer è stata spostata qui per un accesso globale.
export interface DesignLayer {
    id: string;
    type: 'image' | 'text' | 'shape' | 'drawing';
    content: string; // URL per l'immagine, contenuto testuale per il testo, tipo di forma per la forma, dataURL per il disegno
    position: { x: number; y: number }; // Centro, in percentuale
    size: { width: number, height: number }; // Percentuale del contenitore
    rotation: number;
    opacity: number;
    visible: boolean;
    // Nuove proprietà per i livelli avanzati
    blendMode: GlobalCompositeOperation | (string & {});
    lockTransparency: boolean;
    // Specifiche per il testo
    fontFamily?: string;
    fontSize?: number; // Dimensione relativa
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    textDecoration?: 'none' | 'underline' | 'line-through';
    color?: string;
    // Specifiche per la forma
    fill?: string;
}


export const AI_IMAGE_MODELS = [
  { name: 'Gemini 2.5 Flash Image', value: 'gemini-2.5-flash-image' },
  { name: 'Imagen 4 (Highest Quality)', value: 'imagen-4.0-generate-001' },
];

// FIX: Define and export STYLE_OPTIONS and StyleOption type
export const STYLE_OPTIONS = {
    PHOTOREALISTIC: 'style.photorealistic',
    FLAT_LAY: 'style.flat_lay',
    ON_HANGER: 'style.on_hanger',
    TECHNICAL_SKETCH: 'style.technical_sketch',
    GHOST_MANNEQUIN: 'style.ghost_mannequin',
} as const;

export type StyleOption = typeof STYLE_OPTIONS[keyof typeof STYLE_OPTIONS];

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
  name: string; // Translation key
  items: string[]; // Array of translation keys
}

export interface ModificationRequest {
  type: 'Structural' | 'Text' | 'Graphic';
  content: string;
  location: string;
  style: string;
}


export const GARMENT_CATEGORIES: GarmentCategory[] = [
  {
    name: "garmentCategory.tops_casual",
    items: ['garment.tshirt_basic_crew', 'garment.tshirt_vneck', 'garment.tshirt_long_sleeve', 'garment.henley_shirt', 'garment.tank_top', 'garment.muscle_shirt']
  },
  {
    name: "garmentCategory.tops_collared",
    items: ['garment.polo_shirt', 'garment.button_up_shirt', 'garment.flannel_shirt', 'garment.denim_shirt', 'garment.oxford_shirt', 'garment.work_shirt']
  },
  {
    name: "garmentCategory.tops_sweatshirts_hoodies",
    items: ['garment.crewneck_sweatshirt', 'garment.hoodie_pullover', 'garment.zip_up_hoodie', 'garment.quarter_zip_pullover', 'garment.hoodie_cropped', 'garment.oversized_sweatshirt']
  },
  {
    name: "garmentCategory.outerwear_jackets",
    items: ['garment.bomber_jacket', 'garment.denim_jacket', 'garment.leather_jacket', 'garment.windbreaker', 'garment.track_jacket', 'garment.varsity_jacket', 'garment.harrington_jacket', 'garment.coach_jacket', 'garment.trucker_jacket']
  },
  {
    name: "garmentCategory.outerwear_coats_blazers",
    items: ['garment.parka_winter_coat', 'garment.puffer_jacket', 'garment.blazer', 'garment.suit_jacket', 'garment.trench_coat', 'garment.peacoat', 'garment.field_jacket', 'garment.anorak']
  },
  {
    name: "garmentCategory.outerwear_vests",
    items: ['garment.vest_gilet', 'garment.puffer_vest', 'garment.cardigan']
  },
  {
    name: "garmentCategory.bottoms_jeans",
    items: ['garment.jeans_straight', 'garment.jeans_slim', 'garment.jeans_skinny', 'garment.jeans_relaxed', 'garment.jeans_bootcut', 'garment.jeans_distressed']
  },
  {
    name: "garmentCategory.bottoms_pants",
    items: ['garment.chino_pants', 'garment.cargo_pants', 'garment.joggers_sweatpants', 'garment.track_pants', 'garment.dress_pants', 'garment.corduroy_pants', 'garment.work_pants']
  },
  {
    name: "garmentCategory.bottoms_shorts",
    items: ['garment.casual_shorts', 'garment.athletic_shorts', 'garment.basketball_shorts', 'garment.swim_trunks', 'garment.cargo_shorts', 'garment.running_shorts', 'garment.denim_shorts']
  },
  {
    name: "garmentCategory.athletic_sportswear",
    items: ['garment.athletic_jersey', 'garment.performance_tshirt', 'garment.compression_shirt', 'garment.sports_tank_top', 'garment.cycling_jersey', 'garment.training_shorts', 'garment.tracksuit', 'garment.athletic_tights']
  },
  {
    name: "garmentCategory.headwear",
    items: ['garment.baseball_cap', 'garment.snapback_cap', 'garment.dad_hat', 'garment.trucker_hat', 'garment.beanie', 'garment.bucket_hat']
  },
  {
    name: "garmentCategory.footwear",
    items: ['garment.sneakers_low_top', 'garment.sneakers_high_top', 'garment.running_shoes', 'garment.basketball_shoes', 'garment.loafers', 'garment.dress_shoes', 'garment.boots_casual', 'garment.chelsea_boots', 'garment.combat_boots', 'garment.slides_sandals']
  }
];

// FIX: Define and export DESIGN_STYLE_CATEGORIES
export interface DesignStyleCategory {
    name: string; // Translation key
    items: string[]; // Array of translation keys
}

export const DESIGN_STYLE_CATEGORIES: DesignStyleCategory[] = [
  { name: 'designStyleCategory.contemporary', items: ['designStyle.streetwear', 'designStyle.minimalist_normcore', 'designStyle.athleisure'] },
  { name: 'designStyleCategory.vintage_retro', items: ['designStyle.90s_grunge', 'designStyle.y2k_early_2000s', 'designStyle.80s_retro', 'designStyle.vintage_americana'] },
  { name: 'designStyleCategory.niche_tech', items: ['designStyle.cyberpunk_techwear', 'designStyle.gorpcore_outdoor', 'designStyle.darkwear_avant_garde'] },
  { name: 'designStyleCategory.artistic', items: ['designStyle.abstract_art', 'designStyle.photographic', 'designStyle.typography_heavy'] },
];

// FIX: Define and export FIT_OPTIONS
export const FIT_OPTIONS = ['fit.slim', 'fit.regular', 'fit.oversized', 'fit.cropped', 'fit.relaxed'];

// FIX: Define and export VIEWS
export const VIEWS = ['Front', 'Back', 'Left Side', 'Right Side', 'Close-up'];

// FIX: Define and export TREND_PRESETS
export const TREND_PRESETS = [
  "trend.90s_grunge_tee",
  "trend.y2k_juicy",
  "trend.gorpcore_tech",
  "trend.minimalist_streetwear",
  "trend.darkwear_utility"
];

// FIX: Define and export FONT_OPTIONS
export const FONT_OPTIONS = [
  'Arial', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Gill Sans',
  'Times New Roman', 'Georgia', 'Palatino',
  'Courier New', 'Lucida Console', 'Monaco',
  'Impact', 'Arial Black', 'Comic Sans MS',
];

// FIX: Define and export GARMENT_PART_PLACEMENTS
export const GARMENT_PART_PLACEMENTS: Record<string, string[]> = {
    't-shirt': ['Center Chest', 'Left Chest', 'Upper Back', 'Full Front', 'Left Sleeve', 'Right Sleeve'],
    'hoodie': ['Center Chest', 'Left Chest', 'Full Back', 'Hood', 'Left Sleeve', 'Right Sleeve', 'Front Pouch'],
    'sweatshirt': ['Center Chest', 'Left Chest', 'Upper Back', 'Full Front', 'Left Sleeve', 'Right Sleeve'],
    'jacket': ['Left Chest', 'Right Chest', 'Full Back', 'Left Sleeve', 'Right Sleeve'],
    'cap': ['Front Panel', 'Side Panel', 'Back Panel'],
    'pants': ['Left Thigh', 'Right Thigh', 'Back Pocket'],
    'shorts': ['Left Leg', 'Right Leg', 'Back Pocket'],
};

// FIX: Define and export BLEND_MODES
export const BLEND_MODES: GlobalCompositeOperation[] = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

// FIX: Define and export GARMENT_3D_MODELS
export const GARMENT_3D_MODELS: Record<string, string> = {
  'garment.tshirt_basic_crew': '/models/tshirt.glb',
  'garment.hoodie_pullover': '/models/hoodie.glb',
  'garment.crewneck_sweatshirt': '/models/sweatshirt.glb',
  'garment.baseball_cap': '/models/cap.glb',
  'garment.jeans_straight': '/models/jeans.glb',
  'garment.sneakers_low_top': '/models/sneakers.glb',
};


export const GARMENT_MATERIALS: Record<string, string[]> = {
    // TOPS - CASUAL
    'garment.tshirt_basic_crew': ['material.heavyweight_cotton', 'material.pima_cotton', 'material.jersey_knit', 'material.linen_blend', 'material.tri_blend', 'material.slub_cotton'],
    'garment.tshirt_vneck': ['material.pima_cotton', 'material.jersey_knit', 'material.linen_blend', 'material.tri_blend', 'material.modal_blend'],
    'garment.tshirt_long_sleeve': ['material.waffle_knit', 'material.thermal', 'material.heavyweight_cotton', 'material.jersey_knit', 'material.merino_wool_blend'],
    'garment.henley_shirt': ['material.waffle_knit', 'material.slub_cotton', 'material.jersey', 'material.linen_blend'],
    'garment.tank_top': ['material.ribbed_cotton', 'material.jersey_knit', 'material.performance_fabric'],
    'garment.muscle_shirt': ['material.performance_fabric', 'material.cotton_elastane_blend', 'material.jersey', 'material.mesh'],

    // TOPS - COLLARED
    'garment.polo_shirt': ['material.pique_knit_cotton', 'material.jersey', 'material.performance_polyester', 'material.silk_blend', 'material.linen'],
    'garment.button_up_shirt': ['material.oxford_cloth', 'material.poplin', 'material.twill', 'material.chambray', 'material.linen'],
    'garment.flannel_shirt': ['material.brushed_cotton_flannel', 'material.wool_blend_flannel', 'material.corduroy'],
    'garment.denim_shirt': ['material.lightweight_denim', 'material.chambray', 'material.tencel_denim', 'material.raw_denim'],
    'garment.oxford_shirt': ['material.oxford_cloth', 'material.pinpoint_oxford', 'material.royal_oxford'],
    'garment.work_shirt': ['material.heavyweight_canvas', 'material.twill', 'material.denim', 'material.chambray', 'material.ripstop'],
    
    // TOPS - SWEATSHIRTS & HOODIES
    'garment.crewneck_sweatshirt': ['material.fleece', 'material.french_terry', 'material.loopback_cotton', 'material.scuba_knit', 'material.velour'],
    'garment.hoodie_pullover': ['material.fleece', 'material.french_terry', 'material.loopback_cotton', 'material.tech_fleece', 'material.sherpa_lined'],
    'garment.zip_up_hoodie': ['material.fleece', 'material.french_terry', 'material.loopback_cotton', 'material.tech_fleece', 'material.sherpa_lined'],
    'garment.quarter_zip_pullover': ['material.fleece', 'material.performance_knit', 'material.waffle_knit', 'material.merino_wool'],
    'garment.hoodie_cropped': ['material.fleece', 'material.french_terry', 'material.loopback_cotton'],
    'garment.oversized_sweatshirt': ['material.heavyweight_fleece', 'material.loopback_cotton', 'material.french_terry'],

    // OUTERWEAR - JACKETS
    'garment.bomber_jacket': ['material.nylon', 'material.satin', 'material.leather', 'material.suede', 'material.wool'],
    'garment.denim_jacket': ['material.cotton_twill', 'material.stonewashed_denim', 'material.acid_wash_denim', 'material.sherpa_lined_denim'],
    'garment.leather_jacket': ['material.cowhide_leather', 'material.lambskin_leather', 'material.faux_leather', 'material.suede'],
    'garment.windbreaker': ['material.polyester', 'material.nylon', 'material.ripstop_fabric', 'material.gore_tex_active'],
    'garment.track_jacket': ['material.tricot_polyester', 'material.double_knit', 'material.nylon'],
    'garment.varsity_jacket': ['material.wool_body_leather_sleeves', 'material.melton_wool', 'material.satin', 'material.fleece'],
    'garment.harrington_jacket': ['material.cotton_twill', 'material.polyester_blend', 'material.waxed_cotton'],
    'garment.coach_jacket': ['material.nylon_taffeta', 'material.polyester', 'material.satin'],
    'garment.trucker_jacket': ['material.denim', 'material.corduroy', 'material.canvas', 'material.sherpa_lined'],

    // OUTERWEAR - COATS & BLAZERS
    'garment.parka_winter_coat': ['material.waxed_canvas', 'material.down_filled_nylon', 'material.gore_tex', 'material.wool_blend'],
    'garment.puffer_jacket': ['material.nylon', 'material.polyester', 'material.synthetic_insulation', 'material.ripstop_polyester'],
    'garment.blazer': ['material.wool', 'material.tweed', 'material.linen', 'material.seersucker', 'material.velvet'],
    'garment.suit_jacket': ['material.worsted_wool', 'material.flannel', 'material.linen', 'material.tweed'],
    'garment.trench_coat': ['material.gabardine', 'material.cotton_twill', 'material.waterproof_polyester', 'material.leather'],
    'garment.peacoat': ['material.melton_wool', 'material.cashmere_blend', 'material.heavyweight_fleece'],
    'garment.field_jacket': ['material.cotton_twill', 'material.waxed_canvas', 'material.ripstop'],
    'garment.anorak': ['material.nylon', 'material.ventile_cotton', 'material.ripstop'],

    // OUTERWEAR - VESTS
    'garment.vest_gilet': ['material.fleece', 'material.nylon', 'material.wool', 'material.canvas'],
    'garment.puffer_vest': ['material.nylon', 'material.polyester', 'material.synthetic_insulation'],
    'garment.cardigan': ['material.merino_wool', 'material.cashmere', 'material.lambswool', 'material.cotton_knit', 'material.cable_knit'],

    // BOTTOMS - JEANS
    'garment.jeans_straight': ['material.selvedge_denim', 'material.stonewashed_denim', 'material.black_denim'],
    'garment.jeans_slim': ['material.stretch_denim', 'material.raw_denim', 'material.lightweight_denim'],
    'garment.jeans_skinny': ['material.high_stretch_denim', 'material.power_stretch_denim', 'material.washed_denim'],
    'garment.jeans_relaxed': ['material.heavyweight_denim', 'material.japanese_denim', 'material.classic_indigo_denim'],
    'garment.jeans_bootcut': ['material.stretch_denim', 'material.classic_indigo_denim', 'material.stonewashed_denim'],
    'garment.jeans_distressed': ['material.any_denim_with_distressing', 'material.acid_wash_denim', 'material.stonewashed_denim'],

    // BOTTOMS - PANTS
    'garment.chino_pants': ['material.cotton_twill', 'material.stretch_twill', 'material.brushed_cotton'],
    'garment.cargo_pants': ['material.cotton_ripstop', 'material.twill', 'material.nylon_blend'],
    'garment.joggers_sweatpants': ['material.fleece', 'material.french_terry', 'material.tech_fleece', 'material.tricot'],
    'garment.track_pants': ['material.nylon', 'material.polyester', 'material.tricot'],
    'garment.dress_pants': ['material.worsted_wool', 'material.flannel', 'material.linen', 'material.cotton_sateen'],
    'garment.corduroy_pants': ['material.corduroy_8_wale', 'material.corduroy_14_wale', 'material.stretch_corduroy'],
    'garment.work_pants': ['material.heavy_duty_twill', 'material.duck_canvas', 'material.denim'],
    
    // BOTTOMS - SHORTS
    'garment.casual_shorts': ['material.cotton_twill', 'material.chambray', 'material.linen'],
    'garment.athletic_shorts': ['material.polyester_microfiber', 'material.mesh', 'material.performance_knit'],
    'garment.basketball_shorts': ['material.mesh', 'material.dazzle_fabric', 'material.polyester'],
    'garment.swim_trunks': ['material.quick_dry_nylon', 'material.polyester_microfiber', 'material.seersucker'],
    'garment.cargo_shorts': ['material.cotton_ripstop', 'material.twill', 'material.canvas'],
    'garment.running_shorts': ['material.polyester_with_spandex', 'material.lightweight_mesh', 'material.nylon'],
    'garment.denim_shorts': ['material.stretch_denim', 'material.stonewashed_denim', 'material.raw_denim'],

    // ATHLETIC & SPORTSWEAR
    'garment.athletic_jersey': ['material.mesh', 'material.polyester_knit', 'material.dazzle_fabric'],
    'garment.performance_tshirt': ['material.polyester_spandex_blend', 'material.technical_fabric', 'material.merino_wool_blend'],
    'garment.compression_shirt': ['material.nylon_spandex_blend', 'material.polyester_elastane', 'material.lycra'],
    'garment.sports_tank_top': ['material.performance_knit', 'material.lightweight_mesh', 'material.polyester_spandex_blend'],
    'garment.cycling_jersey': ['material.lycra', 'material.polyester_knit', 'material.merino_wool_blend'],
    'garment.training_shorts': ['material.polyester_microfiber', 'material.performance_woven', 'material.stretch_twill'],
    'garment.tracksuit': ['material.tricot', 'material.nylon', 'material.polyester'],
    'garment.athletic_tights': ['material.nylon_spandex_blend', 'material.lycra', 'material.polyester_elastane'],

    // HEADWEAR
    'garment.baseball_cap': ['material.cotton_twill', 'material.wool', 'material.polyester'],
    'garment.snapback_cap': ['material.wool_blend', 'material.cotton_twill', 'material.polyester'],
    'garment.dad_hat': ['material.washed_cotton_twill', 'material.canvas', 'material.corduroy'],
    'garment.trucker_hat': ['material.cotton_twill_front_nylon_mesh_back', 'material.polyester', 'material.canvas'],
    'garment.beanie': ['material.merino_wool', 'material.acrylic_knit', 'material.cashmere', 'material.fleece'],
    'garment.bucket_hat': ['material.cotton_twill', 'material.nylon', 'material.denim', 'material.canvas'],
    
    // FOOTWEAR
    'garment.sneakers_low_top': ['material.leather', 'material.canvas', 'material.suede', 'material.knit_fabric'],
    'garment.sneakers_high_top': ['material.leather', 'material.canvas', 'material.suede', 'material.patent_leather'],
    'garment.running_shoes': ['material.engineered_mesh', 'material.knit_upper', 'material.synthetic_insulation'],
    'garment.basketball_shoes': ['material.leather_with_synthetic_mesh', 'material.knit_upper', 'material.patent_leather'],
    'garment.loafers': ['material.full_grain_leather', 'material.suede', 'material.patent_leather'],
    'garment.dress_shoes': ['material.calfskin_leather', 'material.patent_leather', 'material.suede'],
    'garment.boots_casual': ['material.full_grain_leather', 'material.suede', 'material.nubuck'],
    'garment.chelsea_boots': ['material.suede', 'material.calfskin_leather', 'material.leather'],
    'garment.combat_boots': ['material.full_grain_leather', 'material.patent_leather', 'material.canvas'],
    'garment.slides_sandals': ['material.eva_foam', 'material.rubber', 'material.leather'],
};