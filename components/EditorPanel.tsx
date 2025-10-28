import React, { useState } from 'react';
import { FONT_OPTIONS } from '../constants';

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

interface EditorPanelProps {
    layers: DesignLayer[];
    activeLayerId: string | null;
    onAddLayer: (layer: Partial<DesignLayer>) => void;
    onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
    onDeleteLayer: (id: string) => void;
    onReorderLayer: (from: number, to: number) => void;
    onSetActiveLayer: (id: string | null) => void;
    onGenerateGraphic: (prompt: string) => void;
    onRenderRealistic: () => void;
    isLoading: boolean;
}

type EditorTab = 'layers' | 'text' | 'elements' | 'uploads' | 'generate';

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
    onRenderRealistic,
    isLoading
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('layers');
    const [graphicPrompt, setGraphicPrompt] = useState('');
    
    const activeLayer = layers.find(l => l.id === activeLayerId);

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

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'generate':
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">Generate AI Graphic</h3>
                        <textarea
                            value={graphicPrompt}
                            onChange={(e) => setGraphicPrompt(e.target.value)}
                            placeholder="e.g., A retro-style phoenix, vector art"
                            className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                            disabled={isLoading}
                        />
                         <button
                            onClick={() => onGenerateGraphic(graphicPrompt)}
                            disabled={isLoading || !graphicPrompt}
                            className="w-full mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Generate & Add Graphic'}
                        </button>
                    </div>
                );
            case 'text':
                return (
                    <div>
                         <h3 className="text-lg font-semibold mb-4 text-white">Text Tools</h3>
                         <button onClick={() => onAddLayer({type: 'text', content: 'Hello World', fontFamily: 'Arial', fontSize: 50, color: '#FFFFFF'})} className="w-full bg-gray-600 p-2 rounded-md mb-4">Add Text</button>
                         {activeLayer?.type === 'text' && (
                            <div className="space-y-4">
                                <textarea
                                    value={activeLayer.content}
                                    onChange={(e) => onUpdateLayer(activeLayerId!, { content: e.target.value })}
                                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md p-2"
                                />
                                <select value={activeLayer.fontFamily} onChange={e => onUpdateLayer(activeLayerId!, { fontFamily: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                    {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                                <input type="color" value={activeLayer.color} onChange={e => onUpdateLayer(activeLayerId!, { color: e.target.value })} className="w-full p-1 h-10 bg-gray-700 rounded-md"/>
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
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold mb-2 text-white">Layers</h3>
                        {layers.map((layer, index) => (
                            <div key={layer.id} onClick={() => onSetActiveLayer(layer.id)} className={`flex items-center p-2 rounded-md cursor-pointer ${activeLayerId === layer.id ? 'bg-indigo-500/30' : 'bg-gray-700'}`}>
                                <div className="flex-grow truncate pr-2">
                                    {layer.type === 'image' && <img src={layer.content} className="w-8 h-8 object-contain inline mr-2"/>}
                                    {layer.type === 'text' && <span className="text-xl font-bold mr-2">T</span>}
                                    {layer.content}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, {visible: !layer.visible})}}>{layer.visible ? '👁️' : '🙈'}</button>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id)}}>🗑️</button>
                                </div>
                            </div>
                        ))}
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
                    className="w-full mt-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoadingSpinner /> : 'Render Realistic Mockup'}
                </button>
            </div>
        </div>
    );
};
