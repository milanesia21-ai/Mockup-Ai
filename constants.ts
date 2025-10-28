
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

export const ASPECT_RATIO_OPTIONS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;
export type AspectRatioOption = typeof ASPECT_RATIO_OPTIONS[number];


export interface DesignStyleCategory {
  name: string;
  items: string[];
}

export const DESIGN_STYLE_CATEGORIES: DesignStyleCategory[] = [
  {
    name: 'Trend Revival',
    items: [
      '[Y2K/Early 2000s]',
      '[90s Streetwear]',
      '[80s Synthwave/Vaporwave]',
    ],
  },
  {
    name: 'Modern Aesthetics',
    items: [
      '[Athleisure/Cozywear]',
      '[Minimalist/Normcore]',
      '[Cyberpunk/Techwear]',
      '[Grunge/Distressed]',
      '[Cottagecore/Boho]',
      '[Gorpcore/Outdoor]',
    ],
  },
  {
    name: 'Artistic/Luxury',
    items: [
      '[Haute Couture/Luxury]',
      '[Abstract Art/Expressionist]',
      '[Tattoo Style]',
    ],
  },
];

export const BASE_PROMPT = `
=== LAYOUT & COMPOSITION ===
- Dual view presentation: FRONT view positioned on the LEFT side, BACK view positioned on the RIGHT side
- Both views perfectly centered, aligned at identical height with equal spacing between them
- Pure black background (#000000) for maximum contrast and professional appearance
- Garment color: White (#FFFFFF) or Light Grey (#F5F5F5) as default, easily customizable
- Both views should be identical in size and scale
- Symmetrical, professional presentation suitable for e-commerce or portfolio use

=== GARMENT CONSTRUCTION - UNIVERSAL DETAILS ===
SEAMS & STITCHING:
- All major seams clearly visible with thin line indication
- Shoulder seams, side seams, sleeve seams, inseams, outseams as applicable
- Topstitching where appropriate (decorative or reinforcement stitching)
- Contrast stitching for denim items (gold/tan thread #D4A574)
- Bartack reinforcement at stress points (pocket corners, belt loops)
NECKLINES & COLLARS (Garment-Specific):
- Crew neck: Rounded neckline with ribbed band
- V-neck: V-shaped opening with ribbed or bound edge
- Henley: Partial button placket (2-5 buttons) extending from neckline
- Polo collar: Folded collar with button placket (2-3 buttons)
- Shirt collar: Traditional collar with points, collar band, and top button
- Hoodie: Hood with drawstrings, interior lining visible at opening
SLEEVES (Garment-Specific):
- Short sleeves: Hem at mid-bicep with clean finish
- Long sleeves: Full length to wrist with cuff detail
- Sleeveless: Armhole with bound edge or tank-style wider opening
- Raglan sleeves: Diagonal seam from underarm to neckline
- Set-in sleeves: Traditional shoulder seam construction
- Ribbed cuffs: Elastic ribbed band at wrist (hoodies, sweatshirts)
- Button cuffs: Dress shirt style with 1-2 buttons and placket
CLOSURES & FASTENERS:
- Buttons: Circular shapes with subtle shading, visible stitch holes, positioned on button placket
- Zippers: Metal or plastic teeth texture, zipper pull tab, zipper tape/guard
- Drawstrings: Cord running through channel with aglets (metal or plastic tips)
POCKETS (Garment-Specific):
- Patch pockets: Sewn-on rectangular pockets with visible stitching outline
- Kangaroo pocket: Single large front pocket on hoodies (horizontal opening)
- Slash pockets: Angled side-entry pockets (pants, jackets)
- Welt pockets: Rectangular opening with finished edge (suit jackets, dress pants)
- Flap pockets: Pocket with covering flap and button closure
- Cargo pockets: Large external pockets with flap and button/velcro (sides of pants/shorts)
WAISTBANDS & HEMS:
- Ribbed waistband: Elastic band with horizontal rib texture (sweatpants, athletic wear)
- Structured waistband: Stiff band with belt loops, button, and zipper (pants, jeans)
- Straight hem: Clean horizontal finish line
- Curved hem: Rounded shirttail hem (button-up shirts)
RIBBED TEXTURES (Where Applicable):
- Neck ribbing: Horizontal parallel lines indicating knit texture (t-shirts, sweatshirts)
- Cuff ribbing: Visible texture with 1x1 or 2x2 rib pattern
- Waistband ribbing: Elastic knit with texture lines
HARDWARE DETAILS:
- Rivets (jeans): Small copper/brass circles at pocket corners (#B87333)
- Grommets: Reinforced metal eyelet holes (hoodie drawstrings)

=== FABRIC APPEARANCE - CRITICAL REQUIREMENTS ===
SMOOTH, WRINKLE-FREE PRIMARY SURFACES:
- Main body areas (chest, back, entire torso, thigh fronts) MUST be completely smooth, flat, and wrinkle-free
- Fabric should appear freshly pressed, crisp, clean, and new
- Absolutely NO excessive wrinkles, creases, or fabric bunching on primary design placement surfaces
MINIMAL, NATURAL FOLDS - ALLOWED ONLY AT:
- Armhole/shoulder junction, Inner elbow, Behind knee, Bottom hem, Waistband area
- Folds MUST BE extremely subtle, naturalistic, and never interfere with main design areas

=== DESIGN PLACEMENT AREAS ===
PRIMARY DESIGN ZONES - MUST BE COMPLETELY FLAT AND UNOBSTRUCTED:
- FRONT CHEST AREA, BACK PANEL, LEFT CHEST (Small Logo Area), SLEEVES, FRONT THIGH AREA, BACK POCKETS

=== LIGHTING & SHADING (For Photorealistic Style Only) ===
LIGHT SOURCE:
- Direction: Top-left at 45-degree angle
- Type: Soft, diffused natural lighting
HIGHLIGHTS (Brightest Areas):
- Location: Shoulders, upper chest, top of sleeves
- Appearance: Subtle lightening of base color, soft transition
SHADOWS (Darkest Areas):
- Location: Under collar, inside pockets, armpit area, inseams
- Appearance: Darkened version of base color, very soft transition

=== FINAL OUTPUT DESCRIPTION ===
The completed mockup will be:
- Professional-grade illustration suitable for commercial use
- E-commerce ready for product listings and catalogs
- Realistic yet clean presentation
- Perfect for showcasing designs before production

=== VISUAL PURITY RULE ===
- The generated image must be completely free of any text, labels, annotations, or written descriptions anywhere within the visual.

=== CRITICAL FINAL INSTRUCTION ===
- It must create only one garment at a time, front and back only.

Add Style Menu Selection (Choose ONE):

Trend Revival:
[Y2K/Early 2000s] (Bubbly fonts, airbrush, bright colors, low-rise aesthetics)
[90s Streetwear] (Graffiti, bold graphics, logo mania, vintage hip-hop)
[80s Synthwave/Vaporwave] (Neon, grid lines, retro-futuristic, marble statues, glitch effect)

Modern Aesthetics:
[Athleisure/Cozywear] (Clean typography, minimalist branding, technical fabric look)
[Minimalist/Normcore] (Simple lines, negative space, subtle logos, monochrome palette)
[Cyberpunk/Techwear] (Sci-fi, distressed, Japanese text elements, technical diagrams)
[Grunge/Distressed] (Worn, ripped, layered, messy collage, punk influence)
[Cottagecore/Boho] (Nature-inspired, floral patterns, embroidery, soft colors, vintage charm)
[Gorpcore/Outdoor] (Utility graphics, map lines, functional text, nature motifs)

Artistic/Luxury:
[Haute Couture/Luxury] (Elegant typography, intricate details, subtle branding, high-quality texture)
[Abstract Art/Expressionist] (Non-representational, bold brushstrokes, expressive colors)
[Tattoo Style] (Classic or modern tattoo motifs, bold lines, blackwork or colorful)
`;