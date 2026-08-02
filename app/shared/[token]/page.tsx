'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import PhotoViewer from '@/components/PhotoViewer';
import { formatDateVN } from '@/lib/datetime';
import { MapPin } from 'lucide-react';

interface StickerItem {
  id: number;
  emoji: string;
  positionX: number;
  positionY: number;
  userId: number;
}

interface Photo {
  id: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  locationName?: string | null;
  locationUrl?: string | null;
  stickers?: StickerItem[];
}

interface Album {
  id: number;
  title: string;
  description: string;
  photos: Photo[];
  expiresAt?: string;
}

// Sticker decoration constants (same as AlbumDetail)
const WASHI_TAPES = [
  '/assets-new-design/tape_washi_pink_solid.png',
  '/assets-new-design/tape_washi_pink_dotted.png',
  '/assets-new-design/tape_washi_pink_light.png',
  '/assets-new-design/tape_washi_blue.png',
];

const CORNER_STICKERS = [
  { src: '/assets-new-design/heart_pink_solid_01.png', w: 44, h: 44 },
  { src: '/assets-new-design/heart_pink_solid_02.png', w: 45, h: 45 },
  { src: '/assets-new-design/flower_pink_medium.png', w: 46, h: 46 },
  { src: '/assets-new-design/bow_pink_small.png', w: 46, h: 34 },
  { src: '/assets-new-design/flower_pink_small.png', w: 44, h: 44 },
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
  const sticker = CORNER_STICKERS[index % CORNER_STICKERS.length];
  return { tapeConfig, stickerConfig, tapeImage, sticker };
}

function LocationBadge({ locationName, locationUrl }: { locationName?: string | null; locationUrl?: string | null }) {
  if (!locationName && !locationUrl) return null;
  const label = locationName || 'Xem bản đồ';

  if (locationUrl) {
    return (
      <a
        href={locationUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer truncate max-w-[160px]"
        title={locationUrl}
      >
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{label}</span>
      </a>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 truncate max-w-[160px]">
      <MapPin size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export default function SharedAlbumPage() {
  const params = useParams();
  const token = params.token as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!token) return;

    const fetchAlbum = async () => {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Không tìm thấy album');
          return;
        }
        const data = await res.json();
        setAlbum(data.album);
      } catch (err) {
        setError('Không thể tải album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (!album?.expiresAt) return;

    const updateCountdown = () => {
      const expiresAt = new Date(album.expiresAt!);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Đã hết hạn');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days} ngày ${hours} giờ`);
      } else if (hours > 0) {
        setCountdown(`${hours} giờ ${minutes} phút`);
      } else {
        setCountdown(`${minutes} phút`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [album?.expiresAt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải album...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Không thể truy cập</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-400 mt-4">
            Liên kết này có thể đã hết hạn hoặc không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-rose-600">{album.title}</h1>
          {album.description && (
            <p className="text-gray-600 text-sm mt-1">{album.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {album.photos.length} ảnh
          </p>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {album.photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-500">Album này chưa có ảnh</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {album.photos.map((photo, idx) => {
              const decoration = getCardDecoration(idx);
              return (
                <div
                  key={photo.id}
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
                    onClick={() => setViewerIndex(idx)}
                    className="h-36 sm:h-44 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center overflow-hidden relative cursor-pointer rounded-t-2xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || 'Ảnh'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

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

                    {/* User stickers on image */}
                    {photo.stickers && photo.stickers.length > 0 && (
                      <>
                        {photo.stickers.map((s) => (
                          <span
                            key={s.id}
                            className="absolute pointer-events-none z-10"
                            style={{
                              left: `${s.positionX}%`,
                              top: `${s.positionY}%`,
                              fontSize: '20px',
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                            {s.emoji}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3 sm:p-4 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* User stickers in text area */}
                        {photo.stickers && photo.stickers.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            {photo.stickers.map((s) => (
                              <span key={s.id} style={{ fontSize: '16px', lineHeight: 1 }} title={s.emoji}>
                                {s.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 min-h-[2.5rem]">
                          {photo.caption || <span className="text-gray-400 italic">Chưa có chú thích</span>}
                        </p>

                        {(photo.locationName || photo.locationUrl) && (
                          <div className="mt-1 truncate">
                            <LocationBadge
                              locationName={photo.locationName}
                              locationUrl={photo.locationUrl}
                            />
                          </div>
                        )}

                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
                          📅 {formatDateVN(photo.createdAt)}
                        </p>
                      </div>
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
        )}
      </div>

      {/* Photo Viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={album.photos.map((p) => ({
            id: p.id,
            image_url: p.imageUrl,
            caption: p.caption,
            created_at: p.createdAt,
          }))}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
        />
      )}

      {/* Footer */}
      <div className="text-center py-8 text-xs text-gray-400">
        <p>Liên kết này sẽ hết hạn sau {countdown || '72 giờ'}</p>
      </div>
    </div>
  );
}
