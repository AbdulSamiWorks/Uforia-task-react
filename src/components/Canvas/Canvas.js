import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import './Canvas.css';

let nextNumericId = 1;

const Canvas = forwardRef(({ onLayersChange, onSelectionChange, onObjectEditRequest }, ref) => {
	const canvasElRef = useRef(null);
	const fabricRef = useRef(null);

	// helper to sync layers to parent (simple mapping)
	const emitLayers = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const objects = canvas.getObjects();
		const layers = objects.map((obj, index) => ({
			id: obj.__nid || index + 1,
			type: obj.type === 'textbox' ? 'text' : obj.type === 'image' ? 'image' : 'shape',
			visible: obj.visible,
			locked: obj.lockMovementX && obj.lockMovementY && obj.hasControls === false,
			selected: obj === canvas.getActiveObject(),
			orderIndex: index, // 0 is bottom, last is top
		}));
		onLayersChange && onLayersChange(layers);
	};

	// helper to assign ids on add
	const ensureIds = (obj) => {
		if (!obj.__uid) {
			obj.__uid = `${obj.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		}
		if (!obj.__nid) {
			obj.__nid = nextNumericId++;
		}
	};

	useEffect(() => {
		const canvas = new fabric.Canvas(canvasElRef.current, {
			preserveObjectStacking: true,
			selection: true,
			backgroundColor: '#ffffff',
		});
		fabricRef.current = canvas;

		const onChange = () => emitLayers();

		canvas.on('object:added', (e) => {
			if (e && e.target) ensureIds(e.target);
			emitLayers();
		});
		canvas.on('object:modified', onChange);
		canvas.on('object:removed', onChange);
		canvas.on('object:skewing', onChange);
		canvas.on('object:scaling', onChange);
		canvas.on('object:moving', onChange);
		canvas.on('selection:created', () => {
			onSelectionChange && onSelectionChange(getActiveSummary());
			emitLayers();
		});
		canvas.on('selection:updated', () => {
			onSelectionChange && onSelectionChange(getActiveSummary());
			emitLayers();
		});
		canvas.on('selection:cleared', () => {
			onSelectionChange && onSelectionChange(null);
			emitLayers();
		});

		// open edit popup on double click
		canvas.on('mouse:dblclick', () => {
			const obj = canvas.getActiveObject();
			if (!obj) return;
			const type = obj.type === 'textbox' ? 'text' : obj.type === 'image' ? 'image' : 'shape';
			onObjectEditRequest && onObjectEditRequest(type);
		});

		// keyboard delete handling
		const handleKey = (e) => {
			// Don't delete if user is typing in an input field
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
				return;
			}
			
			if (e.key === 'Delete' || e.key === 'Backspace') {
				const active = canvas.getActiveObject();
				if (active) {
					e.preventDefault();
					canvas.remove(active);
					canvas.discardActiveObject();
					canvas.requestRenderAll();
					emitLayers();
				}
			}
		};
		document.addEventListener('keydown', handleKey);

		// initial size
		canvas.setWidth(800);
		canvas.setHeight(600);
		canvas.renderAll();

		return () => {
			document.removeEventListener('keydown', handleKey);
			canvas.dispose();
			fabricRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getActive = () => {
		const c = fabricRef.current;
		if (!c) return null;
		return c.getActiveObject();
	};

	const getActiveSummary = () => {
		const obj = getActive();
		if (!obj) return null;
		return {
			id: obj.__nid,
			type: obj.type === 'textbox' ? 'text' : obj.type === 'image' ? 'image' : 'shape',
			visible: obj.visible,
			locked: obj.lockMovementX && obj.lockMovementY && obj.hasControls === false,
		};
	};

	useImperativeHandle(ref, () => ({
		getActiveProps: () => {
			const obj = getActive();
			if (!obj) return null;
			if (obj.type === 'textbox') {
				return {
					type: 'text',
					text: obj.text || '',
					fontFamily: obj.fontFamily || 'Arial',
					fontSize: obj.fontSize || 16,
					fill: obj.fill || '#000000',
					underline: !!obj.underline,
					fontWeight: obj.fontWeight || 'normal',
					fontStyle: obj.fontStyle || 'normal',
				};
			}
			if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'ellipse') {
				return {
					type: 'shape',
					shape: obj.type === 'circle' ? 'circle' : obj.type === 'triangle' ? 'triangle' : obj.type === 'ellipse' ? 'ellipse' : 'rectangle',
					width: obj.getScaledWidth ? obj.getScaledWidth() : obj.width * obj.scaleX,
					height: obj.getScaledHeight ? obj.getScaledHeight() : obj.height * obj.scaleY,
					fill: obj.fill || '#ffffff',
					stroke: obj.stroke || '#000000',
					strokeWidth: obj.strokeWidth || 0,
					cornerRadius: obj.rx || 0,
				};
			}
			if (obj.type === 'image') {
				return {
					type: 'image',
					width: obj.getScaledWidth(),
					height: obj.getScaledHeight(),
					opacity: obj.opacity ?? 1,
				};
			}
			return null;
		},

		addText: ({ text, fontFamily, fontSize, fill, underline, fontWeight, fontStyle }) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const tb = new fabric.Textbox(text || 'Text', {
				left: 100,
				top: 100,
				fontFamily: fontFamily || 'Arial',
				fontSize: fontSize || 18,
				fill: fill || '#000000',
				underline: Boolean(underline),
				fontWeight: fontWeight || 'normal',
				fontStyle: fontStyle || 'normal',
			});
			ensureIds(tb);
			canvas.add(tb);
			canvas.setActiveObject(tb);
			canvas.renderAll();
			emitLayers();
		},

		updateActiveText: ({ text, fontFamily, fontSize, fill, underline, fontWeight, fontStyle }) => {
			const obj = getActive();
			if (!obj || obj.type !== 'textbox') return;
			if (typeof text === 'string') obj.text = text;
			if (fontFamily) obj.set('fontFamily', fontFamily);
			if (fontSize) obj.set('fontSize', fontSize);
			if (fill) obj.set('fill', fill);
			if (underline !== undefined) obj.set('underline', Boolean(underline));
			if (fontWeight) obj.set('fontWeight', fontWeight);
			if (fontStyle) obj.set('fontStyle', fontStyle);
			obj.canvas.requestRenderAll();
			emitLayers();
		},

		addShape: ({ shape, width, height, fill, stroke, strokeWidth }) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			let obj;
			const w = width || 100;
			const h = height || 100;
			switch (shape) {
				case 'circle':
					obj = new fabric.Circle({ left: 200, top: 200, radius: Math.min(w, h) / 2, fill: fill || '#7d2ae8', stroke: stroke || '#000000', strokeWidth: strokeWidth || 0 });
					break;
				case 'square':
					obj = new fabric.Rect({ left: 250, top: 250, width: Math.min(w, h), height: Math.min(w, h), fill: fill || '#f7b500', stroke: stroke || '#000000', strokeWidth: strokeWidth || 0, rx: 0, ry: 0 });
					break;
				case 'triangle':
					obj = new fabric.Triangle({ left: 260, top: 260, width: w, height: h, fill: fill || '#ff7a59', stroke: stroke || '#000000', strokeWidth: strokeWidth || 0 });
					break;
				case 'ellipse':
					obj = new fabric.Ellipse({ left: 270, top: 270, rx: w / 2, ry: h / 2, fill: fill || '#5ac18e', stroke: stroke || '#000000', strokeWidth: strokeWidth || 0 });
					break;
				case 'rectangle':
				default:
					obj = new fabric.Rect({ left: 300, top: 300, width: w, height: h, fill: fill || '#00c4cc', stroke: stroke || '#000000', strokeWidth: strokeWidth || 0, rx: 0, ry: 0 });
			}
			ensureIds(obj);
			canvas.add(obj);
			canvas.setActiveObject(obj);
			canvas.renderAll();
			emitLayers();
		},

		updateActiveShape: ({ fill, stroke, strokeWidth, width, height, cornerRadius }) => {
			const obj = getActive();
			if (!obj || (obj.type !== 'rect' && obj.type !== 'circle' && obj.type !== 'triangle' && obj.type !== 'ellipse')) return;
			if (fill) obj.set('fill', fill);
			if (stroke) obj.set('stroke', stroke);
			if (strokeWidth !== undefined) obj.set('strokeWidth', strokeWidth);
			if (obj.type === 'rect') {
				if (width) obj.set('width', width);
				if (height) obj.set('height', height);
				if (cornerRadius !== undefined) {
					obj.set('rx', cornerRadius);
					obj.set('ry', cornerRadius);
				}
			}
			if (obj.type === 'triangle') {
				if (width) obj.set('width', width);
				if (height) obj.set('height', height);
			}
			if (obj.type === 'ellipse') {
				if (width) obj.set('rx', width / 2);
				if (height) obj.set('ry', height / 2);
			}
			obj.setCoords();
			obj.canvas.requestRenderAll();
			emitLayers();
		},

		addImageFromFile: (file) => {
			const canvas = fabricRef.current;
			if (!canvas || !file) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				fabric.Image.fromURL(e.target.result, (img) => {
					img.set({ left: 350, top: 150, opacity: 1 });
					ensureIds(img);
					canvas.add(img);
					canvas.setActiveObject(img);
					canvas.renderAll();
					emitLayers();
				});
			};
			reader.readAsDataURL(file);
		},

		updateActiveImage: ({ width, height, opacity }) => {
			const obj = getActive();
			if (!obj || obj.type !== 'image') return;
			if (width) obj.scaleToWidth(width);
			if (height) obj.scaleToHeight(height);
			if (opacity !== undefined) obj.set('opacity', opacity);
			obj.setCoords();
			obj.canvas.requestRenderAll();
			emitLayers();
		},

		deleteActive: () => {
			const canvas = fabricRef.current;
			const obj = getActive();
			if (canvas && obj) {
				canvas.remove(obj);
				canvas.discardActiveObject();
				canvas.requestRenderAll();
				emitLayers();
			}
		},

		moveActiveUp: () => {
			const obj = getActive();
			if (obj) {
				obj.bringForward();
				obj.canvas.requestRenderAll();
				emitLayers();
			}
		},
		moveActiveDown: () => {
			const obj = getActive();
			if (obj) {
				obj.sendBackwards();
				obj.canvas.requestRenderAll();
				emitLayers();
			}
		},
		lockActive: () => {
			const obj = getActive();
			if (obj) {
				obj.lockMovementX = true;
				obj.lockMovementY = true;
				obj.lockScalingX = true;
				obj.lockScalingY = true;
				obj.hasControls = false;
				obj.selectable = false;
				obj.evented = false;
				obj.canvas.discardActiveObject();
				obj.canvas.requestRenderAll();
				emitLayers();
			}
		},
		unlockById: (id) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj) {
				obj.lockMovementX = false;
				obj.lockMovementY = false;
				obj.lockScalingX = false;
				obj.lockScalingY = false;
				obj.hasControls = true;
				obj.selectable = true;
				obj.evented = true;
				canvas.setActiveObject(obj);
				canvas.requestRenderAll();
				emitLayers();
			}
		},
		setVisibilityById: (id, visible) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj) {
				obj.visible = visible;
				canvas.requestRenderAll();
				emitLayers();
			}
		},
		selectById: (id) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj && obj.selectable !== false) {
				canvas.setActiveObject(obj);
				canvas.requestRenderAll();
				emitLayers();
			}
		},
		deleteById: (id) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj) {
				canvas.remove(obj);
				canvas.requestRenderAll();
				emitLayers();
			}
		},
		bringForwardById: (id) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj) {
				obj.bringForward();
				canvas.requestRenderAll();
				emitLayers();
			}
		},
		sendBackwardById: (id) => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const obj = canvas.getObjects().find(o => o.__nid === id);
			if (obj) {
				obj.sendBackwards();
				canvas.requestRenderAll();
				emitLayers();
			}
		},
	}));

  return (
    <div className="canvas-container">
      <div className="canvas-tools">
        <div className="zoom-controls">
          <span>100%</span>
        </div>
      </div>
      <div className="canvas-area">
        <div className="canvas">
					<canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
});

export default Canvas;
