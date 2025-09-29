import React from 'react';
import './LeftMenu.css';

const LeftMenu = ({ openPopup }) => {
  const handleTextClick = () => {
    openPopup('text');
  };

  const handleShapeClick = () => {
    openPopup('shape');
  };

  const handleImageClick = () => {
    openPopup('image');
  };

  return (
    <div className="left-menu">
      <div className="menu-item" onClick={handleTextClick}>
        <div className="menu-icon">T</div>
        <div className="menu-label">Text</div>
      </div>
      <div className="menu-item" onClick={handleShapeClick}>
        <div className="menu-icon">◯</div>
        <div className="menu-label">Shapes</div>
      </div>
      <div className="menu-item" onClick={handleImageClick}>
        <div className="menu-icon">🖼️</div>
        <div className="menu-label">Images</div>
      </div>
    </div>
  );
};

export default LeftMenu;
