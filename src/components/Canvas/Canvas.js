import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { fabric } from 'fabric';
import './Canvas.css';

let nextNumericId = 1;

const Canvas = forwardRef(({ onLayersChange, onSelectionChange, onObjectEditRequest }, ref) => {
	const canvasElRef = useRef(null);
	const fabricRef = useRef(null);
	const historyRef = useRef([]);
	const historyIndexRef = useRef(-1);
	const [zoomLevel, setZoomLevel] = useState(100);

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
		// Auto-save canvas state
		saveCanvasState();
	};

	// Save canvas state to localStorage
	const saveCanvasState = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		try {
			const canvasData = JSON.stringify(canvas.toJSON());
			localStorage.setItem('canva-clone-canvas', canvasData);
		} catch (error) {
			console.warn('Failed to save canvas state:', error);
		}
	};

	// Load canvas state from localStorage
	const loadCanvasState = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		try {
			const savedData = localStorage.getItem('canva-clone-canvas');
			if (savedData) {
				canvas.loadFromJSON(savedData, () => {
					canvas.renderAll();
					emitLayers();
					saveToHistory();
				});
			}
		} catch (error) {
			console.warn('Failed to load canvas state:', error);
		}
	};

	// History management for undo/redo
	const saveToHistory = () => {
		// Skip saving if temporarily disabled (during redo/undo operations)
		if (window._tempDisableHistory) {
			return;
		}
		
		const canvas = fabricRef.current;
		if (!canvas) return;
		try {
			const state = JSON.stringify(canvas.toJSON());
			const history = historyRef.current;
			const currentIndex = historyIndexRef.current;
			
			// Remove any states after current index (when we're not at the end)
			if (currentIndex < history.length - 1) {
				history.splice(currentIndex + 1);
			}
			
			// Add new state
			history.push(state);
			historyIndexRef.current = history.length - 1;
			
			// Limit history to 50 states
			if (history.length > 50) {
				history.shift();
				historyIndexRef.current--;
			}
		} catch (error) {
			console.warn('Failed to save to history:', error);
		}
	};

	const undo = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		
		const history = historyRef.current;
		const currentIndex = historyIndexRef.current;
		
		// Can't undo if we're at the beginning
		if (currentIndex <= 0) return;
		
		historyIndexRef.current = currentIndex - 1;
		const state = history[historyIndexRef.current];
		
		if (state) {
			// Temporarily disable history saving during undo
			window._tempDisableHistory = true;
			
			canvas.loadFromJSON(state, () => {
				canvas.renderAll();
				emitLayers();
				// Re-enable history saving
				window._tempDisableHistory = false;
			});
		}
	};

	const redo = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		
		const history = historyRef.current;
		const currentIndex = historyIndexRef.current;
		
		// Can't redo if we're at the end
		if (currentIndex >= history.length - 1) {
			return;
		}
		
		// Move to next state
		historyIndexRef.current = currentIndex + 1;
		const state = history[historyIndexRef.current];
		
		if (state) {
			// Temporarily disable history saving during redo
			window._tempDisableHistory = true;
			
			canvas.loadFromJSON(state, () => {
				canvas.renderAll();
				emitLayers();
				// Re-enable history saving
				window._tempDisableHistory = false;
			});
		}
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

	// Handler functions for UI buttons and keyboard shortcuts
	const handleCopy = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const active = canvas.getActiveObject();
		if (active) {
			const clipboard = JSON.stringify(active.toObject());
			localStorage.setItem('canva-clone-clipboard', clipboard);
		}
	};

	const handlePaste = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		try {
			const clipboard = localStorage.getItem('canva-clone-clipboard');
			if (clipboard) {
				const objData = JSON.parse(clipboard);
				fabric.util.enlivenObjects([objData], (objects) => {
					const obj = objects[0];
					obj.set({
						left: obj.left + 20,
						top: obj.top + 20,
					});
					ensureIds(obj);
					canvas.add(obj);
					canvas.setActiveObject(obj);
					canvas.renderAll();
					emitLayers();
					saveToHistory();
				});
			}
		} catch (error) {
			console.warn('Failed to paste:', error);
		}
	};

	const handleDuplicate = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const active = canvas.getActiveObject();
		if (active) {
			active.clone((cloned) => {
				cloned.set({
					left: cloned.left + 20,
					top: cloned.top + 20,
				});
				ensureIds(cloned);
				canvas.add(cloned);
				canvas.setActiveObject(cloned);
				canvas.renderAll();
				emitLayers();
				saveToHistory();
			});
		}
	};

	useEffect(() => {
		if (!canvasElRef.current) return;
		
		const canvas = new fabric.Canvas(canvasElRef.current, {
			preserveObjectStacking: true,
			selection: true,
			backgroundColor: '#ffffff',
			enableRetinaScaling: false,
		});
		fabricRef.current = canvas;

		const onChange = () => emitLayers();

		canvas.on('object:added', (e) => {
			if (e && e.target) ensureIds(e.target);
			emitLayers();
			saveToHistory();
		});
		canvas.on('object:modified', () => {
			onChange();
			saveToHistory();
		});
		canvas.on('object:removed', () => {
			onChange();
			saveToHistory();
		});
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

		// keyboard shortcuts handling
		const handleKey = (e) => {
			// Don't handle shortcuts if user is typing in an input field
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
				return;
			}
			
			// Undo/Redo shortcuts
			if (e.ctrlKey || e.metaKey) {
				if (e.key === 'z' && !e.shiftKey) {
					e.preventDefault();
					undo();
					return;
				}
				if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
					e.preventDefault();
					redo();
					return;
				}
				// Copy/Paste shortcuts
				if (e.key === 'c') {
					e.preventDefault();
					handleCopy();
					return;
				}
				if (e.key === 'v') {
					e.preventDefault();
					handlePaste();
					return;
				}
				if (e.key === 'd') {
					e.preventDefault();
					handleDuplicate();
					return;
				}
			}
			
			// Delete shortcuts
			if (e.key === 'Delete' || e.key === 'Backspace') {
				const active = canvas.getActiveObject();
				if (active) {
					e.preventDefault();
					canvas.remove(active);
					canvas.discardActiveObject();
					canvas.requestRenderAll();
					emitLayers();
					saveToHistory();
				}
			}
		};
		document.addEventListener('keydown', handleKey);

		// Mouse wheel zoom
		canvas.on('mouse:wheel', (opt) => {
			const delta = opt.e.deltaY;
			let zoom = canvas.getZoom();
			zoom *= 0.999 ** delta;
			if (zoom > 3) zoom = 3;
			if (zoom < 0.1) zoom = 0.1;
			canvas.setZoom(zoom);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		// initial size
		canvas.setWidth(800);
		canvas.setHeight(600);
		canvas.renderAll();

		// Load saved canvas state after initialization
		loadCanvasState();

		// Initialize history with empty state
		saveToHistory();

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
			saveToHistory();
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
			saveToHistory();
		},

		addImageFromFile: (file, options = {}) => {
			const canvas = fabricRef.current;
			if (!canvas || !file) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				fabric.Image.fromURL(e.target.result, (img) => {
					img.set({ 
						left: 350, 
						top: 150, 
						opacity: options.opacity || 1 
					});
					
					// Apply dimensions if provided
					if (options.width) {
						img.scaleToWidth(options.width);
					}
					if (options.height) {
						img.scaleToHeight(options.height);
					}
					
					ensureIds(img);
					canvas.add(img);
					canvas.setActiveObject(img);
					canvas.renderAll();
					emitLayers();
					saveToHistory();
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
			saveToHistory();
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
		// Persistence methods
		saveCanvas: () => {
			saveCanvasState();
		},
		clearCanvas: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			canvas.clear();
			canvas.renderAll();
			emitLayers();
			saveToHistory();
		},
		// Copy/Paste functionality
		copyActive: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const active = canvas.getActiveObject();
			if (active) {
				const clipboard = JSON.stringify(active.toObject());
				localStorage.setItem('canva-clone-clipboard', clipboard);
			}
		},
		pasteFromClipboard: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			try {
				const clipboard = localStorage.getItem('canva-clone-clipboard');
				if (clipboard) {
					const objData = JSON.parse(clipboard);
					fabric.util.enlivenObjects([objData], (objects) => {
						const obj = objects[0];
						obj.set({
							left: obj.left + 20,
							top: obj.top + 20,
						});
						ensureIds(obj);
						canvas.add(obj);
						canvas.setActiveObject(obj);
						canvas.renderAll();
						emitLayers();
						saveToHistory();
					});
				}
			} catch (error) {
				console.warn('Failed to paste:', error);
			}
		},
		duplicateActive: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const active = canvas.getActiveObject();
			if (active) {
				active.clone((cloned) => {
					cloned.set({
						left: cloned.left + 20,
						top: cloned.top + 20,
					});
					ensureIds(cloned);
					canvas.add(cloned);
					canvas.setActiveObject(cloned);
					canvas.renderAll();
					emitLayers();
					saveToHistory();
				});
			}
		},
		// Undo/Redo methods
		undo: () => undo(),
		redo: () => redo(),
		// Zoom controls
		zoomIn: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const currentZoom = canvas.getZoom();
			const newZoom = Math.min(currentZoom * 1.2, 3);
			canvas.setZoom(newZoom);
			canvas.renderAll();
		},
		zoomOut: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const currentZoom = canvas.getZoom();
			const newZoom = Math.max(currentZoom / 1.2, 0.1);
			canvas.setZoom(newZoom);
			canvas.renderAll();
		},
		zoomFit: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			canvas.setZoom(1);
			canvas.renderAll();
		},
		// Export functionality
		exportAsPNG: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			
			// Use the main canvas directly
			try {
				canvas.setBackgroundColor('#ffffff', () => {
					canvas.renderAll();
					
					setTimeout(() => {
						try {
							const dataURL = canvas.toDataURL({
								format: 'png',
								quality: 1,
								multiplier: 1
							});
							downloadImage(dataURL, 'design.png');
						} catch (error) {
							console.error('Export failed:', error);
							alert('Export failed. Please try again.');
						}
					}, 100);
				});
			} catch (error) {
				console.error('Export setup failed:', error);
				alert('Export failed. Please try again.');
			}
		},
		exportAsJPG: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			
			// Use the main canvas directly
			try {
				canvas.setBackgroundColor('#ffffff', () => {
					canvas.renderAll();
					
					setTimeout(() => {
						try {
							const dataURL = canvas.toDataURL({
								format: 'jpeg',
								quality: 0.9,
								multiplier: 1
							});
							downloadImage(dataURL, 'design.jpg');
						} catch (error) {
							console.error('Export failed:', error);
							alert('Export failed. Please try again.');
						}
					}, 100);
				});
			} catch (error) {
				console.error('Export setup failed:', error);
				alert('Export failed. Please try again.');
			}
		},
		// Alignment tools
		alignLeft: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const activeObjects = canvas.getActiveObjects();
			if (activeObjects.length === 0) return;
			
			if (activeObjects.length === 1) {
				// Single object - align to canvas left
				activeObjects[0].set('left', 0);
			} else {
				// Multiple objects - align to leftmost
				const leftmost = Math.min(...activeObjects.map(obj => obj.left));
				activeObjects.forEach(obj => {
					obj.set('left', leftmost);
				});
			}
			canvas.renderAll();
			emitLayers();
			saveToHistory();
		},
		alignCenter: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const activeObjects = canvas.getActiveObjects();
			if (activeObjects.length === 0) return;
			
			const centerX = canvas.getWidth() / 2;
			activeObjects.forEach(obj => {
				obj.set('left', centerX - obj.width * obj.scaleX / 2);
			});
			canvas.renderAll();
			emitLayers();
			saveToHistory();
		},
		alignRight: () => {
			const canvas = fabricRef.current;
			if (!canvas) return;
			const activeObjects = canvas.getActiveObjects();
			if (activeObjects.length === 0) return;
			
			if (activeObjects.length === 1) {
				// Single object - align to canvas right
				const obj = activeObjects[0];
				const objWidth = obj.width * obj.scaleX;
				obj.set('left', canvas.getWidth() - objWidth);
			} else {
				// Multiple objects - align to rightmost
				const rightmost = Math.max(...activeObjects.map(obj => obj.left + (obj.width * obj.scaleX)));
				activeObjects.forEach(obj => {
					const objWidth = obj.width * obj.scaleX;
					obj.set('left', rightmost - objWidth);
				});
			}
			canvas.renderAll();
			emitLayers();
			saveToHistory();
		},
	}));

	// Helper function to download images
	const downloadImage = (dataURL, filename) => {
		const link = document.createElement('a');
		link.download = filename;
		link.href = dataURL;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Additional handler functions for UI buttons
	const handleZoomOut = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const currentZoom = canvas.getZoom();
		const newZoom = Math.max(currentZoom / 1.2, 0.1);
		canvas.setZoom(newZoom);
		setZoomLevel(Math.round(newZoom * 100));
		canvas.renderAll();
	};

	const handleZoomIn = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const currentZoom = canvas.getZoom();
		const newZoom = Math.min(currentZoom * 1.2, 3);
		canvas.setZoom(newZoom);
		setZoomLevel(Math.round(newZoom * 100));
		canvas.renderAll();
	};

	const handleZoomFit = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		canvas.setZoom(1);
		setZoomLevel(100);
		canvas.renderAll();
	};

	const handleUndo = () => undo();
	const handleRedo = () => redo();

	const handleAlignLeft = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		if (activeObjects.length === 1) {
			// Single object - align to canvas left
			activeObjects[0].set('left', 0);
		} else {
			// Multiple objects - align to leftmost
			const leftmost = Math.min(...activeObjects.map(obj => obj.left));
			activeObjects.forEach(obj => {
				obj.set('left', leftmost);
			});
		}
		canvas.renderAll();
		emitLayers();
		saveToHistory();
	};

	const handleAlignCenter = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		const centerX = canvas.getWidth() / 2;
		activeObjects.forEach(obj => {
			obj.set('left', centerX - obj.width * obj.scaleX / 2);
		});
		canvas.renderAll();
		emitLayers();
		saveToHistory();
	};

	const handleAlignRight = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length === 0) return;
		
		if (activeObjects.length === 1) {
			// Single object - align to canvas right
			const obj = activeObjects[0];
			const objWidth = obj.width * obj.scaleX;
			obj.set('left', canvas.getWidth() - objWidth);
		} else {
			// Multiple objects - align to rightmost
			const rightmost = Math.max(...activeObjects.map(obj => obj.left + (obj.width * obj.scaleX)));
			activeObjects.forEach(obj => {
				const objWidth = obj.width * obj.scaleX;
				obj.set('left', rightmost - objWidth);
			});
		}
		canvas.renderAll();
		emitLayers();
		saveToHistory();
	};

	const handleExportPNG = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		
		// Use the main canvas directly
		try {
			canvas.setBackgroundColor('#ffffff', () => {
				canvas.renderAll();
				
				setTimeout(() => {
					try {
						const dataURL = canvas.toDataURL({
							format: 'png',
							quality: 1,
							multiplier: 1
						});
						downloadImage(dataURL, 'design.png');
					} catch (error) {
						console.error('Export failed:', error);
						alert('Export failed. Please try again.');
					}
				}, 100);
			});
		} catch (error) {
			console.error('Export setup failed:', error);
			alert('Export failed. Please try again.');
		}
	};

	const handleExportJPG = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		
		// Use the main canvas directly
		try {
			canvas.setBackgroundColor('#ffffff', () => {
				canvas.renderAll();
				
				setTimeout(() => {
					try {
						const dataURL = canvas.toDataURL({
							format: 'jpeg',
							quality: 0.9,
							multiplier: 1
						});
						downloadImage(dataURL, 'design.jpg');
					} catch (error) {
						console.error('Export failed:', error);
						alert('Export failed. Please try again.');
					}
				}, 100);
			});
		} catch (error) {
			console.error('Export setup failed:', error);
			alert('Export failed. Please try again.');
		}
	};

  return (
    <div className="canvas-container">
      <div className="canvas-tools">
        <div className="zoom-controls">
          <button onClick={handleZoomOut} title="Zoom Out">-</button>
          <span>{zoomLevel}%</span>
          <button onClick={handleZoomIn} title="Zoom In">+</button>
          <button onClick={handleZoomFit} title="Fit to Screen">⌂</button>
        </div>
        <div className="canvas-actions">
          <button onClick={handleUndo} title="Undo (Ctrl+Z)">↶</button>
          <button onClick={handleRedo} title="Redo (Ctrl+Y)">↷</button>
          <button onClick={handleCopy} title="Copy (Ctrl+C)">📋</button>
          <button onClick={handlePaste} title="Paste (Ctrl+V)">📄</button>
          <button onClick={handleDuplicate} title="Duplicate (Ctrl+D)">📄</button>
        </div>
        <div className="alignment-controls">
          <button onClick={handleAlignLeft} title="Align Left">⫷</button>
          <button onClick={handleAlignCenter} title="Align Center">⧉</button>
          <button onClick={handleAlignRight} title="Align Right">⫸</button>
        </div>
        <div className="export-controls">
          <button onClick={handleExportPNG} title="Export as PNG">PNG</button>
          <button onClick={handleExportJPG} title="Export as JPG">JPG</button>
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
