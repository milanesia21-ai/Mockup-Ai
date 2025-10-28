
import React, { useRef } from 'react';
import { DraggableGraphic } from './DraggableGraphic';
import { DesignLayer } from './EditorPanel';
import { GeneratedImage } from '../App';


interface DisplayAreaProps {
  baseImages: GeneratedImage[];
  finalImage: string | null;
  layers: DesignLayer[];
  activeLayerId: string | null;
  onSetActiveLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
}

const Placeholder: React.FC = () => (
  <div className="text-center text-gray-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h3 className="mt-4 text-xl font-medium text-gray-300">Your Mockup Will Appear Here</h3>
    <p className="mt-1 text-sm text-gray-500">Configure the options and click "Generate Mockup".</p>
  </div>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


export const DisplayArea: React.FC<DisplayAreaProps> = ({ 
    baseImages, 
    finalImage,
    layers,
    activeLayerId,
    onSetActiveLayer,
    onUpdateLayer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryImage = finalImage || baseImages[0]?.url || null;

  const handleDownload = () => {
    if (!primaryImage) return;

    if (finalImage) {
      // Single final image download
      const link = document.createElement('a');
      link.download = 'apparel-mockup-final.png';
      link.href = finalImage;
      link.click();
    } else {
      // Download all generated views (could be one or more)
      baseImages.forEach(image => {
        const link = document.createElement('a');
        link.download = `apparel-mockup-${image.view.toLowerCase().replace(' ', '-')}.png`;
        link.href = image.url;
        link.click();
      });
    }
  };
  
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Deselect if clicking the container itself
      if (e.target === containerRef.current) {
          onSetActiveLayer(null);
      }
  };

  const isGalleryView = baseImages.length > 1 && !finalImage;

  return (
    <div 
        className="bg-black w-full h-full min-h-[60vh] lg:min-h-full rounded-lg shadow-2xl flex items-center justify-center p-4 relative overflow-hidden"
    >
      {primaryImage ? (
        <>
          <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center"
            onClick={handleContainerClick}
          >
            {isGalleryView ? (
                 <div className="grid grid-cols-2 gap-4 w-full h-full">
                    {baseImages.map((image, index) => (
                        <img 
                            key={index}
                            src={image.url} 
                            alt={`Generated apparel mockup view ${image.view}`}
                            className="w-full h-full object-contain rounded-md"
                        />
                    ))}
                 </div>
            ) : (
                <div className="relative w-full h-full">
                    <img 
                        src={primaryImage} 
                        alt="Generated apparel mockup" 
                        className="w-full h-full object-contain rounded-md select-none pointer-events-none"
                    />
                    {containerRef.current && !finalImage && layers.map(layer => (
                        <DraggableGraphic 
                            key={layer.id}
                            containerRef={containerRef}
                            layer={layer}
                            onUpdateLayer={onUpdateLayer}
                            isActive={activeLayerId === layer.id}
                            onSetActive={() => onSetActiveLayer(layer.id)}
                        />
                    ))}
                </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            className="absolute bottom-4 right-4 bg-indigo-600 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
            aria-label="Download Mockup"
          >
            <DownloadIcon className="h-5 w-5" />
            <span>Download</span>
          </button>
        </>
      ) : <Placeholder />}
    </div>
  );
};
