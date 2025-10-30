

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { DesignLayer } from './EditorPanel';

interface DraggableGraphicProps {
  layer: DesignLayer;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  onSetActive: () => void;
  zIndex: number;
}

export const DraggableGraphic: React.FC<DraggableGraphicProps> = ({ 
  layer,
  onUpdateLayer,
  containerRef, 
  isActive,
  onSetActive,
  zIndex,
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
  
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  useLayoutEffect(() => {
    let isMounted = true;
    if (layer.type === 'image' && layer.content) {
        const img = new Image();
        img.src = layer.content;
        img.onload = () => {
            if (isMounted && img.naturalWidth > 0 && img.naturalHeight > 0) {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
            }
        };
    } else if (layer.type === 'shape' && layer.size.width > 0 && layer.size.height > 0) {
        setAspectRatio(layer.size.width / layer.size.height);
    }
    return () => { isMounted = false; }
  }, [layer.content, layer.type, layer.size.width, layer.size.height]);
  
  const updateElementTransform = useCallback(() => {
    if (!graphicRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const graphic = graphicRef.current;
    
    const width = containerRect.width * layer.size.width;

    if (layer.type === 'text') {
        graphic.style.height = 'auto';
        const pixelFontSize = (layer.fontSize || 50) * (containerRect.width / 1000);
        graphic.style.fontSize = `${pixelFontSize}px`;
    } else {
        const height = width / aspectRatio;
        graphic.style.height = `${height}px`;
        graphic.style.fontSize = '';
    }
    
    graphic.style.width = `${width}px`;

    // Use a timeout to allow the browser to compute the element's new height if it's 'auto'
    setTimeout(() => {
        if (!graphicRef.current || !containerRef.current) return;
        const currentHeight = graphicRef.current.offsetHeight;
        const x = layer.position.x * containerRect.width - width / 2;
        const y = layer.position.y * containerRect.height - currentHeight / 2;

        graphic.style.left = `${x}px`;
        graphic.style.top = `${y}px`;
        graphic.style.transform = `rotate(${layer.rotation}deg)`;
        graphic.style.opacity = `${layer.opacity}`;
        graphic.style.display = layer.visible ? 'flex' : 'none';
        graphic.style.alignItems = 'center';
        graphic.style.justifyContent = 'center';
    }, 0);
  }, [containerRef, layer, aspectRatio]);
  
  useLayoutEffect(() => {
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
        
        let newHeight: number;
        if (layer.type === 'text') {
            newHeight = graphic.offsetHeight; // Height is auto, don't change it on resize
        } else {
            newHeight = newWidth / aspectRatio;
        }
        
        if (interactionStart.current.elementX + newWidth > containerRect.width ||
            interactionStart.current.elementY + newHeight > containerRect.height) {
            return;
        }

        graphic.style.width = `${Math.max(20, newWidth)}px`;
        if (layer.type !== 'text') {
            graphic.style.height = `${Math.max(20, newHeight)}px`;
        }
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
  }, [isInteracting, onUpdateLayer, containerRef, layer.id, aspectRatio]);

  const borderStyle = isActive ? 'border-2 border-dashed border-orange-400' : 'border-2 border-transparent';
  const interactionClass = isInteracting ? 'scale-105 shadow-2xl' : '';

  return (
    <div
      ref={graphicRef}
      onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
      className={`absolute cursor-move select-none p-1 box-content transition-all duration-150 ${borderStyle} ${interactionClass}`}
      style={{ 
        touchAction: 'none', 
        zIndex: isActive ? 20 : zIndex,
        mixBlendMode: layer.blendMode as any,
      }}
    >
        {layer.type === 'image' && (
            <img
                src={layer.content}
                alt="Draggable graphic"
                className="w-full h-full object-contain pointer-events-none"
            />
        )}
        {layer.type === 'text' && (
             <div className="pointer-events-none w-full" style={{
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight || 'normal',
                color: layer.color,
                wordBreak: 'break-word',
                textAlign: 'center',
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
                className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-orange-500 cursor-se-resize"
            ></div>
        )}
    </div>
  );
};
