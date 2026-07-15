'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setAddingPhoto(true);
      const base64 = await convertFileToBase64(file);

      const response = await fetch(`/api/albums/${album.id}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: base64,
          caption: file.name || 'Photo'
        }),
      });
      const data = await response.json();
      if (data.photo) {
        setPhotos([data.photo, ...photos]);
        onAlbumUpdate();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Lỗi upload ảnh');
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 border border-rose-100">
        <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center gap-2 font-cute">
          📷 Thêm Ảnh Mới
        </h3>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`w-full px-6 py-8 mb-4 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${dragActive
            ? 'border-rose-500 bg-rose-50'
            : 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
            }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="text-4xl mb-2">📸</div>
          <p className="text-gray-700 font-semibold mb-1 font-cute">Kéo thả ảnh vào đây hoặc nhấp để chọn</p>
          <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG, GIF, WebP</p>
        </div>

        {/* Or separator */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-500 text-sm">hoặc</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* URL Form */}
        <form onSubmit={handleAddPhoto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Link Ảnh từ URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Chú Thích (Tùy Chọn)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Viết ghi chú cho ảnh..."
            />
          </div>

          <Button
            type="submit"
            disabled={addingPhoto || !imageUrl}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-cute shadow-lg"
          >
            {addingPhoto ? '⏳ Đang tải...' : '✨ Thêm Ảnh'}
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
