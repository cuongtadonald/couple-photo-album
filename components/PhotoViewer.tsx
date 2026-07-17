'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ViewerPhoto {
  id: number;
  image_url: string;
  caption?: string;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  startIndex: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function PhotoViewer({ photos, startIndex, onClose }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; baseX: number; baseY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  const current = photos[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
    resetZoom();
  }, [photos.length, resetZoom]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
    resetZoom();
  }, [photos.length, resetZoom]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(2))), []);
  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, +(z - 0.5).toFixed(2));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', handleKey);
    // Lock body scroll while viewer is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [goPrev, goNext, zoomIn, zoomOut, onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    setOffset({
      x: dragState.current.baseX + (e.clientX - dragState.current.startX),
      y: dragState.current.baseY + (e.clientY - dragState.current.startY),
    });
  };

  const handlePointerUp = () => {
    dragState.current.dragging = false;
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-sm font-medium">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Thu nhỏ"
            className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Phóng to"
            className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={resetZoom}
            aria-label="Đặt lại"
            className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Image stage */}
      <div
        className="relative flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onClick={(e) => {
          // Click on the empty backdrop closes; clicks on controls/image do not
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {photos.length > 1 && (
          <button
            onClick={goPrev}
            aria-label="Ảnh trước"
            className="absolute left-2 sm:left-4 z-10 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.image_url || '/placeholder.svg'}
          alt={current.caption || `Ảnh ${index + 1}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={() => (zoom > 1 ? resetZoom() : setZoom(2))}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-100"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
          }}
        />

        {photos.length > 1 && (
          <button
            onClick={goNext}
            aria-label="Ảnh sau"
            className="absolute right-2 sm:right-4 z-10 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="px-4 py-4 text-center">
          <p className="mx-auto max-w-2xl text-sm text-white/85 whitespace-pre-line leading-relaxed">
            {current.caption}
          </p>
        </div>
      )}
    </div>
  );
}
