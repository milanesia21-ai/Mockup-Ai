

import React from 'react';

interface RefinePanelProps {
    onRenderRealistic: () => void;
    onPropagateDesign: () => void;
    isLoading: boolean;
    finalRenderedImage: string | null;
    propagationTargetCount: number;
    hasLayers: boolean;
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

export const RefinePanel: React.FC<RefinePanelProps> = ({
    onRenderRealistic,
    onPropagateDesign,
    isLoading,
    finalRenderedImage,
    propagationTargetCount,
    hasLayers
}) => {
    return (
        <div className="p-4 flex flex-col items-center gap-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white">Refine & Finalize</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Apply the final touches. The AI will render your layers onto the mockup with realistic lighting, shadows, and fabric texture.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
                <div className="w-full">
                    <button
                        onClick={onRenderRealistic}
                        disabled={isLoading || !hasLayers}
                        className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Render Realistic Mockup'}
                    </button>
                    {!hasLayers && <p className="text-xs text-gray-500 text-center mt-2">Add layers in the "Design" step to enable rendering.</p>}
                </div>

                {finalRenderedImage && propagationTargetCount > 0 && (
                    <div className="w-full">
                         <button
                            onClick={onPropagateDesign}
                            disabled={isLoading}
                            className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoadingSpinner /> : `Propagate to ${propagationTargetCount} View${propagationTargetCount > 1 ? 's' : ''}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
