import React, { useState } from 'react';
import { TARGET_AREAS, FINISH_SIMULATIONS } from '../constants';

interface EditorPanelProps {
    onGenerateGraphic: (prompt: string) => void;
    onEditImage: (prompt: string) => void;
    isLoading: boolean;
    hasGraphic: boolean;
    graphicPrompt: string;
    onGraphicPromptChange: (value: string) => void;
    graphicRotation: number;
    onGraphicRotationChange: (value: number) => void;
    graphicFlip: { horizontal: boolean, vertical: boolean };
    onGraphicFlipChange: React.Dispatch<React.SetStateAction<{ horizontal: boolean, vertical: boolean }>>;
    // New Advanced AI Feature props
    targetArea: string;
    onTargetAreaChange: (value: string) => void;
    finishSimulation: string;
    onFinishSimulationChange: (value: string) => void;
    smartDisplacement: boolean;
    onSmartDisplacementChange: (value: boolean) => void;
    onCheckContrast: () => void;
    onGenerateVariation: () => void;
    onReversePrompt: (imageDataUrl: string) => void;
    onPrintSafetyCheck: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Processing...</span>
    </div>
);

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode; disabled?: boolean, className?: string }> = ({ title, description, children, disabled = false, className = '' }) => (
    <div className={`border-t border-gray-700 pt-6 ${disabled ? 'opacity-50' : ''} ${className}`}>
        <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mb-3">{description}</p>}
        {children}
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
    onGenerateGraphic, 
    onEditImage, 
    isLoading,
    hasGraphic,
    graphicPrompt,
    onGraphicPromptChange,
    graphicRotation,
    onGraphicRotationChange,
    graphicFlip,
    onGraphicFlipChange,
    targetArea,
    onTargetAreaChange,
    finishSimulation,
    onFinishSimulationChange,
    smartDisplacement,
    onSmartDisplacementChange,
    onCheckContrast,
    onGenerateVariation,
    onReversePrompt,
    onPrintSafetyCheck
}) => {
    const [editPrompt, setEditPrompt] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
           try {
                const imageDataUrl = await fileToDataUrl(e.target.files[0]);
                onReversePrompt(imageDataUrl);
           } catch (error) {
                console.error("Error reading file:", error);
           }
        }
        // Reset file input to allow re-uploading the same file
        e.target.value = '';
    };

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
            <Section title="A. Generate a Custom Graphic" description='Describe a graphic to place on your mockup (e.g., "a roaring tiger logo", "a minimalist mountain range").'>
                <textarea
                    value={graphicPrompt}
                    onChange={(e) => onGraphicPromptChange(e.target.value)}
                    placeholder="e.g., A retro-style phoenix, vector art"
                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                    disabled={isLoading}
                />
                <div className="mt-2 mb-4">
                     <label htmlFor="target-area" className="block text-sm font-medium text-gray-300 mb-1">Target Area</label>
                     <select
                        id="target-area"
                        value={targetArea}
                        onChange={(e) => onTargetAreaChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        disabled={isLoading}
                    >
                        {TARGET_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => onGenerateGraphic(graphicPrompt)}
                    disabled={isLoading || !graphicPrompt}
                    className="w-full mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate Graphic'}
                </button>
            </Section>

            <Section title="B. Graphic Settings" description="Adjust the graphic. For size, drag the corner of the graphic on the mockup." disabled={!hasGraphic}>
                <div className="mb-4">
                    <label htmlFor="rotation" className="block text-sm font-medium text-gray-300 mb-1">Rotation (°)</label>
                    <input
                        type="number"
                        id="rotation"
                        value={graphicRotation}
                        onChange={(e) => onGraphicRotationChange(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        disabled={isLoading || !hasGraphic}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onGraphicFlipChange(f => ({ ...f, horizontal: !f.horizontal }))} disabled={isLoading || !hasGraphic} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors">
                        Flip Horizontal {graphicFlip.horizontal && '✓'}
                    </button>
                    <button onClick={() => onGraphicFlipChange(f => ({ ...f, vertical: !f.vertical }))} disabled={isLoading || !hasGraphic} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors">
                        Flip Vertical {graphicFlip.vertical && '✓'}
                    </button>
                </div>
            </Section>

            <Section title="C. Edit the Whole Image" description='Describe a change to apply to the entire mockup (e.g., "add a vintage photo filter", "change the background to a cityscape"). This will merge any placed graphic.'>
                <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., Change the T-shirt color to navy blue"
                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                    disabled={isLoading}
                />
                <button
                    onClick={() => onEditImage(editPrompt)}
                    disabled={isLoading || !editPrompt}
                    className="w-full mt-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoadingSpinner /> : 'Apply Full Edit'}
                </button>
            </Section>
            
            <Section title="D. Advanced AI Features" disabled={!hasGraphic} className="!mt-6 space-y-4">
                <div>
                     <label htmlFor="finish-sim" className="block text-sm font-medium text-gray-300 mb-1">Finish Simulation</label>
                     <select
                        id="finish-sim"
                        value={finishSimulation}
                        onChange={(e) => onFinishSimulationChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        disabled={isLoading || !hasGraphic}
                    >
                        {FINISH_SIMULATIONS.map(sim => <option key={sim} value={sim}>{sim}</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                    <label htmlFor="displacement-toggle" className="text-sm font-medium text-gray-300">Smart Displacement Mapping</label>
                    <button
                        id="displacement-toggle"
                        onClick={() => onSmartDisplacementChange(!smartDisplacement)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${smartDisplacement ? 'bg-indigo-600' : 'bg-gray-600'}`}
                        disabled={isLoading || !hasGraphic}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${smartDisplacement ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={onCheckContrast} disabled={isLoading || !hasGraphic} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors text-sm">Check Contrast</button>
                    <button onClick={onGenerateVariation} disabled={isLoading || !hasGraphic} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors text-sm">Generate Variation</button>
                    <button onClick={onPrintSafetyCheck} disabled={isLoading || !hasGraphic} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors text-sm">Print Safety Check</button>
                     <div className="relative">
                        <input type="file" id="reverse-prompt-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" disabled={isLoading} />
                        <label htmlFor="reverse-prompt-upload" className="w-full h-full flex items-center justify-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors text-sm cursor-pointer">Reverse Prompt</label>
                    </div>
                </div>
            </Section>
        </div>
    );
};