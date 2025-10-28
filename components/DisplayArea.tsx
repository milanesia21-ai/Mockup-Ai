import React, { useRef } from 'react';
// FIX: Import Dispatch and SetStateAction for correct prop typing.
import type { Dispatch, SetStateAction } from 'react';
import { DraggableGraphic } from './DraggableGraphic';

interface DisplayAreaProps {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  generatedImage: string | null;
  graphic: string | null;
  // FIX: Update the type to correctly reflect that it's a state setter function from useState.
  onGraphicPositionChange: Dispatch<SetStateAction<{ x: number; y: number }>>;
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

const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center text-gray-400">
    <div className="mx-auto h-20 w-20">
      <svg className="animate-spin h-full w-full text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <h3 className="mt-6 text-xl font-medium text-gray-300">{message}</h3>
    <p className="mt-1 text-sm text-gray-500">This can take a moment. The AI is hard at work!</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center text-red-400 border border-red-400 bg-red-900 bg-opacity-30 rounded-lg p-6">
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 className="mt-4 text-xl font-medium text-red-300">An Error Occurred</h3>
    <p className="mt-1 text-sm">{message}</p>
  </div>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


export const DisplayArea: React.FC<DisplayAreaProps> = ({ isLoading, loadingMessage, error, generatedImage, graphic, onGraphicPositionChange }) => {
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
      const graphicPos = await new Promise<{ x: number; y: number }>((resolve) => {
        // A bit of a hack to get the latest position state for the canvas composition
        onGraphicPositionChange((currentPos) => {
          resolve(currentPos);
          return currentPos;
        });
      });
      graphicImg.src = graphic;
      await new Promise(resolve => { graphicImg.onload = resolve; });
      
      const targetWidth = canvas.width * 0.3; // Graphic will be 30% of the mockup's width
      const targetHeight = (graphicImg.naturalHeight / graphicImg.naturalWidth) * targetWidth;
      const targetX = (graphicPos.x * canvas.width) - (targetWidth / 2);
      const targetY = (graphicPos.y * canvas.height) - (targetHeight / 2);
      ctx.drawImage(graphicImg, targetX, targetY, targetWidth, targetHeight);
    }

    const link = document.createElement('a');
    link.download = 'apparel-mockup-custom.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div ref={containerRef} className="bg-black w-full h-full min-h-[60vh] lg:min-h-full rounded-lg shadow-2xl flex items-center justify-center p-4 relative overflow-hidden">
      {isLoading && <Loader message={loadingMessage} />}
      {!isLoading && error && <ErrorDisplay message={error} />}
      {!isLoading && !error && generatedImage && (
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
              onPositionChange={onGraphicPositionChange}
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
      )}
      {!isLoading && !error && !generatedImage && <Placeholder />}
    </div>
  );
};