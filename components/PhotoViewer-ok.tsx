'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, MapPin, ExternalLink, Sticker } from 'lucide-react';
import StickerOverlay, { StickerItem } from './StickerOverlay';

interface ViewerPhoto {
  id: number;
  image_url: string;
  caption?: string;
  location_name?: string | null;
  location_url?: string | null;
  is_video?: boolean;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  startIndex: number;
  onClose: () => void;
  albumId?: number;
  token?: string | null;
  onStickersSaved?: (photoId: number, stickers: StickerItem[]) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function PhotoViewer({ photos, startIndex, onClose, albumId, token, onStickersSaved }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stickerMode, setStickerMode] = useState(false);
  const [displayStickers, setDisplayStickers] = useState<StickerItem[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  const current = photos[index];
  const currentId = current?.id ?? null;

  // Fetch stickers mỗi khi chuyển ảnh (luôn hiển thị, không cần bật sticker mode)
  useEffect(() => {
    if (albumId == null || currentId == null) return;

    let cancelled = false;
    setDisplayStickers([]);

    fetch(`/api/albums/${albumId}/photos/${currentId}/stickers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDisplayStickers(data.stickers || []);
        }
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [albumId, currentId, token]);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; baseX: number; baseY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  //const current = photos[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
    resetZoom();
    setStickerMode(false);
  }, [photos.length, resetZoom]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
    resetZoom();
    setStickerMode(false);
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
          {albumId != null && (
            <button
              onClick={() => { resetZoom(); setStickerMode((v) => !v); }}
              aria-label="Sticker"
              title="Sticker"
              className={`grid place-items-center w-10 h-10 rounded-full transition-colors ${stickerMode ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
            >
              <Sticker size={20} />
            </button>
          )}
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
        ref={stageRef}
        className="relative flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onClick={(e) => {
          // Click on the empty backdrop closes; clicks on controls/image do not
          if (!stickerMode && e.target === e.currentTarget) onClose();
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

        {current.is_video ? (
          <video
            src={current.image_url || '/placeholder.svg'}
            controls
            autoPlay
            className="max-h-full max-w-full object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
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
        )}

        {photos.length > 1 && (
          <button
            onClick={goNext}
            aria-label="Ảnh sau"
            className="absolute right-2 sm:right-4 z-10 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevronRight size={26} />
          </button>
        )}

        {/* Stickers luôn hiển thị (không tương tác) khi không ở sticker mode */}
        {!stickerMode && displayStickers.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.pos_x}%`,
              top: `${s.pos_y}%`,
              fontSize: `${s.size}px`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
              pointerEvents: 'none',
              userSelect: 'none',
              lineHeight: 1,
              zIndex: 15,
            }}
          >
            {s.emoji}
          </div>
        ))}

        {/* Sticker overlay (edit mode) */}
        {stickerMode && albumId != null && current && (
          <StickerOverlay
            photoId={current.id}
            albumId={albumId}
            token={token ?? null}
            containerRef={stageRef}
            onClose={() => {
              setStickerMode(false);
              // Reload stickers mới nhất sau khi lưu
              if (albumId != null && currentId != null) {
                const photoId = currentId;
                fetch(`/api/albums/${albumId}/photos/${photoId}/stickers`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                })
                  .then((r) => r.json())
                  .then((data) => {
                    const updated: StickerItem[] = data.stickers || [];
                    setDisplayStickers(updated);
                    onStickersSaved?.(photoId, updated);
                  })
                  .catch(() => { });
              }
            }}
          />
        )}
      </div>

      {/* Caption + Location */}
      {(current.caption || current.location_name || current.location_url) && (
        <div className="px-4 py-4 text-center space-y-2">
          {current.caption && (
            <p className="mx-auto max-w-2xl text-sm text-white/85 whitespace-pre-line leading-relaxed">
              {current.caption}
            </p>
          )}
          {(current.location_name || current.location_url) && (
            <div className="flex items-center justify-center gap-2">
              {current.location_url ? (
                <a
                  href={current.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 text-white/90 transition-colors"
                  aria-label={`Mo Google Maps: ${current.location_name || 'Xem ban do'}`}
                >
                  <MapPin size={12} className="shrink-0" />
                  <span>{current.location_name || 'Xem bản đồ'}</span>
                  <ExternalLink size={11} className="shrink-0 opacity-75" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-white/10 text-white/75">
                  <MapPin size={12} className="shrink-0" />
                  <span>{current.location_name}</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
