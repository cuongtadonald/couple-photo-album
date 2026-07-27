'use client';

import { useEffect, useState } from 'react';
import AlbumModal from './AlbumModal';
import AlbumDetail from './AlbumDetail';
import { Plus, Lock, Globe, Pencil, Trash2, ImageIcon, MoreHorizontal } from 'lucide-react';
import { formatDateVN } from '@/lib/datetime';
import LocationBadge from './LocationBadge';
import { useSessionState, clearSessionKey } from '@/lib/use-session-state';
import { useSeen } from '@/lib/use-seen';
import Image from 'next/image';

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

// Corner decoration options (hearts, flowers, bows)
const CORNER_STICKERS = [
  { src: '/assets-new-design/heart_pink_solid_01.png', w: 44, h: 44 },
  { src: '/assets-new-design/heart_pink_solid_02.png', w: 40, h: 40 },
  { src: '/assets-new-design/flower_pink_medium.png', w: 48, h: 48 },
  { src: '/assets-new-design/bow_pink_small.png', w: 48, h: 34 },
  { src: '/assets-new-design/flower_pink_small.png', w: 42, h: 42 },
];

// Corner positions with rotation offsets
const CORNER_POSITIONS = [
  { pos: 'top-1 left-1', rotate: -15 },
  { pos: 'top-1 right-1', rotate: 12 },
  { pos: 'bottom-1 left-1', rotate: 8 },
  { pos: 'bottom-1 right-1', rotate: -10 },
];

function getCardDecoration(index: number) {
  // Alternate between tape on different corners and sticker on opposite corner
  const tapePosition = index % 2 === 0 ? CORNER_POSITIONS[0] : CORNER_POSITIONS[1]; // top-left or top-right
  const stickerPosition = index % 2 === 0 ? CORNER_POSITIONS[3] : CORNER_POSITIONS[2]; // bottom-right or bottom-left
  const tapeImage = WASHI_TAPES[index % WASHI_TAPES.length];
  const sticker = CORNER_STICKERS[index % CORNER_STICKERS.length];
  return { tapePosition, stickerPosition, tapeImage, sticker };
}

export default function AlbumList({ token, currentUserId }: { token: string | null; currentUserId?: number | null }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useSessionState<boolean>('albums:showModal', false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useSessionState<number | null>('albums:selectedId', null);
  const [tab, setTab] = useSessionState<Visibility>('albums:tab', 'private');
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

  const visibleAlbums = albums.filter((a) => a.visibility === tab);
  const tabsFilter: { key: Visibility; label: string; icon: typeof Lock }[] = [
    { key: 'private', label: 'Riêng tư', icon: Lock },
    { key: 'public', label: 'Công khai', icon: Globe },
  ];

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E8548E]">
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
        <button
          onClick={openCreate}
          className="flex items-center gap-2 py-2.5 px-5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          <Plus size={18} />
          Tạo Album Mới
        </button>
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
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-pink-50 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => { setSelectedAlbumId(album.id); markSeen(album.id); }}
                  className="h-36 sm:h-44 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center overflow-hidden relative cursor-pointer"
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
                  
                  {/* Washi tape decoration - positioned on corner */}
                  <div className={`absolute ${decoration.tapePosition.pos} z-20 pointer-events-none`}>
                    <Image
                      src={decoration.tapeImage}
                      alt=""
                      width={60}
                      height={24}
                      className="opacity-85"
                      style={{ transform: `rotate(${decoration.tapePosition.rotate}deg)` }}
                    />
                  </div>
                  
                  {/* Corner sticker decoration */}
                  <div className={`absolute ${decoration.stickerPosition.pos} z-20 pointer-events-none`}>
                    <Image
                      src={decoration.sticker.src}
                      alt=""
                      width={decoration.sticker.w}
                      height={decoration.sticker.h}
                      className="opacity-80"
                      style={{ transform: `rotate(${decoration.stickerPosition.rotate}deg)` }}
                    />
                  </div>
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
                      <div className="relative shrink-0 group/menu">
                        <button className="grid place-items-center w-7 h-7 rounded-full text-gray-300 hover:text-pink-400 hover:bg-pink-50 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                        <div className="hidden group-hover/menu:flex absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-pink-100 py-1 z-30 min-w-[100px]">
                          <button
                            onClick={() => openEdit(album)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-pink-50 hover:text-rose-500 w-full text-left"
                          >
                            <Pencil size={13} /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(album)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-500 w-full text-left"
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        </div>
                      </div>
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
