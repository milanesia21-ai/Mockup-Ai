import React, { useState, useRef, useEffect } from 'react';

interface DraggableGraphicProps {
  src: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DraggableGraphic: React.FC<DraggableGraphicProps> = ({ src, onPositionChange, containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 25 }); // in percentage
  const graphicRef = useRef<HTMLImageElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (!graphicRef.current || !containerRef.current) return;
    
    setIsDragging(true);
    const containerRect = containerRef.current.getBoundingClientRect();
    const graphicRect = graphicRef.current.getBoundingClientRect();

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { 
      x: graphicRect.left - containerRect.left, 
      y: graphicRect.top - containerRect.top 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = elementStartPos.current.x + dx;
    const newY = elementStartPos.current.y + dy;

    // Clamp position within the container
    const clampedX = Math.max(0, Math.min(newX, containerRect.width - graphicRef.current!.offsetWidth));
    const clampedY = Math.max(0, Math.min(newY, containerRect.height - graphicRef.current!.offsetHeight));

    const newXPercent = (clampedX / containerRect.width) * 100;
    const newYPercent = (clampedY / containerRect.height) * 100;
    
    setPosition({ x: newXPercent, y: newYPercent });
  };

  const handleMouseUp = () => {
    if (!isDragging || !containerRef.current || !graphicRef.current) return;

    setIsDragging(false);
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate center of graphic for more intuitive placement
    const graphicCenterX = (position.x / 100) * containerRect.width + graphicRef.current.offsetWidth / 2;
    const graphicCenterY = (position.y / 100) * containerRect.height + graphicRef.current.offsetHeight / 2;
    
    const finalXPercent = graphicCenterX / containerRect.width;
    const finalYPercent = graphicCenterY / containerRect.height;
    
    onPositionChange({ x: finalXPercent, y: finalYPercent });
  };
  
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            handleMouseMove(e as any);
        }
    };
    const handleGlobalMouseUp = () => {
        if (isDragging) {
            handleMouseUp();
        }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <img
      ref={graphicRef}
      src={src}
      alt="Draggable graphic"
      onMouseDown={handleMouseDown}
      className="absolute max-w-[30%] max-h-[30%] object-contain cursor-move select-none border-2 border-dashed border-indigo-400"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        touchAction: 'none' // for mobile
      }}
    />
  );
};
