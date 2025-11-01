


import React, { useState, useMemo, useRef } from 'react';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, STYLE_OPTIONS, VIEWS, AI_IMAGE_MODELS, FIT_OPTIONS, TREND_PRESETS, GARMENT_MATERIALS } from '../constants';
import { toast } from 'sonner';
// FIX: Import StyleOption to fix type error on line 488
import type { MockupConfig, StyleOption } from '../constants';
import { MagicWand } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface ControlPanelProps {
  config: MockupConfig;
  setConfig: React.Dispatch<React.SetStateAction<MockupConfig>>;
  presets: Record<string, MockupConfig>;
  onSavePreset: () => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  onLoadTrendPreset: (preset: string) => void;
  onGenerateGarmentConcept: (styleA: string, styleB: string) => Promise<void>;
  onParseEasyPrompt: (prompt: string) => void;
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
    const { t } = useTranslation();
    const [styleA, setStyleA] = useState(DESIGN_STYLE_CATEGORIES[0].items[0]);
    const [styleB, setStyleB] = useState(DESIGN_STYLE_CATEGORIES[0].items[1]);
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (styleA === styleB) {
            toast.error(t('toasts.selectDifferentStyles'));
            return;
        }
        onGenerate(styleA, styleB);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-orange-400 mb-4">{t('controlPanel.styleMixer.title')}</h3>
                <p className="text-sm text-gray-400 mb-6">{t('controlPanel.styleMixer.description')}</p>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.styleMixer.styleALabel')}</label>
                        <select value={styleA} onChange={(e) => setStyleA(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                            {DESIGN_STYLE_CATEGORIES.map(category => (
                                <optgroup key={category.name} label={t(category.name)}>
                                    {category.items.map(item => <option key={item} value={item}>{t(item)}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.styleMixer.styleBLabel')}</label>
                        <select value={styleB} onChange={(e) => setStyleB(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                             {DESIGN_STYLE_CATEGORIES.map(category => (
                                <optgroup key={category.name} label={t(category.name)}>
                                    {category.items.map(item => <option key={item} value={item}>{t(item)}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">{t('controlPanel.styleMixer.cancelButton')}</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50">
                        {isLoading ? t('controlPanel.styleMixer.generateButtonLoading') : t('controlPanel.styleMixer.generateButton')}
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
  onParseEasyPrompt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState<false | 'easy' | 'apparel'>(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const recognitionRef = useRef<any>(null); // Usare 'any' per SpeechRecognition per compatibilità cross-browser
  const [selectedPreset, setSelectedPreset] = useState('');
  const [easyPromptText, setEasyPromptText] = useState('');
  const { t, language } = useTranslation();

  const handleConfigChange = (key: keyof MockupConfig, value: any) => {
    setConfig(prev => ({...prev, [key]: value}));
  };

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
    const newGarment = newItems[0] || '';
    const newMaterials = GARMENT_MATERIALS[newGarment] || [];
    const newMaterial = newMaterials[0] || 'material.fleece'; 
    setConfig(prev => ({
        ...prev,
        selectedCategory: category,
        selectedGarment: newGarment,
        aiMaterialPrompt: t(newMaterial),
    }));
  };

  const handleGarmentChange = (newGarment: string) => {
    const newMaterials = GARMENT_MATERIALS[newGarment] || [];
    const newMaterial = newMaterials.length > 0 ? newMaterials[0] : 'material.fleece';
    setConfig(prev => ({
        ...prev,
        selectedGarment: newGarment,
        aiMaterialPrompt: t(newMaterial),
    }));
  };


  const garmentItems = useMemo(() => {
    const category = GARMENT_CATEGORIES.find(cat => cat.name === config.selectedCategory);
    return category ? category.items : [];
  }, [config.selectedCategory]);
  
  const garmentMaterials = useMemo(() => {
    return GARMENT_MATERIALS[config.selectedGarment] || [];
  }, [config.selectedGarment]);

  const handleTextureUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 4 * 1024 * 1024) { // Gemini ha un limite di 4MB per i dati inline
          toast.error(t('toasts.fileTooLarge'));
          return;
      }

      try {
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUrl = reader.result as string;
              handleConfigChange('customMaterialTexture', dataUrl);
              handleConfigChange('aiMaterialPrompt', `Custom texture: ${file.name.substring(0, 20)}...`);
              toast.success(t('toasts.customTextureLoaded'));
          };
          reader.readAsDataURL(file);
      } catch (error) {
          toast.error(t('toasts.fileReadError'));
          console.error("Errore di lettura file:", error);
      }
      e.target.value = '';
  };

  const handleVoiceInput = (fieldToUpdate: 'easyPrompt' | 'aiApparelPrompt') => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast.error(t('toasts.micNotSupported'));
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
      recognition.lang = language || 'it-IT'; // Usa la lingua del browser per una migliore precisione

      recognition.onstart = () => {
          setIsRecording(fieldToUpdate === 'easyPrompt' ? 'easy' : 'apparel');
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

    const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (name) {
            onLoadPreset(name);
            setSelectedPreset(name);
        } else {
            setSelectedPreset('');
        }
    };

    const handlePresetDelete = () => {
        if (selectedPreset) {
            onDeletePreset(selectedPreset);
            setSelectedPreset('');
        }
    };
    
    const handleAnalyzeClick = () => {
        if (!easyPromptText.trim()) {
            toast.error(t('toasts.enterPromptToAnalyze'));
            return;
        }
        onParseEasyPrompt(easyPromptText);
    };


  const isImageGenerationModel = config.selectedModel.startsWith('imagen') || config.selectedModel === 'gemini-2.5-flash-image';
  const isSearchDisabled = !!config.customMaterialTexture || isImageGenerationModel;

  return (
    <div className="p-4 space-y-4">
        <StyleMixerModal 
            isOpen={isMixerOpen}
            onClose={() => setIsMixerOpen(false)}
            onGenerate={handleGenerateConcept}
            isLoading={isGeneratingConcept}
        />

        <Card title={t('controlPanel.simplePrompt.title')}>
            <p className="text-sm text-gray-400 mb-2 -mt-1">{t('controlPanel.simplePrompt.description')}</p>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={easyPromptText}
                    onChange={(e) => setEasyPromptText(e.target.value)}
                    placeholder={t('controlPanel.simplePrompt.placeholder')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                />
                <button 
                    onClick={handleAnalyzeClick}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                    {t('controlPanel.simplePrompt.button')}
                </button>
            </div>
        </Card>
        
        <Card title={t('controlPanel.presets.title')}>
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('controlPanel.presets.trendsTitle')}</label>
                <select 
                    onChange={(e) => onLoadTrendPreset(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                    value="" // Mantenere non controllato per le tendenze
                >
                    <option value="" disabled>{t('controlPanel.presets.trendsPlaceholder')}</option>
                    {TREND_PRESETS.map(preset => <option key={preset} value={preset}>{t(preset)}</option>)}
                </select>
            </div>
            <div className="border-t border-gray-700 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('controlPanel.presets.userTitle')}</label>
                <div className="space-y-2">
                    <button 
                        onClick={onSavePreset}
                        className="w-full text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-md transition-colors"
                    >
                        {t('controlPanel.presets.saveButton')}
                    </button>
                    {Object.keys(presets).length > 0 && (
                         <div className="flex items-center gap-2">
                            <select 
                                value={selectedPreset}
                                onChange={handlePresetSelect}
                                className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                            >
                                <option value="">{t('controlPanel.presets.loadPlaceholder')}</option>
                                {Object.keys(presets).sort().map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <button
                                onClick={handlePresetDelete}
                                disabled={!selectedPreset}
                                className="px-3 py-2 bg-red-600/80 text-white rounded-md hover:bg-red-700/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                                title={t('controlPanel.presets.deleteTitle')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>

        {/* Card 1: Define Garment */}
        <Card title={t('controlPanel.defineGarment.title')}>
             <ToggleSwitch 
                label={t('controlPanel.defineGarment.toggle')}
                enabled={config.useAiApparel} 
                setEnabled={(val) => handleConfigChange('useAiApparel', val)} 
            />
            {config.useAiApparel ? (
                <div>
                  <label htmlFor="ai-apparel-prompt" className="block text-sm font-medium text-gray-300">{t('controlPanel.defineGarment.promptLabel')}</label>
                  <p id="ai-apparel-description" className="text-xs text-gray-500 mt-1 mb-2">{t('controlPanel.defineGarment.promptDescription')}</p>
                  <div className="relative">
                      <textarea
                        id="ai-apparel-prompt"
                        aria-describedby="ai-apparel-description"
                        value={config.aiApparelPrompt}
                        onChange={(e) => handleConfigChange('aiApparelPrompt', e.target.value)}
                        placeholder={t('controlPanel.defineGarment.promptPlaceholder')}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white resize-none pr-12"
                      />
                      <button 
                        onClick={() => handleVoiceInput('aiApparelPrompt')}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isRecording === 'apparel' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600/50 hover:bg-gray-500/50'}`} 
                        title={isRecording === 'apparel' ? t('controlPanel.mic.stop') : t('controlPanel.defineGarment.recordDescription')}
                      >
                        {isRecording === 'apparel' ? <StopIcon/> : <MicIcon className="h-4 w-4" />}
                      </button>
                  </div>
                </div>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineGarment.categoryLabel')}</label>
                        <select value={config.selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                            {GARMENT_CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{t(cat.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineGarment.typeLabel')}</label>
                        <select value={config.selectedGarment} onChange={(e) => handleGarmentChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                           {garmentItems.map(item => <option key={item} value={item}>{t(item)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineGarment.fitLabel')}</label>
                        <select value={config.fit} onChange={(e) => handleConfigChange('fit', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                           {FIT_OPTIONS.map(item => <option key={item} value={item}>{t(item)}</option>)}
                        </select>
                    </div>
                </>
            )}
            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                    {config.useAiApparel ? t('controlPanel.defineGarment.aiMaterialLabel') : t('controlPanel.defineGarment.materialLabel')}
                </label>
                {config.useAiApparel || garmentMaterials.length === 0 ? (
                    <input
                        type="text"
                        value={config.aiMaterialPrompt}
                        onChange={(e) => handleConfigChange('aiMaterialPrompt', e.target.value)}
                        placeholder={t('controlPanel.defineGarment.materialPlaceholder')}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                        disabled={!!config.customMaterialTexture}
                    />
                ) : (
                    <select 
                        value={t(config.aiMaterialPrompt, config.aiMaterialPrompt)} 
                        onChange={(e) => handleConfigChange('aiMaterialPrompt', e.target.value)} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                        disabled={!!config.customMaterialTexture}
                    >
                        {garmentMaterials.map(item => <option key={item} value={t(item)}>{t(item)}</option>)}
                    </select>
                )}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineGarment.colorLabel')}</label>
                <input type="color" value={config.selectedColor} onChange={(e) => handleConfigChange('selectedColor', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md"/>
            </div>
        </Card>

        {/* Card 2: Define Style */}
        <Card title={t('controlPanel.defineStyle.title')}>
             <div className="flex items-center gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineStyle.designStyleLabel')}</label>
                    <select value={config.selectedDesignStyle} onChange={(e) => handleConfigChange('selectedDesignStyle', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                        {DESIGN_STYLE_CATEGORIES.map(category => (
                            <optgroup key={category.name} label={t(category.name)}>
                                {category.items.map(item => <option key={item} value={item}>{t(item)}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <button onClick={() => setIsMixerOpen(true)} title={t('controlPanel.defineStyle.mixerButtonTitle')} className="self-end p-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                    <MagicWand className="h-5 w-5"/>
                </button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.defineStyle.mockupStyleLabel')}</label>
                <select value={config.selectedStyle} onChange={(e) => handleConfigChange('selectedStyle', e.target.value as StyleOption)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500">
                  {Object.values(STYLE_OPTIONS).map(item => <option key={item} value={item}>{t(item)}</option>)}
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
                <button onClick={handleTextureUploadClick} className="w-full text-center text-sm bg-gray-700 hover:bg-gray-600 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={config.selectedStyle === STYLE_OPTIONS.TECHNICAL_SKETCH}>
                   {config.selectedStyle === STYLE_OPTIONS.TECHNICAL_SKETCH ? t('controlPanel.defineStyle.uploadTextureDisabled') : t('controlPanel.defineStyle.uploadTextureButton')}
                </button>
                {config.customMaterialTexture && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                        <img src={config.customMaterialTexture} alt={t('controlPanel.defineStyle.customTexturePreviewAlt')} className="w-10 h-10 object-cover rounded"/>
                        <p className="text-xs text-gray-300 flex-grow truncate">{config.aiMaterialPrompt}</p>
                        <button 
                          onClick={() => {
                            handleConfigChange('customMaterialTexture', undefined);
                            handleConfigChange('aiMaterialPrompt', t('material.fleece'));
                          }} 
                          className="text-red-500 hover:text-red-400 font-bold text-lg"
                          title={t('controlPanel.defineStyle.removeCustomTexture')}
                        >
                          &times;
                        </button>
                    </div>
                )}
            </div>
        </Card>

        {/* Card 3: Advanced AI Options */}
        <Card title={t('controlPanel.advancedAI.title')}>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('controlPanel.advancedAI.modelLabel')}</label>
                <select 
                    value={config.selectedModel} 
                    onChange={(e) => handleConfigChange('selectedModel', e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-orange-500"
                >
                    {AI_IMAGE_MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                </select>
            </div>
            <ToggleSwitch 
                label={t('controlPanel.advancedAI.sceneToggleLabel')}
                description={t('controlPanel.advancedAI.sceneToggleDescription')}
                enabled={config.useAiModelScene} 
                setEnabled={(val) => handleConfigChange('useAiModelScene', val)} 
            />
            {config.useAiModelScene && (
                <div className="bg-gray-700/50 p-3 rounded-md space-y-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">{t('controlPanel.advancedAI.modelPromptLabel')}</label>
                        <input type="text" value={config.aiModelPrompt} onChange={(e) => handleConfigChange('aiModelPrompt', e.target.value)} placeholder={t('controlPanel.advancedAI.modelPromptPlaceholder')} className="w-full bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-sm"/>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-300 mb-1">{t('controlPanel.advancedAI.scenePromptLabel')}</label>
                       <input type="text" value={config.aiScenePrompt} onChange={(e) => handleConfigChange('aiScenePrompt', e.target.value)} placeholder={t('controlPanel.advancedAI.scenePromptPlaceholder')} className="w-full bg-gray-900 border border-gray-600 rounded-md py-1 px-2 text-sm"/>
                    </div>
                </div>
            )}
             <ToggleSwitch 
                label={t('controlPanel.advancedAI.searchToggleLabel')}
                description={t('controlPanel.advancedAI.searchToggleDescription').replace('{style}', t(config.selectedDesignStyle))}
                enabled={config.useGoogleSearch} 
                setEnabled={(val) => handleConfigChange('useGoogleSearch', val)} 
                disabled={isSearchDisabled}
             />
             {isSearchDisabled && <p className="text-xs text-gray-500 -mt-3">{config.customMaterialTexture ? t('controlPanel.advancedAI.searchDisabledCustomTexture') : t('controlPanel.advancedAI.searchDisabledImageModel')}</p>}

            <fieldset className="border-t border-gray-700 pt-4">
                <legend className="block text-sm font-medium text-gray-300 mb-2">{t('controlPanel.advancedAI.viewsLegend')}</legend>
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