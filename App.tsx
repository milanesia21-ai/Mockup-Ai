
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { ControlPanel, MockupConfig } from './components/ControlPanel';
import { DisplayArea } from './components/DisplayArea';
import { EditorPanel } from './components/EditorPanel';
import type { DesignLayer } from './components/EditorPanel';
import { 
  generateMockup, 
  generateGraphic, 
  renderRealisticComposite,
  parseEasyPrompt,
  modifyGarmentImage,
  generateAdditionalView,
} from './services/geminiService';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, GARMENT_COLORS, MATERIALS_BY_GARMENT_TYPE, FONT_OPTIONS, VIEWS } from './constants';

type View = 'generator' | 'editor';

export interface GeneratedImage {
  view: string;
  url: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<View>('generator');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [finalRenderedImage, setFinalRenderedImage] = useState<string | null>(null);

  // --- New Layer-Based State Management for Editor ---
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // --- New Generator State ---
  const [config, setConfig] = useState<MockupConfig>({
    easyPrompt: '',
    selectedCategory: GARMENT_CATEGORIES[0].name,
    selectedGarment: GARMENT_CATEGORIES[0].items[0],
    selectedDesignStyle: DESIGN_STYLE_CATEGORIES[0].items[0],
    selectedColor: '#000000',
    selectedMaterial: MATERIALS_BY_GARMENT_TYPE[GARMENT_CATEGORIES[0].name]?.[0] || '',
    customMaterialTexture: undefined,
    selectedStyle: 'Photorealistic Mockup',
    selectedViews: ['Front'],
    aiApparelPrompt: '',
    useAiApparel: false,
    aiModelPrompt: '',
    aiScenePrompt: '',
    useAiModelScene: false,
  });

  const [presets, setPresets] = useState<Record<string, MockupConfig>>({});

  // Load presets from localStorage on initial render
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem('mockupPresets');
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      console.error("Failed to load presets from localStorage", error);
    }
  }, []);

  // --- Layer Manipulation Handlers ---
  const addLayer = useCallback((layer: Partial<DesignLayer>) => {
    const newLayer: DesignLayer = {
      id: Date.now().toString(),
      type: 'image',
      content: '',
      position: { x: 0.5, y: 0.4 },
      size: { width: 0.3, height: 0.3 },
      rotation: 0,
      opacity: 1,
      visible: true,
      ...layer,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<DesignLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(null);
    }
  }, [activeLayerId]);

  const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const handleEasyPromptParse = useCallback(async () => {
    if (!config.easyPrompt) return;
    const toastId = toast.loading('AI is interpreting your request...');
    try {
      const parsedConfig = await parseEasyPrompt(config.easyPrompt);
      
      setConfig(prev => {
        const newConfig = { ...prev, ...parsedConfig };

        // If the garment was parsed, find its category and update that too for UI consistency.
        if (parsedConfig.selectedGarment) {
          const category = GARMENT_CATEGORIES.find(cat => cat.items.includes(parsedConfig.selectedGarment!));
          if (category) {
            newConfig.selectedCategory = category.name;
          }
        }
        return newConfig;
      });

      toast.success('Settings have been auto-filled!', { id: toastId });
    } catch (e) {
      const error = e as Error;
      toast.error(error.message, { id: toastId });
    }
  }, [config.easyPrompt]);
  
  const handleInspireMe = useCallback(() => {
    const randomCategory = GARMENT_CATEGORIES[Math.floor(Math.random() * GARMENT_CATEGORIES.length)];
    const randomGarment = randomCategory.items[Math.floor(Math.random() * randomCategory.items.length)];
    const randomDesignCategory = DESIGN_STYLE_CATEGORIES[Math.floor(Math.random() * DESIGN_STYLE_CATEGORIES.length)];
    const randomDesignStyle = randomDesignCategory.items[Math.floor(Math.random() * randomDesignCategory.items.length)];
    const randomColor = GARMENT_COLORS[Math.floor(Math.random() * GARMENT_COLORS.length)].match(/#([0-9a-fA-F]{6})/)?.[0] || '#000000';
    const randomMaterial = MATERIALS_BY_GARMENT_TYPE[randomCategory.name]?.[0] || '';

    setConfig(prev => ({
      ...prev,
      selectedCategory: randomCategory.name,
      selectedGarment: randomGarment,
      selectedDesignStyle: randomDesignStyle,
      selectedColor: randomColor,
      selectedMaterial: randomMaterial,
      customMaterialTexture: undefined, // Reset custom texture on inspire
    }));
    toast.success("Feeling inspired! ✨");
  }, []);

  const handleSavePreset = useCallback(() => {
    const name = prompt("Enter a name for your preset:");
    if (name) {
      const newPresets = { ...presets, [name]: config };
      setPresets(newPresets);
       try {
        localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
        toast.success(`Preset "${name}" saved!`);
       } catch (error) {
        console.error("Failed to save presets:", error);
        toast.error("Could not save preset. Storage may be full.");
       }
    }
  }, [config, presets]);

  const handleLoadPreset = useCallback((name: string) => {
    if (presets[name]) {
      setConfig(presets[name]);
      toast.success(`Preset "${name}" loaded!`);
    }
  }, [presets]);

  const handleDeletePreset = useCallback((name: string) => {
    if (window.confirm(`Are you sure you want to delete the preset "${name}"?`)) {
      const newPresets = { ...presets };
      delete newPresets[name];
      setPresets(newPresets);
       try {
        localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
        toast.success(`Preset "${name}" deleted.`);
       } catch (error) {
        console.error("Failed to delete preset:", error);
        toast.error("Could not delete preset. Storage may be full.");
       }
    }
  }, [presets]);


  const handleGenerateMockup = useCallback(async () => {
    if (config.selectedViews.length === 0) {
      toast.error("Please select at least one view to generate.");
      return;
    }

    setIsLoading(true);
    setFinalRenderedImage(null);
    setGeneratedImages([]);
    const toastId = toast.loading('Starting mockup generation...');

    try {
      const allGeneratedImages: { view: string, url: string }[] = [];
      const viewsToGenerate = [...config.selectedViews];
      
      let baseImage: string | null = null;
      let baseView: string | null = null;
      
      const frontIndex = viewsToGenerate.indexOf('Front');
      if (frontIndex !== -1) {
        [baseView] = viewsToGenerate.splice(frontIndex, 1);
      } else {
        baseView = viewsToGenerate.shift()!;
      }

      if (baseView) {
        toast.loading(`Generating ${baseView} view...`, { id: toastId });
        const generatedBaseImage = await generateMockup(config, baseView);
        baseImage = generatedBaseImage;
        allGeneratedImages.push({ view: baseView, url: baseImage });
      }

      if (!baseImage) {
        throw new Error("Failed to generate the initial base image.");
      }

      for (const view of viewsToGenerate) {
        toast.loading(`Generating ${view} view (based on ${baseView})...`, { id: toastId });
        const additionalImage = await generateAdditionalView(baseImage, config, view);
        allGeneratedImages.push({ view: view, url: additionalImage });
      }

      const orderedImages = VIEWS
          .map(view => allGeneratedImages.find(img => img.view === view))
          .filter((img): img is { view: string; url: string } => !!img);

      setGeneratedImages(orderedImages);
      setLayers([]);
      setView('editor');
      toast.success('Mockup(s) generated successfully!', { id: toastId });

    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'An unknown error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  const handleGenerateGraphic = useCallback(async (prompt: string, color: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt for the graphic.");
      return;
    }
    
    setIsLoading(true);
    const promise = generateGraphic(prompt, config.useAiApparel ? config.aiApparelPrompt : config.selectedGarment, 'Center Chest', color);
    
    toast.promise(promise, {
      loading: 'Creating your custom graphic...',
      success: (graphicDataUrl) => {
        addLayer({ type: 'image', content: graphicDataUrl });
        return 'Custom graphic created!';
      },
      error: (err) => err instanceof Error ? err.message : 'An error occurred creating the graphic.',
    });

    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [config, addLayer]);

  const handleModifyGarment = useCallback(async (prompt: string) => {
    if (!generatedImages[0]) {
      toast.error("No mockup available to modify.");
      return;
    }
    
    setIsLoading(true);
    const promise = modifyGarmentImage(generatedImages[0].url, prompt);
    
    toast.promise(promise, {
      loading: 'AI is modifying your garment...',
      success: (newImageUrl) => {
        const originalView = generatedImages[0]?.view || 'Front'; 
        setGeneratedImages([{ view: originalView, url: newImageUrl }]); // Replace with the new image
        setLayers([]); // Clear layers as the base image changed
        setFinalRenderedImage(null); // Clear final render
        return 'Garment modified successfully!';
      },
      error: (err) => err instanceof Error ? err.message : 'An error occurred during modification.',
    });

    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [generatedImages]);

  const handleRenderRealistic = useCallback(async () => {
    const baseImage = generatedImages[0]?.url;
    if (!baseImage || layers.length === 0) {
      toast.error("Please add a design to the mockup before rendering.");
      return;
    }
    
    setIsLoading(true);
    const promise = (async () => {
      // 1. Flatten layers onto a canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      const baseImg = new Image();
      baseImg.src = baseImage;
      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = reject;
      });

      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      
      const renderLayers = [...layers];

      for (const layer of renderLayers) {
        if (!layer.visible) continue;
        
        ctx.save();
        ctx.globalAlpha = layer.opacity;

        const targetWidth = canvas.width * layer.size.width;
        
        if (layer.type === 'image') {
            const graphicImg = new Image();
            graphicImg.src = layer.content;
            await new Promise((resolve, reject) => {
                graphicImg.onload = resolve;
                graphicImg.onerror = reject;
            });
            
            const aspectRatio = graphicImg.naturalWidth / graphicImg.naturalHeight;
            const targetHeight = targetWidth / aspectRatio;
            const targetX = (layer.position.x * canvas.width) - (targetWidth / 2);
            const targetY = (layer.position.y * canvas.height) - (targetHeight / 2);

            ctx.translate(targetX + targetWidth / 2, targetY + targetHeight / 2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.drawImage(graphicImg, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

        } else if (layer.type === 'text') {
            const fontSize = (layer.fontSize || 24) * (canvas.width / 1000);
            ctx.font = `${layer.fontWeight || 'normal'} ${fontSize}px ${layer.fontFamily || 'Arial'}`;
            ctx.fillStyle = layer.color || '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const targetX = (layer.position.x * canvas.width);
            const targetY = (layer.position.y * canvas.height);
            
            ctx.translate(targetX, targetY);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.fillText(layer.content, 0, 0);
        } else if (layer.type === 'shape') {
            const targetHeight = canvas.height * layer.size.height;
            const targetX = (layer.position.x * canvas.width) - (targetWidth / 2);
            const targetY = (layer.position.y * canvas.height) - (targetHeight / 2);
            
            ctx.fillStyle = layer.fill || '#FFFFFF';
            ctx.translate(targetX + targetWidth/2, targetY + targetHeight/2);
            ctx.rotate(layer.rotation * Math.PI / 180);
            
            if (layer.content === 'circle') {
                ctx.beginPath();
                ctx.ellipse(0, 0, targetWidth / 2, targetHeight / 2, 0, 0, 2 * Math.PI);
                ctx.fill();
            } else { // rectangle
                ctx.fillRect(-targetWidth/2, -targetHeight/2, targetWidth, targetHeight);
            }
        }
        
        ctx.restore();
      }

      const compositeGraphicUrl = canvas.toDataURL('image/png');

      return renderRealisticComposite(baseImage, compositeGraphicUrl);
    })();

    toast.promise(promise, {
        loading: 'AI is rendering a hyper-realistic mockup...',
        success: (finalImage) => {
            const originalView = generatedImages[0]?.view || 'Front';
            setFinalRenderedImage(finalImage);
            setGeneratedImages([{ view: originalView, url: finalImage }]);
            setLayers([]);
            return 'Realistic mockup rendered successfully!';
        },
        error: (err) => err instanceof Error ? err.message : 'An error occurred during rendering.',
    });
    
    promise.catch(() => {}).finally(() => setIsLoading(false));

  }, [generatedImages, layers]);

  const garmentDescription = useMemo(() =>
    config.useAiApparel && config.aiApparelPrompt ? config.aiApparelPrompt : config.selectedGarment,
    [config.useAiApparel, config.aiApparelPrompt, config.selectedGarment]
  );
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Toaster position="top-right" richColors theme="dark" />
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl h-full flex flex-col">
            <div className="flex border-b border-gray-700 mb-6">
              <button onClick={() => setView('generator')} className={`py-2 px-4 text-sm font-medium ${view === 'generator' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                1. Mockup Generator
              </button>
              <button onClick={() => setView('editor')} disabled={generatedImages.length === 0} className={`py-2 px-4 text-sm font-medium ${view === 'editor' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                2. Design Studio
              </button>
            </div>
            
            {view === 'generator' && (
              <ControlPanel
                config={config}
                setConfig={setConfig}
                onGenerate={handleGenerateMockup}
                onParseEasyPrompt={handleEasyPromptParse}
                onInspireMe={handleInspireMe}
                presets={presets}
                onSavePreset={handleSavePreset}
                onLoadPreset={handleLoadPreset}
                onDeletePreset={handleDeletePreset}
                isLoading={isLoading}
              />
            )}
            {view === 'editor' && generatedImages.length > 0 && (
               <EditorPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onAddLayer={addLayer}
                onUpdateLayer={updateLayer}
                onDeleteLayer={deleteLayer}
                onReorderLayer={reorderLayer}
                onSetActiveLayer={setActiveLayerId}
                onGenerateGraphic={handleGenerateGraphic}
                onModifyGarment={handleModifyGarment}
                onRenderRealistic={handleRenderRealistic}
                isLoading={isLoading}
                garmentDescription={garmentDescription}
               />
            )}
          </div>
        </div>
        <div className="flex-grow lg:w-2/3 xl:w-3/4">
          <DisplayArea
            baseImages={generatedImages}
            finalImage={finalRenderedImage}
            layers={layers}
            activeLayerId={activeLayerId}
            onSetActiveLayer={setActiveLayerId}
            onUpdateLayer={updateLayer}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
