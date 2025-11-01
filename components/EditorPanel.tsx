import React, { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { FONT_OPTIONS, GARMENT_PART_PLACEMENTS, BLEND_MODES, ModificationRequest, DESIGN_STYLE_CATEGORIES, DesignLayer, STYLE_OPTIONS } from '../constants';
import { generateInspirationPrompt, generateColorPalette, applyGraphicFilter } from '../services/geminiService';
import { 
    Undo as UndoIcon, 
    Redo as RedoIcon,
    Pencil as PencilIcon,
    Pen as PenIcon,
    Eraser as EraserIcon,
    SymmetryX as SymmetryXIcon,
    SymmetryY as SymmetryYIcon,
    Layers as LayersIcon,
    Add as AddIcon,
    MagicWand as MagicWandIcon,
    Upload as UploadIcon,
    AlignCenter,
    AlignLeft,
    AlignRight,
} from './Icons';
import { useTranslation } from '../hooks/useTranslation';

export interface SketchToolsConfig {
    brushType: 'pencil' | 'pen' | 'eraser';
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    symmetry: 'none' | 'vertical' | 'horizontal';
}

interface EditorPanelProps {
    layers: DesignLayer[];
    activeLayerId: string | null;
    onAddLayer: (layer: Partial<DesignLayer>) => void;
    onUpdateLayer: (id: string, updates: Partial<DesignLayer>, commit: boolean) => void;
    onDeleteLayer: (id: string) => void;
    onReorderLayer: (from: number, to: number) => void;
    onSetActiveLayer: (id: string | null) => void;
    onGenerateGraphic: (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => void;
    onAiEdit: (modification: ModificationRequest) => void;
    onRenderRealistic: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    garmentDescription: string;
    garmentColor: string;
    designStyle: string;
    selectedStyle: string;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    sketchTools: SketchToolsConfig;
    setSketchTools: React.Dispatch<React.SetStateAction<SketchToolsConfig>>;
}

type EditorTab = 'layers' | 'add' | 'modify' | 'sketch';

const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
        <path d="M8 8a3 3 0 0 0 3-3V3a3 3 0 0 0-6 0v2a3 3 0 0 0 3 3z"/>
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
    </svg>
);

const LoadingSpinner: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{t('editorPanel.processing')}</span>
        </div>
    );
};

// Helper per leggere il file come Data URL
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
    layers,
    activeLayerId,
    onAddLayer,
    onUpdateLayer,
    onDeleteLayer,
    onReorderLayer,
    onSetActiveLayer,
    onGenerateGraphic,
    onAiEdit,
    onRenderRealistic,
    isLoading,
    setIsLoading,
    garmentDescription,
    garmentColor,
    designStyle,
    selectedStyle,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    sketchTools,
    setSketchTools,
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('layers');
    const [graphicPrompt, setGraphicPrompt] = useState('');
    const [texturePrompt, setTexturePrompt] = useState('');
    const [graphicColor, setGraphicColor] = useState('#FFFFFF');
    const [graphicPlacement, setGraphicPlacement] = useState<string>('');
    const [modificationRequest, setModificationRequest] = useState<ModificationRequest>({
        type: 'Structural',
        content: '',
        location: '',
        style: '',
    });
    const [isInspiring, setIsInspiring] = useState(false);
    const [isSuggestingColors, setIsSuggestingColors] = useState(false);
    const [suggestedPalette, setSuggestedPalette] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const { t, language } = useTranslation();
    
    const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId), [layers, activeLayerId]);
    const modificationTypes: ModificationRequest['type'][] = ['Structural', 'Text', 'Graphic'];

    const placementOptions = useMemo(() => {
        const garmentKey = Object.keys(GARMENT_PART_PLACEMENTS)
            .sort((a, b) => b.length - a.length)
            .find(key => t(garmentDescription).toLowerCase().includes(key.toLowerCase()));
        
        return garmentKey ? GARMENT_PART_PLACEMENTS[garmentKey] : [];
    }, [garmentDescription, t]);
    
    useMemo(() => {
        if (placementOptions.length > 0) {
            if (!placementOptions.includes(graphicPlacement)) {
                setGraphicPlacement(placementOptions[0]);
            }
            if (!placementOptions.includes(modificationRequest.location)) {
                setModificationRequest(prev => ({ ...prev, location: placementOptions[0] }));
            }
        }
    }, [placementOptions, graphicPlacement, modificationRequest.location]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
           try {
                const imageDataUrl = await fileToDataUrl(e.target.files[0]);
                onAddLayer({ type: 'image', content: imageDataUrl });
           } catch (error) {
                console.error("Errore durante la lettura del file:", error);
                toast.error(t('toasts.fileReadError'));
           }
        }
        e.target.value = '';
    };

    const handleInspireMeClick = async () => {
        setIsInspiring(true);

        const allDesignStyles = DESIGN_STYLE_CATEGORIES.flatMap(cat => cat.items);
        const randomDesignStyle = allDesignStyles[Math.floor(Math.random() * allDesignStyles.length)];
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

        const promise = generateInspirationPrompt(t(garmentDescription), t(randomDesignStyle), randomColor, t(selectedStyle));

        toast.promise(promise, {
            loading: t('toasts.inspiring.loading'),
            success: (idea) => {
                setGraphicPrompt(idea);
                return t('toasts.inspiring.success').replace('{idea}', idea);
            },
            error: (err: any) => err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.',
        });

        promise.catch(() => {}).finally(() => setIsInspiring(false));
    };

     const handleSuggestColors = async () => {
        setIsSuggestingColors(true);
        const promise = generateColorPalette(garmentColor, t(designStyle));

        toast.promise(promise, {
            loading: t('toasts.generatingConcept.loading'),
            success: (palette) => {
                setSuggestedPalette(palette);
                return 'Palette suggerita! 🎨';
            },
            error: (err: any) => err instanceof Error ? err.message : 'Impossibile suggerire i colori.',
        });

        promise.catch(() => {}).finally(() => setIsSuggestingColors(false));
    };

    const handleVoiceInput = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast.error(t('toasts.micNotSupported'));
          return;
      }

      if (isRecording) {
          recognitionRef.current?.stop();
          return; // onend si occuperà dei cambi di stato
      }

      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'it-IT'; // Usa la lingua del browser per una migliore precisione

      recognition.onstart = () => {
          setIsRecording(true);
          toast.info(t('toasts.micRecordingStarted'));
      };

      recognition.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
          toast.success(t('toasts.micRecordingStopped'));
      };

      recognition.onerror = (event: any) => {
          console.error("Errore riconoscimento vocale", event.error);
          const errorKey = `toasts.micError.${event.error || 'unknown'}`;
          toast.error(t(errorKey, t('toasts.micError.unknown')));
          setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
              }
          }
          if (finalTranscript) {
             setModificationRequest(prev => ({...prev, content: (prev.content.trim() + ' ' + finalTranscript.trim()).trim()}));
          }
      };

      recognition.start();
    };
    
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            onReorderLayer(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleApplyFilter = (filterType: 'vintage' | 'glitch' | 'distress') => {
        if (!activeLayer || activeLayer.type !== 'image' || !activeLayer.content) return;
        
        setIsLoading(true);
        const promise = applyGraphicFilter(activeLayer.content, filterType)
            .then(newImageUrl => {
                onUpdateLayer(activeLayer.id, { content: newImageUrl }, true);
                return t('toasts.applyingFilter.success').replace('{filterType}', filterType);
            });

        toast.promise(promise, {
            loading: t('toasts.applyingFilter.loading').replace('{filterType}', filterType),
            success: (message) => message,
            error: (err: any) => err instanceof Error ? err.message : t('errors.unknown'),
        });
        
        promise.catch(() => {}).finally(() => setIsLoading(false));
    };


    const renderActiveTab = () => {
        switch(activeTab) {
            case 'add':
                return (
                    <div className="space-y-6">
                        {/* --- Generate Graphic --- */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">{t('editorPanel.addTab.generateTitle')}</h3>
                            <button 
                              onClick={handleInspireMeClick} 
                              disabled={isLoading || isInspiring}
                              className="flex items-center gap-2 text-sm bg-orange-600/20 text-orange-300 px-3 py-2 rounded-lg hover:bg-orange-600/40 disabled:opacity-50 transition-colors"
                              title={t('editorPanel.addTab.inspireTitle')}
                            >
                              <span>🪄</span>
                              <span>{t('editorPanel.addTab.inspireButton')}</span>
                            </button>
                          </div>
                          <textarea
                              value={graphicPrompt}
                              onChange={(e) => setGraphicPrompt(e.target.value)}
                              placeholder={t('editorPanel.addTab.promptPlaceholder')}
                              className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white resize-none"
                              disabled={isLoading || isInspiring}
                          />
                           <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.addTab.texturePromptLabel')}</label>
                              <input
                                  type="text"
                                  value={texturePrompt}
                                  onChange={(e) => setTexturePrompt(e.target.value)}
                                  placeholder={t('editorPanel.addTab.texturePromptPlaceholder')}
                                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                                  disabled={isLoading}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.addTab.placementLabel')}</label>
                                <select value={graphicPlacement} onChange={(e) => setGraphicPlacement(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" disabled={isLoading || placementOptions.length === 0}>
                                    {placementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-300">{t('editorPanel.addTab.colorLabel')}</label>
                                    <button onClick={handleSuggestColors} disabled={isLoading || isSuggestingColors} className="text-xs text-orange-400 hover:underline">
                                        {isSuggestingColors ? '...' : t('editorPanel.addTab.suggestButton')}
                                    </button>
                                </div>
                                <input type="color" value={graphicColor} onChange={(e) => setGraphicColor(e.target.value)} className="w-full h-[38px] p-1 bg-gray-700 border-gray-600 rounded-md"/>
                            </div>
                          </div>
                            {suggestedPalette.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                    {suggestedPalette.map((color, index) => (
                                        <button key={index} onClick={() => setGraphicColor(color)} className="w-full h-8 rounded-md border-2 border-transparent hover:border-white transition-all" style={{ backgroundColor: color }} title={color}/>
                                    ))}
                                </div>
                            )}
                          <button
                              onClick={() => onGenerateGraphic(graphicPrompt, graphicColor, graphicPlacement, designStyle, texturePrompt)}
                              disabled={isLoading || isInspiring || !graphicPrompt || !graphicPlacement}
                              className="w-full mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                              {isLoading ? <LoadingSpinner /> : t('editorPanel.addTab.generateButton')}
                          </button>
                        </div>
                        
                        <div className="border-t border-gray-700"></div>

                        {/* --- Base Elements --- */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t('editorPanel.addTab.baseElementsTitle')}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onAddLayer({ type: 'text', content: 'Hello World', fontFamily: 'Arial', color: '#FFFFFF' })} className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md">{t('editorPanel.addTab.addText')}</button>
                                <button onClick={() => onAddLayer({ type: 'drawing', content: '' })} className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md">{t('editorPanel.addTab.addSketchLayer')}</button>
                                <button onClick={() => onAddLayer({ type: 'shape', content: 'rectangle', fill: '#FFFFFF' })} className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md">{t('editorPanel.addTab.addRectangle')}</button>
                                <button onClick={() => onAddLayer({ type: 'shape', content: 'circle', fill: '#FFFFFF' })} className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md">{t('editorPanel.addTab.addCircle')}</button>
                            </div>
                        </div>

                        <div className="border-t border-gray-700"></div>

                        {/* --- Upload Graphic --- */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t('editorPanel.addTab.uploadTitle')}</h3>
                            <label htmlFor="file-upload" className="w-full cursor-pointer flex flex-col items-center justify-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border-2 border-dashed border-gray-500">
                                <UploadIcon className="h-8 w-8 text-gray-400" />
                                <span className="mt-2 text-sm text-gray-400">{t('editorPanel.addTab.uploadButton')}</span>
                                <span className="text-xs text-gray-500">{t('editorPanel.addTab.uploadHint')}</span>
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileUpload} />
                        </div>
                    </div>
                );
            case 'modify':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">{t('editorPanel.modifyTab.title')}</h3>
                        <p className="text-xs text-gray-400 -mt-2">{t('editorPanel.modifyTab.description')}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.modifyTab.typeLabel')}</label>
                            <select
                                value={modificationRequest.type}
                                onChange={(e) => setModificationRequest(prev => ({ ...prev, type: e.target.value as ModificationRequest['type'] }))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                            >
                                {modificationTypes.map(type => <option key={type} value={type}>{t(`modificationType.${type.toLowerCase()}`, type)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.modifyTab.contentLabel')}</label>
                            <div className="relative">
                                <textarea
                                    value={modificationRequest.content}
                                    onChange={(e) => setModificationRequest(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder={modificationRequest.type === 'Structural' ? "e.g., add a zipper to the front" : "e.g., the text 'APEX'"}
                                    rows={3}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 pr-10"
                                />
                                <button
                                    onClick={handleVoiceInput}
                                    className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600/50 hover:bg-gray-500/50'}`}
                                    title={isRecording ? t('controlPanel.mic.stop') : "Record Modification"}
                                >
                                    {isRecording ? <StopIcon /> : <MicIcon />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.modifyTab.styleLabel')}</label>
                            <input
                                type="text"
                                value={modificationRequest.style}
                                onChange={(e) => setModificationRequest(prev => ({ ...prev, style: e.target.value }))}
                                placeholder={t('editorPanel.modifyTab.stylePlaceholder')}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.modifyTab.locationLabel')}</label>
                            <select
                                value={modificationRequest.location}
                                onChange={(e) => setModificationRequest(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                                disabled={placementOptions.length === 0}
                            >
                                {placementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => onAiEdit(modificationRequest)}
                            disabled={isLoading || !modificationRequest.content || !modificationRequest.location}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : t('editorPanel.modifyTab.applyButton')}
                        </button>

                        <div className="border-t border-gray-700 pt-4 mt-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('editorPanel.modifyTab.quickEditsTitle')}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => onAiEdit({ type: 'Structural', content: 'a subtle, contrasting white trim', location: 'collar', style: '' })}
                                    disabled={isLoading}
                                    className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md text-xs disabled:opacity-50"
                                >
                                    {t('editorPanel.modifyTab.addCollarTrim')}
                                </button>
                                <button 
                                    onClick={() => onAiEdit({ type: 'Structural', content: 'realistic stitching details along all visible seams (shoulders, sleeves, hem)', location: 'seams', style: 'matching the garment fabric color' })}
                                    disabled={isLoading}
                                    className="text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md text-xs disabled:opacity-50"
                                >
                                    {t('editorPanel.modifyTab.addStitching')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'sketch':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">{t('editorPanel.sketchTab.title')}</h3>
                        {activeLayer?.type !== 'drawing' ? (
                             <div className="text-center text-gray-400 p-4 bg-gray-900/50 rounded-lg">
                                 <p>Select a sketch layer to use these tools, or add one from the 'Add' tab.</p>
                             </div>
                        ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('editorPanel.sketchTab.brushTypeLabel')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => setSketchTools(s => ({...s, brushType: 'pencil'}))} className={`p-2 rounded-md ${sketchTools.brushType === 'pencil' ? 'bg-orange-600' : 'bg-gray-700'}`}><PencilIcon className="mx-auto" /></button>
                                    <button onClick={() => setSketchTools(s => ({...s, brushType: 'pen'}))} className={`p-2 rounded-md ${sketchTools.brushType === 'pen' ? 'bg-orange-600' : 'bg-gray-700'}`}><PenIcon className="mx-auto" /></button>
                                    <button onClick={() => setSketchTools(s => ({...s, brushType: 'eraser'}))} className={`p-2 rounded-md ${sketchTools.brushType === 'eraser' ? 'bg-orange-600' : 'bg-gray-700'}`}><EraserIcon className="mx-auto" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.sketchTab.brushColorLabel')}</label>
                                <input type="color" value={sketchTools.brushColor} onChange={e => setSketchTools(s => ({...s, brushColor: e.target.value}))} className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.sketchTab.brushSizeLabel')} ({sketchTools.brushSize}px)</label>
                                <input type="range" min="1" max="100" value={sketchTools.brushSize} onChange={e => setSketchTools(s => ({...s, brushSize: parseInt(e.target.value)}))} className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.sketchTab.brushOpacityLabel')} ({Math.round(sketchTools.brushOpacity * 100)}%)</label>
                                <input type="range" min="0.01" max="1" step="0.01" value={sketchTools.brushOpacity} onChange={e => setSketchTools(s => ({...s, brushOpacity: parseFloat(e.target.value)}))} className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('editorPanel.sketchTab.symmetryLabel')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => setSketchTools(s => ({...s, symmetry: 'none'}))} className={`p-2 rounded-md ${sketchTools.symmetry === 'none' ? 'bg-orange-600' : 'bg-gray-700'}`}>{t('editorPanel.sketchTab.symmetryOff')}</button>
                                    <button onClick={() => setSketchTools(s => ({...s, symmetry: 'vertical'}))} className={`p-2 rounded-md ${sketchTools.symmetry === 'vertical' ? 'bg-orange-600' : 'bg-gray-700'}`}><SymmetryYIcon className="mx-auto" /></button>
                                    <button onClick={() => setSketchTools(s => ({...s, symmetry: 'horizontal'}))} className={`p-2 rounded-md ${sketchTools.symmetry === 'horizontal' ? 'bg-orange-600' : 'bg-gray-700'}`}><SymmetryXIcon className="mx-auto" /></button>
                                </div>
                            </div>
                        </>
                        )}
                    </div>
                );
            case 'layers':
            default:
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">{t('editorPanel.layersTab.title')}</h3>
                            <div className="flex gap-2">
                                <button onClick={onUndo} disabled={!canUndo} title={t('editorPanel.layersTab.undo')} className="p-2 bg-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-600"><UndoIcon /></button>
                                <button onClick={onRedo} disabled={!canRedo} title={t('editorPanel.layersTab.redo')} className="p-2 bg-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-600"><RedoIcon /></button>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-2 space-y-2 min-h-[150px]">
                            {layers.length === 0 ? (
                                <div className="text-center text-sm text-gray-400 py-10">{t('editorPanel.layersTab.empty')}</div>
                            ) : (
                                layers.slice().reverse().map((layer, index) => {
                                    const originalIndex = layers.length - 1 - index;
                                    const layerName = layer.type === 'shape' ? t('editorPanel.layerName.shape', 'Forma {shape}').replace('{shape}', t(`editorPanel.layerName.${layer.content}`, layer.content))
                                        : layer.type === 'text' ? t('editorPanel.layerName.text', '{content}').replace('{content}', layer.content.substring(0, 15) + (layer.content.length > 15 ? '...' : ''))
                                        : layer.type === 'drawing' ? t('editorPanel.layerName.sketch')
                                        : t('editorPanel.layerName.image');
                                    
                                    return (
                                        <div
                                            key={layer.id}
                                            draggable
                                            onDragStart={() => dragItem.current = originalIndex}
                                            onDragEnter={() => dragOverItem.current = originalIndex}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            onClick={() => onSetActiveLayer(layer.id)}
                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${activeLayerId === layer.id ? 'bg-orange-600/30' : 'bg-gray-700 hover:bg-gray-600/70'}`}
                                        >
                                            <button onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible }, true)}>
                                                {layer.visible ? '👁️' : '🙈'}
                                            </button>
                                            <span className="flex-grow truncate text-sm">{layerName}</span>
                                            <button onClick={() => onDeleteLayer(layer.id)} className="text-red-500 hover:text-red-400">🗑️</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={onRenderRealistic}
                            disabled={isLoading || layers.length === 0 || !layers.some(l => l.visible)}
                            className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : t('editorPanel.layersTab.renderButton')}
                        </button>
                        {!layers.some(l => l.visible) && layers.length > 0 && <p className="text-xs text-center text-gray-500">{t('editorPanel.layersTab.renderButtonDisabled')}</p>}

                        {activeLayer && (
                            <div className="space-y-4 border-t border-gray-700 pt-4">
                                <h4 className="font-semibold text-white">{t('editorPanel.layersTab.propertiesTitle')}</h4>
                                {activeLayer.type === 'image' && (
                                     <div>
                                        <h5 className="text-sm font-medium text-gray-300 mb-2">{t('editorPanel.layersTab.filtersTitle')}</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button onClick={() => handleApplyFilter('vintage')} disabled={isLoading} className="text-xs bg-gray-700 p-2 rounded hover:bg-gray-600 disabled:opacity-50">{t('editorPanel.layersTab.filterVintage')}</button>
                                            <button onClick={() => handleApplyFilter('glitch')} disabled={isLoading} className="text-xs bg-gray-700 p-2 rounded hover:bg-gray-600 disabled:opacity-50">{t('editorPanel.layersTab.filterGlitch')}</button>
                                            <button onClick={() => handleApplyFilter('distress')} disabled={isLoading} className="text-xs bg-gray-700 p-2 rounded hover:bg-gray-600 disabled:opacity-50">{t('editorPanel.layersTab.filterDistress')}</button>
                                        </div>
                                     </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.opacityLabel')}</label>
                                    <input type="range" min="0" max="1" step="0.01" value={activeLayer.opacity}
                                        onChange={(e) => onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) }, false)}
                                        onMouseUp={() => onUpdateLayer(activeLayer.id, {}, true)}
                                        className="w-full"
                                    />
                                </div>
                                {activeLayer.type === 'text' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.fontLabel')}</label>
                                            <select value={activeLayer.fontFamily} onChange={(e) => onUpdateLayer(activeLayer.id, { fontFamily: e.target.value }, true)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2">
                                                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.fontWeightLabel')}</label>
                                            <select value={activeLayer.fontWeight} onChange={(e) => onUpdateLayer(activeLayer.id, { fontWeight: e.target.value as 'normal' | 'bold' }, true)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2">
                                                <option value="normal">{t('editorPanel.layersTab.fontWeightNormal')}</option>
                                                <option value="bold">{t('editorPanel.layersTab.fontWeightBold')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.alignmentLabel')}</label>
                                             <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => onUpdateLayer(activeLayer.id, { textAlign: 'left' }, true)} className={`p-2 rounded-md ${activeLayer.textAlign === 'left' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignLeft className="mx-auto" /></button>
                                                <button onClick={() => onUpdateLayer(activeLayer.id, { textAlign: 'center' }, true)} className={`p-2 rounded-md ${activeLayer.textAlign === 'center' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignCenter className="mx-auto" /></button>
                                                <button onClick={() => onUpdateLayer(activeLayer.id, { textAlign: 'right' }, true)} className={`p-2 rounded-md ${activeLayer.textAlign === 'right' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignRight className="mx-auto" /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.colorLabel')}</label>
                                            <input type="color" value={activeLayer.color} onChange={(e) => onUpdateLayer(activeLayer.id, { color: e.target.value }, true)} className="w-full h-8 p-1 bg-gray-700 border-gray-600 rounded-md" />
                                        </div>
                                    </>
                                )}
                                 {activeLayer.type === 'shape' && (
                                     <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.fillColorLabel')}</label>
                                        <input type="color" value={activeLayer.fill} onChange={(e) => onUpdateLayer(activeLayer.id, { fill: e.target.value }, true)} className="w-full h-8 p-1 bg-gray-700 border-gray-600 rounded-md" />
                                    </div>
                                 )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('editorPanel.layersTab.blendModeLabel')}</label>
                                    <select value={activeLayer.blendMode} onChange={(e) => onUpdateLayer(activeLayer.id, { blendMode: e.target.value }, true)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2">
                                        {BLEND_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                    </select>
                                </div>
                                {activeLayer.type === 'drawing' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-300">{t('editorPanel.layersTab.lockTransparencyLabel')}</span>
                                        <button
                                            type="button"
                                            className={`${activeLayer.lockTransparency ? 'bg-orange-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11`}
                                            onClick={() => onUpdateLayer(activeLayer.id, { lockTransparency: !activeLayer.lockTransparency }, true)}
                                        >
                                            <span className={`${activeLayer.lockTransparency ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
        }
    };

    const tabs: {id: EditorTab, icon: React.ReactNode, name: string}[] = [
        { id: 'layers', icon: <LayersIcon />, name: t('editorPanel.tabs.layers') },
        { id: 'add', icon: <AddIcon />, name: t('editorPanel.tabs.add') },
        { id: 'modify', icon: <MagicWandIcon />, name: t('editorPanel.tabs.modify') },
        { id: 'sketch', icon: <PencilIcon />, name: t('editorPanel.tabs.sketch') },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 grid grid-cols-4 gap-1 bg-gray-900/50 p-1 rounded-t-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md text-xs transition-colors ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >
                        {tab.icon}
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {renderActiveTab()}
            </div>
        </div>
    );
};