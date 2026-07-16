'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { ArrowLeft } from 'lucide-react';

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

interface PreviewItem {
  id: string;
  file: File;
  url: string;
  name: string;
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
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, album.id]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleMultipleFiles = (files: FileList) => {
    const newPreviews: PreviewItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newPreviews.push({
          id: `${Date.now()}-${i}-${file.name}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
        });
      }
    }
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (id: string) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
    setCaptions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setCaptions({});
  };

  const uploadPhotos = async () => {
    if (previews.length === 0) return;
    try {
      setAddingPhoto(true);

      // 1) Upload all files to /public/uploads and get back their paths
      const formData = new FormData();
      previews.forEach((p) => formData.append('files', p.file));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        alert('Lỗi tải ảnh lên máy chủ');
        return;
      }

      const { urls } = await uploadRes.json();

      // 2) Save each photo path + caption into the album
      const newPhotos: Photo[] = [];
      for (let i = 0; i < previews.length; i++) {
        const imageUrl = urls[i];
        if (!imageUrl) continue;
        const caption = captions[previews[i].id] || '';

        const response = await fetch(`/api/albums/${album.id}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageUrl, caption }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.photo) {
            newPhotos.push({
              id: data.photo.id,
              image_url: imageUrl,
              caption,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...newPhotos, ...prev]);
        clearPreviews();
        onAlbumUpdate();
        alert(`Đã thêm thành công ${newPhotos.length} ảnh!`);
      } else {
        alert('Không lưu được ảnh. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Lỗi tải ảnh');
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMultipleFiles(e.target.files);
      e.target.value = '';
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
          Thêm Ảnh Mới
        </h3>

        {/* Preview Section - Multiple Images */}
        {previews.length > 0 && (
          <div className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
            <h4 className="font-semibold text-rose-700 mb-4">
              Các ảnh đã chọn ({previews.length})
            </h4>

            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {previews.map((preview, idx) => (
                <div
                  key={preview.id}
                  className="flex gap-3 bg-white rounded-lg p-3 border border-rose-100"
                >
                  <div className="relative h-28 w-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={preview.url || '/placeholder.svg'}
                      alt={`Xem trước ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(preview.id)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                      aria-label="Xóa ảnh"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      Chú thích (có thể để trống)
                    </label>
                    <textarea
                      value={captions[preview.id] || ''}
                      onChange={(e) =>
                        setCaptions({ ...captions, [preview.id]: e.target.value })
                      }
                      placeholder="Viết mô tả cho ảnh này... có thể xuống dòng thoải mái."
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-sm text-gray-700 resize-y min-h-[5rem]"
                      rows={4}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={clearPreviews}
                disabled={addingPhoto}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-lg font-cute text-sm transition-colors"
              >
                Hủy Tất Cả
              </button>
              <button
                type="button"
                onClick={uploadPhotos}
                disabled={addingPhoto || previews.length === 0}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg font-cute text-sm transition-colors"
              >
                {addingPhoto ? 'Đang tải...' : `Thêm ${previews.length} Ảnh`}
              </button>
            </div>
          </div>
        )}

        {/* Drag & Drop Area - Multiple Files Support */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`w-full px-6 py-8 mb-2 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-rose-500 bg-rose-50'
              : 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <p className="text-gray-700 font-semibold mb-1 font-cute">
            Kéo thả ảnh vào đây hoặc nhấp để chọn
          </p>
          <p className="text-sm text-gray-500">
            Hỗ trợ: JPG, PNG, GIF, WebP (có thể chọn nhiều ảnh cùng lúc)
          </p>
        </div>
      </div>

      {/* Photos Gallery */}
      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border-2 border-dashed border-rose-200">
          <p className="text-gray-600 text-sm sm:text-base">Chưa có ảnh nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48 sm:h-64 bg-gray-100">
                <img
                  src={photo.image_url || '/placeholder.svg'}
                  alt={photo.caption || 'Ảnh'}
                  className="w-full h-full object-cover"
                />
              </div>
              {photo.caption && (
                <div className="p-3 sm:p-4">
                  <p className="text-gray-700 text-sm sm:text-base whitespace-pre-line">
                    {photo.caption}
                  </p>
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
