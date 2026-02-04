import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
    mode: 'none' | 'pen' | 'highlighter' | 'eraser';
    config: {
        penColor: string;
        markerColor: string;
        strokeSize: number;
    };
    isActive: boolean;
    questionId: string;
}

export const DrawingCanvas = ({ mode, config, isActive, questionId }: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Coordinate Normalization & Resizing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);

            if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
                // Save current content before resize
                const tempData = canvas.toDataURL();

                canvas.width = width * window.devicePixelRatio;
                canvas.height = height * window.devicePixelRatio;

                const context = canvas.getContext('2d');
                if (context) {
                    context.scale(window.devicePixelRatio, window.devicePixelRatio);
                    context.lineCap = 'round';
                    context.lineJoin = 'round';
                    contextRef.current = context;

                    // Re-apply settings
                    const isEraser = mode === 'eraser';
                    const isMarker = mode === 'highlighter';
                    context.strokeStyle = isEraser ? '#ffffff' : (isMarker ? config.markerColor : config.penColor);
                    context.lineWidth = isEraser ? 20 : (isMarker ? 20 : config.strokeSize);
                    context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
                    context.globalAlpha = isMarker ? 0.4 : 1.0;

                    // Restore content
                    const img = new Image();
                    img.onload = () => context.drawImage(img, 0, 0, width, height);
                    img.src = tempData;
                }
            }
        };

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(resizeCanvas);
        });

        observer.observe(canvas);
        resizeCanvas();

        const loadSaved = () => {
            const saved = localStorage.getItem(`drawing_${questionId}`);
            if (saved && contextRef.current) {
                const rect = canvas.getBoundingClientRect();
                const img = new Image();
                img.onload = () => {
                    contextRef.current?.clearRect(0, 0, rect.width, rect.height);
                    contextRef.current?.drawImage(img, 0, 0, rect.width, rect.height);
                };
                img.src = saved;
            } else {
                contextRef.current?.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        loadSaved();

        return () => {
            observer.disconnect();
        };
    }, [questionId]);

    useEffect(() => {
        if (contextRef.current) {
            const isEraser = mode === 'eraser';
            const isMarker = mode === 'highlighter';

            contextRef.current.strokeStyle = isEraser ? '#ffffff' : (isMarker ? config.markerColor : config.penColor);
            contextRef.current.lineWidth = isEraser ? 20 : (isMarker ? 20 : config.strokeSize);
            contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
            contextRef.current.globalAlpha = isMarker ? 0.4 : 1.0;
        }
    }, [mode, config]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode === 'none' || !isActive) return;

        const { offsetX, offsetY } = getCoordinates(e);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || mode === 'none' || !isActive) return;

        const { offsetX, offsetY } = getCoordinates(e);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            contextRef.current?.closePath();
            saveDrawing();
        }
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            localStorage.setItem(`drawing_${questionId}`, canvas.toDataURL());
        }
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`absolute inset-0 w-full h-full z-20 transition-opacity duration-300 ${isActive ? 'opacity-100 pointer-events-auto cursor-crosshair' : 'opacity-0 pointer-events-none'
                }`}
            style={{ touchAction: 'none' }}
        />
    );
};
