import React, { useEffect, useState } from 'react';
import './Popups.css';

const TextPropertiesPopup = ({ isOpen, onClose, canvasRef, mode = 'add' }) => {
  const [text, setText] = useState('Sample Text');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('#000000');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && canvasRef?.current) {
        const props = canvasRef.current.getActiveProps?.();
        if (props && props.type === 'text') {
          setText(props.text || '');
          setFontFamily(props.fontFamily || 'Arial');
          setFontSize(props.fontSize || 16);
          setColor(props.fill || '#000000');
          setUnderline(!!props.underline);
          setBold((props.fontWeight || 'normal') === 'bold');
          setItalic((props.fontStyle || 'normal') === 'italic');
        }
      } else if (mode === 'add') {
        // Reset to default values for new element
        setText('Sample Text');
        setFontFamily('Arial');
        setFontSize(16);
        setColor('#000000');
        setUnderline(false);
        setBold(false);
        setItalic(false);
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
    api.updateActiveText({
      text,
      fontFamily,
      fontSize: Number(fontSize),
      fill: color,
      underline,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
    });
    onClose();
  };

  const handleAdd = () => {
    const api = canvasRef?.current;
    if (!api) return;
    api.addText({
      text,
      fontFamily,
      fontSize: Number(fontSize),
      fill: color,
      underline,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
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
      <div className="popup-container text-properties-popup">
        <div className="popup-header">
          <h3>Text Properties</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <div className="property-group">
            <label>Text Content</label>
            <textarea
              className="text-content-input"
              placeholder="Enter your text here"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="property-group">
            <label>Font Family</label>
            <select className="font-family-select" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div className="property-row">
            <div className="property-group half-width">
              <label>Font Size</label>
              <input type="number" className="font-size-input" min="8" max="72" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
            </div>
            <div className="property-group half-width">
              <label>Color</label>
              <input type="color" className="color-picker" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>

          <div className="property-group">
            <label>Text Style</label>
            <div className="text-style-buttons">
              <button className={`style-button ${bold ? 'active' : ''}`} onClick={() => setBold(!bold)}>B</button>
              <button className={`style-button ${italic ? 'active' : ''}`} onClick={() => setItalic(!italic)}><i>I</i></button>
              <button className={`style-button ${underline ? 'active' : ''}`} onClick={() => setUnderline(!underline)}><u>U</u></button>
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

export default TextPropertiesPopup;
