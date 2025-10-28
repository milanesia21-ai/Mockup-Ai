import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { DraggableGraphic } from './DraggableGraphic';

interface DisplayAreaProps {
  generatedImage: string | null;
  graphic: string | null;
  graphicPosition: { x: number; y: number };
  onGraphicPositionChange: Dispatch<SetStateAction<{ x: number; y: number }>>;
  graphicSize: number;
  onGraphicSizeChange: Dispatch<SetStateAction<number>>;
  graphicRotation: number;
  graphicFlip: { horizontal: boolean; vertical: boolean };
  finishSimulation: string;
  smartDisplacement: boolean;
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
    generatedImage, 
    graphic, 
    graphicPosition, 
    onGraphicPositionChange,
    graphicSize,
    onGraphicSizeChange,
    graphicRotation,
    graphicFlip,
    finishSimulation,
    smartDisplacement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!generatedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = generatedImage;
    await new Promise(resolve => { baseImg.onload = resolve; });

    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    ctx.drawImage(baseImg, 0, 0);

    if (graphic) {
      const graphicImg = new Image();
      graphicImg.crossOrigin = "anonymous";
      graphicImg.src = graphic;
      await new Promise(resolve => { graphicImg.onload = resolve; });
      
      const targetWidth = canvas.width * graphicSize;
      const targetHeight = (graphicImg.naturalHeight / graphicImg.naturalWidth) * targetWidth;
      const targetX = (graphicPosition.x * canvas.width) - (targetWidth / 2);
      const targetY = (graphicPosition.y * canvas.height) - (targetHeight / 2);
      
      ctx.save();
      // Apply effects before drawing
      ctx.globalAlpha = smartDisplacement ? 0.9 : 1;
      ctx.globalCompositeOperation = smartDisplacement ? 'multiply' : 'source-over';
      
      ctx.translate(targetX + targetWidth / 2, targetY + targetHeight / 2);
      ctx.rotate(graphicRotation * Math.PI / 180);
      ctx.scale(graphicFlip.horizontal ? -1 : 1, graphicFlip.vertical ? -1 : 1);
      ctx.drawImage(graphicImg, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();
    }

    const link = document.createElement('a');
    link.download = 'apparel-mockup-custom.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div ref={containerRef} className="bg-black w-full h-full min-h-[60vh] lg:min-h-full rounded-lg shadow-2xl flex items-center justify-center p-4 relative overflow-hidden">
      {generatedImage ? (
        <>
          <img 
            src={generatedImage} 
            alt="Generated apparel mockup" 
            className="max-w-full max-h-full object-contain rounded-md select-none pointer-events-none"
          />
          {graphic && containerRef.current && (
             <DraggableGraphic 
              containerRef={containerRef}
              src={graphic} 
              initialPosition={graphicPosition}
              onPositionChange={onGraphicPositionChange}
              initialSize={graphicSize}
              onSizeChange={onGraphicSizeChange}
              initialRotation={graphicRotation}
              flip={graphicFlip}
              finishSimulation={finishSimulation}
              smartDisplacement={smartDisplacement}
             />
          )}
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