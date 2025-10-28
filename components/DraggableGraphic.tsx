import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface DraggableGraphicProps {
  src: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange: (size: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  initialPosition: { x: number; y: number }; // Center position as %
  initialSize: number; // Factor of container width
  initialRotation: number; // degrees
  flip: { horizontal: boolean; vertical: boolean };
  finishSimulation: string;
  smartDisplacement: boolean;
}

export const DraggableGraphic: React.FC<DraggableGraphicProps> = ({ 
  src, 
  onPositionChange, 
  onSizeChange, 
  containerRef, 
  initialPosition, 
  initialSize, 
  initialRotation, 
  flip,
  finishSimulation,
  smartDisplacement
}) => {
  const [isInteracting, setIsInteracting] = useState<false | 'dragging' | 'resizing'>(false);
  const graphicRef = useRef<HTMLDivElement>(null);
  const interactionStart = useRef({
    mouseX: 0,
    mouseY: 0,
    elementX: 0,
    elementY: 0,
    width: 0,
    height: 0,
  });
  const [naturalAspectRatio, setNaturalAspectRatio] = useState(1);
  
  const graphicStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      mixBlendMode: smartDisplacement ? 'multiply' : 'normal',
      filter: 'none',
    };

    switch(finishSimulation) {
      case 'High-Density Embroidery':
        styles.filter = 'brightness(1.05) contrast(1.1) drop-shadow(0px 1px 1px rgba(0,0,0,0.4))';
        break;
      case 'Heavy Screen Print Ink':
        styles.filter = 'brightness(1.1) contrast(1.05) drop-shadow(0px 1px 0.5px rgba(0,0,0,0.2))';
        break;
      case 'Distressed Vintage Print':
        styles.opacity = 0.85;
        styles.filter = 'contrast(1.2) saturate(0.9)';
        break;
      case 'Foil/Metallic Print':
        styles.filter = 'brightness(1.3) contrast(1.2) saturate(1.1)';
        break;
      default: // Standard Screen Print
        break;
    }
    return styles;
  }, [finishSimulation, smartDisplacement]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      setNaturalAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  const updateElementTransform = useCallback(() => {
    if (!containerRef.current || !graphicRef.current || naturalAspectRatio === 0) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width * initialSize;
    const height = width / naturalAspectRatio;
    const x = initialPosition.x * containerRect.width - width / 2;
    const y = initialPosition.y * containerRect.height - height / 2;
    
    const graphic = graphicRef.current;
    graphic.style.width = `${width}px`;
    graphic.style.height = `${height}px`;
    graphic.style.left = `${x}px`;
    graphic.style.top = `${y}px`;
    graphic.style.transform = `rotate(${initialRotation}deg)`;

  }, [initialPosition, initialSize, initialRotation, naturalAspectRatio, containerRef]);
  
  useEffect(() => {
    updateElementTransform();
  }, [updateElementTransform]);

  useEffect(() => {
      const observer = new ResizeObserver(updateElementTransform);
      const container = containerRef.current;
      if (container) {
          observer.observe(container);
      }
      return () => {
        if (container) {
            observer.unobserve(container);
        }
      }
  }, [containerRef, updateElementTransform]);

  const handleInteractionStart = (e: React.MouseEvent, type: 'dragging' | 'resizing') => {
    e.preventDefault();
    e.stopPropagation();
    if (!graphicRef.current) return;

    setIsInteracting(type);
    const rect = graphicRef.current.getBoundingClientRect();

    interactionStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: graphicRef.current.offsetLeft,
      elementY: graphicRef.current.offsetTop,
      width: rect.width,
      height: rect.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isInteracting || !graphicRef.current || !containerRef.current) return;
      e.preventDefault();

      const dx = e.clientX - interactionStart.current.mouseX;
      const dy = e.clientY - interactionStart.current.mouseY;
      const containerRect = containerRef.current.getBoundingClientRect();
      const graphic = graphicRef.current;

      if (isInteracting === 'dragging') {
        let newX = interactionStart.current.elementX + dx;
        let newY = interactionStart.current.elementY + dy;

        newX = Math.max(0, Math.min(newX, containerRect.width - graphic.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - graphic.offsetHeight));

        graphic.style.left = `${newX}px`;
        graphic.style.top = `${newY}px`;
      } else if (isInteracting === 'resizing') {
        const newWidth = interactionStart.current.width + dx;
        const newHeight = newWidth / naturalAspectRatio;
        
        if (interactionStart.current.elementX + newWidth > containerRect.width ||
            interactionStart.current.elementY + newHeight > containerRect.height) {
            return;
        }

        graphic.style.width = `${Math.max(20, newWidth)}px`;
        graphic.style.height = `${Math.max(20 / naturalAspectRatio, newHeight)}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isInteracting || !graphicRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const graphic = graphicRef.current;
      
      const newWidth = graphic.offsetWidth;
      const newHeight = graphic.offsetHeight;
      const newX = graphic.offsetLeft;
      const newY = graphic.offsetTop;

      const finalXPercent = (newX + newWidth / 2) / containerRect.width;
      const finalYPercent = (newY + newHeight / 2) / containerRect.height;
      onPositionChange({ x: finalXPercent, y: finalYPercent });

      const finalSizeFactor = newWidth / containerRect.width;
      onSizeChange(finalSizeFactor);

      setIsInteracting(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isInteracting, onPositionChange, onSizeChange, containerRef, naturalAspectRatio]);


  return (
    <div
      ref={graphicRef}
      onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
      className="absolute cursor-move select-none border-2 border-dashed border-indigo-400 p-1 box-content"
      style={{ touchAction: 'none', ...graphicStyles }}
    >
        <img
            src={src}
            alt="Draggable graphic"
            className="w-full h-full object-contain pointer-events-none"
            style={{ transform: `scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})` }}
            onLoad={handleImageLoad}
        />
        <div 
            onMouseDown={(e) => handleInteractionStart(e, 'resizing')}
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-se-resize"
        ></div>
    </div>
  );
};