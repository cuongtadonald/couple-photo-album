'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Image from 'next/image';

interface Album {
  id: number;
  title: string;
  description: string;
  photo_count?: number;
}

interface Photo {
  id: number;
  image_url: string;
  caption: string;
  created_at: string;
}

interface AlbumDetailProps {
  album: Album;
  token: string | null;
  onBack: () => void;
  onAlbumUpdate: () => void;
}

export default function AlbumDetail({ album, token, onBack, onAlbumUpdate }: AlbumDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [token, album.id]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/albums/${album.id}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPhoto(true);
    try {
      const response = await fetch(`/api/albums/${album.id}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl, caption }),
      });
      const data = await response.json();
      if (data.photo) {
        setPhotos([data.photo, ...photos]);
        setImageUrl('');
        setCaption('');
        onAlbumUpdate();
      }
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setAddingPhoto(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6"
      >
        <ArrowLeft size={20} />
        Quay Lại
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{album.title}</h2>
        {album.description && (
          <p className="text-gray-600 mt-2">{album.description}</p>
        )}
      </div>

      {/* Add Photo Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={20} /> Thêm Ảnh Mới
        </h3>
        <form onSubmit={handleAddPhoto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Ảnh
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="https://example.com/photo.jpg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chú Thích (Tùy Chọn)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Viết ghi chú cho ảnh..."
            />
          </div>

          <Button
            type="submit"
            disabled={addingPhoto}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {addingPhoto ? 'Đang tải...' : 'Thêm Ảnh'}
          </Button>
        </form>
      </div>

      {/* Photos Gallery */}
      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-rose-200">
          <p className="text-gray-600">Chưa có ảnh nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-64 bg-gray-100">
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              {photo.caption && (
                <div className="p-4">
                  <p className="text-gray-700">{photo.caption}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(photo.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
