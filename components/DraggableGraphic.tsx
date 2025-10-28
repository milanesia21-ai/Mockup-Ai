import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DesignLayer } from './EditorPanel';

interface DraggableGraphicProps {
  layer: DesignLayer;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  onSetActive: () => void;
}

export const DraggableGraphic: React.FC<DraggableGraphicProps> = ({ 
  layer,
  onUpdateLayer,
  containerRef, 
  isActive,
  onSetActive,
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      setNaturalAspectRatio(img.naturalWidth / img.naturalHeight);
      onUpdateLayer(layer.id, { size: { ...layer.size, height: (img.naturalHeight / img.naturalWidth) * layer.size.width }});
    }
  };
  
  // Calculate size in pixels from percentage
  const getPixelDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0, x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width * layer.size.width;
    let height = containerRect.height * layer.size.height;
    
    // For images, maintain aspect ratio
    if (layer.type === 'image' && naturalAspectRatio !== 0) {
        height = width / naturalAspectRatio;
    }

    const x = layer.position.x * containerRect.width - width / 2;
    const y = layer.position.y * containerRect.height - height / 2;
    
    return { width, height, x, y };
  }, [containerRef, layer.position, layer.size, layer.type, naturalAspectRatio]);


  const updateElementTransform = useCallback(() => {
    if (!graphicRef.current) return;
    const { width, height, x, y } = getPixelDimensions();
    
    const graphic = graphicRef.current;
    graphic.style.width = `${width}px`;
    graphic.style.height = `${height}px`;
    graphic.style.left = `${x}px`;
    graphic.style.top = `${y}px`;
    graphic.style.transform = `rotate(${layer.rotation}deg)`;
    graphic.style.opacity = `${layer.opacity}`;
    graphic.style.display = layer.visible ? 'block' : 'none';

  }, [getPixelDimensions, layer.rotation, layer.opacity, layer.visible]);
  
  useEffect(() => {
    updateElementTransform();
  }, [updateElementTransform]);

  useEffect(() => {
      const observer = new ResizeObserver(updateElementTransform);
      const container = containerRef.current;
      if (container) observer.observe(container);
      return () => { if (container) observer.unobserve(container); }
  }, [containerRef, updateElementTransform]);

  const handleInteractionStart = (e: React.MouseEvent, type: 'dragging' | 'resizing') => {
    e.preventDefault();
    e.stopPropagation();
    onSetActive();
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
        const newHeight = newWidth / (layer.type === 'image' ? naturalAspectRatio : (interactionStart.current.width / interactionStart.current.height));
        
        if (interactionStart.current.elementX + newWidth > containerRect.width ||
            interactionStart.current.elementY + newHeight > containerRect.height) {
            return;
        }

        graphic.style.width = `${Math.max(20, newWidth)}px`;
        graphic.style.height = `${Math.max(20, newHeight)}px`;
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

      const finalPosition = { 
          x: (newX + newWidth / 2) / containerRect.width, 
          y: (newY + newHeight / 2) / containerRect.height 
      };
      const finalSize = {
          width: newWidth / containerRect.width,
          height: newHeight / containerRect.height,
      };
      
      onUpdateLayer(layer.id, { position: finalPosition, size: finalSize });
      setIsInteracting(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isInteracting, onUpdateLayer, containerRef, naturalAspectRatio, layer.id, layer.type]);

  const borderStyle = isActive ? 'border-2 border-dashed border-indigo-400' : 'border-2 border-transparent';

  return (
    <div
      ref={graphicRef}
      onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
      className={`absolute cursor-move select-none p-1 box-content ${borderStyle}`}
      style={{ touchAction: 'none' }}
    >
        {layer.type === 'image' && (
            <img
                src={layer.content}
                alt="Draggable graphic"
                className="w-full h-full object-contain pointer-events-none"
                onLoad={handleImageLoad}
            />
        )}
        {layer.type === 'text' && (
             <div className="w-full h-full pointer-events-none flex items-center justify-center" style={{
                fontFamily: layer.fontFamily,
                fontSize: '100px', // This will be scaled by the container
                fontWeight: layer.fontWeight,
                color: layer.color,
                whiteSpace: 'nowrap'
             }}>
                {layer.content}
            </div>
        )}
        {layer.type === 'shape' && (
             <div className="w-full h-full pointer-events-none" style={{
                backgroundColor: layer.fill,
                borderRadius: layer.content === 'circle' ? '50%' : '0'
             }}/>
        )}

        {isActive && (
            <div 
                onMouseDown={(e) => handleInteractionStart(e, 'resizing')}
                className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-se-resize"
            ></div>
        )}
    </div>
  );
};
