import React, { useState, useMemo, useRef } from 'react';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, STYLE_OPTIONS, StyleOption, VIEWS, AI_IMAGE_MODELS, FIT_OPTIONS, TREND_PRESETS } from '../constants';
import { toast } from 'sonner';
import type { MockupConfig } from '../constants';
import { MagicWand } from './Icons';

interface ControlPanelProps {
  config: MockupConfig;
  setConfig: React.Dispatch<React.SetStateAction<MockupConfig>>;
  presets: Record<string, MockupConfig>;
  onSavePreset: () => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  onLoadTrendPreset: (preset: string) => void;
  onGenerateGarmentConcept: (styleA: string, styleB: string) => Promise<void>;
}

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => {
    return (
        <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
            <h3 className="text-lg font-bold text-orange-400 mb-4">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
};

const ToggleSwitch: React.FC<{
  label: string;
  description?: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, enabled, setEnabled, disabled = false }) => (
  <div>
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-300'}`}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        className={`${
          enabled ? 'bg-orange-600' : 'bg-gray-600'
        } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => setEnabled(!enabled)}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
      </button>
    </div>
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

const MicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
        <path d="M8 8a3 3 0 0 0 3-3V3a3 3 0 0 0-6 0v2a3 3 0 0 0 3 3z"/>
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
    </svg>
);

const StyleMixerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (styleA: string, styleB: string) => void;
    isLoading: boolean;
}> = ({ isOpen, onClose, onGenerate, isLoading }) => {
    const [styleA, setStyleA] = useState(DESIGN_STYLE_CATEGORIES[0].items[0]);
    const [styleB, setStyleB] = useState(DESIGN_STYLE_CATEGORIES[0].items[1]);
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (styleA === styleB) {
            toast.error("Please select two different styles to mix.");
            return;
        }
        onGenerate(styleA, styleB);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-orange-400 mb-4">AI Garment Mixer</h3>
                <p className="text-sm text-gray-400 mb-6">Select two styles to hybridize into a new garment concept. The AI will generate a description for you.</p>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Style A</label>
                        <select value={styleA} onChange={(e) => setStyleA(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                            {DESIGN_STYLE_CATEGORIES.map(category => (
                                <optgroup key={category.name} label={category.name}>
                                    {category.items.map(item => <option key={item} value={item}>{item}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Style B</label>
                        <select value={styleB} onChange={(e) => setStyleB(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                             {DESIGN_STYLE_CATEGORIES.map(category => (
                                <optgroup key={category.name} label={category.name}>
                                    {category.items.map(item => <option key={item} value={item}>{item}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50">
                        {isLoading ? 'Generating...' : 'Generate Concept'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onLoadTrendPreset,
  onGenerateGarmentConcept,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState<false | 'easy' | 'apparel'>(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition for cross-browser compatibility

  const handleConfigChange = (key: keyof MockupConfig, value: any) => {
    setConfig(prev => ({...prev, [key]: value}));
  };

  // FIX: Define the missing `handleViewToggle` function.
  const handleViewToggle = (view: string) => {
    setConfig(prev => {
      const newViews = prev.selectedViews.includes(view)
        ? prev.selectedViews.filter(v => v !== view)
        : [...prev.selectedViews, view];
      return { ...prev, selectedViews: newViews };
    });
  };
  
  const handleCategoryChange = (category: string) => {
    const newItems = GARMENT_CATEGORIES.find(cat => cat.name === category)?.items || [];
    setConfig(prev => ({
        ...prev,
        selectedCategory: category,
        selectedGarment: newItems[0] || '',
    }));
  };

  const garmentItems = useMemo(() => {
    const category = GARMENT_CATEGORIES.find(cat => cat.name === config.selectedCategory);
    return category ? category.items : [];
  }, [config.selectedCategory]);

  const handleTextureUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 4 * 1024 * 1024) { // Gemini has a 4MB limit for inline data
          toast.error('File size must be less than 4MB.');
          return;
      }

      try {
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUrl = reader.result as string;
              handleConfigChange('customMaterialTexture', dataUrl);
              handleConfigChange('aiMaterialPrompt', `Custom texture: ${file.name.substring(0, 20)}...`);
              toast.success("Custom texture uploaded!");
          };
          reader.readAsDataURL(file);
      } catch (error) {
          toast.error('Failed to read the file.');
          console.error("File read error:", error);
      }
      e.target.value = '';
  };

  const handleVoiceInput = (fieldToUpdate: 'easyPrompt' | 'aiApparelPrompt') => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast.error("Speech recognition is not supported in your browser.");
          return;
      }

      if (isRecording) {
          recognitionRef.current?.stop();
          return;
      }

      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US'; // Use browser language for better accuracy

      recognition.onstart = () => {
          setIsRecording(fieldToUpdate === 'easyPrompt' ? 'easy' : 'apparel');
          toast.info("Recording started. Speak your prompt.");
      };

      recognition.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
          toast.success("Recording stopped.");
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          let errorMessage = "An unknown error occurred.";
          if (event.error === 'no-speech') {
            errorMessage = "No speech was detected. Please try again.";
          } else if (event.error === 'audio-capture') {
            errorMessage = "No microphone was found. Ensure that a microphone is installed.";
          } else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access was denied. Please allow access in your browser settings.";
          }
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
             setConfig(prev => ({...prev, [fieldToUpdate]: (prev[fieldToUpdate] + ' ' + finalTranscript).trim() }));
          }
      };

      recognition.start();
  };

    const handleGenerateConcept = async (styleA: string, styleB: string) => {
        setIsGeneratingConcept(true);
        await onGenerateGarmentConcept(styleA, styleB);
        setIsGeneratingConcept(false);
        setIsMixerOpen(false);
    };

  const isImagenModel = config.selectedModel.startsWith('imagen');
  const isSearchDisabled = !!config.customMaterialTexture || isImagenModel;

  return (
    <div className="p-4 space-y-4">
        <StyleMixerModal 
            isOpen={isMixerOpen}
            onClose={() => setIsMixerOpen(false)}
            onGenerate={handleGenerateConcept}
            isLoading={isGeneratingConcept}
        />
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
             <label className="block text-lg font-bold text-orange-400 mb-2">Trend Presets</label>
             <select 
                onChange={(e) => onLoadTrendPreset(e.target.value)} 
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                defaultValue=""
             >
                <option value="" disabled>Load a Trend Preset...</option>
                {TREND_PRESETS.map(preset => <option key={preset} value={preset}>{preset}</option>)}
            </select>
        </div>

        {/* Card 1: Define Garment */}
        <Card title="Define Garment">
             <ToggleSwitch 
                label="Generate Custom Apparel with AI" 
                enabled={config.useAiApparel} 
                setEnabled={(val) => handleConfigChange('useAiApparel', val)} 
            />
            {config.useAiApparel ? (
                <div>
                  <label htmlFor="ai-apparel-prompt" className="block text-sm font-medium text-gray-300">AI Apparel Prompt</label>
                  <p id="ai-apparel-description" className="text-xs text-gray-500 mt-1 mb-2">Describe the custom apparel you want to create with AI.</p>
                  <div className="relative">
                      <textarea
                        id="ai-apparel-prompt"
                        aria-describedby="ai-apparel-description"
                        value={config.aiApparelPrompt}
                        onChange={(e) => handleConfigChange('aiApparelPrompt', e.target.value)}
                        placeholder="e.g., An oversized black hoodie with a distressed vintage band logo on the front..."
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white resize-none pr-12"
                      />
                      <button 
                        onClick={() => handleVoiceInput('aiApparelPrompt')}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isRecording === 'apparel' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600/50 hover:bg-gray-500/50'}`} 
                        title={isRecording === 'apparel' ? "Stop Recording" : "Record Apparel Description"}
                      >
                        {isRecording === 'apparel' ? <StopIcon/> : <MicIcon className="h-4 w-4" />}
                      </button>
                  </div>
                </div>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select value={config.selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                            {GARMENT_CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <select value={config.selectedGarment} onChange={(e) => handleConfigChange('selectedGarment', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                           {garmentItems.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Fit</label>
                        <select value={config.fit} onChange={(e) => handleConfigChange('fit', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                           {FIT_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">AI Material Prompt</label>
                 <input
                    type="text"
                    value={config.aiMaterialPrompt}
                    onChange={(e) => handleConfigChange('aiMaterialPrompt', e.target.value)}
                    placeholder="e.g., Heavy 'used' fleece, acid wash denim"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                    disabled={!!config.customMaterialTexture}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                <input type="color" value={config.selectedColor} onChange={(e) => handleConfigChange('selectedColor', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md"/>
            </div>
        </Card>

        {/* Card 2: Define Style */}
        <Card title="Define Style">
             <div className="flex items-center gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Design Style</label>
                    <select value={config.selectedDesignStyle} onChange={(e) => handleConfigChange('selectedDesignStyle', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                        {DESIGN_STYLE_CATEGORIES.map(category => (
                            <optgroup key={category.name} label={category.name}>
                                {category.items.map(item => <option key={item} value={item}>{item}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <button onClick={() => setIsMixerOpen(true)} title="Mix Styles with AI" className="self-end p-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                    <MagicWand className="h-5 w-5"/>
                </button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mockup Style</label>
                <select value={config.selectedStyle} onChange={(e) => handleConfigChange('selectedStyle', e.target.value as StyleOption)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                  {STYLE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTextureFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
                <button onClick={handleTextureUploadClick} className="w-full text-center text-sm bg-gray-700 hover:bg-gray-600 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={config.selectedStyle === 'Technical Sketch Style'}>
                   {config.selectedStyle === 'Technical Sketch Style' ? 'N/A for Sketches' : 'Upload Custom Fabric Texture'}
                </button>
                {config.customMaterialTexture && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                        <img src={config.customMaterialTexture} alt="Custom texture preview" className="w-10 h-10 object-cover rounded"/>
                        <p className="text-xs text-gray-300 flex-grow truncate">{config.aiMaterialPrompt}</p>
                        <button 
                          onClick={() => {
                            handleConfigChange('customMaterialTexture', undefined);
                            handleConfigChange('aiMaterialPrompt', 'Fleece');
                          }} 
                          className="text-red-500 hover:text-red-400 font-bold text-lg"
                          title="Remove custom texture"
                        >
                          &times;
                        </button>
                    </div>
                )}
            </div>
        </Card>

        {/* Card 3: Advanced AI Options */}
        <Card title="Advanced AI Options">
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">AI Generation Model</label>
                <select 
                    value={config.selectedModel} 
                    onChange={(e) => handleConfigChange('selectedModel', e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                >
                    {AI_IMAGE_MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                </select>
            </div>
            <ToggleSwitch 
                label="Generate Model & Scene"
                description="Create a photorealistic model and background for your garment."
                enabled={config.useAiModelScene} 
                setEnabled={(val) => handleConfigChange('useAiModelScene', val)} 
            />
            {config.useAiModelScene && (
                <div className="bg-gray-700/50 p-3 rounded-md space-y-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Describe Model</label>
                        <input type="text" value={config.aiModelPrompt} onChange={(e) => handleConfigChange('aiModelPrompt', e.target.value)} placeholder="e.g., male model, athletic build" className="w-full bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-sm"/>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-300 mb-1">Describe Background</label>
                       <input type="text" value={config.aiScenePrompt} onChange={(e) => handleConfigChange('aiScenePrompt', e.target.value)} placeholder="e.g., on a city rooftop at dusk" className="w-full bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-sm"/>
                    </div>
                </div>
            )}
             <ToggleSwitch 
                label="Enhance Style with Search"
                description={`Use current Google trends to enhance the selected ${config.selectedDesignStyle} style.`}
                enabled={config.useGoogleSearch} 
                setEnabled={(val) => handleConfigChange('useGoogleSearch', val)} 
                disabled={isSearchDisabled}
             />
             {isSearchDisabled && <p className="text-xs text-gray-500 -mt-3">{isImagenModel ? 'N/A for Imagen models.' : 'N/A for custom textures.'}</p>}

            <fieldset className="border-t border-gray-700 pt-4">
                <legend className="block text-sm font-medium text-gray-300 mb-2">Views to Generate</legend>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {VIEWS.map(view => (
                        <button key={view} onClick={() => handleViewToggle(view)} className={`text-center py-2 rounded-md text-xs ${config.selectedViews.includes(view) ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                            {view}
                        </button>
                    ))}
                </div>
            </fieldset>
        </Card>
    </div>
  );
};
