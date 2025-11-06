


import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

import { ControlPanel } from '../components/ControlPanel';
import { EditorPanel, SketchToolsConfig } from '../components/EditorPanel';
import { DisplayArea } from '../components/DisplayArea';
import { MagicWand } from '../components/Icons';

import {
    MockupConfig, GeneratedImage, ModificationRequest, GARMENT_CATEGORIES,
    DESIGN_STYLE_CATEGORIES, DesignLayer, STYLE_OPTIONS, FIT_OPTIONS, TREND_PRESETS
} from '../constants';
import * as gemini from '../services/geminiService';
import { GeminiError } from '../services/errors';
import type { GroundingSource, PrintArea } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';

const uuidv4 = () => crypto.randomUUID();

const DEFAULT_CONFIG: MockupConfig = {
    easyPrompt: '',
    selectedCategory: 'garmentCategory.tops_sweatshirts_hoodies',
    selectedGarment: 'garment.hoodie_pullover',
    selectedDesignStyle: 'designStyle.streetwear',
    selectedColor: '#1a1a1a',
    aiMaterialPrompt: 'Pile', // This will be overwritten by translation
    fit: 'fit.regular',
    selectedStyle: STYLE_OPTIONS.PHOTOREALISTIC,
    selectedViews: ['Front'],
    aiApparelPrompt: '',
    useAiApparel: false,
    aiModelPrompt: 'modello maschile, corporatura atletica, in piedi su sfondo neutro',
    aiScenePrompt: 'in uno studio fotografico minimalista con luci soffuse',
    useAiModelScene: false,
    useGoogleSearch: false,
    selectedModel: 'gemini-2.5-flash-image',
};

// --- Reducer per la Gestione dello Stato ---

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
    
    // Azioni che creano una voce di cronologia
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

    // Per azioni non di commit come aggiornamenti transitori
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
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<MockupConfig>({
        ...DEFAULT_CONFIG,
        aiMaterialPrompt: t('material.fleece'),
    });
    const [baseImages, setBaseImages] = useState<GeneratedImage[]>([]);
    const [cleanBaseImages, setCleanBaseImages] = useState<GeneratedImage[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [printArea, setPrintArea] = useState<PrintArea | null>(null);
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
        } catch (e) { console.error("Impossibile caricare i preset", e); }
    }, []);
    
     const handleUpdateLayer = (id: string, updates: Partial<DesignLayer>, commitToHistory: boolean) => {
        const actionType = commitToHistory ? 'COMMIT_UPDATE' : 'UPDATE_LAYER';
        dispatch({ type: actionType, payload: { id, updates } });
    };

    const handleRenderRealistic = useCallback(async (imagesToRenderOn?: GeneratedImage[]) => {
        const currentBaseImages = imagesToRenderOn || baseImages;
        if (!currentBaseImages.length || !layers.length) {
            if (layers.length === 0 && imagesToRenderOn) {
                 return;
            }
            return;
        };
        setIsLoading(true);
        setFinalImage(null);

        const promise = (async () => {
            const primaryImage = currentBaseImages[0].url;
            const resultUrl = await gemini.renderDesignOnMockup(primaryImage, layers, config.selectedDesignStyle);
            
            const sourceImage = resultUrl;
            const sourceView = currentBaseImages[0].view;
            const targets = cleanBaseImages.slice(1);

            let finalImages = [{ view: sourceView, url: sourceImage }];

            if (targets.length > 0) {
                 const propagatedImages = await Promise.all(
                    targets.map(target => 
                        gemini.propagateDesignToView(sourceImage, target.url, sourceView, target.view, config.selectedDesignStyle)
                        .then(newUrl => ({ view: target.view, url: newUrl }))
                    )
                );
                finalImages.push(...propagatedImages);
            }
            
            setBaseImages(finalImages);
            dispatch({ type: 'RESET_STATE' });
            return t('toasts.renderingComposite.success');
        })();
        
         toast.promise(promise, {
            loading: t('toasts.renderingComposite.loading'),
            success: (message) => message,
            error: (err: any) => {
                const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, layers, cleanBaseImages, config.selectedDesignStyle, t]);


    const handleGenerateMockup = useCallback(async () => {
        setIsLoading(true);
        setBaseImages([]);
        setCleanBaseImages([]);
        setFinalImage(null);
        dispatch({ type: 'RESET_STATE' });
        setGroundingSources([]);
        setPrintArea(null);

        const generationTask = async () => {
            if (config.selectedViews.length === 0) throw new GeminiError('select_view', 'Please select at least one view.');
            
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

             try {
                const area = await gemini.analyzePrintArea(newImages[0].url);
                setPrintArea(area);
                toast.success(t('toasts.printAreaAnalyzed'));
            } catch(e) {
                toast.error(t('errors.print_area_analysis_failed'));
                console.error(e);
            }
            
            setStep('design');
            return t('toasts.generatingViews.success').replace('{count}', newImages.length.toString());
        };
        
        const promise = generationTask();
        toast.promise(promise, {
            loading: t('toasts.generatingViews.loading'),
            success: (message) => message,
            error: (err: any) => {
                const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config, t]);

    const handleInspireMe = useCallback(async () => {
        setIsLoading(true);
        const allGarments = GARMENT_CATEGORIES.flatMap(cat => cat.items);
        const allDesignStyles = DESIGN_STYLE_CATEGORIES.flatMap(cat => cat.items);
        const randomGarment = allGarments[Math.floor(Math.random() * allGarments.length)];
        const randomDesignStyle = allDesignStyles[Math.floor(Math.random() * allDesignStyles.length)];
        
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

        const promise = gemini.generateInspirationPrompt(t(randomGarment), t(randomDesignStyle), randomColor, t(config.selectedStyle))
            .then(idea => {
                setConfig(prev => ({...prev, aiApparelPrompt: idea, useAiApparel: true}));
                toast.info(t('toasts.inspiring.info'));
                return t('toasts.inspiring.success').replace('{idea}', idea);
            });
        
        toast.promise(promise, {
            loading: t('toasts.inspiring.loading'),
            success: (message) => message,
            error: (err: any) => {
                 const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedStyle, t]);

    const isGenerationReady = useMemo(() => {
        if (config.useAiApparel) return config.aiApparelPrompt.trim().length > 0;
        return !!config.selectedGarment && config.selectedViews.length > 0;
    }, [config]);

    const handleSavePreset = () => {
        const name = prompt(t('profile.save'));
        if (name) {
            if (presets[name]) {
                if (!window.confirm(t('toasts.presetExists').replace('{name}', name))) {
                    return;
                }
            }
            const newPresets = { ...presets, [name]: config };
            setPresets(newPresets);
            localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
            toast.success(t('toasts.presetSaved').replace('{name}', name));
        }
    };

    const handleLoadPreset = (name: string) => {
        if (presets[name]) {
            setConfig(presets[name]);
            toast.info(t('toasts.presetLoaded').replace('{name}', name));
        }
    };
    
    const handleDeletePreset = (name: string) => {
        if (window.confirm(t('profile.accountManagement.deleteAccount'))) {
            const newPresets = { ...presets };
            delete newPresets[name];
            setPresets(newPresets);
            localStorage.setItem('mockupPresets', JSON.stringify(newPresets));
            toast.success(t('toasts.presetDeleted').replace('{name}', name));
        }
    };

    const handleGenerateGraphic = useCallback(async (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => {
        setIsLoading(true);
        const promise = gemini.generateGraphic(prompt, t(config.selectedGarment), placement, color, t(designStyle), texturePrompt, config.selectedModel)
            .then(imageUrl => {
                dispatch({ type: 'ADD_LAYER', payload: { type: 'image', content: imageUrl }});
                return t('toasts.generatingGraphic.success');
            });
            
        toast.promise(promise, {
            loading: t('toasts.generatingGraphic.loading'),
            success: (message) => message,
            error: (err: any) => {
                 const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [config.selectedGarment, config.selectedModel, t]);
    
    const handleAiEdit = useCallback(async (modification: ModificationRequest) => {
        if (!baseImages.length) {
            toast.error(t('errors.generate_base_first'));
            return;
        }
        setIsLoading(true);
        
        const primaryView = baseImages[0];
        
        const promise = gemini.modifyGarmentImage(primaryView.url, modification, t(config.selectedDesignStyle))
            .then(async (modifiedImageUrl) => {
                const newBaseImages = [{ ...primaryView, url: modifiedImageUrl }];
                const newCleanBaseImages = [...cleanBaseImages];
                newCleanBaseImages[0] = { ...newCleanBaseImages[0], url: modifiedImageUrl };
                setCleanBaseImages(newCleanBaseImages);

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
                toast.success(t('toasts.garmentModified'));
                
                await handleRenderRealistic(newBaseImages);
                return t('toasts.applyingEdit.success');
            });
            
        toast.promise(promise, {
            loading: t('toasts.applyingEdit.loading'),
            success: (message) => message,
            error: (err: any) => {
                 const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [baseImages, cleanBaseImages, config, t, handleRenderRealistic]);

    
    const handleLoadTrendPreset = (presetKey: string) => {
        let newConfig: Partial<MockupConfig> = {};
        switch (presetKey) {
            case "trend.90s_grunge_tee":
                newConfig = {
                    selectedCategory: 'garmentCategory.tops_casual',
                    selectedGarment: 'garment.tshirt_basic_crew',
                    selectedDesignStyle: 'designStyle.90s_grunge',
                    fit: 'fit.oversized',
                    aiMaterialPrompt: t('material.heavyweight_cotton'),
                    selectedColor: '#2a2a2a',
                };
                break;
            case "trend.y2k_juicy":
                 newConfig = {
                    selectedCategory: 'garmentCategory.tops_sweatshirts_hoodies',
                    selectedGarment: 'garment.zip_up_hoodie',
                    selectedDesignStyle: 'designStyle.y2k_early_2000s',
                    fit: 'fit.cropped',
                    aiMaterialPrompt: t('material.velour'),
                    selectedColor: '#ff69b4', // Hot Pink
                };
                break;
             case "trend.gorpcore_tech":
                 newConfig = {
                    selectedCategory: 'garmentCategory.outerwear_jackets',
                    selectedGarment: 'garment.anorak',
                    selectedDesignStyle: 'designStyle.gorpcore_outdoor',
                    fit: 'fit.regular',
                    aiMaterialPrompt: t('material.ripstop'),
                    selectedColor: '#808000', // Olive
                };
                break;
            case "trend.minimalist_streetwear":
                 newConfig = {
                    selectedCategory: 'garmentCategory.tops_sweatshirts_hoodies',
                    selectedGarment: 'garment.crewneck_sweatshirt',
                    selectedDesignStyle: 'designStyle.minimalist_normcore',
                    fit: 'fit.oversized',
                    aiMaterialPrompt: t('material.loopback_cotton'),
                    selectedColor: '#e5e5e5', // Light grey
                };
                break;
             case "trend.darkwear_utility":
                 newConfig = {
                    selectedCategory: 'garmentCategory.outerwear_vests',
                    selectedGarment: 'garment.vest_gilet',
                    selectedDesignStyle: 'designStyle.cyberpunk_techwear',
                    fit: 'fit.regular',
                    aiMaterialPrompt: t('material.heavyweight_canvas'),
                    selectedColor: '#1a1a1a',
                };
                break;
        }
        setConfig(prev => ({ ...prev, ...newConfig, useAiApparel: false }));
        toast.success(t('toasts.trendPresetLoaded').replace('{preset}', t(presetKey)));
    };
    
    const handleGenerateGarmentConcept = async (styleA: string, styleB: string) => {
        const promise = gemini.generateGarmentConcept(t(config.selectedGarment), t(styleA), t(styleB))
            .then(concept => {
                setConfig(prev => ({
                    ...prev,
                    aiApparelPrompt: concept,
                    useAiApparel: true,
                    selectedDesignStyle: styleA, // Prioritize style A for persona
                }));
                return t('toasts.generatingConcept.success');
            });
        
        toast.promise(promise, {
            loading: t('toasts.generatingConcept.loading'),
            success: (message) => message,
            error: (err: any) => {
                 const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });

        await promise;
    };

    const handleParseEasyPrompt = useCallback(async (prompt: string) => {
        setIsLoading(true);
        const promise = gemini.parseEasyPrompt(prompt)
            .then(parsedConfig => {
                setConfig(prev => ({ ...prev, ...parsedConfig }));
                return t('toasts.parsingPrompt.success');
            });

        toast.promise(promise, {
            loading: t('toasts.parsingPrompt.loading'),
            success: (message) => message,
            error: (err: any) => {
                 const messageKey = err instanceof GeminiError ? `errors.${err.code}` : 'errors.unknown';
                return t(messageKey, err.message);
            }
        });

        promise.catch(() => {}).finally(() => setIsLoading(false));
    }, [t]);


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
                            onLoadTrendPreset={handleLoadTrendPreset}
                            onGenerateGarmentConcept={handleGenerateGarmentConcept}
                            onParseEasyPrompt={handleParseEasyPrompt}
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
                    onAiEdit={handleAiEdit}
                    onRenderRealistic={() => handleRenderRealistic()}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    garmentDescription={config.selectedGarment}
                    garmentColor={config.selectedColor}
                    designStyle={config.selectedDesignStyle}
                    selectedStyle={config.selectedStyle}
                    sketchTools={sketchTools} setSketchTools={setSketchTools}
                    printArea={printArea}
                />;
            default:
                return null;
        }
    };
    
    return (
        <main className="flex flex-col flex-grow min-h-0">
            <div className="flex-shrink-0 bg-gray-900 flex border-b border-gray-700 shadow-md">
                <TabButton title={t('tabs.generate')} active={step === 'generate'} onClick={() => setStep('generate')} />
                <TabButton title={t('tabs.design')} active={step === 'design'} onClick={() => setStep('design')} disabled={baseImages.length === 0} />
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] overflow-hidden">
                <aside className="overflow-y-auto bg-gray-800/50 border-r border-gray-700">
                    {renderActivePanel()}
                </aside>
                <section className="flex flex-col bg-gray-900 p-4 min-h-0">
                     <DisplayArea
                        baseImages={baseImages}
                        finalImage={finalImage}
                        layers={layers}
                        activeLayerId={activeLayerId}
                        onSetActiveLayer={(id) => dispatch({ type: 'SET_ACTIVE_LAYER', payload: { id }})}
                        onUpdateLayer={handleUpdateLayer}
                        groundingSources={groundingSources}
                        sketchTools={sketchTools}
                        isLoading={isLoading}
                        selectedGarment={config.selectedGarment}
                        printArea={printArea}
                        cleanBaseImages={cleanBaseImages}
                    />
                </section>
            </div>

            {step === 'generate' && (
                 <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900 flex items-center justify-center gap-4">
                    <button
                        onClick={handleGenerateMockup}
                        disabled={isLoading || !isGenerationReady}
                        className="flex-grow bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    >
                        {isLoading ? t('generateButton.loading') : t('generateButton.default')}
                    </button>
                    <button onClick={handleInspireMe} disabled={isLoading} className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 text-white" title={t('inspireButton.title')}>
                        <MagicWand className="h-5 w-5" />
                        <span className="font-semibold hidden lg:inline">{t('inspireButton.default')}</span>
                    </button>
                </footer>
            )}
        </main>
    );
};