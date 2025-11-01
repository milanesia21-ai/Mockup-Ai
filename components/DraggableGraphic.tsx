



import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import type { DesignLayer } from '../constants';

interface DraggableGraphicProps {
  layer: DesignLayer;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>, commitToHistory: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  onSetActive: () => void;
  zIndex: number;
}

const ROTATION_HANDLE_OFFSET = 30;

const getCursorForHandle = (handle: string, rotation: number) => {
    const angle = rotation % 360;
    const baseCursors: { [key: string]: number } = {
        'tl': 315, 't': 0, 'tr': 45,
        'l': 270,           'r': 90,
        'bl': 225, 'b': 180, 'br': 135
    };
    const handleAngle = baseCursors[handle] || 0;
    const finalAngle = (handleAngle + angle + 360) % 360;

    if (finalAngle > 337.5 || finalAngle <= 22.5) return 'ns-resize';
    if (finalAngle > 22.5 && finalAngle <= 67.5) return 'nesw-resize';
    if (finalAngle > 67.5 && finalAngle <= 112.5) return 'ew-resize';
    if (finalAngle > 112.5 && finalAngle <= 157.5) return 'nwse-resize';
    if (finalAngle > 157.5 && finalAngle <= 202.5) return 'ns-resize';
    if (finalAngle > 202.5 && finalAngle <= 247.5) return 'nesw-resize';
    if (finalAngle > 247.5 && finalAngle <= 292.5) return 'ew-resize';
    if (finalAngle > 292.5 && finalAngle <= 337.5) return 'nwse-resize';
    return 'auto';
};

export const DraggableGraphic: React.FC<DraggableGraphicProps> = ({ 
  layer,
  onUpdateLayer,
  containerRef, 
  isActive,
  onSetActive,
  zIndex,
}) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [isInteracting, setIsInteracting] = useState<boolean>(false);
    const interactionDetails = useRef({
        type: '', handle: '', startX: 0, startY: 0,
        layerStart: { ...layer }
    });
    
    const [aspectRatio, setAspectRatio] = useState<number>(1);

    useLayoutEffect(() => {
        if (layer.type === 'image' && layer.content) {
            const img = new Image();
            img.src = layer.content;
            img.onload = () => {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
            };
        }
    }, [layer.content, layer.type]);

    const handleInteractionStart = (e: React.MouseEvent, type: 'dragging' | 'resizing' | 'rotating', handle = 'body') => {
        e.preventDefault();
        e.stopPropagation();
        onSetActive();
        if (!elementRef.current || !containerRef.current) return;
        
        setIsInteracting(true);
        interactionDetails.current = {
            type, handle,
            startX: e.clientX,
            startY: e.clientY,
            layerStart: { ...layer },
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isInteracting || !containerRef.current) return;

            const { type, handle, startX, startY, layerStart } = interactionDetails.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const containerRect = containerRef.current.getBoundingClientRect();
            let newPosition = { ...layerStart.position };
            let newSize = { ...layerStart.size };
            let newRotation = layerStart.rotation;

            if (type === 'dragging') {
                newPosition = {
                    x: layerStart.position.x + dx / containerRect.width,
                    y: layerStart.position.y + dy / containerRect.height,
                };
            } else if (type === 'rotating') {
                const elementRect = elementRef.current!.getBoundingClientRect();
                const centerX = elementRect.left + elementRect.width / 2;
                const centerY = elementRect.top + elementRect.height / 2;
                const startAngle = Math.atan2(startY - centerY, startX - centerX);
                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                newRotation = layerStart.rotation + (currentAngle - startAngle) * (180 / Math.PI);
            } else if (type === 'resizing') {
                const rad = layerStart.rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                // Rotate mouse delta to element's coordinate system
                const dxx = dx * cos + dy * sin;
                const dyy = dy * cos - dx * sin;

                const startWidthPx = layerStart.size.width * containerRect.width;
                const startHeightPx = layerStart.size.height * containerRect.height;
                
                let widthChange = 0;
                let heightChange = 0;
                let xChange = 0;
                let yChange = 0;
                
                // Calculate width and height changes
                if (handle.includes('r')) widthChange = dxx;
                if (handle.includes('l')) widthChange = -dxx;
                if (handle.includes('b')) heightChange = dyy;
                if (handle.includes('t')) heightChange = -dyy;

                if (e.shiftKey && (handle === 'tl' || handle === 'tr' || handle === 'bl' || handle === 'br')) {
                     const change = Math.max(widthChange, heightChange);
                     widthChange = change;
                     heightChange = change / aspectRatio;
                }

                // Update size
                let newWidthPx = startWidthPx + widthChange;
                let newHeightPx = startHeightPx + heightChange;

                if(e.shiftKey && layer.type === 'image') {
                    if (widthChange > heightChange) {
                        newHeightPx = newWidthPx / aspectRatio;
                    } else {
                        newWidthPx = newHeightPx * aspectRatio;
                    }
                }
                
                // Adjust position to keep the opposite handle pinned
                xChange = (newWidthPx - startWidthPx) / 2;
                yChange = (newHeightPx - startHeightPx) / 2;
                if (handle.includes('l')) xChange = -xChange;
                if (handle.includes('t')) yChange = -yChange;
                
                // Rotate position adjustment back to screen coordinates
                const rotatedXChange = xChange * cos - yChange * sin;
                const rotatedYChange = xChange * sin + yChange * cos;

                newSize = {
                    width: newWidthPx / containerRect.width,
                    height: newHeightPx / containerRect.height,
                };
                newPosition = {
                    x: layerStart.position.x + rotatedXChange / containerRect.width,
                    y: layerStart.position.y + rotatedYChange / containerRect.height,
                };
            }
            
            onUpdateLayer(layer.id, { position: newPosition, size: newSize, rotation: newRotation }, false);
        };

        const handleMouseUp = () => {
            if (!isInteracting) return;
            setIsInteracting(false);
            onUpdateLayer(layer.id, {}, true); // Commit final state
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isInteracting, onUpdateLayer, containerRef, layer.id, aspectRatio]);

    const resizeHandles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];

    const elementWidthPx = (containerRef.current?.getBoundingClientRect().width || 0) * layer.size.width;
    const elementHeightPx = (containerRef.current?.getBoundingClientRect().height || 0) * layer.size.height;
    const elementX = (containerRef.current?.getBoundingClientRect().width || 0) * layer.position.x - elementWidthPx / 2;
    const elementY = (containerRef.current?.getBoundingClientRect().height || 0) * layer.position.y - elementHeightPx / 2;
    
    return (
        <div
            ref={elementRef}
            onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
            className="absolute cursor-move select-none flex items-center justify-center box-border"
            style={{
                width: `${elementWidthPx}px`,
                height: `${elementHeightPx}px`,
                left: `${elementX}px`,
                top: `${elementY}px`,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
                display: layer.visible ? 'flex' : 'none',
                zIndex: isActive ? 20 : zIndex,
                mixBlendMode: layer.blendMode as any,
                touchAction: 'none',
            }}
        >
            {/* The element content */}
            <div className="w-full h-full pointer-events-none flex items-center justify-center">
                 {layer.type === 'image' && <img src={layer.content} alt="Draggable graphic" className="w-full h-full object-contain" />}
                 {layer.type === 'text' && (
                    <div style={{ fontFamily: layer.fontFamily, fontWeight: layer.fontWeight, color: layer.color, textAlign: layer.textAlign, fontSize: `${elementWidthPx / 10}px`, whiteSpace: 'nowrap' }}>
                        {layer.content}
                    </div>
                 )}
                 {layer.type === 'shape' && (
                    <div style={{ backgroundColor: layer.fill, width: '100%', height: '100%', borderRadius: layer.content === 'circle' ? '50%' : 0 }} />
                 )}
            </div>

            {/* Bounding Box and Handles */}
            {isActive && (
                <>
                    <div className="absolute inset-0 border border-dashed border-orange-500 pointer-events-none" />
                    
                    {/* Rotation Handle */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-px bg-orange-500 pointer-events-none" style={{ top: `-${ROTATION_HANDLE_OFFSET}px`, height: `${ROTATION_HANDLE_OFFSET - 8}px` }} />
                    <div
                        onMouseDown={(e) => handleInteractionStart(e, 'rotating')}
                        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-orange-500 cursor-alias"
                        style={{ top: `-${ROTATION_HANDLE_OFFSET}px` }}
                    />

                    {/* Resize Handles */}
                    {resizeHandles.map(handle => (
                        <div
                            key={handle}
                            onMouseDown={(e) => handleInteractionStart(e, 'resizing', handle)}
                            className="absolute w-3 h-3 bg-white rounded-full border border-orange-500"
                            style={{
                                top: handle.includes('t') ? '-6px' : handle.includes('b') ? 'auto' : '50%',
                                bottom: handle.includes('b') ? '-6px' : 'auto',
                                left: handle.includes('l') ? '-6px' : handle.includes('r') ? 'auto' : '50%',
                                right: handle.includes('r') ? '-6px' : 'auto',
                                transform: `translate(${handle.includes('l') || handle.includes('r') ? '0' : '-50%'}, ${handle.includes('t') || handle.includes('b') ? '0' : '-50%'})`,
                                cursor: getCursorForHandle(handle, layer.rotation),
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
};
