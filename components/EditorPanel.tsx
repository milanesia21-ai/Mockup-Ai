import React, { useState } from 'react';

interface EditorPanelProps {
    onGenerateGraphic: (prompt: string) => void;
    onEditImage: (prompt: string) => void;
    isLoading: boolean;
    hasGraphic: boolean;
    graphicRotation: number;
    onGraphicRotationChange: (value: number) => void;
    graphicFlip: { horizontal: boolean, vertical: boolean };
    onGraphicFlipChange: React.Dispatch<React.SetStateAction<{ horizontal: boolean, vertical: boolean }>>;
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

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
    onGenerateGraphic, 
    onEditImage, 
    isLoading,
    hasGraphic,
    graphicRotation,
    onGraphicRotationChange,
    graphicFlip,
    onGraphicFlipChange
}) => {
    const [graphicPrompt, setGraphicPrompt] = useState('');
    const [editPrompt, setEditPrompt] = useState('');

    return (
        <div className="h-full flex flex-col space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-white">A. Generate a Custom Graphic</h3>
                <p className="text-sm text-gray-400 mb-3">Describe a graphic to place on your mockup (e.g., "a roaring tiger logo", "a minimalist mountain range").</p>
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
                    {isLoading ? <LoadingSpinner /> : 'Generate Graphic'}
                </button>
            </div>

            <div className={`border-t border-gray-700 pt-6 ${!hasGraphic ? 'opacity-50' : ''}`}>
                <h3 className="text-lg font-semibold mb-2 text-white">B. Graphic Settings</h3>
                <p className="text-sm text-gray-400 mb-3">Adjust the graphic. For size, drag the corner of the graphic on the mockup.</p>
                
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
                    <button
                        onClick={() => onGraphicFlipChange(f => ({ ...f, horizontal: !f.horizontal }))}
                        disabled={isLoading || !hasGraphic}
                        className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors"
                    >
                        Flip Horizontal {graphicFlip.horizontal && '✓'}
                    </button>
                    <button
                        onClick={() => onGraphicFlipChange(f => ({ ...f, vertical: !f.vertical }))}
                        disabled={isLoading || !hasGraphic}
                        className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors"
                    >
                        Flip Vertical {graphicFlip.vertical && '✓'}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-2 text-white">C. Edit the Whole Image</h3>
                <p className="text-sm text-gray-400 mb-3">Describe a change to apply to the entire mockup (e.g., "add a vintage photo filter", "change the background to a cityscape"). This will merge any placed graphic.</p>
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
            </div>
        </div>
    );
};