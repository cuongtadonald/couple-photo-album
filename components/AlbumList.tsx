'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AlbumModal from './AlbumModal';
import AlbumDetail from './AlbumDetail';
import { Plus } from 'lucide-react';

interface Album {
  id: number;
  title: string;
  description: string;
  photo_count: number;
  created_at: string;
}

export default function AlbumList({ token }: { token: string | null }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    fetchAlbums();
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

  const handleCreateAlbum = async (title: string, description: string) => {
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      if (data.album) {
        setAlbums([...albums, data.album]);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating album:', error);
    }
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          📷 Ảnh Kỷ Niệm
        </h2>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Tạo Album Mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
          <div className="text-6xl mb-4">🎞️</div>
          <p className="text-gray-600 mb-6 text-lg">Chưa có album nào</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Tạo Album Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album, idx) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbum(album)}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105 hover:-translate-y-1 border border-rose-100"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="h-48 bg-gradient-to-br from-rose-200 via-pink-100 to-rose-100 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center relative z-10">
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300">📷</div>
                  <p className="text-sm font-semibold text-rose-700 mt-3 bg-white/70 px-3 py-1 rounded-full inline-block">
                    {album.photo_count} ✨ ảnh
                  </p>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-rose-600 group-hover:text-pink-600 transition-colors">
                  {album.title}
                </h3>
                {album.description && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {album.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  📅 {new Date(album.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlbumModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateAlbum}
      />
    </div>
  );
}
