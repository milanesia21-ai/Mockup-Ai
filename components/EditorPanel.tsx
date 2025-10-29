import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { FONT_OPTIONS, GARMENT_PART_PLACEMENTS } from '../constants';
import { generateInspirationPrompt, generateColorPalette } from '../services/geminiService';
import { 
    Undo as UndoIcon, 
    Redo as RedoIcon,
} from './Icons';

export interface DesignLayer {
    id: string;
    type: 'image' | 'text' | 'shape';
    content: string; // URL for image, text content for text, shape type for shape
    position: { x: number; y: number }; // Center, percentage based
    size: { width: number, height: number }; // Percentage of container
    rotation: number;
    opacity: number;
    visible: boolean;
    // Text specific
    fontFamily?: string;
    fontSize?: number; // Relative size
    fontWeight?: string;
    color?: string;
    // Shape specific
    fill?: string;
}

export interface ModificationRequest {
  type: 'Structural' | 'Text' | 'Graphic';
  content: string;
  location: string;
  style: string;
}

interface EditorPanelProps {
    layers: DesignLayer[];
    activeLayerId: string | null;
    onAddLayer: (layer: Partial<DesignLayer>) => void;
    onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
    onDeleteLayer: (id: string) => void;
    onReorderLayer: (from: number, to: number) => void;
    onSetActiveLayer: (id: string | null) => void;
    onGenerateGraphic: (prompt: string, color: string, placement: string, designStyle: string, texturePrompt?: string) => void;
    onModifyGarment: (modification: ModificationRequest) => void;
    onRenderRealistic: () => void;
    onPropagateDesign: () => void;
    finalRenderedImage: string | null;
    isLoading: boolean;
    garmentDescription: string;
    garmentColor: string;
    designStyle: string;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

type EditorTab = 'layers' | 'generate' | 'text' | 'elements' | 'uploads';

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

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Processing...</span>
    </div>
);

// Helper to read file as Data URL
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
    onModifyGarment,
    onRenderRealistic,
    onPropagateDesign,
    finalRenderedImage,
    isLoading,
    garmentDescription,
    garmentColor,
    designStyle,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('generate');
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
    
    const activeLayer = layers.find(l => l.id === activeLayerId);

    const placementOptions = useMemo(() => {
        const garmentDescLower = garmentDescription.toLowerCase();
        const garmentKey = Object.keys(GARMENT_PART_PLACEMENTS)
            .sort((a, b) => b.length - a.length)
            .find(key => garmentDescLower.includes(key.toLowerCase()));
        
        return garmentKey ? GARMENT_PART_PLACEMENTS[garmentKey] : [];
    }, [garmentDescription]);
    
    useEffect(() => {
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
                console.error("Error reading file:", error);
           }
        }
        e.target.value = '';
    };

    const handleInspireMeClick = async () => {
        setIsInspiring(true);
        const promise = generateInspirationPrompt(garmentDescription);

        toast.promise(promise, {
            loading: 'Getting an idea from the AI...',
            success: (idea) => {
                setGraphicPrompt(idea);
                return 'Idea generated! ✨';
            },
            error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
        });

        promise.catch(() => {}).finally(() => setIsInspiring(false));
    };

     const handleSuggestColors = async () => {
        setIsSuggestingColors(true);
        const promise = generateColorPalette(garmentColor, designStyle);

        toast.promise(promise, {
            loading: 'Generating color palette...',
            success: (palette) => {
                setSuggestedPalette(palette);
                return 'Palette suggested! 🎨';
            },
            error: (err) => err instanceof Error ? err.message : 'Could not suggest colors.',
        });

        promise.catch(() => {}).finally(() => setIsSuggestingColors(false));
    };

    const handleVoiceInput = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast.error("Speech recognition is not supported in your browser.");
          return;
      }

      if (isRecording) {
          recognitionRef.current?.stop();
          return; // onend will handle state changes
      }

      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US'; // Use browser language for better accuracy

      recognition.onstart = () => {
          setIsRecording(true);
          toast.info("Recording started. Speak your modification request.");
      };

      recognition.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
          toast.success("Recording stopped.");
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          let errorMessage = "An unknown error occurred.";
          if (event.error === 'no-speech') errorMessage = "No speech was detected.";
          else if (event.error === 'audio-capture') errorMessage = "No microphone was found.";
          else if (event.error === 'not-allowed') errorMessage = "Microphone access was denied.";
          toast.error(errorMessage);
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


    const renderActiveTab = () => {
        switch(activeTab) {
            case 'generate':
                return (
                    <div>
                        {/* --- Generate Graphic --- */}
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-white">Generate AI Graphic</h3>
                          <button 
                            onClick={handleInspireMeClick} 
                            disabled={isLoading || isInspiring}
                            className="flex items-center gap-2 text-sm bg-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            title="Let the AI suggest a design idea"
                          >
                            <span>🪄</span>
                            <span>Inspire Me</span>
                          </button>
                        </div>
                        <textarea
                            value={graphicPrompt}
                            onChange={(e) => setGraphicPrompt(e.target.value)}
                            placeholder="e.g., A retro-style phoenix, vector art"
                            className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                            disabled={isLoading || isInspiring}
                        />
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Texture Prompt (Optional)</label>
                            <textarea
                                value={texturePrompt}
                                onChange={(e) => setTexturePrompt(e.target.value)}
                                placeholder="e.g., embroidered patch, leather, denim"
                                className="w-full h-16 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                                disabled={isLoading}
                            />
                        </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Placement</label>
                            <select
                                value={graphicPlacement}
                                onChange={(e) => setGraphicPlacement(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500"
                                disabled={isLoading || placementOptions.length === 0}
                            >
                                {placementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                         <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-300">Graphic Color</label>
                                <button 
                                    onClick={handleSuggestColors}
                                    disabled={isLoading || isSuggestingColors}
                                    className="text-xs text-indigo-400 hover:underline disabled:opacity-50"
                                >
                                    {isSuggestingColors ? 'Suggesting...' : '🎨 Suggest Colors'}
                                </button>
                            </div>
                            <input
                                type="color"
                                value={graphicColor}
                                onChange={(e) => setGraphicColor(e.target.value)}
                                className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md"
                            />
                            {suggestedPalette.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                    {suggestedPalette.map((color, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setGraphicColor(color)}
                                            className="w-full h-8 rounded-md border-2 border-transparent hover:border-white transition-all"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                         <button
                            onClick={() => onGenerateGraphic(graphicPrompt, graphicColor, graphicPlacement, designStyle, texturePrompt)}
                            disabled={isLoading || isInspiring || !graphicPrompt || !graphicPlacement}
                            className="w-full mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Generate & Add To Layers'}
                        </button>
                        
                        {/* --- Modify Garment --- */}
                        <div className="border-t border-gray-700 my-6"></div>
                        <h3 className="text-lg font-semibold text-white mb-2">Direct-to-Garment AI</h3>
                        <p className="text-sm text-gray-400 mb-4">Apply realistic modifications directly to the base mockup.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Modification Type</label>
                                <select value={modificationRequest.type} onChange={e => setModificationRequest(prev => ({...prev, type: e.target.value as ModificationRequest['type']}))} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                                    <option>Structural</option>
                                    <option>Text</option>
                                    <option>Graphic</option>
                                </select>
                            </div>
                             <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Content / Description</label>
                                <textarea
                                    value={modificationRequest.content}
                                    onChange={e => setModificationRequest(prev => ({...prev, content: e.target.value}))}
                                    placeholder={
                                        modificationRequest.type === 'Structural' ? "e.g., 'add a zipper' or 'make the collar blue'" :
                                        modificationRequest.type === 'Text' ? "e.g., 'CALIFORNIA 1982'" :
                                        "e.g., 'a small eagle logo'"
                                    }
                                    className="w-full flex-grow h-20 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                                    disabled={isLoading}
                                />
                                <button 
                                  onClick={handleVoiceInput} 
                                  className={`absolute top-8 right-2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`} 
                                  title={isRecording ? "Stop Recording" : "Record Voice Prompt"}
                                >
                                  {isRecording ? <StopIcon/> : <MicIcon />}
                                </button>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
                                 <input
                                    type="text"
                                    value={modificationRequest.style}
                                    onChange={e => setModificationRequest(prev => ({...prev, style: e.target.value}))}
                                    placeholder="e.g., cracked vintage varsity font, off-white"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                                />
                            </div>
                             {modificationRequest.type !== 'Structural' && <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                                <select
                                    value={modificationRequest.location}
                                    onChange={e => setModificationRequest(prev => ({...prev, location: e.target.value}))}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                                    disabled={isLoading || placementOptions.length === 0}
                                >
                                    {placementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>}
                        </div>
                        <button
                            onClick={() => onModifyGarment(modificationRequest)}
                            disabled={isLoading || !modificationRequest.content}
                            className="w-full mt-4 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Apply Modifications'}
                        </button>

                    </div>
                );
            case 'text':
                return (
                    <div>
                         <h3 className="text-lg font-semibold mb-4 text-white">Text Tools</h3>
                         <button onClick={() => onAddLayer({type: 'text', content: 'Hello World', fontFamily: 'Arial', fontWeight: 'normal', fontSize: 50, color: '#FFFFFF'})} className="w-full bg-gray-600 p-2 rounded-md mb-4">Add Text</button>
                         {activeLayer?.type === 'text' && (
                            <div className="space-y-4">
                                <textarea
                                    value={activeLayer.content}
                                    onChange={(e) => onUpdateLayer(activeLayerId!, { content: e.target.value })}
                                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md p-2"
                                />
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                                    <select value={activeLayer.fontFamily} onChange={e => onUpdateLayer(activeLayerId!, { fontFamily: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                        {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                                    </select>
                                </div>

                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Font Weight</label>
                                  <select 
                                    value={activeLayer.fontWeight || 'normal'} 
                                    onChange={e => onUpdateLayer(activeLayerId!, { fontWeight: e.target.value })} 
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                                  >
                                    <option value="100">Thin (100)</option>
                                    <option value="300">Light (300)</option>
                                    <option value="400">Normal (400)</option>
                                    <option value="500">Medium (500)</option>
                                    <option value="700">Bold (700)</option>
                                    <option value="900">Black (900)</option>
                                  </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Text Color</label>
                                    <input type="color" value={activeLayer.color} onChange={e => onUpdateLayer(activeLayerId!, { color: e.target.value })} className="w-full p-1 h-10 bg-gray-700 rounded-md"/>
                                </div>
                            </div>
                         )}
                    </div>
                );
            case 'elements':
                 return (
                    <div>
                         <h3 className="text-lg font-semibold mb-4 text-white">Elements</h3>
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => onAddLayer({type: 'shape', content: 'rectangle', fill: '#FFFFFF', size: {width: 0.25, height: 0.25}})} className="bg-gray-700 aspect-square flex items-center justify-center rounded-md">
                                <div className="w-1/2 h-1/2 bg-white" />
                            </button>
                             <button onClick={() => onAddLayer({type: 'shape', content: 'circle', fill: '#FFFFFF', size: {width: 0.25, height: 0.25}})} className="bg-gray-700 aspect-square flex items-center justify-center rounded-md">
                                <div className="w-1/2 h-1/2 bg-white rounded-full" />
                            </button>
                         </div>
                    </div>
                );
            case 'uploads':
                 return (
                    <div>
                         <h3 className="text-lg font-semibold mb-4 text-white">Uploads</h3>
                         <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                            <input type="file" id="upload-input" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/png, image/jpeg"/>
                            <label htmlFor="upload-input" className="cursor-pointer">
                                <p className="text-gray-400">Click to upload your logo or graphic</p>
                                <p className="text-xs text-gray-500">PNG, JPG</p>
                            </label>
                         </div>
                    </div>
                );
            case 'layers':
            default:
                return (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Layers</h3>
                        <div className="flex items-center gap-2">
                          <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo"><UndoIcon /></button>
                          <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo"><RedoIcon /></button>
                        </div>
                      </div>
                        {layers.length > 0 && (
                          <div className="space-y-2 mb-4">
                              {layers.map((layer, index) => (
                                  <div 
                                      key={layer.id}
                                      draggable
                                      onDragStart={() => dragItem.current = index}
                                      onDragEnter={() => dragOverItem.current = index}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={(e) => e.preventDefault()}
                                      onClick={() => onSetActiveLayer(layer.id)} 
                                      className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${activeLayerId === layer.id ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-gray-700'}`}
                                      style={{
                                          border: dragOverItem.current === index ? '2px dashed #6366f1' : 'none'
                                      }}
                                  >
                                      <div className="flex-grow truncate pr-2 flex items-center">
                                          <span className="cursor-grab pr-2">⠿</span>
                                          {layer.type === 'image' && <img src={layer.content} className="w-8 h-8 object-contain inline mr-2 bg-white/10 rounded"/>}
                                          {layer.type === 'text' && <span className="text-xl font-bold mr-2 w-8 text-center">T</span>}
                                          {layer.type === 'shape' && (
                                              <div className="w-8 h-8 mr-2 flex items-center justify-center">
                                                  <div style={{ backgroundColor: layer.fill }} className={`w-5 h-5 ${layer.content === 'circle' ? 'rounded-full' : ''}`}></div>
                                              </div>
                                          )}
                                          <span className="truncate">{layer.content.startsWith('data:') ? `Image Layer ${index + 1}` : layer.content}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, {visible: !layer.visible})}}>{layer.visible ? '👁️' : '🙈'}</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id)}}>🗑️</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                        )}

                        {activeLayer && (
                            <div className="border-t border-gray-700 pt-4">
                                <h4 className="text-md font-semibold mb-2 text-white">Layer Properties</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Opacity</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={activeLayer.opacity}
                                        onChange={(e) => onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {layers.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Your design is empty. Add a graphic, text, or elements.</p>}
                    </div>
                );
        }
    }

    const TabButton: React.FC<{tab: EditorTab, label: string}> = ({tab, label}) => (
        <button onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm rounded-md ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    )

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-hidden">
            <div className="flex-shrink-0 grid grid-cols-5 gap-1 p-1 bg-gray-900 rounded-lg">
                <TabButton tab="layers" label="Layers" />
                <TabButton tab="generate" label="AI" />
                <TabButton tab="text" label="Text" />
                <TabButton tab="elements" label="Elements" />
                <TabButton tab="uploads" label="Uploads" />
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                {renderActiveTab()}
            </div>

            <div className="flex-shrink-0 border-t border-gray-700 pt-4">
                 <button
                    onClick={onRenderRealistic}
                    disabled={isLoading || layers.length === 0}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoadingSpinner /> : 'Render Realistic Mockup'}
                </button>
                {finalRenderedImage && (
                     <button
                        onClick={onPropagateDesign}
                        disabled={isLoading}
                        className="w-full mt-2 bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Propagate Design to All Views'}
                    </button>
                )}
            </div>
        </div>
    );
};
