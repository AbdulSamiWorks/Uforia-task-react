import React from 'react';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo">Canva Clone</div>
      </div>
      <div className="topbar-center">
        <div className="file-name">Untitled Design</div>
      </div>
      <div className="topbar-right">
        <button className="share-button">Share</button>
      </div>
    </div>
  );
};

export default TopBar;
