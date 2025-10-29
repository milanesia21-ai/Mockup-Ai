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
