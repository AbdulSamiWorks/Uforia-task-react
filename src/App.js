import React, { useRef, useState } from 'react';
import './App.css';
import TopBar from './components/TopBar/TopBar';
import LeftMenu from './components/LeftMenu/LeftMenu';
import Canvas from './components/Canvas/Canvas';
import PopupManager from './components/Popups/PopupManager';
import LayerPanel from './components/LayerPanel/LayerPanel';

function App() {
  const canvasRef = useRef(null);
  const [activePopup, setActivePopup] = useState(null);
  const [popupMode, setPopupMode] = useState('add'); // 'add' | 'edit'
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const openPopup = (popupType, mode = 'add') => {
    setActivePopup(popupType);
    setPopupMode(mode);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const handleLayersChange = (newLayers) => {
    setLayers(newLayers);
  };

  const handleSelectionChange = (summary) => {
    setSelectedLayerId(summary ? summary.id : null);
  };

  const handleEditRequest = (type) => {
    if (type) openPopup(type, 'edit');
  };

  const deleteLayer = (layerId) => {
    canvasRef.current?.deleteById(layerId);
  };

  const moveLayerUp = (layerId) => {
    canvasRef.current?.bringForwardById(layerId);
  };

  const moveLayerDown = (layerId) => {
    canvasRef.current?.sendBackwardById(layerId);
  };

  const toggleLockLayer = (layerId) => {
    const target = layers.find(l => l.id === layerId);
    if (!target) return;
    if (target.locked) {
      canvasRef.current?.unlockById(layerId);
    } else {
      canvasRef.current?.selectById(layerId);
      canvasRef.current?.lockActive();
    }
  };

  const toggleLayerVisibility = (layerId) => {
    const target = layers.find(l => l.id === layerId);
    if (!target) return;
    canvasRef.current?.setVisibilityById(layerId, !target.visible);
  };

  const selectLayer = (layerId) => {
    setSelectedLayerId(layerId);
    canvasRef.current?.selectById(layerId);
  };

  return (
    <div className="App">
      <TopBar canvasRef={canvasRef} />
      <div className="main-container">
        <LeftMenu openPopup={openPopup} />
        <Canvas
          ref={canvasRef}
          onLayersChange={handleLayersChange}
          onSelectionChange={handleSelectionChange}
          onObjectEditRequest={handleEditRequest}
        />
        <LayerPanel
          layers={layers}
          onDeleteLayer={deleteLayer}
          onMoveLayerUp={moveLayerUp}
          onMoveLayerDown={moveLayerDown}
          onToggleLock={toggleLockLayer}
          onToggleVisibility={toggleLayerVisibility}
          onSelectLayer={selectLayer}
        />
      </div>
      <PopupManager activePopup={activePopup} closePopup={closePopup} canvasRef={canvasRef} mode={popupMode} />
    </div>
  );
}

export default App;
