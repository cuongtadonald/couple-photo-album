'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import AlbumModal from './AlbumModal';
import AlbumDetail from './AlbumDetail';
import { Plus, Lock, Globe, Pencil, Trash2, ImageIcon, MoreHorizontal, Calendar } from 'lucide-react';
import { formatDateVN } from '@/lib/datetime';
import LocationBadge from './LocationBadge';
import { useSessionState, clearSessionKey } from '@/lib/use-session-state';
import { useSeen } from '@/lib/use-seen';
import Image from 'next/image';

type TimeFilter = 'all' | 'week' | 'month' | 'year';

// Dropdown menu component that closes when clicking outside
function DropdownMenu({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-pink-100 py-1 z-50 min-w-[120px]">
          {children}
        </div>
      )}
    </div>
  );
}


type Visibility = 'private' | 'public';

interface Album {
  id: number;
  user_id: number;
  title: string;
  description: string;
  visibility: Visibility;
  location_name?: string | null;
  location_url?: string | null;
  cover_image_url: string | null;
  cover_photo_id: number | null;
  photo_count: number;
  created_at: string;
  uploader_name?: string | null;
}

// Washi tape options for album card decorations
const WASHI_TAPES = [
  '/assets-new-design/tape_washi_pink_solid.png',
  '/assets-new-design/tape_washi_pink_dotted.png',
  '/assets-new-design/tape_washi_pink_light.png',
  '/assets-new-design/tape_washi_blue.png',
];

// Corner decoration options (hearts, flowers, bows) - 44-46px
const CORNER_STICKERS = [
  { src: '/assets-new-design/heart_pink_solid_01.png', w: 44, h: 44 },
  { src: '/assets-new-design/heart_pink_solid_02.png', w: 45, h: 45 },
  { src: '/assets-new-design/flower_pink_medium.png', w: 46, h: 46 },
  { src: '/assets-new-design/bow_pink_small.png', w: 46, h: 34 },
  { src: '/assets-new-design/flower_pink_small.png', w: 44, h: 44 },
];

// Tape positions - thinner, longer, extend ~40% outside the card
const TAPE_CONFIGS = [
  { top: '-15px', left: '-24px', rotate: -35, width: 80, height: 14 },
  { top: '-15px', right: '-24px', rotate: 30, width: 80, height: 14 },
];

// Sticker positions - random between image bottom-right and text area bottom-right
const STICKER_CONFIGS = [
  { location: 'image', rotate: 12 },
  { location: 'text', rotate: -8 },
  { location: 'image', rotate: 15 },
  { location: 'text', rotate: -12 },
];

function getCardDecoration(index: number) {
  const tapeConfig = TAPE_CONFIGS[index % 2];
  const stickerConfig = STICKER_CONFIGS[index % STICKER_CONFIGS.length];
  const tapeImage = WASHI_TAPES[index % WASHI_TAPES.length];
  const sticker = CORNER_STICKERS[index % CORNER_STICKERS.length];
  return { tapeConfig, stickerConfig, tapeImage, sticker };
}

export default function AlbumList({ token, currentUserId }: { token: string | null; currentUserId?: number | null }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useSessionState<boolean>('albums:showModal', false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useSessionState<number | null>('albums:selectedId', null);
  const [tab, setTab] = useSessionState<Visibility>('albums:tab', 'private');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { badge, markSeen } = useSeen('album');

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  useEffect(() => {
    fetchAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    title: string,
    description: string,
    visibility: Visibility,
    locationName: string,
    locationUrl: string
  ) => {
    try {
      if (editing) {
        const response = await fetch(`/api/albums/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, visibility, locationName, locationUrl }),
        });
        if (response.ok) {
          setTab(visibility);
          await fetchAlbums();
        }
      } else {
        const response = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, visibility, locationName, locationUrl }),
        });
        const data = await response.json();
        if (data.album) {
          setAlbums((prev) => [data.album, ...prev]);
          setTab(visibility);
        }
      }
      clearSessionKey('albums:draft:title');
      clearSessionKey('albums:draft:desc');
      clearSessionKey('albums:draft:visibility');
      clearSessionKey('albums:draft:locationName');
      clearSessionKey('albums:draft:locationUrl');
      closeModal();
    } catch (error) {
      console.error('Error saving album:', error);
    }
  };

  const handleDelete = async (album: Album) => {
    if (!confirm(`Xóa album "${album.title}" và toàn bộ ảnh bên trong?`)) return;
    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== album.id));
      }
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (album: Album) => { setEditing(album); setShowModal(true); };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    clearSessionKey('albums:draft:title');
    clearSessionKey('albums:draft:desc');
    clearSessionKey('albums:draft:visibility');
    clearSessionKey('albums:draft:locationName');
    clearSessionKey('albums:draft:locationUrl');
  };

  if (selectedAlbum) {
    return (
      <AlbumDetail
        album={selectedAlbum}
        token={token}
        onBack={() => setSelectedAlbumId(null)}
        onAlbumUpdate={fetchAlbums}
      />
    );
  }

  const visibleAlbums = albums.filter((a) => {
    if (a.visibility !== tab) return false;
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const createdDate = new Date(a.created_at);
      const now = new Date();
      
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (createdDate < weekAgo) return false;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (createdDate < monthAgo) return false;
      } else if (timeFilter === 'year') {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (createdDate < yearAgo) return false;
      }
    }
    
    return true;
  });
  
  const tabsFilter: { key: Visibility; label: string; icon: typeof Lock }[] = [
    { key: 'private', label: 'Riêng tư', icon: Lock },
    { key: 'public', label: 'Công khai', icon: Globe },
  ];
  
  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng này' },
    { key: 'year', label: 'Năm nay' },
  ];

  return (
    <div>
      {/* Section header */}
      <div className="flex justify-between items-center mb-8 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            📷 Ảnh Kỷ Niệm
          </h2>
          <Image
            src="/assets-new-design/heart_doodle_scribble.png"
            alt=""
            width={28}
            height={28}
            className="opacity-70"
          />
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Tạo Album Mới
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabsFilter.map(({ key, label, icon: Icon }) => {
          const count = albums.filter((a) => a.visibility === key).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                tab === key
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md'
                  : 'bg-white/80 text-gray-500 border-pink-100 hover:border-pink-300 hover:text-rose-500'
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tab === key ? 'bg-white/25' : 'bg-pink-50 text-rose-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
        
        {/* Time filter */}
        <div className="flex items-center gap-1 ml-auto">
          <Calendar size={16} className="text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-3 py-2 rounded-full text-sm font-semibold bg-white/80 border-2 border-pink-100 text-gray-500 hover:border-pink-300 focus:outline-none focus:border-pink-400 transition-all"
          >
            {timeFilters.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : visibleAlbums.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-pink-200">
          <div className="text-6xl mb-4">🎞️</div>
          <p className="text-gray-500 mb-6 text-lg">
            {tab === 'private' ? 'Chưa có album riêng tư nào' : 'Chưa có album công khai nào'}
          </p>
          <button
            onClick={openCreate}
            className="py-2.5 px-6 rounded-full text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-md hover:shadow-lg transition-all"
          >
            ✨ Tạo Album Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {visibleAlbums.map((album, idx) => {
            const decoration = getCardDecoration(idx);
            return (
              <div
                key={album.id}
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible border border-pink-50 hover:-translate-y-1"
              >
                {/* Washi tape - thinner, longer, extend 40% outside */}
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
                  onClick={() => { setSelectedAlbumId(album.id); markSeen(album.id); }}
                  className="h-36 sm:h-44 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center overflow-hidden relative cursor-pointer rounded-t-2xl"
                >
                  {album.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center relative z-10">
                      <ImageIcon className="mx-auto text-rose-300" size={40} />
                      <p className="text-xs font-semibold text-rose-400 mt-2">Chưa có ảnh</p>
                    </div>
                  )}
                  
                  {/* Photo count badge */}
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-rose-600 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-pink-100 z-10">
                    <Image src="/assets-new-design/icon_camera_album_badge.png" alt="" width={12} height={12} />
                    {album.photo_count} ảnh
                  </span>
                  
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <h3
                        onClick={() => { setSelectedAlbumId(album.id); markSeen(album.id); }}
                        className="font-bold text-sm sm:text-base text-[#E8548E] hover:text-pink-600 transition-colors cursor-pointer line-clamp-1"
                      >
                        {album.title}
                      </h3>
                      {(() => {
                        const b = badge(album.id, album.created_at);
                        if (!b) return null;
                        return (
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${b === 'new' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                            {b === 'new' ? 'Mới' : 'Chưa xem'}
                          </span>
                        );
                      })()}
                    </div>
                    {currentUserId === album.user_id && (
                      <DropdownMenu
                        trigger={
                          <div className="grid place-items-center w-7 h-7 rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                            <MoreHorizontal size={16} />
                          </div>
                        }
                      >
                        <button
                          onClick={() => { openEdit(album); }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-pink-50 hover:text-rose-500 w-full text-left"
                        >
                          <Pencil size={13} /> Sửa
                        </button>
                        <button
                          onClick={() => { handleDelete(album); }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-500 w-full text-left"
                        >
                          <Trash2 size={13} /> Xóa
                        </button>
                      </DropdownMenu>
                    )}
                  </div>

                  {album.description && (
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 line-clamp-2">{album.description}</p>
                  )}
                  {(album.location_name || album.location_url) && (
                    <div className="mt-1.5">
                      <LocationBadge
                        locationName={album.location_name}
                        locationUrl={album.location_url}
                      />
                    </div>
                  )}
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-2 flex items-center gap-1">
                    📅 {formatDateVN(album.created_at)}
                  </p>
                  {album.uploader_name && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                      Được đăng bởi: <span className="font-semibold text-pink-400">{album.uploader_name}</span>
                    </p>
                  )}
                  
                  {/* Corner sticker decoration - random position */}
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

      <AlbumModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description || '',
                visibility: editing.visibility,
                location_name: editing.location_name || '',
                location_url: editing.location_url || '',
              }
            : null
        }
        draftKey="albums:draft"
      />
    </div>
  );
}
