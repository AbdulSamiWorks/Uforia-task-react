import React, { useEffect, useState } from 'react';
import './Popups.css';

const ShapePropertiesPopup = ({ isOpen, onClose, canvasRef, mode = 'add' }) => {
  const [shape, setShape] = useState('rectangle');
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [fill, setFill] = useState('#ffffff');
  const [outlineWidth, setOutlineWidth] = useState(1);
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [cornerRadius, setCornerRadius] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && canvasRef?.current) {
        const props = canvasRef.current.getActiveProps?.();
        if (props && props.type === 'shape') {
          setShape(props.shape || 'rectangle');
          setWidth(Math.round(props.width || 100));
          setHeight(Math.round(props.height || 100));
          setFill(props.fill || '#ffffff');
          setOutlineColor(props.stroke || '#000000');
          setOutlineWidth(props.strokeWidth || 0);
          setCornerRadius(props.cornerRadius || 0);
        }
      } else if (mode === 'add') {
        // Reset to default values for new element
        setShape('rectangle');
        setWidth(100);
        setHeight(100);
        setFill('#00c4cc');
        setOutlineColor('#000000');
        setOutlineWidth(0);
        setCornerRadius(0);
      }
    }
  }, [isOpen, mode, canvasRef]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleApply = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.updateActiveShape({
      fill,
      stroke: outlineColor,
      strokeWidth: Number(outlineWidth),
      width: Number(width),
      height: Number(height),
      cornerRadius: Number(cornerRadius)
    });
    onClose();
  };

  const handleAdd = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.addShape({
      shape,
      width: Number(width),
      height: Number(height),
      fill,
      stroke: outlineColor,
      strokeWidth: Number(outlineWidth)
    });
    onClose();
  };

  const handleDelete = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.deleteActive();
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-container shape-properties-popup">
        <div className="popup-header">
          <h3>Shape Properties</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <div className="property-group">
            <label>Shape Type</label>
            <select className="shape-type-select" value={shape} onChange={(e) => setShape(e.target.value)}>
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="triangle">Triangle</option>
              <option value="ellipse">Ellipse</option>
            </select>
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
            <label>Fill Color</label>
            <input type="color" className="color-picker" value={fill} onChange={(e) => setFill(e.target.value)} />
          </div>

          <div className="property-group">
            <label>Outline</label>
            <div className="property-row">
              <div className="property-group half-width">
                <label>Width</label>
                <input type="number" className="outline-width-input" min="0" max="20" value={outlineWidth} onChange={(e) => setOutlineWidth(e.target.value)} />
              </div>
              <div className="property-group half-width">
                <label>Color</label>
                <input type="color" className="outline-color-picker" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="property-group">
            <label>Corner Radius (for rectangles)</label>
            <input
              type="range"
              className="corner-radius-slider"
              min="0"
              max="50"
              value={cornerRadius}
              onChange={(e) => setCornerRadius(e.target.value)}
            />
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

export default ShapePropertiesPopup;
