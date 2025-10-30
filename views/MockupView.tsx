

import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

import { ControlPanel } from '../components/ControlPanel';
// FIX: Import DesignLayer from constants instead of EditorPanel
import { EditorPanel, SketchToolsConfig } from '../components/EditorPanel';
import { DisplayArea } from '../components/DisplayArea';

import {
    MockupConfig,
    GeneratedImage,
    ModificationRequest,
    GARMENT_CATEGORIES,
    DESIGN_STYLE_CATEGORIES,
    GARMENT_COLORS,
    DesignLayer,
} from '../constants';
import * as gemini from '../services/geminiService';
import type { GroundingSource } from '../services/geminiService';

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

// --- Reducer for State Management ---

interface EditorState {
    layers: DesignLayer[];
    activeLayerId: string | null;
}

interface History {
    past: EditorState[];
    future: EditorState[];
}

const initialEditorState: EditorState = {
    layers: [],
    activeLayerId: null,
};


type EditorAction =
    | { type: 'ADD_LAYER'; payload: Partial<DesignLayer> }
    | { type: 'DELETE_LAYER'; payload: { id: string } }
    | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<DesignLayer> } }
    | { type: 'COMMIT_UPDATE'; payload: { id: string; updates: Partial<DesignLayer> } }
    | { type: 'SET_ACTIVE_LAYER'; payload: { id: string | null } }
    | { type: 'REORDER_LAYER'; payload: { fromIndex: number; toIndex: number } }
    | { type: 'SET_STATE'; payload: EditorState }
    // FIX: Add UNDO and REDO types to the discriminated union to fix TS errors.
    | { type: 'RESET_STATE'; payload?: DesignLayer[] }
    | { type: 'UNDO' }
    | { type: 'REDO' };

const historyReducer = (
    state: { current: EditorState; history: History },
    action: EditorAction
): { current: EditorState; history: History } => {
    const { current, history } = state;
    const { past, future } = history;

    const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
        switch (action.type) {
            case 'ADD_LAYER': {
                const newLayer: DesignLayer = {
                    id: uuidv4(), type: 'image', content: '', position: { x: 0.5, y: 0.5 },
                    size: { width: 0.25, height: 0.25 }, rotation: 0, opacity: 1, visible: true,
                    blendMode: 'source-over', lockTransparency: false, ...action.payload,
                };
                 return {
                    ...state,
                    layers: [...state.layers, newLayer],
                    activeLayerId: newLayer.id,
                };
            }
            case 'DELETE_LAYER': {
                return {
                    ...state,
                    layers: state.layers.filter(l => l.id !== action.payload.id),
                    activeLayerId: state.activeLayerId === action.payload.id ? null : state.activeLayerId,
                };
            }
             case 'UPDATE_LAYER': {
                return {
                    ...state,
                    layers: state.layers.map(l => l.id === action.payload.id ? { ...l, ...action.payload.updates } : l),
                };
            }
            case 'COMMIT_UPDATE': {
                 return {
                    ...state,
                    layers: state.layers.map(l => l.id === action.payload.id ? { ...l, ...action.payload.updates } : l),
                };
            }
            case 'SET_ACTIVE_LAYER':
                return { ...state, activeLayerId: action.payload.id };
            case 'REORDER_LAYER': {
                const { fromIndex, toIndex } = action.payload;
                const newLayers = Array.from(state.layers);
                const [removed] = newLayers.splice(fromIndex, 1);
                newLayers.splice(toIndex, 0, removed);
                return { ...state, layers: newLayers };
            }
            case 'RESET_STATE':
                return {
                    ...initialEditorState,
                    layers: action.payload || [],
                };
             case 'SET_STATE':
                return action.payload;
            default:
                return state;
        }
    };
    
    // Actions that create a history entry
    const committingActions = ['ADD_LAYER', 'DELETE_LAYER', 'COMMIT_UPDATE', 'REORDER_LAYER', 'RESET_STATE'];
    
    if (action.type === 'UNDO') {
        if (past.length === 0) return state;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return {
            current: previous,
            history: {
                past: newPast,
                future: [current, ...future],
            },
        };
    }
    
    if (action.type === 'REDO') {
         if (future.length === 0) return state;
        const next = future[0];
        const newFuture = future.slice(1);
        return {
            current: next,
            history: {
                past: [...past, current],
                future: newFuture,
            },
        };
    }
    
    const newCurrent = editorReducer(current, action);

    if (committingActions.includes(action.type)) {
         return {
            current: newCurrent,
            history: {
                past: [...past, current],
                future: [],
            },
        };
    }

    // For non-committing actions like transient updates
    return { ...state, current: newCurrent };
};


type AppStep = 'generate' | 'design';

const TabButton: React.FC<{
    title: string; active: boolean; onClick: () => void; disabled?: boolean;
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

export const MockupView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<MockupConfig>(DEFAULT_CONFIG);
    const [baseImages, setBaseImages] = useState<GeneratedImage[]>([]);
    const [cleanBaseImages, setCleanBaseImages] = useState<GeneratedImage[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [step, setStep] = useState<AppStep>('generate');
    
    const [state, dispatch] = useReducer(historyReducer, {
        current: initialEditorState,
        history: { past: [], future: [] },
    });

    const { current: editorState, history } = state;
    const { layers, activeLayerId } = editorState;
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const [sketchTools, setSketchTools] = useState<SketchToolsConfig>({
        brushType: 'pencil', brushColor: '#ffffff', brushSize: 10, brushOpacity: 1, symmetry: 'none',
    });

    const [presets, setPresets] = useState<Record<string, MockupConfig>>({});

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('mockupPresets');
            if (savedPresets) setPresets(JSON.parse(savedPresets));
        } catch (e) { console.error("Failed to load presets", e); }
    }, []);
    
     const handleUpdateLayer = (id: string, updates: Partial<DesignLayer>, commitToHistory: boolean) => {
        const actionType = commitToHistory ? 'COMMIT_UPDATE' : 'UPDATE_LAYER';
        dispatch({ type: actionType, payload: { id, updates } });
    };

    const handleGenerateMockup = useCallback(async () => {
        setIsLoading(true);
        setBaseImages([]);
        setCleanBaseImages([]);
        setFinalImage(null);
        dispatch({ type: 'RESET_STATE' });
        setGroundingSources([]);

        const generationTask = async () => {
            if (config.selectedViews.length === 0) throw new Error("Please select at least one view.");
            
            const newImages: GeneratedImage[] = [];
            let combinedSources: GroundingSource[] = [];

            const firstView = config.selectedViews[0];
            const firstResult = await gemini.generateMockup(config, firstView);
            newImages.push({ view: firstView, url: firstResult.imageUrl });
            if (firstResult.groundingSources) combinedSources.push(...firstResult.groundingSources);

            if (config.selectedViews.length > 1) {
                const subsequentViews = config.selectedViews.slice(1);
                const additionalImages = await Promise.all(
                    subsequentViews.map(view => 
                        gemini.generateAdditionalView(firstResult.imageUrl, config, view).then(url => ({ view, url }))
                    )
                );
                newImages.push(...additionalImages);
            }
            
            const uniqueSources = Array.from(new Map(combinedSources.map(s => [s.uri, s])).values());
                
            setBaseImages(newImages);
            setCleanBaseImages(newImages);
            setGroundingSources(uniqueSources);
            setStep('design');
            return `${newImages.length} mockup view(s) generated!`;
        };
        
        const promise = generationTask();
        toast.promise(promise, {
            loading: 'Generating consistent mockup views...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config]);

    const handleInspireMe = useCallback(async () => {
        setIsLoading(true);
        const allGarments = GARMENT_CATEGORIES.flatMap(cat => cat.items);
        const allDesignStyles = DESIGN_STYLE_CATEGORIES.flatMap(cat => cat.items);
        const randomGarment = allGarments[Math.floor(Math.random() * allGarments.length)];
        const randomDesignStyle = allDesignStyles[Math.floor(Math.random() * allDesignStyles.length)];
        const randomColorString = GARMENT_COLORS[Math.floor(Math.random() * GARMENT_COLORS.length)];
        const hexMatch = randomColorString.match(/#([0-9a-fA-F]{6})/);
        const randomColor = hexMatch ? hexMatch[0] : '#000000';

        const promise = gemini.generateInspirationPrompt(randomGarment, randomDesignStyle, randomColor, config.selectedStyle)
            .then(idea => {
                setConfig(prev => ({...prev, aiApparelPrompt: idea, useAiApparel: true}));
                toast.info("Switched to 'Generate Custom Apparel' mode.");
                return `New Idea: "${idea}"`;
            });
        
        toast.promise(promise, {
            loading: 'Getting an idea from the AI...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedStyle]);

    const isGenerationReady = useMemo(() => {
        if (config.useAiApparel) return config.aiApparelPrompt.trim().length > 0;
        return !!config.selectedGarment && config.selectedViews.length > 0;
    }, [config]);

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
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            const newPresets = { ...presets };
            delete newPresets[name];
            setPresets(newPresets);
            localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
            toast.success(`Preset "${name}" deleted.`);
        }
    };

    const handleGenerateGraphic = useCallback(async (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => {
        setIsLoading(true);
        const promise = gemini.generateGraphic(prompt, config.selectedGarment, placement, color, designStyle, texturePrompt, config.selectedModel)
            .then(imageUrl => {
                dispatch({ type: 'ADD_LAYER', payload: { type: 'image', content: imageUrl }});
                return "AI graphic added as a new layer!";
            });
            
        toast.promise(promise, {
            loading: 'Generating AI graphic...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedGarment, config.selectedModel]);
    
    const handleModifyGarment = useCallback(async (modification: ModificationRequest) => {
        if (!baseImages.length) {
            toast.error("Please generate a base mockup first.");
            return;
        }
        setIsLoading(true);
        setFinalImage(null);
        dispatch({ type: 'RESET_STATE' });

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
            loading: 'Applying AI modifications...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, config]);
    
    const handleRenderRealistic = useCallback(async () => {
        if (!baseImages.length || !layers.length) return;
        setIsLoading(true);
        setFinalImage(null); // Clear previous final image

        const promise = (async () => {
            const primaryImage = baseImages[0].url;
            // FIX: Call the correct function `renderDesignOnMockup` which now exists in geminiService.
            const resultUrl = await gemini.renderDesignOnMockup(primaryImage, layers);
            
            // We now have the primary view rendered.
            // We can now propagate this design to other views.
            const sourceImage = resultUrl;
            const sourceView = baseImages[0].view;
            const targets = cleanBaseImages.slice(1);

            let finalImages = [{ view: sourceView, url: sourceImage }];

            if (targets.length > 0) {
                 const propagatedImages = await Promise.all(
                    targets.map(target => 
                        gemini.propagateDesignToView(sourceImage, target.url, sourceView, target.view)
                        .then(newUrl => ({ view: target.view, url: newUrl }))
                    )
                );
                finalImages.push(...propagatedImages);
            }
            
            setBaseImages(finalImages);
            dispatch({ type: 'RESET_STATE' }); // Clear layers after rendering
            return "Realistic mockup rendered and propagated!";
        })();
        
         toast.promise(promise, {
            loading: 'Rendering realistic composite and propagating...',
            success: (message) => message,
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, layers, cleanBaseImages]);

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
                    layers={layers} activeLayerId={activeLayerId}
                    onAddLayer={(payload) => dispatch({ type: 'ADD_LAYER', payload })}
                    onUpdateLayer={handleUpdateLayer}
                    onDeleteLayer={(id) => dispatch({ type: 'DELETE_LAYER', payload: { id }})}
                    onReorderLayer={(from, to) => dispatch({ type: 'REORDER_LAYER', payload: { fromIndex: from, toIndex: to }})}
                    onSetActiveLayer={(id) => dispatch({ type: 'SET_ACTIVE_LAYER', payload: { id }})}
                    onUndo={() => dispatch({ type: 'UNDO' as any })}
                    onRedo={() => dispatch({ type: 'REDO' as any })}
                    canUndo={canUndo} canRedo={canRedo}
                    onGenerateGraphic={handleGenerateGraphic}
                    onModifyGarment={handleModifyGarment}
                    onRenderRealistic={handleRenderRealistic}
                    isLoading={isLoading}
                    garmentDescription={config.selectedGarment}
                    garmentColor={config.selectedColor}
                    designStyle={config.selectedDesignStyle}
                    selectedStyle={config.selectedStyle}
                    sketchTools={sketchTools} setSketchTools={setSketchTools}
                />;
            default:
                return null;
        }
    };
    
    return (
        <div className="flex flex-col flex-grow min-h-0">
            <div className="flex-shrink-0 bg-gray-900 flex border-b border-gray-700 shadow-md">
                <TabButton title="1. Generate" active={step === 'generate'} onClick={() => setStep('generate')} />
                <TabButton title="2. Design" active={step === 'design'} onClick={() => setStep('design')} disabled={baseImages.length === 0} />
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] overflow-hidden">
                <div className="overflow-y-auto bg-gray-800/50">
                    {renderActivePanel()}
                </div>
                <div className="flex flex-col bg-gray-900">
                    <div className="flex-grow p-4 min-h-0">
                         <DisplayArea
                            baseImages={baseImages} finalImage={finalImage} layers={layers} activeLayerId={activeLayerId}
                            onSetActiveLayer={(id) => dispatch({ type: 'SET_ACTIVE_LAYER', payload: { id }})}
                            onUpdateLayer={handleUpdateLayer}
                            groundingSources={groundingSources} sketchTools={sketchTools} isLoading={isLoading}
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