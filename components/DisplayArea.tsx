


import React, { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { DraggableGraphic } from './DraggableGraphic';
import { SketchToolsConfig } from './EditorPanel';
import type { GeneratedImage, DesignLayer } from '../constants';
import { GroundingSource, PrintArea } from '../services/geminiService';
import { View3D, View2D, ExportFile } from './Icons';
import { Mockup3DViewer } from './Mockup3DViewer';
import { useTranslation } from '../hooks/useTranslation';


interface DisplayAreaProps {
  baseImages: GeneratedImage[];
  finalImage: string | null;
  layers: DesignLayer[];
  activeLayerId: string | null;
  onSetActiveLayer: (id: string | null) => void;
  onUpdateLayer: (id:string, updates: Partial<DesignLayer>, commit: boolean) => void;
  groundingSources: GroundingSource[];
  sketchTools: SketchToolsConfig;
  isLoading: boolean;
  selectedGarment: string;
  printArea: PrintArea | null;
  cleanBaseImages: GeneratedImage[];
}

const Placeholder: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-300">{t('displayArea.placeholder.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('displayArea.placeholder.description')}</p>
        </div>
    );
};

const LoadingIndicator: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
            <svg className="animate-spin h-12 w-12 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-300">{t('displayArea.loading.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('displayArea.loading.description')}</p>
        </div>
    );
};

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
    groundingSources,
    sketchTools,
    isLoading,
    selectedGarment,
    printArea,
    cleanBaseImages
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const { t } = useTranslation();

  const activeLayer = layers.find(l => l.id === activeLayerId);
  const isSketchMode = activeLayer?.type === 'drawing';
  const primaryImage = finalImage || baseImages[0]?.url || null;

  useEffect(() => {
    setImageError(false);
    setViewMode('2d');
  }, [primaryImage]);


  // Sincronizza il canvas di disegno con il contenuto del livello attivo
  useLayoutEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Imposta le dimensioni del canvas dal contenitore
    const container = containerRef.current;
    if (container) {
        const { clientWidth, clientHeight } = container;
        const imgElement = container.querySelector('img[data-is-base-image="true"]') as HTMLImageElement;
        if(imgElement) {
             const ar = imgElement.naturalWidth / imgElement.naturalHeight;
             const newW = Math.min(clientWidth, clientHeight * ar);
             const newH = Math.min(clientHeight, clientWidth / ar);
             canvas.width = newW;
             canvas.height = newH;
        } else {
             canvas.width = clientWidth;
             canvas.height = clientHeight;
        }
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isSketchMode && activeLayer.content) {
        const img = new Image();
        img.onload = () => {
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = activeLayer.content;
    }
  }, [activeLayerId, activeLayer?.content, isSketchMode, layers]); // Esegui di nuovo quando il livello attivo cambia


  const getBrushStyle = (opacity: number) => {
    switch (sketchTools.brushType) {
        case 'pencil':
            return `rgba(${parseInt(sketchTools.brushColor.slice(1, 3), 16)}, ${parseInt(sketchTools.brushColor.slice(3, 5), 16)}, ${parseInt(sketchTools.brushColor.slice(5, 7), 16)}, ${0.4 * opacity})`;
        case 'pen':
            return sketchTools.brushColor;
        case 'eraser':
             return `rgba(0,0,0,1)`; // La gomma usa destination-out
        default:
            return sketchTools.brushColor;
    }
  };

  const getCompositeOperation = () => {
      if (sketchTools.brushType === 'eraser') return 'destination-out';
      return activeLayer?.blendMode || 'source-over';
  };

  const drawLine = (ctx: CanvasRenderingContext2D, from: {x: number, y: number}, to: {x: number, y: number}) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSketchMode) return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    lastPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !lastPoint.current || !isSketchMode) return;

      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.globalCompositeOperation = activeLayer.lockTransparency ? 'source-atop' : getCompositeOperation();
      ctx.strokeStyle = getBrushStyle(sketchTools.brushOpacity);
      ctx.lineWidth = sketchTools.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const rect = e.currentTarget.getBoundingClientRect();
      const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      
      drawLine(ctx, lastPoint.current, currentPoint);
      
      if (sketchTools.symmetry !== 'none') {
        const { width, height } = canvas;
        const symFrom = { ...lastPoint.current };
        const symTo = { ...currentPoint };

        if (sketchTools.symmetry === 'vertical') {
          symFrom.x = width - symFrom.x;
          symTo.x = width - symTo.x;
        } else if (sketchTools.symmetry === 'horizontal') {
          symFrom.y = height - symFrom.y;
          symTo.y = height - symTo.y;
        }
        drawLine(ctx, symFrom, symTo);
      }
      lastPoint.current = currentPoint;
  };

  const handleMouseUp = () => {
      if (!isDrawing || !isSketchMode) return;
      setIsDrawing(false);
      lastPoint.current = null;
      
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        onUpdateLayer(activeLayer.id, { content: canvas.toDataURL() }, true);
      }
  };


  const handleDownload = () => {
    if (!primaryImage) return;

    if (finalImage) {
      const link = document.createElement('a');
      link.download = 'apparel-mockup-finale.png';
      link.href = finalImage;
      link.click();
    } else {
      baseImages.forEach(image => {
        const link = document.createElement('a');
        link.download = `apparel-mockup-${image.view.toLowerCase().replace(' ', '-')}.png`;
        link.href = image.url;
        link.click();
      });
    }
  };

  const handleExportSVG = () => {
    if (!cleanBaseImages.length || !printArea) {
        toast.error("Cannot export without a base image and analyzed print area.");
        return;
    }

    const viewBoxWidth = 1000;
    const viewBoxHeight = 1000;

    const layerElements = layers
        .filter(l => l.visible)
        .map(layer => {
            const w = layer.size.width * viewBoxWidth;
            const h = layer.size.height * viewBoxHeight;
            const x = layer.position.x * viewBoxWidth;
            const y = layer.position.y * viewBoxHeight;
            
            const transform = `translate(${x}, ${y}) rotate(${layer.rotation}) translate(${-w / 2}, ${-h / 2})`;

            if (layer.type === 'image' || layer.type === 'drawing') {
                return `<image transform="${transform}" x="0" y="0" width="${w}" height="${h}" xlink:href="${layer.content}" style="mix-blend-mode: ${layer.blendMode}; opacity: ${layer.opacity};" />`;
            }
            if (layer.type === 'text') {
                // A simple approximation for font size. A more robust solution might be needed.
                const fontSize = Math.min(h * 0.8, w / (layer.content.length * 0.6 || 1));
                return `<text transform="${transform}" x="${w/2}" y="${h/2}" font-family="${layer.fontFamily}" font-weight="${layer.fontWeight}" fill="${layer.color}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" style="mix-blend-mode: ${layer.blendMode}; opacity: ${layer.opacity};">${layer.content}</text>`;
            }
             if (layer.type === 'shape') {
                if (layer.content === 'rectangle') {
                    return `<rect transform="${transform}" x="0" y="0" width="${w}" height="${h}" fill="${layer.fill}" style="mix-blend-mode: ${layer.blendMode}; opacity: ${layer.opacity};" />`;
                }
                if (layer.content === 'circle') {
                    return `<ellipse transform="${transform}" cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="${layer.fill}" style="mix-blend-mode: ${layer.blendMode}; opacity: ${layer.opacity};" />`;
                }
            }
            return '';
        }).join('\n');

    const svgContent = `
<svg width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="print-clip">
      <rect x="${printArea.x * viewBoxWidth}" y="${printArea.y * viewBoxHeight}" width="${printArea.width * viewBoxWidth}" height="${printArea.height * viewBoxHeight}" />
    </clipPath>
  </defs>

  <metadata>
    <print-specifications>
      <area-id>center-chest</area-id>
      <dimensions-normalized>
        <x>${printArea.x}</x>
        <y>${printArea.y}</y>
        <width>${printArea.width}</width>
        <height>${printArea.height}</height>
      </dimensions-normalized>
      <printing-method>DTG_SUGGESTED</printing-method>
      <color-mode>RGB_SOURCE</color-mode>
      <source-mockup-app>Apparel Mockup AI</source-mockup-app>
    </print-specifications>
  </metadata>

  <g id="reference-mockup">
    <image x="0" y="0" width="${viewBoxWidth}" height="${viewBoxHeight}" xlink:href="${cleanBaseImages[0].url}" opacity="0.4" />
    <rect x="${printArea.x * viewBoxWidth}" y="${printArea.y * viewBoxHeight}" width="${printArea.width * viewBoxWidth}" height="${printArea.height * viewBoxHeight}" fill="none" stroke="#FF4500" stroke-width="2" stroke-dasharray="10,5" />
  </g>

  <g id="user-graphic-layer-clipped" clip-path="url(#print-clip)">
    ${layerElements}
  </g>

  <g id="user-graphic-layer-unclipped" style="display: none;">
     <!-- Same layers without clipping for reference -->
     ${layerElements}
  </g>
</svg>
    `;

    const blob = new Blob([svgContent.trim()], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'print-file.svg';
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File di stampa SVG esportato!");
};
  
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      // Deseleziona se si fa clic sul contenitore stesso o sull'immagine di base
      if (target === containerRef.current || target.dataset.isBaseImage || target.id === "drawing-canvas") {
          onSetActiveLayer(null);
      }
  };

  const isGalleryView = baseImages.length > 1 && !finalImage;

  return (
    <div 
        className="bg-gray-700 w-full h-full rounded-lg shadow-2xl flex flex-col p-4"
    >
      <div className="flex-grow w-full flex items-center justify-center relative overflow-hidden min-h-0">
        {isLoading ? (
          <LoadingIndicator />
        ) : primaryImage && !imageError ? (
          <>
            {viewMode === '3d' ? (
              <Mockup3DViewer imageUrl={primaryImage} selectedGarment={selectedGarment} />
            ) : (
              <div 
                ref={containerRef} 
                className={`w-full h-full flex items-center justify-center relative`}
                onClick={handleContainerClick}
              >
                {isGalleryView ? (
                     <div className="grid grid-cols-2 gap-4 w-full h-full overflow-y-auto">
                        {baseImages.map((image, index) => (
                            <div key={index} className="relative aspect-square">
                                <img 
                                    src={image.url} 
                                    alt={t('displayArea.generatedMockupViewAlt', 'Generated mockup - {view} view').replace('{view}', image.view)}
                                    onError={() => setImageError(true)}
                                    className="w-full h-full object-contain rounded-md"
                                />
                                <div className="absolute bottom-1 right-1 bg-gray-900/50 text-white text-xs px-2 py-1 rounded">
                                    {image.view}
                                </div>
                            </div>
                        ))}
                     </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={primaryImage} 
                            alt={t('displayArea.generatedMockupAlt')}
                            className="max-w-full max-h-full object-contain rounded-md select-none"
                            onError={() => setImageError(true)}
                            data-is-base-image="true"
                        />
                         {printArea && viewMode === '2d' && !isGalleryView && containerRef.current && (
                            <div
                                className="absolute"
                                style={{
                                    left: `0px`,
                                    top: `0px`,
                                    width: `100%`,
                                    height: `100%`,
                                    pointerEvents: 'none',
                                }}
                                >
                                <div
                                    className="absolute border-2 border-dashed border-orange-500 pointer-events-none"
                                    style={{
                                        left: `${printArea.x * 100}%`,
                                        top: `${printArea.y * 100}%`,
                                        width: `${printArea.width * 100}%`,
                                        height: `${printArea.height * 100}%`,
                                        boxSizing: 'border-box',
                                        zIndex: 99
                                    }}
                                />
                            </div>
                        )}
                         <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {layers.map((layer, index) => (
                                layer.type !== 'drawing' && (
                                     <DraggableGraphic 
                                        key={layer.id}
                                        containerRef={containerRef}
                                        layer={layer}
                                        onUpdateLayer={onUpdateLayer}
                                        isActive={activeLayerId === layer.id}
                                        onSetActive={() => onSetActiveLayer(layer.id)}
                                        zIndex={index + 5}
                                    />
                                )
                            ))}
                         </div>
                         <canvas
                            id="drawing-canvas"
                            ref={drawingCanvasRef}
                            className={`absolute object-contain ${isSketchMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                            style={{ zIndex: layers.findIndex(l => l.id === activeLayerId) + 5, opacity: activeLayer?.opacity, display: isSketchMode && activeLayer?.visible ? 'block' : 'none' }}
                            onMouseDown={isSketchMode ? handleMouseDown : undefined}
                            onMouseMove={isSketchMode ? handleMouseMove : undefined}
                            onMouseUp={isSketchMode ? handleMouseUp : undefined}
                            onMouseLeave={isSketchMode ? handleMouseUp : undefined}
                          />
                    </div>
                )}
              </div>
            )}


             {groundingSources && groundingSources.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg max-w-xs text-xs border border-gray-700 z-20">
                <h4 className="font-bold text-gray-200 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  {t('displayArea.groundingTitle')}
                </h4>
                <ul className="space-y-1 max-h-24 overflow-y-auto pr-2">
                  {groundingSources.map((source, index) => (
                    <li key={index} className="truncate">
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline" title={source.title}>
                        {source.title || new URL(source.uri).hostname}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : <Placeholder />}
      </div>
       {primaryImage && !imageError && (
        <div className="flex-shrink-0 flex justify-end items-center gap-2 pt-4">
           <button
              onClick={handleExportSVG}
              className="bg-gray-800 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
              aria-label={t('displayArea.exportButton')}
          >
              <ExportFile className="h-5 w-5" />
              <span>{t('displayArea.exportButton')}</span>
          </button>
          <button
              onClick={() => setViewMode(v => v === '2d' ? '3d' : '2d')}
              className="bg-gray-800 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
              aria-label={viewMode === '2d' ? t('displayArea.switchTo3D') : t('displayArea.switchTo2D')}
          >
              {viewMode === '2d' ? <View3D className="h-5 w-5" /> : <View2D className="h-5 w-5" />}
              <span>{viewMode === '2d' ? '3D' : '2D'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-orange-600 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
            aria-label={t('displayArea.downloadButton')}
          >
            <DownloadIcon className="h-5 w-5" />
            <span>{t('displayArea.downloadButton')}</span>
          </button>
        </div>
      )}
    </div>
  );
};