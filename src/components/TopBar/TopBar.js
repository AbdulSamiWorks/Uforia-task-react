import React from 'react';
import './TopBar.css';

const TopBar = ({ canvasRef }) => {
  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      canvasRef?.current?.clearCanvas();
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo">Canva Clone</div>
      </div>
      <div className="topbar-center">
        <div className="file-name">Untitled Design</div>
      </div>
      <div className="topbar-right">
        <button className="clear-button" onClick={handleClearCanvas} title="Clear Canvas">
          Clear
        </button>
        <button className="share-button">Share</button>
      </div>
    </div>
  );
};

export default TopBar;
