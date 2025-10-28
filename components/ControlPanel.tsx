import React, { useState, useMemo, useRef } from 'react';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, MATERIALS_BY_GARMENT_TYPE, STYLE_OPTIONS, StyleOption, VIEWS } from '../constants';
import { toast } from 'sonner';

export interface MockupConfig {
  easyPrompt: string;
  selectedCategory: string;
  selectedGarment: string;
  selectedDesignStyle: string;
  selectedColor: string;
  selectedMaterial: string;
  customMaterialTexture?: string;
  selectedStyle: StyleOption;
  selectedViews: string[];
  aiApparelPrompt: string;
  useAiApparel: boolean;
  aiModelPrompt: string;
  aiScenePrompt: string;
  useAiModelScene: boolean;
}

interface ControlPanelProps {
  config: MockupConfig;
  setConfig: React.Dispatch<React.SetStateAction<MockupConfig>>;
  onGenerate: () => void;
  onParseEasyPrompt: () => void;
  onInspireMe: () => void;
  presets: Record<string, MockupConfig>;
  onSavePreset: () => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  isLoading: boolean;
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white disabled:opacity-50"
    />
  </div>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}> = ({ label, value, onChange, placeholder, disabled, rows = 3 }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
    />
  </div>
);

const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}> = ({ label, enabled, setEnabled }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <button
      type="button"
      className={`${
        enabled ? 'bg-indigo-600' : 'bg-gray-600'
      } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500`}
      onClick={() => setEnabled(!enabled)}
    >
      <span
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
      />
    </button>
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


export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  onGenerate,
  onParseEasyPrompt,
  onInspireMe,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetSelectRef = useRef<HTMLSelectElement>(null);
  const [isRecording, setIsRecording] = useState<false | 'easy' | 'apparel'>(false);
  const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition for cross-browser compatibility

  const handleConfigChange = (key: keyof MockupConfig, value: any) => {
    setConfig(prev => ({...prev, [key]: value}));
  };
  
  const handleCategoryChange = (category: string) => {
    const newItems = GARMENT_CATEGORIES.find(cat => cat.name === category)?.items || [];
    setConfig(prev => ({
        ...prev,
        selectedCategory: category,
        selectedGarment: newItems[0] || ''
    }));
  };

  const handleViewToggle = (view: string) => {
    const newViews = config.selectedViews.includes(view)
      ? config.selectedViews.filter(v => v !== view)
      : [...config.selectedViews, view];
    handleConfigChange('selectedViews', newViews);
  };
  
  const garmentItems = useMemo(() => {
    const category = GARMENT_CATEGORIES.find(cat => cat.name === config.selectedCategory);
    return category ? category.items : [];
  }, [config.selectedCategory]);

  const materialOptions = useMemo(() => {
    return MATERIALS_BY_GARMENT_TYPE[config.selectedCategory] || [];
  }, [config.selectedCategory]);

  const handlePresetLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (presetName) {
      onLoadPreset(presetName);
      if (presetSelectRef.current) {
        presetSelectRef.current.value = ''; // Reset dropdown to placeholder
      }
    }
  };

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
              handleConfigChange('selectedMaterial', `Custom: ${file.name.substring(0, 20)}...`);
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

  return (
    <div className="h-full flex flex-col space-y-4">
      <h2 className="text-xl font-bold text-white">Mockup Studio</h2>
      
      {/* Easy Mode */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <label className="block text-sm font-bold text-indigo-400 mb-2">Easy Mode</label>
        <div className="flex gap-2">
            <input
              type="text"
              value={config.easyPrompt}
              onChange={(e) => handleConfigChange('easyPrompt', e.target.value)}
              placeholder="e.g., photorealistic black cotton hoodie..."
              className="flex-grow bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
            <button onClick={onParseEasyPrompt} className="bg-indigo-600 px-3 rounded-md hover:bg-indigo-700" title="Auto-fill options from prompt">
                🪄
            </button>
            <button 
              onClick={() => handleVoiceInput('easyPrompt')}
              className={`px-3 rounded-md transition-colors ${isRecording === 'easy' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`} 
              title={isRecording === 'easy' ? "Stop Recording" : "Record Voice Prompt"}
            >
              {isRecording === 'easy' ? <StopIcon/> : <MicIcon />}
            </button>
        </div>
      </div>

      {/* Pro Mode */}
      <div className="flex-grow space-y-4 overflow-y-auto pr-2">
        <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Professional Options</h3>

            <ToggleSwitch label="Generate Custom Apparel with AI" enabled={config.useAiApparel} setEnabled={(val) => handleConfigChange('useAiApparel', val)} />
            {config.useAiApparel ? (
                <div className="relative">
                  <TextAreaField 
                    label="Describe Apparel" 
                    value={config.aiApparelPrompt} 
                    onChange={(val) => handleConfigChange('aiApparelPrompt', val)} 
                    placeholder="e.g., a 1980s sci-fi jacket with high collar"
                  />
                  <button 
                    onClick={() => handleVoiceInput('aiApparelPrompt')}
                    className={`absolute top-0 right-0 mt-1 mr-1 p-2 rounded-full transition-colors ${isRecording === 'apparel' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600/50 hover:bg-gray-500/50'}`} 
                    title={isRecording === 'apparel' ? "Stop Recording" : "Record Apparel Description"}
                  >
                    {isRecording === 'apparel' ? <StopIcon/> : <MicIcon className="h-4 w-4" />}
                  </button>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Garment Category</label>
                        <select value={config.selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500">
                            {GARMENT_CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Garment Type</label>
                        <select value={config.selectedGarment} onChange={(e) => handleConfigChange('selectedGarment', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500">
                           {garmentItems.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </>
            )}

            <ToggleSwitch label="Show on AI Model & Scene" enabled={config.useAiModelScene} setEnabled={(val) => handleConfigChange('useAiModelScene', val)} />
            {config.useAiModelScene && (
                <div className="bg-gray-700/50 p-3 rounded-md">
                    <InputField label="Describe Model" value={config.aiModelPrompt} onChange={(val) => handleConfigChange('aiModelPrompt', val)} placeholder="e.g., male model, athletic build"/>
                    <InputField label="Describe Background" value={config.aiScenePrompt} onChange={(val) => handleConfigChange('aiScenePrompt', val)} placeholder="e.g., on a city rooftop at dusk"/>
                </div>
            )}
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Details & Style</h3>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                <input type="color" value={config.selectedColor} onChange={(e) => handleConfigChange('selectedColor', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md"/>
            </div>
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Material</label>
                <select value={config.selectedMaterial} onChange={(e) => handleConfigChange('selectedMaterial', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500" disabled={materialOptions.length === 0 || !!config.customMaterialTexture}>
                    {materialOptions.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTextureFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
                <button onClick={handleTextureUploadClick} className="text-xs text-indigo-400 hover:underline mt-1" disabled={config.selectedStyle === 'Technical Sketch Style'}>
                   {config.selectedStyle === 'Technical Sketch Style' ? 'Custom Textures N/A for Sketches' : 'Upload Custom Fabric Texture'}
                </button>
                {config.customMaterialTexture && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                        <img src={config.customMaterialTexture} alt="Custom texture preview" className="w-10 h-10 object-cover rounded"/>
                        <p className="text-xs text-gray-300 flex-grow truncate">{config.selectedMaterial}</p>
                        <button 
                          onClick={() => {
                            handleConfigChange('customMaterialTexture', undefined);
                            handleConfigChange('selectedMaterial', materialOptions[0] || '');
                          }} 
                          className="text-red-500 hover:text-red-400 font-bold text-lg"
                          title="Remove custom texture"
                        >
                          &times;
                        </button>
                    </div>
                )}
            </div>
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Design Style</label>
                <select value={config.selectedDesignStyle} onChange={(e) => handleConfigChange('selectedDesignStyle', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500">
                    {DESIGN_STYLE_CATEGORIES.map(category => (
                        <optgroup key={category.name} label={category.name}>
                            {category.items.map(item => <option key={item} value={item}>{item}</option>)}
                        </optgroup>
                    ))}
                </select>
            </div>
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Mockup Style</label>
                 <select value={config.selectedStyle} onChange={(e) => handleConfigChange('selectedStyle', e.target.value as StyleOption)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500">
                    {STYLE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Generate Views</label>
                <div className="grid grid-cols-4 gap-2">
                    {VIEWS.map(view => (
                        <button key={view} onClick={() => handleViewToggle(view)} className={`text-center py-2 rounded-md text-sm ${config.selectedViews.includes(view) ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                            {view}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
             <h3 className="text-lg font-semibold text-white mb-2">Presets</h3>
             <div className="flex gap-2">
                <select ref={presetSelectRef} onChange={handlePresetLoad} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3" defaultValue="">
                    <option value="" disabled>Load Preset...</option>
                    {Object.keys(presets).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <button onClick={onSavePreset} className="bg-gray-600 px-3 rounded-md hover:bg-gray-500" title="Save current settings as preset">💾</button>
             </div>
             {Object.keys(presets).length > 0 && (
                <div className="text-xs mt-2 space-y-1">
                    {Object.keys(presets).map(name => (
                        <div key={name} className="flex justify-between items-center bg-gray-900/50 p-1 rounded">
                            <span className="truncate pr-2">{name}</span>
                            <button onClick={() => onDeletePreset(name)} className="text-red-500 hover:text-red-400 flex-shrink-0">🗑️</button>
                        </div>
                    ))}
                </div>
             )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 border-t border-gray-700 pt-4 flex items-center gap-2">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex-grow bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-transform transform hover:scale-105"
        >
          {isLoading ? 'Generating...' : 'Generate Mockup'}
        </button>
        <button onClick={onInspireMe} disabled={isLoading} className="p-3 bg-gray-600 rounded-lg hover:bg-gray-500 disabled:opacity-50" title="Inspire Me!">
            🎲
        </button>
      </div>
    </div>
  );
};