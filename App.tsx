

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { ControlPanel, MockupConfig } from './components/ControlPanel';
import { DisplayArea } from './components/DisplayArea';
import { EditorPanel, DesignLayer, ModificationRequest } from './components/EditorPanel';
import { 
  generateMockup, 
  generateGraphic, 
  renderRealisticComposite,
  parseEasyPrompt,
  modifyGarmentImage,
  generateAdditionalView,
  propagateDesignToView,
  GroundingSource,
} from './services/geminiService';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, GARMENT_COLORS, MATERIALS_BY_GARMENT_TYPE, FONT_OPTIONS, VIEWS, PLACEMENT_COORDINATES } from './constants';

type View = 'generator' | 'editor';

export interface GeneratedImage {
  view: string;
  url: string;
}

// --- History Hook for Undo/Redo ---
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    const currentState = history[currentIndex];
    const newState = typeof action === 'function' 
        ? (action as (prevState: T) => T)(currentState) 
        : action;
    
    if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        return; // Don't add to history if state is the same
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex, history.length]);
  
  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state: history[currentIndex], setState, undo, redo, canUndo, canRedo, reset };
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('generator');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [finalRenderedImage, setFinalRenderedImage] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);

  // --- New Layer-Based State Management for Editor ---
  const { 
      state: layers, 
      setState: setLayers, 
      undo, 
      redo, 
      canUndo, 
      canRedo, 
      reset: resetLayers 
  } = useHistory<DesignLayer[]>([]);
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
    useGoogleSearch: false,
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
  }, [setLayers]);

  const updateLayer = useCallback((id: string, updates: Partial<DesignLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, [setLayers]);

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(null);
    }
  }, [activeLayerId, setLayers]);

  const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, [setLayers]);

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
    setGroundingSources([]);
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
        const { imageUrl, groundingSources: sources } = await generateMockup(config, baseView);
        baseImage = imageUrl;
        setGroundingSources(sources);
        if (sources.length > 0) {
          toast.success("Used Google Search to enhance details.", { id: toastId, duration: 2000 });
        }
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
      resetLayers([]);
      setView('editor');
      toast.success('Mockup(s) generated successfully!', { id: toastId });

    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'An unknown error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, [config, resetLayers]);
  
  const handleGenerateGraphic = useCallback(async (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt for the graphic.");
      return;
    }

    const baseImage = generatedImages[0]?.url;
    if (!baseImage) {
      toast.error("Please generate a mockup before adding a graphic.");
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Step 1/2: Generating your custom graphic...');
    const garmentDesc = config.useAiApparel ? config.aiApparelPrompt : config.selectedGarment;

    try {
      // Step 1: Generate the isolated graphic
      const graphicDataUrl = await generateGraphic(prompt, garmentDesc, placement, color, designStyle, texturePrompt);

      toast.loading('Step 2/2: Rendering graphic onto mockup...', { id: toastId });

      const coordinates = PLACEMENT_COORDINATES[placement] || { x: 0.5, y: 0.4 };
      
      addLayer({
        type: 'image',
        content: graphicDataUrl,
        position: coordinates,
      });
      
      toast.success('Graphic generated and added as a new layer!', { id: toastId });
      
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'An unknown error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, [generatedImages, config.useAiApparel, config.aiApparelPrompt, config.selectedGarment, addLayer]);

  const handleModifyGarment = useCallback(async (modification: ModificationRequest) => {
    if (!generatedImages[0]) {
      toast.error("No mockup available to modify.");
      return;
    }
    
    setIsLoading(true);
    const promise = modifyGarmentImage(generatedImages[0].url, modification);
    
    toast.promise(promise, {
      loading: 'AI is applying direct-to-garment modifications...',
      success: (newImageUrl) => {
        const originalView = generatedImages[0]?.view || 'Front'; 
        setGeneratedImages(prev => prev.map((img, i) => i === 0 ? { ...img, url: newImageUrl } : { ...img, url: '' })); // Invalidate other views
        resetLayers([]); // Clear layers as the base image changed
        setFinalRenderedImage(null); // Clear final render
        toast.info("Other views have been cleared as the base garment has changed. Please re-generate if needed.", { duration: 5000 });
        return 'Garment modified successfully!';
      },
      error: (err) => err instanceof Error ? err.message : 'An error occurred during modification.',
    });

    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [generatedImages, resetLayers]);
  
  const handlePropagateDesign = useCallback(async () => {
    const renderedImage = generatedImages.find(img => img.url === finalRenderedImage);
    const cleanImages = generatedImages.filter(img => img.url !== finalRenderedImage);

    if (!finalRenderedImage || !renderedImage || cleanImages.length === 0) {
        toast.error("A primary view must be rendered first, and other views must exist to propagate to.");
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`Propagating design from ${renderedImage.view} to ${cleanImages.length} other view(s)...`);

    try {
        const propagationPromises = cleanImages.map(target => 
            propagateDesignToView(
                renderedImage.url,
                target.url,
                renderedImage.view,
                target.view
            ).then(newUrl => ({ ...target, url: newUrl }))
        );

        const propagatedImages = await Promise.all(propagationPromises);

        const finalImageSet = [...generatedImages];
        propagatedImages.forEach(pImg => {
            const index = finalImageSet.findIndex(fImg => fImg.view === pImg.view);
            if (index !== -1) {
                finalImageSet[index] = pImg;
            }
        });

        setGeneratedImages(finalImageSet);
        setFinalRenderedImage(null);
        toast.success("Design propagated to all views successfully!", { id: toastId });

    } catch (error) {
        const err = error as Error;
        toast.error(err.message, { id: toastId });
    } finally {
        setIsLoading(false);
    }
}, [finalRenderedImage, generatedImages]);

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
      baseImg.crossOrigin = "Anonymous"; // Allow loading from data URLs without tainting canvas
      baseImg.src = baseImage;
      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = (err) => reject(new Error(`Failed to load base image: ${err.toString()}`));
      });

      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      
      const renderLayers = [...layers].reverse(); // Render from bottom up

      for (const layer of renderLayers) {
        if (!layer.visible) continue;
        
        ctx.save();
        ctx.globalAlpha = layer.opacity;

        const targetWidth = canvas.width * layer.size.width;
        
        if (layer.type === 'image') {
            const graphicImg = new Image();
            graphicImg.crossOrigin = "Anonymous";
            graphicImg.src = layer.content;
            await new Promise((resolve, reject) => {
                graphicImg.onload = resolve;
                graphicImg.onerror = () => reject(new Error("Failed to load a graphic layer."));
            });
            
            const aspectRatio = (graphicImg.naturalWidth > 0 && graphicImg.naturalHeight > 0) ? (graphicImg.naturalWidth / graphicImg.naturalHeight) : 1;
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
            // IMPORTANT: Update the URL in the main array, don't replace it, to preserve other views
            setGeneratedImages(prev => prev.map((img, index) => index === 0 ? { ...img, url: finalImage } : img));
            resetLayers([]);
            return 'Realistic mockup rendered successfully!';
        },
        error: (err) => err instanceof Error ? err.message : 'An error occurred during rendering.',
    });
    
    promise.catch(() => {}).finally(() => setIsLoading(false));

  }, [generatedImages, layers, resetLayers]);

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
                onPropagateDesign={handlePropagateDesign}
                finalRenderedImage={finalRenderedImage}
                isLoading={isLoading}
                garmentDescription={garmentDescription}
                garmentColor={config.selectedColor}
                designStyle={config.selectedDesignStyle}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
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
            groundingSources={groundingSources}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
