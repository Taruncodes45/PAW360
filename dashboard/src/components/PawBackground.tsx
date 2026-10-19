import React from 'react';

export const PawBackground: React.FC = () => {
  return (
    <div className="paw-background-container" aria-hidden="true">
      {/* Floating ambient paw prints */}
      <span className="floating-paw paw-1">🐾</span>
      <span className="floating-paw paw-2">🐾</span>
      <span className="floating-paw paw-3">🐾</span>
      <span className="floating-paw paw-4">🐾</span>
      <span className="floating-paw paw-5">🐾</span>
      <span className="floating-paw paw-6">🐾</span>
      <span className="floating-paw paw-7">🐾</span>
      <span className="floating-paw paw-8">🐾</span>

      {/* Walking paw trail at the bottom */}
      <div className="walking-paws-track">
        <span className="trail-paw tp-1">🐾</span>
        <span className="trail-paw tp-2">🐾</span>
        <span className="trail-paw tp-3">🐾</span>
        <span className="trail-paw tp-4">🐾</span>
        <span className="trail-paw tp-5">🐾</span>
        <span className="trail-paw tp-6">🐾</span>
      </div>
    </div>
  );
};

export default PawBackground;
