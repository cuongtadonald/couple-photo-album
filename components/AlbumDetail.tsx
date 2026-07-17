'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { ArrowLeft, Star, Pencil, Trash2, Check, X, Lock, Globe } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import { formatDateVN } from '@/lib/datetime';

interface Album {
  id: number;
  title: string;
  description: string;
  visibility?: 'private' | 'public';
  cover_photo_id?: number | null;
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

const PAGE_SIZE = 24;

export default function AlbumDetail({ album, token, onBack, onAlbumUpdate }: AlbumDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [addingPhoto, setAddingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [coverPhotoId, setCoverPhotoId] = useState<number | null>(album.cover_photo_id ?? null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  const fetchPhotos = useCallback(
    async (reset: boolean) => {
      const offset = reset ? 0 : offsetRef.current;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const response = await fetch(
          `/api/albums/${album.id}/photos?limit=${PAGE_SIZE}&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        const incoming: Photo[] = data.photos || [];
        setPhotos((prev) => (reset ? incoming : [...prev, ...incoming]));
        setTotal(data.total ?? incoming.length);
        setHasMore(Boolean(data.hasMore));
        offsetRef.current = offset + incoming.length;
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [album.id, token]
  );

  useEffect(() => {
    offsetRef.current = 0;
    fetchPhotos(true);
  }, [fetchPhotos]);

  // Dọn các object URL khi unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy load: tự tải thêm khi cuộn đến cuối danh sách
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPhotos(false);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPhotos]);

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

  // Upload files với thanh tiến trình thật (XHR)
  const uploadFilesWithProgress = (formData: FormData): Promise<{ urls: string[] }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Chừa 10% cuối cho bước lưu vào album
          setUploadProgress(Math.round((e.loaded / e.total) * 90));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Phản hồi không hợp lệ'));
          }
        } else {
          reject(new Error('Lỗi tải ảnh lên máy chủ'));
        }
      };
      xhr.onerror = () => reject(new Error('Lỗi kết nối'));
      xhr.send(formData);
    });
  };

  const uploadPhotos = async () => {
    if (previews.length === 0) return;
    try {
      setAddingPhoto(true);
      setUploadProgress(0);

      const formData = new FormData();
      previews.forEach((p) => formData.append('files', p.file));

      const { urls } = await uploadFilesWithProgress(formData);

      const newPhotos: Photo[] = [];
      for (let i = 0; i < previews.length; i++) {
        const imageUrl = urls[i];
        if (!imageUrl) continue;
        const caption = captions[previews[i].id] || '';
        const response = await fetch(`/api/albums/${album.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        setUploadProgress(90 + Math.round(((i + 1) / previews.length) * 10));
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...newPhotos, ...prev]);
        setTotal((t) => t + newPhotos.length);
        offsetRef.current += newPhotos.length;
        clearPreviews();
        onAlbumUpdate();
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert(error instanceof Error ? error.message : 'Lỗi tải ảnh');
    } finally {
      setAddingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) handleMultipleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMultipleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const startEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditCaption(photo.caption || '');
  };

  const saveCaption = async (photoId: number) => {
    try {
      const response = await fetch(`/api/albums/${album.id}/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: editCaption }),
      });
      if (response.ok) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, caption: editCaption } : p))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      const response = await fetch(`/api/albums/${album.id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setTotal((t) => Math.max(0, t - 1));
        offsetRef.current = Math.max(0, offsetRef.current - 1);
        if (coverPhotoId === photoId) setCoverPhotoId(null);
        onAlbumUpdate();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const setAsCover = async (photoId: number) => {
    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverPhotoId: photoId }),
      });
      if (response.ok) {
        setCoverPhotoId(photoId);
        onAlbumUpdate();
      }
    } catch (error) {
      console.error('Error setting cover:', error);
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
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold text-gray-900">{album.title}</h2>
          {album.visibility && (
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
              {album.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
              {album.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
            </span>
          )}
          <span className="text-sm text-gray-500">{total} ảnh</span>
        </div>
        {album.description && <p className="text-gray-600 mt-2">{album.description}</p>}
      </div>

      {/* Add Photo Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 border border-rose-100">
        <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center gap-2 font-cute">
          Thêm Ảnh Mới
        </h3>

        {previews.length > 0 && (
          <div className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
            <h4 className="font-semibold text-rose-700 mb-4">Các ảnh đã chọn ({previews.length})</h4>

            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {previews.map((preview, idx) => (
                <div key={preview.id} className="flex gap-3 bg-white rounded-lg p-3 border border-rose-100">
                  <div className="relative h-28 w-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url || '/placeholder.svg'} alt={`Xem trước ${idx + 1}`} className="w-full h-full object-cover" />
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
                      onChange={(e) => setCaptions({ ...captions, [preview.id]: e.target.value })}
                      placeholder="Viết mô tả cho ảnh này... có thể xuống dòng thoải mái."
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-sm text-gray-700 resize-y min-h-[5rem]"
                      rows={4}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Thanh tiến trình tải lên dễ thương */}
            {addingPhoto && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-rose-600 mb-1">
                  <span>💕 Đang gửi ảnh vào nhà mình...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

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

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`w-full px-6 py-8 mb-2 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
            dragActive ? 'border-rose-500 bg-rose-50' : 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
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
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border-2 border-dashed border-rose-200">
          <p className="text-gray-600 text-sm sm:text-base">Chưa có ảnh nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 sm:h-64 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image_url || '/placeholder.svg'}
                    alt={photo.caption || 'Ảnh'}
                    loading="lazy"
                    onClick={() => setViewerIndex(idx)}
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                  {coverPhotoId === photo.id && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold text-white bg-rose-500/90 px-2 py-1 rounded-full">
                      <Star size={12} className="fill-white" />
                      Ảnh bìa
                    </span>
                  )}
                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setAsCover(photo.id)}
                      aria-label="Đặt làm ảnh bìa"
                      title="Đặt làm ảnh bìa"
                      className="grid place-items-center w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-rose-500 shadow transition-colors"
                    >
                      <Star size={15} className={coverPhotoId === photo.id ? 'fill-rose-500 text-rose-500' : ''} />
                    </button>
                    <button
                      onClick={() => startEdit(photo)}
                      aria-label="Sửa chú thích"
                      title="Sửa chú thích"
                      className="grid place-items-center w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-rose-500 shadow transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      aria-label="Xóa ảnh"
                      title="Xóa ảnh"
                      className="grid place-items-center w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-red-500 shadow transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  {editingId === photo.id ? (
                    <div>
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-gray-700 resize-y"
                        placeholder="Chú thích cho ảnh..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveCaption(photo.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm transition-colors"
                        >
                          <Check size={15} /> Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                        >
                          <X size={15} /> Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {photo.caption ? (
                        <p className="text-gray-700 text-sm sm:text-base whitespace-pre-line">
                          {photo.caption}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Chưa có chú thích</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">{formatDateVN(photo.created_at)}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sentinel + trạng thái tải thêm (lazy load) */}
          <div ref={sentinelRef} className="h-10" />
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
            </div>
          )}
        </>
      )}

      {/* Fullscreen viewer */}
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
