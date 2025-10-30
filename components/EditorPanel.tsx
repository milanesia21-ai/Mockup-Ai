



import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
// FIX: Import DesignLayer from constants.ts after it was moved.
import { FONT_OPTIONS, GARMENT_PART_PLACEMENTS, BLEND_MODES, ModificationRequest, GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, GARMENT_COLORS, DesignLayer } from '../constants';
import { generateInspirationPrompt, generateColorPalette } from '../services/geminiService';
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

// FIX: Moved DesignLayer interface to constants.ts to be shared across components/services.

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
    onModifyGarment: (modification: ModificationRequest) => void;
    onRenderRealistic: () => void;
    isLoading: boolean;
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
    isLoading,
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
    
    const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId), [layers, activeLayerId]);

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
                toast.error('Failed to read the file.');
           }
        }
        e.target.value = '';
    };

    const handleInspireMeClick = async () => {
        setIsInspiring(true);

        // Get random values for a more varied inspiration
        const allGarments = GARMENT_CATEGORIES.flatMap(cat => cat.items);
        const allDesignStyles = DESIGN_STYLE_CATEGORIES.flatMap(cat => cat.items);
        
        const randomGarment = allGarments[Math.floor(Math.random() * allGarments.length)];
        const randomDesignStyle = allDesignStyles[Math.floor(Math.random() * allDesignStyles.length)];
        
        const randomColorString = GARMENT_COLORS[Math.floor(Math.random() * GARMENT_COLORS.length)];
        const hexMatch = randomColorString.match(/#([0-9a-fA-F]{6})/);
        const randomColor = hexMatch ? hexMatch[0] : '#000000';

        const promise = generateInspirationPrompt(randomGarment, randomDesignStyle, randomColor, selectedStyle);

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
            case 'add':
                return (
                    <div className="space-y-6">
                        {/* --- Generate Graphic --- */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">Generate AI Graphic</h3>
                            <button 
                              onClick={handleInspireMeClick} 
                              disabled={isLoading || isInspiring}
                              className="flex items-center gap-2 text-sm bg-orange-600/20 text-orange-300 px-3 py-2 rounded-lg hover:bg-orange-600/40 disabled:opacity-50 transition-colors"
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
                              className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white resize-none"
                              disabled={isLoading || isInspiring}
                          />
                           <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-1">Texture Prompt (Optional)</label>
                              <input
                                  type="text"
                                  value={texturePrompt}
                                  onChange={(e) => setTexturePrompt(e.target.value)}
                                  placeholder="e.g., embroidered patch, leather, denim"
                                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                                  disabled={isLoading}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Placement</label>
                                <select value={graphicPlacement} onChange={(e) => setGraphicPlacement(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" disabled={isLoading || placementOptions.length === 0}>
                                    {placementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-300">Color</label>
                                    <button onClick={handleSuggestColors} disabled={isLoading || isSuggestingColors} className="text-xs text-orange-400 hover:underline">
                                        {isSuggestingColors ? '...' : 'Suggest'}
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
                              {isLoading ? <LoadingSpinner /> : 'Generate & Add To Layers'}
                          </button>
                        </div>
                        
                        <div className="border-t border-gray-700"></div>

                        {/* Add Text, Shape, Sketch Layer */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Add Basic Elements</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onAddLayer({type: 'text', content: 'Hello World', fontFamily: 'Arial', fontWeight: 'normal', fontSize: 50, color: '#FFFFFF', textAlign: 'center'})} className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-center text-sm">Add Text</button>
                                <button onClick={() => onAddLayer({type: 'drawing', content: '', size: {width: 1, height: 1}, position: {x: 0.5, y: 0.5}})} className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-center text-sm">
                                  Sketch Layer
                                </button>
                                <button onClick={() => onAddLayer({type: 'shape', content: 'rectangle', fill: '#FFFFFF', size: {width: 0.25, height: 0.25}})} className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-center text-sm">Rectangle</button>
                                <button onClick={() => onAddLayer({type: 'shape', content: 'circle', fill: '#FFFFFF', size: {width: 0.25, height: 0.25}})} className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-center text-sm">Circle</button>
                            </div>
                        </div>
                        
                        {/* Upload */}
                         <div>
                            <h3 className="text-lg font-semibold text-white">Upload Graphic</h3>
                             <div className="mt-2 relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                                <input type="file" id="upload-input" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/png, image/jpeg"/>
                                <label htmlFor="upload-input" className="cursor-pointer">
                                    <UploadIcon className="mx-auto h-8 w-8 text-gray-500" />
                                    <p className="mt-2 text-gray-400">Click to upload</p>
                                    <p className="text-xs text-gray-500">PNG, JPG</p>
                                </label>
                             </div>
                         </div>
                    </div>
                );
            case 'modify':
                return (
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Direct-to-Garment AI</h3>
                        <p className="text-sm text-gray-400 mb-4">Apply realistic modifications directly to the base mockup. This will regenerate all views and clear existing layers.</p>
                        
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
                                    className="w-full flex-grow h-20 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white resize-none"
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
                            className="w-full mt-6 bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Apply Modifications'}
                        </button>

                    </div>
                );
            case 'sketch':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Sketch Tools</h3>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Brush Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setSketchTools(s => ({...s, brushType: 'pencil'}))} className={`p-2 rounded-md flex items-center justify-center gap-2 ${sketchTools.brushType === 'pencil' ? 'bg-orange-600' : 'bg-gray-700'}`}><PencilIcon /> Pencil</button>
                                <button onClick={() => setSketchTools(s => ({...s, brushType: 'pen'}))} className={`p-2 rounded-md flex items-center justify-center gap-2 ${sketchTools.brushType === 'pen' ? 'bg-orange-600' : 'bg-gray-700'}`}><PenIcon /> Pen</button>
                                <button onClick={() => setSketchTools(s => ({...s, brushType: 'eraser'}))} className={`p-2 rounded-md flex items-center justify-center gap-2 ${sketchTools.brushType === 'eraser' ? 'bg-orange-600' : 'bg-gray-700'}`}><EraserIcon /> Eraser</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Brush Color</label>
                            <input type="color" value={sketchTools.brushColor} onChange={e => setSketchTools(s => ({...s, brushColor: e.target.value}))} className="w-full p-1 h-10 bg-gray-700 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Brush Size ({sketchTools.brushSize}px)</label>
                            <input type="range" min="1" max="100" value={sketchTools.brushSize} onChange={e => setSketchTools(s => ({...s, brushSize: Number(e.target.value)}))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Brush Opacity ({Math.round(sketchTools.brushOpacity * 100)}%)</label>
                            <input type="range" min="0" max="1" step="0.01" value={sketchTools.brushOpacity} onChange={e => setSketchTools(s => ({...s, brushOpacity: Number(e.target.value)}))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Symmetry</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setSketchTools(s => ({...s, symmetry: 'none'}))} className={`p-2 rounded-md ${sketchTools.symmetry === 'none' ? 'bg-orange-600' : 'bg-gray-700'}`}>Off</button>
                                <button onClick={() => setSketchTools(s => ({...s, symmetry: 'vertical'}))} className={`p-2 rounded-md flex justify-center ${sketchTools.symmetry === 'vertical' ? 'bg-orange-600' : 'bg-gray-700'}`}><SymmetryYIcon /></button>
                                <button onClick={() => setSketchTools(s => ({...s, symmetry: 'horizontal'}))} className={`p-2 rounded-md flex justify-center ${sketchTools.symmetry === 'horizontal' ? 'bg-orange-600' : 'bg-gray-700'}`}><SymmetryXIcon /></button>
                            </div>
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
                        {layers.length > 0 ? (
                          <div className="space-y-2 mb-4">
                              {[...layers].reverse().map((layer, index) => {
                                  const originalIndex = layers.length - 1 - index;
                                  return (
                                  <div 
                                      key={layer.id}
                                      draggable
                                      onDragStart={() => dragItem.current = originalIndex}
                                      onDragEnter={() => dragOverItem.current = originalIndex}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={(e) => e.preventDefault()}
                                      onClick={() => onSetActiveLayer(layer.id)} 
                                      className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${activeLayerId === layer.id ? 'bg-orange-500/30 ring-2 ring-orange-500' : 'bg-gray-700'}`}
                                      style={{ border: dragOverItem.current === originalIndex ? '2px dashed #f97316' : 'none' }}
                                  >
                                      <div className="flex-grow truncate pr-2 flex items-center">
                                          <span className="cursor-grab pr-2 text-gray-500">⠿</span>
                                          {layer.type === 'image' && <img src={layer.content} className="w-8 h-8 object-contain inline mr-2 bg-white/10 rounded"/>}
                                          {layer.type === 'text' && <span className="text-xl font-bold mr-2 w-8 text-center">T</span>}
                                          {layer.type === 'shape' && (
                                              <div className="w-8 h-8 mr-2 flex items-center justify-center">
                                                  <div style={{ backgroundColor: layer.fill }} className={`w-5 h-5 ${layer.content === 'circle' ? 'rounded-full' : ''}`}></div>
                                              </div>
                                          )}
                                          {layer.type === 'drawing' && <PencilIcon className="w-8 h-8 p-1 mr-2"/>}
                                          <span className="truncate text-sm">
                                            {layer.type === 'drawing' ? `Sketch Layer` : 
                                             layer.type === 'text' ? layer.content :
                                             layer.type === 'shape' ? `${layer.content.charAt(0).toUpperCase() + layer.content.slice(1)} Shape` :
                                             `Image Layer`
                                             }
                                          </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, {visible: !layer.visible}, true)}}>{layer.visible ? '👁️' : '🙈'}</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id)}}>🗑️</button>
                                      </div>
                                  </div>
                              )})}
                          </div>
                        ) : (
                           <p className="text-gray-500 text-sm text-center py-4">Your design is empty. Use the 'Add' tab to add content.</p>
                        )}
                        
                        <div className="border-t border-gray-700 mt-4 pt-4">
                             <button
                                onClick={onRenderRealistic}
                                disabled={isLoading || layers.length === 0}
                                className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? <LoadingSpinner /> : 'Render Realistic Mockup'}
                            </button>
                            {layers.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Add layers to enable rendering.</p>}
                        </div>

                        {activeLayer && (
                            <div className="border-t border-gray-700 mt-4 pt-4 space-y-4">
                                <h4 className="text-md font-semibold mb-2 text-white">Layer Properties</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Opacity ({Math.round(activeLayer.opacity * 100)}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={activeLayer.opacity}
                                        onChange={(e) => onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) }, false)}
                                        onMouseUp={(e) => onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) }, true)}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                {activeLayer.type === 'text' && (
                                     <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                                                <select value={activeLayer.fontFamily} onChange={e => onUpdateLayer(activeLayerId!, { fontFamily: e.target.value }, true)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm">
                                                    {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Font Weight</label>
                                                <select value={activeLayer.fontWeight} onChange={e => onUpdateLayer(activeLayerId!, { fontWeight: e.target.value as any }, true)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                                    <option value="normal">Normal</option>
                                                    <option value="bold">Bold</option>
                                                </select>
                                            </div>
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Text Color</label>
                                            <input type="color" value={activeLayer.color} onChange={e => onUpdateLayer(activeLayerId!, { color: e.target.value }, true)} className="w-full p-1 h-10 bg-gray-700 border border-gray-600 rounded-md"/>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-300 mb-1">Alignment</label>
                                              <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => onUpdateLayer(activeLayerId!, { textAlign: 'left' }, true)} className={`p-2 rounded-md flex justify-center ${activeLayer.textAlign === 'left' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignLeft /></button>
                                                <button onClick={() => onUpdateLayer(activeLayerId!, { textAlign: 'center' }, true)} className={`p-2 rounded-md flex justify-center ${activeLayer.textAlign === 'center' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignCenter /></button>
                                                <button onClick={() => onUpdateLayer(activeLayerId!, { textAlign: 'right' }, true)} className={`p-2 rounded-md flex justify-center ${activeLayer.textAlign === 'right' ? 'bg-orange-600' : 'bg-gray-700'}`}><AlignRight /></button>
                                              </div>
                                        </div>
                                    </>
                                )}
                                {activeLayer.type === 'shape' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Fill Color</label>
                                        <input 
                                            type="color" 
                                            value={activeLayer.fill} 
                                            onChange={e => onUpdateLayer(activeLayerId!, { fill: e.target.value }, true)} 
                                            className="w-full p-1 h-10 bg-gray-700 border border-gray-600 rounded-md"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Blend Mode</label>
                                    <select 
                                        value={activeLayer.blendMode} 
                                        onChange={(e) => onUpdateLayer(activeLayer.id, { blendMode: e.target.value }, true)} 
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                                    >
                                        {BLEND_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Lock Transparency</span>
                                    <button
                                      type="button"
                                      className={`${ activeLayer.lockTransparency ? 'bg-orange-600' : 'bg-gray-600' } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                                      onClick={() => onUpdateLayer(activeLayer.id, { lockTransparency: !activeLayer.lockTransparency }, true)}
                                    >
                                      <span className={`${ activeLayer.lockTransparency ? 'translate-x-6' : 'translate-x-1' } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    }

    const TabButton: React.FC<{tab: EditorTab, icon: React.ReactNode, title: string, isVisible?: boolean}> = ({tab, icon, title, isVisible = true}) => {
        if (!isVisible) return null;
        return (
            <button 
                onClick={() => setActiveTab(tab)} 
                className={`px-3 py-2 rounded-lg flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === tab ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                title={title}
            >
                {icon}
                <span className="text-xs font-medium">{title}</span>
            </button>
        )
    }

    return (
        <div className="p-4">
            <div className="flex-shrink-0 flex items-center gap-1 p-1 bg-gray-900 rounded-lg">
                <TabButton tab="layers" icon={<LayersIcon />} title="Layers" />
                <TabButton tab="add" icon={<AddIcon />} title="Add" />
                <TabButton tab="modify" icon={<MagicWandIcon />} title="AI Modify" />
                <TabButton tab="sketch" icon={<PencilIcon />} title="Sketch" isVisible={activeLayer?.type === 'drawing'} />
            </div>
            
            <div className="mt-4">
                {renderActiveTab()}
            </div>
        </div>
    );
};