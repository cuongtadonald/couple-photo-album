'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Trash2, ChevronLeft, ChevronRight, RotateCw, X, Music } from 'lucide-react';

interface Attachment {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
}

interface AttachmentGridProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: number) => void;
  showDelete?: boolean;
}

// Sticker decorations (same as EventDetail)
const STICKERS = [
  { src: '/assets-new-design/heart_pink_solid_01.png', w: 40, h: 40 },
  { src: '/assets-new-design/heart_pink_solid_02.png', w: 35, h: 35 },
  { src: '/assets-new-design/flower_pink_medium.png', w: 45, h: 45 },
  { src: '/assets-new-design/flower_pink_small.png', w: 38, h: 38 },
  { src: '/assets-new-design/bow_pink_small.png', w: 42, h: 30 },
];

const WASHI_TAPES = [
  '/assets-new-design/tape_washi_pink_solid.png',
  '/assets-new-design/tape_washi_pink_dotted.png',
  '/assets-new-design/tape_washi_pink_light.png',
  '/assets-new-design/tape_washi_blue.png',
];

const TAPE_CONFIGS = [
  { top: '-15px', left: '-24px', rotate: -35, width: 80, height: 14 },
  { top: '-15px', right: '-24px', rotate: 30, width: 80, height: 14 },
];

const STICKER_CONFIGS = [
  { location: 'image' as const, rotate: 12 },
  { location: 'text' as const, rotate: -8 },
  { location: 'image' as const, rotate: 15 },
  { location: 'text' as const, rotate: -12 },
];

function getCardDecoration(index: number) {
  const tapeConfig = TAPE_CONFIGS[index % 2];
  const stickerConfig = STICKER_CONFIGS[index % STICKER_CONFIGS.length];
  const tapeImage = WASHI_TAPES[index % WASHI_TAPES.length];
  const sticker = STICKERS[index % STICKERS.length];
  return { tapeConfig, stickerConfig, tapeImage, sticker };
}

export default function AttachmentGrid({ attachments, onDelete, showDelete = true }: AttachmentGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerRotation, setViewerRotation] = useState(0);

  const imageAttachments = attachments.filter(a => a.file_type === 'image');

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
        {attachments.map((attachment, idx) => {
          const decoration = getCardDecoration(idx);
          const imageIndex = attachment.file_type === 'image' ? imageAttachments.indexOf(attachment) : -1;
          
          return (
            <div
              key={attachment.id}
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible border border-pink-50 hover:-translate-y-1"
            >
              {/* Washi tape */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  top: decoration.tapeConfig.top,
                  ...(decoration.tapeConfig.left ? { left: decoration.tapeConfig.left } : { right: decoration.tapeConfig.right }),
                  transform: `rotate(${decoration.tapeConfig.rotate}deg)`,
                }}
              >
                <Image
                  src={decoration.tapeImage}
                  alt=""
                  width={decoration.tapeConfig.width}
                  height={decoration.tapeConfig.height}
                  className="opacity-85"
                />
              </div>

              {/* Thumbnail */}
              <div
                onClick={() => {
                  if (attachment.file_type === 'image' && imageIndex >= 0) {
                    setViewerIndex(imageIndex);
                  } else if (attachment.file_type === 'video') {
                    window.open(attachment.file_url, '_blank');
                  }
                }}
                className="h-36 sm:h-44 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center overflow-hidden relative cursor-pointer rounded-t-2xl"
              >
                {attachment.file_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : attachment.file_type === 'video' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <video
                    src={attachment.file_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                  />
                ) : attachment.file_type === 'audio' ? (
                  <div className="text-center p-4 w-full">
                    <Music size={48} className="mx-auto text-rose-400 mb-2" />
                    <audio
                      controls
                      src={attachment.file_url}
                      className="w-full h-8"
                      style={{ accentColor: '#f43f5e' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-5xl">📄</span>
                    <p className="text-xs text-gray-500 mt-2">{attachment.file_name.split('.').pop()?.toUpperCase()}</p>
                  </div>
                )}
                
                {/* Video play icon overlay */}
                {attachment.file_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-rose-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Corner sticker on image */}
                {decoration.stickerConfig.location === 'image' && (
                  <div
                    className="absolute bottom-2 right-2 pointer-events-none z-10"
                    style={{ transform: `rotate(${decoration.stickerConfig.rotate}deg)` }}
                  >
                    <Image
                      src={decoration.sticker.src}
                      alt=""
                      width={decoration.sticker.w}
                      height={decoration.sticker.h}
                    />
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-3 sm:p-4 relative">
                <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 min-h-[2.5rem]">
                  {attachment.file_name}
                </p>
                <div className="flex gap-2 mt-2">
                  <a
                    href={attachment.file_url}
                    download
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
                  >
                    <Download size={12} />
                  </a>
                  {showDelete && onDelete && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors border border-red-200"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                
                {/* Corner sticker in text area */}
                {decoration.stickerConfig.location === 'text' && (
                  <div
                    className="absolute bottom-2 right-2 pointer-events-none"
                    style={{ transform: `rotate(${decoration.stickerConfig.rotate}deg)` }}
                  >
                    <Image
                      src={decoration.sticker.src}
                      alt=""
                      width={decoration.sticker.w}
                      height={decoration.sticker.h}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Viewer Modal */}
      {viewerIndex !== null && imageAttachments.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 text-white/90 z-10">
            <span className="text-sm font-medium">
              {viewerIndex + 1} / {imageAttachments.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewerRotation((r) => (r + 90) % 360)}
                className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Xoay 90 độ"
              >
                <RotateCw size={18} />
              </button>
              <a
                href={imageAttachments[viewerIndex]?.file_url}
                download
                className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download size={18} />
              </a>
              <button
                onClick={() => {
                  setViewerIndex(null);
                  setViewerRotation(0);
                }}
                className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Navigation buttons */}
          {imageAttachments.length > 1 && (
            <>
              <button
                onClick={() => {
                  setViewerIndex((viewerIndex - 1 + imageAttachments.length) % imageAttachments.length);
                  setViewerRotation(0);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={() => {
                  setViewerIndex((viewerIndex + 1) % imageAttachments.length);
                  setViewerRotation(0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative max-w-7xl max-h-[90vh] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageAttachments[viewerIndex]?.file_url}
              alt={imageAttachments[viewerIndex]?.file_name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-300"
              style={{ transform: `rotate(${viewerRotation}deg)` }}
            />
            {/* Caption */}
            {imageAttachments[viewerIndex]?.file_name && (
              <p className="text-center text-white/80 text-sm mt-3">
                {imageAttachments[viewerIndex]?.file_name}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
