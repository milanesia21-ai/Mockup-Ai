


import React from 'react';

export const Undo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.6-3.6A8.007 8.007 0 0112.5 10c3.73 0 6.84 2.55 7.73 6h2.07c-.94-4.56-4.96-8-9.3-8z"/>
  </svg>
);

export const Redo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.34 0-8.36 3.44-9.3 8h2.07c.89-3.45 3.99-6 7.73-6a8.007 8.007 0 015.9 2.4L15 14h9V5l-3.6 3.6z"/>
  </svg>
);

export const Pencil: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"/>
  </svg>
);

export const Pen: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" >
        <path fill="currentColor" d="m19.26 7.82l-2.09-2.09l-3.5 3.51l2.09 2.08l3.5-3.5zm-5.63.02l-6.85 6.85q-.21.21-.48.33t-.56.16H4.25v-1.5q0-.3.12-.56t.34-.48l6.85-6.85l2.09 2.08zM5.5 21q-.63 0-1.06-.44T4 19.5v-3.75l1.5 1.5v2.25h2.25l1.5 1.5H5.5z"/>
    </svg>
);

export const Eraser: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.5 22H21.45L12.5 13.05L8.5 17.05V22M6.5 22V19.05L16.95 8.6L19.4 11.05L9.5 21H6.5V22M18.35 7.2L15.8 4.65L17.2 3.25q.35-.35.85-.35t.85.35l1.65 1.65q.35.35.35.85t-.35.85L18.35 7.2Z"/>
    </svg>
);

export const SymmetryY: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeDasharray="4" strokeLinecap="round" strokeWidth="2" d="M12 3V21"/>
        <path fill="currentColor" d="M10 15V9l-5 3zM14 9v6l5-3z"/>
    </svg>
);

export const SymmetryX: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeDasharray="4" strokeLinecap="round" strokeWidth="2" d="M3 12H21"/>
        <path fill="currentColor" d="M9 14H15L12 19zM15 10H9l3-5z"/>
    </svg>
);

export const Layers: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 18.54l-7.37-5.73L3 14.07l9 7l9-7l-1.63-1.27L12 18.54zM12 16l7.36-5.73L21 9l-9-7l-9 7l1.63 1.27L12 16z"/>
    </svg>
);

export const Add: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);

export const MagicWand: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M15.5 14L18 11.5L14.5 8L12 10.5L9.5 8L6 11.5L8.5 14L6 16.5L9.5 20L12 17.5L14.5 20L18 16.5L15.5 14M19.34 8.66L21.41 6.59L17.41 2.59L15.34 4.66L19.34 8.66M4.66 19.34L2.59 21.41L6.59 17.41L8.66 15.34L4.66 19.34Z"/>
    </svg>
);

export const Upload: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M9 16h6v-6h4l-7-7l-7 7h4v6zm-4 2h14v2H5v-2z"/>
    </svg>
);

export const View3D: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.09-.34.13-.53.13s-.37-.04-.53-.13l-7.9-4.44A.993.993 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.09.34-.13.53-.13s.37.04.53-.13l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L5.5 8L12 11.85L18.5 8L12 4.15zM5 15.21l6.5 3.64V12L5 8.36v6.85zm14-6.85L12.5 12v6.85l6.5-3.64V8.36z"/>
  </svg>
);

export const View2D: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
    </svg>
);

export const AlignLeft: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M3 21v-2h18v2H3Zm0-4v-2h12v2H3Zm0-4v-2h18v2H3Zm0-4V7h12v2H3Zm0-4V3h18v2H3Z"/>
    </svg>
);
export const AlignCenter: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M3 21v-2h18v2H3Zm4-4v-2h10v2H7Zm-4-4v-2h18v2H3Zm4-4V7h10v2H7Zm-4-4V3h18v2H3Z"/>
    </svg>
);
export const AlignRight: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M3 21v-2h18v2H3Zm6-4v-2h12v2H9Zm-6-4v-2h18v2H3Zm6-4V7h12v2H9ZM3 5V3h18v2H3Z"/>
    </svg>
);

export const ExportFile: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-4l-4 4l-4-4h3V9h2v7h3z"/>
    </svg>
);
