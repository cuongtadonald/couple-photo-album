'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import PhotoViewer from '@/components/PhotoViewer';

interface Photo {
  id: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

interface Album {
  id: number;
  title: string;
  description: string;
  photos: Photo[];
}

export default function SharedAlbumPage() {
  const params = useParams();
  const token = params.token as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {album.photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                onClick={() => setViewerIndex(idx)}
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || `Ảnh ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
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
        <p>Liên kết này sẽ hết hạn sau 72 giờ</p>
      </div>
    </div>
  );
}
