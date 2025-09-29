import React from 'react';
import TextPropertiesPopup from './TextPropertiesPopup';
import ImagePropertiesPopup from './ImagePropertiesPopup';
import ShapePropertiesPopup from './ShapePropertiesPopup';

const PopupManager = ({
  activePopup,
  closePopup,
  canvasRef,
  mode
}) => {
  return (
    <>
      <TextPropertiesPopup
        isOpen={activePopup === 'text'}
        onClose={closePopup}
        canvasRef={canvasRef}
        mode={mode}
      />

      <ImagePropertiesPopup
        isOpen={activePopup === 'image'}
        onClose={closePopup}
        canvasRef={canvasRef}
        mode={mode}
      />

      <ShapePropertiesPopup
        isOpen={activePopup === 'shape'}
        onClose={closePopup}
        canvasRef={canvasRef}
        mode={mode}
      />
    </>
  );
};

export default PopupManager;
