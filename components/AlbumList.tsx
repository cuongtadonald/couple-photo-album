'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AlbumModal from './AlbumModal';
import AlbumDetail from './AlbumDetail';
import { Plus, Lock, Globe, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { formatDateVN } from '@/lib/datetime';
import LocationBadge from './LocationBadge';

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
}

export default function AlbumList({ token }: { token: string | null }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [tab, setTab] = useState<Visibility>('private');

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

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (album: Album) => {
    setEditing(album);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  if (selectedAlbum) {
    return (
      <AlbumDetail
        album={selectedAlbum}
        token={token}
        onBack={() => setSelectedAlbum(null)}
        onAlbumUpdate={fetchAlbums}
      />
    );
  }

  const visibleAlbums = albums.filter((a) => a.visibility === tab);
  const tabs: { key: Visibility; label: string; icon: typeof Lock }[] = [
    { key: 'private', label: 'Riêng tư', icon: Lock },
    { key: 'public', label: 'Công khai', icon: Globe },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          📷 Ảnh Kỷ Niệm
        </h2>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Tạo Album Mới
        </Button>
      </div>

      {/* Private / Public tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map(({ key, label, icon: Icon }) => {
          const count = albums.filter((a) => a.visibility === key).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-cute text-sm font-semibold border-2 transition-all ${
                tab === key
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md'
                  : 'bg-white/70 text-gray-600 border-rose-100 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              <Icon size={16} />
              {label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tab === key ? 'bg-white/25' : 'bg-rose-50 text-rose-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : visibleAlbums.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
          <div className="text-6xl mb-4">🎞️</div>
          <p className="text-gray-600 mb-6 text-lg">
            {tab === 'private' ? 'Chưa có album riêng tư nào' : 'Chưa có album công khai nào'}
          </p>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Tạo Album Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAlbums.map((album) => (
            <div
              key={album.id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-rose-100"
            >
              <div
                onClick={() => setSelectedAlbum(album)}
                className="h-48 bg-gradient-to-br from-rose-200 via-pink-100 to-rose-100 flex items-center justify-center overflow-hidden relative cursor-pointer"
              >
                {album.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_image_url || '/placeholder.svg'}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center relative z-10">
                    <ImageIcon className="mx-auto text-rose-400" size={48} />
                    <p className="text-sm font-semibold text-rose-700 mt-2">Chưa có ảnh</p>
                  </div>
                )}
                <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  {album.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                  {album.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                </span>
                <span className="absolute bottom-3 right-3 text-xs font-semibold text-rose-700 bg-white/80 px-3 py-1 rounded-full">
                  {album.photo_count} ✨ ảnh
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => setSelectedAlbum(album)}
                    className="font-bold text-lg text-rose-600 group-hover:text-pink-600 transition-colors cursor-pointer line-clamp-1"
                  >
                    {album.title}
                  </h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(album)}
                      aria-label="Sửa album"
                      className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(album)}
                      aria-label="Xóa album"
                      className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {album.description && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{album.description}</p>
                )}
                {(album.location_name || album.location_url) && (
                  <div className="mt-2">
                    <LocationBadge
                      locationName={album.location_name}
                      locationUrl={album.location_url}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3">📅 {formatDateVN(album.created_at)}</p>
              </div>
            </div>
          ))}
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
      />
    </div>
  );
}
