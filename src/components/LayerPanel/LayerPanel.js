import React from 'react';
import './LayerPanel.css';

const LayerPanel = ({ layers, onDeleteLayer, onMoveLayerUp, onMoveLayerDown, onToggleLock, onToggleVisibility, onSelectLayer }) => {
  // Layers array is in canvas stacking order (0 bottom → last top)
  // We should render top-first for a natural feel, but keep orderIndex for controls
  const displayLayers = [...layers].slice().reverse();

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Layers</h3>
        <span className="layer-count">{layers.length} layers</span>
      </div>
      <div className="layer-list">
        {layers.length === 0 ? (
          <div className="no-layers-message">No layers available</div>
        ) : (
          displayLayers.map((layer, idx) => {
            const isTopMost = layer.orderIndex === layers.length - 1;
            const isBottomMost = layer.orderIndex === 0;
            return (
              <div
                key={layer.id}
                className={`layer-item ${layer.selected ? 'selected' : ''}`}
                onClick={() => onSelectLayer && onSelectLayer(layer.id)}
              >
                <div className="layer-info">
                  <button
                    className={`visibility-toggle ${layer.visible ? 'visible' : 'hidden'}`}
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <span className="layer-name">
                    {layer.type === 'text' ? 'Text' : layer.type === 'shape' ? 'Shape' : 'Image'} {layer.id}
                  </span>
                </div>
                <div className="layer-actions">
                  <button
                    className={`lock-toggle ${layer.locked ? 'locked' : 'unlocked'}`}
                    onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                    title={layer.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    className="move-up"
                    onClick={(e) => { e.stopPropagation(); onMoveLayerUp(layer.id); }}
                    disabled={isTopMost}
                    title="Move layer up"
                  >
                    ↑
                  </button>
                  <button
                    className="move-down"
                    onClick={(e) => { e.stopPropagation(); onMoveLayerDown(layer.id); }}
                    disabled={isBottomMost}
                    title="Move layer down"
                  >
                    ↓
                  </button>
                  <button
                    className="delete-layer"
                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                    title="Delete layer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="layer-panel-footer">
        <div className="layer-panel-hint">
          Tip: Use the layer panel to manage your design elements
        </div>
      </div>
    </div>
  );
};

export default LayerPanel;
