import React, { useEffect, useState } from 'react';
import './Popups.css';

const ImagePropertiesPopup = ({ isOpen, onClose, canvasRef, mode = 'add' }) => {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);
  const [opacity, setOpacity] = useState(100);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState('#000000');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && canvasRef?.current) {
        const props = canvasRef.current.getActiveProps?.();
        if (props && props.type === 'image') {
          setWidth(Math.round(props.width || 200));
          setHeight(Math.round(props.height || 200));
          setOpacity(Math.round((props.opacity ?? 1) * 100));
        }
      } else if (mode === 'add') {
        // Reset to default values for new element
        setWidth(200);
        setHeight(200);
        setOpacity(100);
        setBorderWidth(0);
        setBorderColor('#000000');
      }
    }
  }, [isOpen, mode, canvasRef]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleApply = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.updateActiveImage({
      width: Number(width),
      height: Number(height),
      opacity: Number(opacity) / 100,
      stroke: borderColor,
      strokeWidth: Number(borderWidth)
    });
    onClose();
  };

  const handleAdd = () => {
    const api = canvasRef?.current;
    if (!api || !file) return;
    api.addImageFromFile(file, {
      width: Number(width),
      height: Number(height),
      opacity: Number(opacity) / 100
    });
    onClose();
  };

  const handleDelete = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.deleteActive();
    onClose();
  };
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-container image-properties-popup">
        <div className="popup-header">
          <h3>Image Properties</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <div className="property-group">
            <label>Image Source</label>
            <div className="image-source-container">
              <input
                type="file"
                id="image-upload"
                className="image-upload-input"
                accept="image/*"
                onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
              <label htmlFor="image-upload" className="image-upload-label">
                Choose Image
              </label>
              <span className="file-name">{file ? file.name : 'No file chosen'}</span>
            </div>
          </div>

          <div className="property-row">
            <div className="property-group half-width">
              <label>Width (px)</label>
              <input type="number" className="dimension-input" min="10" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
            <div className="property-group half-width">
              <label>Height (px)</label>
              <input type="number" className="dimension-input" min="10" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>

          <div className="property-group">
            <label>Opacity: <span className="opacity-value">{opacity}%</span></label>
            <input
              type="range"
              className="opacity-slider"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
            />
          </div>

          <div className="property-group">
            <label>Border</label>
            <div className="property-row">
              <div className="property-group half-width">
                <input type="number" className="border-width-input" min="0" max="20" value={borderWidth} onChange={(e) => setBorderWidth(e.target.value)} />
              </div>
              <div className="property-group half-width">
                <input type="color" className="border-color-picker" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="popup-footer">
          {mode === 'edit' ? (
            <>
              <button className="apply-button" onClick={handleApply}>Apply</button>
              <button className="apply-button" onClick={handleDelete}>Delete</button>
            </>
          ) : (
            <button className="apply-button" onClick={handleAdd}>Add</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePropertiesPopup;
