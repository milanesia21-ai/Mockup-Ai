
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { ControlPanel } from '../components/ControlPanel';
import { EditorPanel, DesignLayer, SketchToolsConfig } from '../components/EditorPanel';
import { RefinePanel } from '../components/RefinePanel';
import { DisplayArea } from '../components/DisplayArea';

import {
    MockupConfig,
    GeneratedImage,
    ModificationRequest,
    GARMENT_CATEGORIES,
    DESIGN_STYLE_CATEGORIES,
    GARMENT_COLORS,
} from '../constants';
import * as gemini from '../services/geminiService';
import type { GroundingSource } from '../services/geminiService';


// Helper for unique IDs
const uuidv4 = () => crypto.randomUUID();

const DEFAULT_CONFIG: MockupConfig = {
    easyPrompt: '',
    selectedCategory: 'TOPS - SWEATSHIRTS & HOODIES',
    selectedGarment: 'Hoodie pullover (with kangaroo pocket)',
    selectedDesignStyle: '[Streetwear]',
    selectedColor: '#1a1a1a',
    selectedMaterial: 'Fleece',
    selectedStyle: 'Photorealistic Mockup',
    selectedViews: ['Front'],
    aiApparelPrompt: '',
    useAiApparel: false,
    aiModelPrompt: 'male model, athletic build, standing against a neutral background',
    aiScenePrompt: 'in a minimalist photography studio with soft lighting',
    useAiModelScene: false,
    useGoogleSearch: false,
    selectedModel: 'gemini-2.5-flash-image',
};

// Custom hook for managing history (undo/redo)
const useHistory = (initialState: DesignLayer[]) => {
    const [history, setHistory] = useState<DesignLayer[][]>([initialState]);
    const [index, setIndex] = useState(0);

    const setState = (action: React.SetStateAction<DesignLayer[]>, overwrite = false) => {
        const newState = typeof action === 'function' ? action(history[index]) : action;
        if (overwrite) {
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        } else {
            const updatedHistory = history.slice(0, index + 1);
            setHistory([...updatedHistory, newState]);
            setIndex(index + 1);
        }
    };

    const undo = () => index > 0 && setIndex(index - 1);
    const redo = () => index < history.length - 1 && setIndex(index + 1);
    
    const resetHistory = (state: DesignLayer[]) => {
        setHistory([state]);
        setIndex(0);
    }

    return [history[index], setState, undo, redo, index > 0, index < history.length - 1, resetHistory] as const;
};

type AppStep = 'generate' | 'design' | 'refine';


const TabButton: React.FC<{
    title: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ title, active, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 py-3 text-sm md:text-base font-bold text-center transition-colors
            ${active ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:bg-gray-700/50 border-b-2 border-transparent'}
            ${disabled ? 'text-gray-600 cursor-not-allowed hover:bg-transparent' : ''}
        `}
    >
        {title}
    </button>
);


// Main View Component
export const MockupView: React.FC = () => {
    // Core State
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<MockupConfig>(DEFAULT_CONFIG);
    const [baseImages, setBaseImages] = useState<GeneratedImage[]>([]);
    const [cleanBaseImages, setCleanBaseImages] = useState<GeneratedImage[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [step, setStep] = useState<AppStep>('generate');

    // Editor/Refine State
    const [layers, setLayers, undo, redo, canUndo, canRedo, resetHistory] = useHistory([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [sketchTools, setSketchTools] = useState<SketchToolsConfig>({
        brushType: 'pencil',
        brushColor: '#ffffff',
        brushSize: 10,
        brushOpacity: 1,
        symmetry: 'none',
    });

    // Preset State
    const [presets, setPresets] = useState<Record<string, MockupConfig>>({});

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('mockupPresets');
            if (savedPresets) {
                setPresets(JSON.parse(savedPresets));
            }
        } catch (e) {
            console.error("Failed to load presets from localStorage", e);
        }
    }, []);

    // --- Core Generation Logic ---

    const handleGenerateMockup = useCallback(async () => {
        setIsLoading(true);
        setBaseImages([]);
        setCleanBaseImages([]);
        setFinalImage(null);
        resetHistory([]);
        setGroundingSources([]);

        const generationTask = async () => {
            if (config.selectedViews.length === 0) {
                throw new Error("Please select at least one view to generate.");
            }

            const newImages: GeneratedImage[] = [];
            let combinedSources: GroundingSource[] = [];

            // 1. Generate the first view
            const firstView = config.selectedViews[0];
            const firstResult = await gemini.generateMockup(config, firstView);
            const firstImage: GeneratedImage = {
                view: firstView,
                url: firstResult.imageUrl,
            };
            newImages.push(firstImage);
            if (firstResult.groundingSources) {
              combinedSources.push(...firstResult.groundingSources);
            }

            // 2. Generate subsequent views based on the first one for consistency
            if (config.selectedViews.length > 1) {
                const subsequentViews = config.selectedViews.slice(1);
                // Use Promise.all to run subsequent generations in parallel
                const additionalImages = await Promise.all(
                    subsequentViews.map(view => 
                        gemini.generateAdditionalView(firstImage.url, config, view)
                            .then(url => ({ view, url }))
                    )
                );
                newImages.push(...additionalImages);
            }
            
            const uniqueSources = Array.from(new Map(combinedSources.map(s => [s.uri, s])).values());
                
            setBaseImages(newImages);
            setCleanBaseImages(newImages);
            setGroundingSources(uniqueSources);
            setStep('design');

            return `${newImages.length} mockup view(s) generated consistently!`;
        };
        
        const promise = generationTask();

        toast.promise(promise, {
            loading: 'Generating consistent mockup views with AI...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config, resetHistory]);
    
    const handleParseEasyPrompt = useCallback(async () => {
        if (!config.easyPrompt) {
            toast.error("Please enter a prompt first.");
            return;
        }
        setIsLoading(true);
        const promise = gemini.parseEasyPrompt(config.easyPrompt).then(parsedConfig => {
            setConfig(prev => ({ ...prev, ...parsedConfig }));
            return "Prompt parsed and options updated!";
        });
        
        toast.promise(promise, {
            loading: 'Parsing your prompt...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.easyPrompt]);
    
    const handleInspireMe = useCallback(async () => {
        setIsLoading(true);

        // Get random values for a more varied inspiration
        const allGarments = GARMENT_CATEGORIES.flatMap(cat => cat.items);
        const allDesignStyles = DESIGN_STYLE_CATEGORIES.flatMap(cat => cat.items);
        
        const randomGarment = allGarments[Math.floor(Math.random() * allGarments.length)];
        const randomDesignStyle = allDesignStyles[Math.floor(Math.random() * allDesignStyles.length)];
        
        // Extract hex code from "Color Name (#XXXXXX)"
        const randomColorString = GARMENT_COLORS[Math.floor(Math.random() * GARMENT_COLORS.length)];
        const hexMatch = randomColorString.match(/#([0-9a-fA-F]{6})/);
        const randomColor = hexMatch ? hexMatch[0] : '#000000';

        const promise = gemini.generateInspirationPrompt(
            randomGarment,
            randomDesignStyle,
            randomColor,
            config.selectedStyle
        ).then(idea => {
            setConfig(prev => ({...prev, aiApparelPrompt: idea, useAiApparel: true}));
            toast.info("Switched to 'Generate Custom Apparel' mode with the new idea.");
            return `New Idea for a ${randomGarment}: "${idea}"`;
        });
        
        toast.promise(promise, {
            loading: 'Getting an idea from the AI...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedStyle]);

    const isGenerationReady = useMemo(() => {
        if (config.useAiApparel) {
            return config.aiApparelPrompt.trim().length > 0;
        }
        return !!config.selectedGarment && config.selectedViews.length > 0;
    }, [config.useAiApparel, config.aiApparelPrompt, config.selectedGarment, config.selectedViews]);


    // --- Preset Logic ---

    const handleSavePreset = () => {
        const name = prompt("Enter a name for this preset:");
        if (name) {
            const newPresets = { ...presets, [name]: config };
            setPresets(newPresets);
            localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
            toast.success(`Preset "${name}" saved!`);
        }
    };

    const handleLoadPreset = (name: string) => {
        if (presets[name]) {
            setConfig(presets[name]);
            toast.info(`Preset "${name}" loaded.`);
        }
    };
    
    const handleDeletePreset = (name: string) => {
        if (window.confirm(`Are you sure you want to delete the preset "${name}"?`)) {
            const newPresets = { ...presets };
            delete newPresets[name];
            setPresets(newPresets);
            localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
            toast.success(`Preset "${name}" deleted.`);
        }
    };

    // --- Layer Management ---
    
    const addLayer = useCallback((layer: Partial<DesignLayer>) => {
        const newLayer: DesignLayer = {
            id: uuidv4(),
            type: 'image',
            content: '',
            position: { x: 0.5, y: 0.5 },
            size: { width: 0.25, height: 0.25 },
            rotation: 0,
            opacity: 1,
            visible: true,
            blendMode: 'source-over',
            lockTransparency: false,
            ...layer,
        };
        setLayers(currentLayers => [...currentLayers, newLayer]);
        setActiveLayerId(newLayer.id);
    }, [setLayers]);
    
    const updateLayer = useCallback((id: string, updates: Partial<DesignLayer>) => {
        setLayers(currentLayers =>
            currentLayers.map(l => l.id === id ? { ...l, ...updates } : l)
        , true); // Overwrite history for minor updates
    }, [setLayers]);

    const commitLayerUpdate = useCallback((id: string, updates: Partial<DesignLayer>) => {
         setLayers(currentLayers =>
            currentLayers.map(l => l.id === id ? { ...l, ...updates } : l)
        );
    }, [setLayers]);
    
    const deleteLayer = useCallback((id: string) => {
        setLayers(currentLayers => currentLayers.filter(l => l.id !== id));
        if (activeLayerId === id) {
            setActiveLayerId(null);
        }
    }, [activeLayerId, setLayers]);
    
    const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
        setLayers(currentLayers => {
            const result = Array.from(currentLayers);
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            return result;
        });
    }, [setLayers]);

    // --- Editor Panel Actions ---
    
    const handleGenerateGraphic = useCallback(async (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => {
        setIsLoading(true);
        const promise = gemini.generateGraphic(prompt, config.selectedGarment, placement, color, designStyle, texturePrompt, config.selectedModel)
            .then(imageUrl => {
                addLayer({ type: 'image', content: imageUrl });
                return "AI graphic generated and added as a layer!";
            });
            
        toast.promise(promise, {
            loading: 'Generating AI graphic...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedGarment, config.selectedModel, addLayer]);
    
    const handleModifyGarment = useCallback(async (modification: ModificationRequest) => {
        if (!baseImages.length) {
            toast.error("Please generate a base mockup first.");
            return;
        }
        setIsLoading(true);
        setFinalImage(null);
        resetHistory([]);

        const primaryView = baseImages[0];
        
        const promise = gemini.modifyGarmentImage(primaryView.url, modification)
            .then(async (modifiedImageUrl) => {
                const newBaseImages = [{ ...primaryView, url: modifiedImageUrl }];

                if (baseImages.length > 1) {
                    const additionalViews = baseImages.slice(1);
                    const regeneratedViews = await Promise.all(
                        additionalViews.map(view => 
                            gemini.generateAdditionalView(modifiedImageUrl, config, view.view)
                                .then(url => ({ view: view.view, url }))
                        )
                    );
                    newBaseImages.push(...regeneratedViews);
                }
                
                setBaseImages(newBaseImages);
                setCleanBaseImages(newBaseImages);
                return "Garment successfully modified!";
            });
            
        toast.promise(promise, {
            loading: 'Applying direct-to-garment AI modifications...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, config, resetHistory]);
    
    // --- Refine Panel Actions ---
    const handleRenderRealistic = useCallback(async () => {
        if (!baseImages.length || !layers.length) return;
        setIsLoading(true);

        const promise = (async () => {
            const primaryImage = baseImages[0].url;
            const img = new Image();
            img.src = primaryImage;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");

            for (const layer of layers) {
                if (!layer.visible) continue;
                
                ctx.save();
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
                
                const layerX = layer.position.x * canvas.width;
                const layerY = layer.position.y * canvas.height;
                const layerWidth = layer.size.width * canvas.width;
                
                ctx.translate(layerX, layerY);
                ctx.rotate(layer.rotation * Math.PI / 180);

                if (layer.type === 'image' || layer.type === 'drawing') {
                    const layerImg = new Image();
                    layerImg.src = layer.content;
                    await new Promise<void>((resolve, reject) => {
                        layerImg.onload = () => resolve();
                        layerImg.onerror = reject;
                    });
                    const layerHeight = layerImg.naturalHeight * (layerWidth / layerImg.naturalWidth);
                    ctx.drawImage(layerImg, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);
                }
                
                ctx.restore();
            }

            const flattenedGraphicUrl = canvas.toDataURL();
            const resultUrl = await gemini.renderRealisticComposite(primaryImage, flattenedGraphicUrl);
            setFinalImage(resultUrl);
            setBaseImages(current => [{...current[0], url: resultUrl}, ...current.slice(1)])
            
            return "Realistic mockup rendered!";
        })();
        
         toast.promise(promise, {
            loading: 'Rendering realistic composite...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, layers]);
    
     const handlePropagateDesign = useCallback(async () => {
        if (!finalImage || cleanBaseImages.length <= 1) return;
        setIsLoading(true);

        const sourceImage = finalImage;
        const sourceView = baseImages[0].view;
        const targets = cleanBaseImages.slice(1);

        const promise = Promise.all(
            targets.map(target => 
                gemini.propagateDesignToView(sourceImage, target.url, sourceView, target.view)
                .then(newUrl => ({ view: target.view, url: newUrl }))
            )
        ).then(propagatedImages => {
            const finalImages = [
                { view: sourceView, url: sourceImage },
                ...propagatedImages
            ];
            setBaseImages(finalImages);
            setFinalImage(null); // Return to gallery view
            return "Design propagated to all views!";
        });
        
        toast.promise(promise, {
            loading: `Propagating design to ${targets.length} other views...`,
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));

    }, [finalImage, baseImages, cleanBaseImages]);

    const renderActivePanel = () => {
        switch(step) {
            case 'generate':
                return <ControlPanel
                    config={config}
                    setConfig={setConfig}
                    presets={presets}
                    onSavePreset={handleSavePreset}
                    onLoadPreset={handleLoadPreset}
                    onDeletePreset={handleDeletePreset}
                />;
            case 'design':
                return <EditorPanel
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onAddLayer={addLayer}
                    onUpdateLayer={commitLayerUpdate}
                    onDeleteLayer={deleteLayer}
                    onReorderLayer={reorderLayer}
                    onSetActiveLayer={setActiveLayerId}
                    onGenerateGraphic={handleGenerateGraphic}
                    onModifyGarment={handleModifyGarment}
                    isLoading={isLoading}
                    garmentDescription={config.selectedGarment}
                    garmentColor={config.selectedColor}
                    designStyle={config.selectedDesignStyle}
                    // Fix: Pass selectedStyle to EditorPanel
                    selectedStyle={config.selectedStyle}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    sketchTools={sketchTools}
                    setSketchTools={setSketchTools}
                />;
            case 'refine':
                return <RefinePanel
                    onRenderRealistic={handleRenderRealistic}
                    onPropagateDesign={handlePropagateDesign}
                    isLoading={isLoading}
                    finalRenderedImage={finalImage}
                    propagationTargetCount={cleanBaseImages.length > 1 ? cleanBaseImages.length - 1 : 0}
                    hasLayers={layers.length > 0}
                />;
            default:
                return null;
        }
    };
    
    return (
        <div className="flex flex-col flex-grow min-h-0">
            {/* Tabs */}
            <div className="flex-shrink-0 bg-gray-900 flex border-b border-gray-700 shadow-md">
                <TabButton title="1. Generate" active={step === 'generate'} onClick={() => setStep('generate')} />
                <TabButton title="2. Design" active={step === 'design'} onClick={() => setStep('design')} disabled={baseImages.length === 0} />
                <TabButton title="3. Refine" active={step === 'refine'} onClick={() => setStep('refine')} disabled={baseImages.length === 0} />
            </div>

            {/* Main Content */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] overflow-hidden">
                {/* Left Column (Controls) */}
                <div className="overflow-y-auto bg-gray-800/50">
                    {renderActivePanel()}
                </div>

                {/* Right Column (Display Area & Actions) */}
                <div className="flex flex-col bg-gray-900">
                    <div className="flex-grow p-4 min-h-0">
                         <DisplayArea
                            baseImages={baseImages}
                            finalImage={finalImage}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onSetActiveLayer={setActiveLayerId}
                            onUpdateLayer={commitLayerUpdate} // Use commit for final state updates
                            onDrawingUpdate={updateLayer} // Use update for real-time drawing
                            groundingSources={groundingSources}
                            sketchTools={sketchTools}
                            isLoading={isLoading}
                        />
                    </div>
                    {step === 'generate' && (
                         <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900 flex items-center gap-4">
                            <button
                                onClick={handleGenerateMockup}
                                disabled={isLoading || !isGenerationReady}
                                className="flex-grow bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                            >
                                {isLoading ? 'Generating...' : 'Generate Mockup'}
                            </button>
                            <button onClick={handleInspireMe} disabled={isLoading} className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 text-white" title="Inspire Me!">
                                <span>🪄</span>
                                <span className="font-semibold hidden lg:inline">Inspire Me</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
