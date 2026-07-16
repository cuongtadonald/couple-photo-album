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
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<Array<{ base64: string; name: string }>>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleMultipleFiles = async (files: FileList) => {
    try {
      const newPreviews: Array<{ base64: string; name: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await convertFileToBase64(file);
          newPreviews.push({ base64, name: file.name });
        }
      }
      setPreviews([...previews, ...newPreviews]);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Lỗi xử lý ảnh');
    }
  };

  const uploadPhotos = async () => {
    try {
      setAddingPhoto(true);
      let uploadedCount = 0;
      const newPhotos: Photo[] = [];

      for (const preview of previews) {
        const caption = captions[preview.name] || '';
        const response = await fetch(`/api/albums/${album.id}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            imageUrl: preview.base64, 
            caption: caption 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.photo) {
            newPhotos.push(data.photo);
            uploadedCount++;
          }
        }
      }

      if (uploadedCount > 0) {
        setPhotos([...newPhotos, ...photos]);
        setPreviews([]);
        setCaptions({});
        onAlbumUpdate();
      }

      if (uploadedCount < previews.length) {
        alert(`Đã tải ${uploadedCount}/${previews.length} ảnh. Vui lòng thử lại.`);
      } else if (uploadedCount > 0) {
        alert(`Đã tải thành công ${uploadedCount} ảnh!`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Lỗi tải ảnh');
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
    
    if (e.dataTransfer.files) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMultipleFiles(e.target.files);
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

        {/* Preview Section - Multiple Images */}
        {previews.length > 0 && (
          <div className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
            <h4 className="font-semibold text-rose-700 mb-4">Các ảnh đã chọn ({previews.length})</h4>
            
            {/* Scrollable preview grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-h-80 overflow-y-auto">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={preview.base64} 
                      alt={`Preview ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPreviews = previews.filter((_, i) => i !== idx);
                      setPreviews(newPreviews);
                      const newCaptions = { ...captions };
                      delete newCaptions[preview.name];
                      setCaptions(newCaptions);
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Captions Section */}
            <div className="mb-4 max-h-48 overflow-y-auto space-y-3">
              {previews.map((preview, idx) => (
                <div key={idx}>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Chú thích ảnh {idx + 1}: {preview.name}
                  </label>
                  <textarea
                    value={captions[preview.name] || ''}
                    onChange={(e) => setCaptions({ ...captions, [preview.name]: e.target.value })}
                    placeholder="Mô tả ảnh này (có thể để trống)..."
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-sm text-gray-700 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviews([]);
                  setCaptions({});
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-cute text-sm transition-colors"
              >
                ✕ Hủy Tất Cả
              </button>
              <button
                type="button"
                onClick={uploadPhotos}
                disabled={addingPhoto || previews.length === 0}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg font-cute text-sm transition-colors"
              >
                {addingPhoto ? '⏳ Đang tải...' : `✨ Thêm ${previews.length} Ảnh`}
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
          className={`w-full px-6 py-8 mb-4 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
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
          <div className="text-4xl mb-2">📸</div>
          <p className="text-gray-700 font-semibold mb-1 font-cute">Kéo thả ảnh vào đây hoặc nhấp để chọn</p>
          <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG, GIF, WebP (có thể chọn nhiều ảnh cùng lúc)</p>
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
                  src={photo.image_url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              {photo.caption && (
                <div className="p-3 sm:p-4">
                  <p className="text-gray-700 text-sm sm:text-base">{photo.caption}</p>
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
