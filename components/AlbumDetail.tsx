'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { StickerItem } from './StickerOverlay';
import { ArrowLeft, Star, Pencil, Trash2, Check, X, Lock, Globe, Download, MoreHorizontal } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import { formatDateVN } from '@/lib/datetime';
import LocationPicker from './LocationPicker';
import LocationBadge from './LocationBadge';
import Image from 'next/image';

interface Album {
  id: number;
  title: string;
  description: string;
  visibility?: 'private' | 'public';
  location_name?: string | null;
  location_url?: string | null;
  cover_photo_id?: number | null;
  photo_count?: number;
}

interface Photo {
  id: number;
  image_url: string;
  caption: string;
  location_name?: string | null;
  location_url?: string | null;
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
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [locationUrls, setLocationUrls] = useState<Record<string, string>>({});

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [coverPhotoId, setCoverPhotoId] = useState<number | null>(album.cover_photo_id ?? null);
  const [photoStickers, setPhotoStickers] = useState<Map<number, StickerItem[]>>(new Map());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editLocationName, setEditLocationName] = useState('');
  const [editLocationUrl, setEditLocationUrl] = useState('');

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

        // Fetch stickers cho từng ảnh mới (fire-and-forget, không block UI)
        incoming.forEach((photo) => {
          fetch(`/api/albums/${album.id}/photos/${photo.id}/stickers`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
            .then((r) => r.json())
            .then((d) => {
              const list: StickerItem[] = d.stickers || [];
              if (list.length > 0) {
                setPhotoStickers((prev) => {
                  const next = new Map(prev);
                  next.set(photo.id, list);
                  return next;
                });
              }
            })
            .catch(() => {});
        });
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
    setCaptions((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setLocationNames((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setLocationUrls((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setCaptions({});
    setLocationNames({});
    setLocationUrls({});
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
        const locationName = locationNames[previews[i].id] || '';
        const locationUrl = locationUrls[previews[i].id] || '';
        const response = await fetch(`/api/albums/${album.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageUrl, caption, locationName, locationUrl }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.photo) {
            newPhotos.push({
              id: data.photo.id,
              image_url: imageUrl,
              caption,
              location_name: locationName || null,
              location_url: locationUrl || null,
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
    setEditLocationName(photo.location_name || '');
    setEditLocationUrl(photo.location_url || '');
  };

  const saveCaption = async (photoId: number) => {
    try {
      const response = await fetch(`/api/albums/${album.id}/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: editCaption, locationName: editLocationName, locationUrl: editLocationUrl }),
      });
      if (response.ok) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, caption: editCaption, location_name: editLocationName || null, location_url: editLocationUrl || null }
              : p
          )
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

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Lấy tên file từ URL, fallback về tên ảnh hoặc id
      const filename = photo.image_url.split('/').pop() || `photo-${photo.id}.jpg`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
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

  // Sticker decoration logic for photo cards
  const WASHI_TAPES = [
    '/assets-new-design/tape_washi_pink_solid.png',
    '/assets-new-design/tape_washi_pink_dotted.png',
    '/assets-new-design/tape_washi_pink_light.png',
    '/assets-new-design/tape_washi_blue.png',
  ];

  const CORNER_STICKERS = [
    { src: '/assets-new-design/heart_pink_solid_01.png', w: 44, h: 44 },
    { src: '/assets-new-design/heart_pink_solid_02.png', w: 45, h: 45 },
    { src: '/assets-new-design/flower_pink_medium.png', w: 46, h: 46 },
    { src: '/assets-new-design/bow_pink_small.png', w: 46, h: 34 },
    { src: '/assets-new-design/flower_pink_small.png', w: 44, h: 44 },
  ];

  const TAPE_CONFIGS = [
    { top: '-15px', left: '-24px', rotate: -35, width: 80, height: 14 },
    { top: '-15px', right: '-24px', rotate: 30, width: 80, height: 14 },
  ];

  const STICKER_CONFIGS = [
    { location: 'image' as const, rotate: 12 },
    { location: 'text' as const, rotate: -8 },
    { location: 'image' as const, rotate: 15 },
    { location: 'text' as const, rotate: -12 },
  ];

  function getCardDecoration(index: number) {
    const tapeConfig = TAPE_CONFIGS[index % 2];
    const stickerConfig = STICKER_CONFIGS[index % STICKER_CONFIGS.length];
    const tapeImage = WASHI_TAPES[index % WASHI_TAPES.length];
    const sticker = CORNER_STICKERS[index % CORNER_STICKERS.length];
    return { tapeConfig, stickerConfig, tapeImage, sticker };
  }

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
        {(album.location_name || album.location_url) && (
          <div className="mt-2">
            <LocationBadge locationName={album.location_name} locationUrl={album.location_url} />
          </div>
        )}
      </div>

      {/* Floating sticker button to add photos */}
      <button
        onClick={() => setShowAddPhoto(true)}
        aria-label="Thêm ảnh mới"
        title="Thêm ảnh mới"
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform select-none"
      >
        📷
      </button>

      {/* Add Photo Popup */}
      {showAddPhoto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white/98 backdrop-blur-sm rounded-t-3xl sm:rounded-2xl shadow-2xl border border-rose-100">
            {/* Popup header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-between px-6 py-4 border-b border-rose-100">
              <h3 className="text-lg font-bold text-rose-600 font-cute">
                Thêm Ảnh Mới
              </h3>
              <button
                onClick={() => { setShowAddPhoto(false); clearPreviews(); }}
                aria-label="Đóng"
                className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {previews.length > 0 && (
                <div className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
                  <h4 className="font-semibold text-rose-700 mb-4">Các ảnh đã chọn ({previews.length})</h4>

                  <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                    {previews.map((preview, idx) => (
                      <div key={preview.id} className="flex gap-3 bg-white rounded-lg p-3 border border-rose-100">
                        <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview.url || '/placeholder.svg'} alt={`Xem trước ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePreview(preview.id)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                            aria-label="Xóa ảnh"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">
                              Chú thích (có thể để trống)
                            </label>
                            <textarea
                              value={captions[preview.id] || ''}
                              onChange={(e) => setCaptions({ ...captions, [preview.id]: e.target.value })}
                              placeholder="Viết mô tả cho ảnh này..."
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-sm text-gray-700 resize-y min-h-[3rem]"
                              rows={2}
                            />
                          </div>
                          <LocationPicker
                            locationName={locationNames[preview.id] || ''}
                            locationUrl={locationUrls[preview.id] || ''}
                            onLocationNameChange={(v) => setLocationNames((prev) => ({ ...prev, [preview.id]: v }))}
                            onLocationUrlChange={(v) => setLocationUrls((prev) => ({ ...prev, [preview.id]: v }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {addingPhoto && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold text-rose-600 mb-1">
                        <span>Đang gửi ảnh vào nhà mình...</span>
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
                      onClick={async () => { await uploadPhotos(); setShowAddPhoto(false); }}
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
                className={`w-full px-6 py-8 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
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
                  Hỗ trợ: JPG, PNG, GIF, WebP (có thể chọn nhiều ảnh)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {photos.map((photo, idx) => {
              const decoration = getCardDecoration(idx);
              return (
                <div
                  key={photo.id}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible border border-pink-50 hover:-translate-y-1"
                >
                  {/* Washi tape - thinner, longer, extend ~40% outside */}
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
                    onClick={() => setViewerIndex(idx)}
                    className="h-36 sm:h-44 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center overflow-hidden relative cursor-pointer rounded-t-2xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image_url || '/placeholder.svg'}
                      alt={photo.caption || 'Ảnh'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Cover badge */}
                    {coverPhotoId === photo.id && (
                      <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-white bg-rose-500/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm z-10">
                        <Star size={10} className="fill-white" />
                        Ảnh bìa
                      </span>
                    )}
                    
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
                      <div className="flex-1 min-w-0">
                        {editingId === photo.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editCaption}
                              onChange={(e) => setEditCaption(e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1.5 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm text-gray-700 resize-y"
                              placeholder="Chú thích cho ảnh..."
                            />
                            <LocationPicker
                              locationName={editLocationName}
                              locationUrl={editLocationUrl}
                              onLocationNameChange={setEditLocationName}
                              onLocationUrlChange={setEditLocationUrl}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveCaption(photo.id)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                              >
                                <Check size={12} /> Lưu
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition-colors"
                              >
                                <X size={12} /> Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 min-h-[2.5rem]">
                              {photo.caption || <span className="text-gray-400 italic">Chưa có chú thích</span>}
                            </p>
                            {(photo.location_name || photo.location_url) && (
                              <div className="mt-1">
                                <LocationBadge
                                  locationName={photo.location_name}
                                  locationUrl={photo.location_url}
                                />
                              </div>
                            )}
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
                              📅 {formatDateVN(photo.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {/* Action menu */}
                      {editingId !== photo.id && (
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            id={`photo-menu-${photo.id}`}
                            className="peer hidden"
                          />
                          <label
                            htmlFor={`photo-menu-${photo.id}`}
                            className="grid place-items-center w-7 h-7 rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal size={16} />
                          </label>
                          <div className="hidden peer-checked:flex absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-pink-100 py-1 z-30 min-w-[120px]">
                            <button
                              onClick={() => { setAsCover(photo.id); (document.getElementById(`photo-menu-${photo.id}`) as HTMLInputElement).checked = false; }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-pink-50 hover:text-rose-500 w-full text-left"
                            >
                              <Star size={13} /> Ảnh bìa
                            </button>
                            <button
                              onClick={() => { downloadPhoto(photo); (document.getElementById(`photo-menu-${photo.id}`) as HTMLInputElement).checked = false; }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-500 w-full text-left"
                            >
                              <Download size={13} /> Tải về
                            </button>
                            <button
                              onClick={() => { startEdit(photo); (document.getElementById(`photo-menu-${photo.id}`) as HTMLInputElement).checked = false; }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-pink-50 hover:text-rose-500 w-full text-left"
                            >
                              <Pencil size={13} /> Sửa
                            </button>
                            <button
                              onClick={() => { deletePhoto(photo.id); (document.getElementById(`photo-menu-${photo.id}`) as HTMLInputElement).checked = false; }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-500 w-full text-left"
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Corner sticker in text area */}
                    {editingId !== photo.id && decoration.stickerConfig.location === 'text' && (
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
        <PhotoViewer
          photos={photos}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          albumId={album.id}
          token={token}
          onStickersSaved={(photoId, stickers) => {
            setPhotoStickers((prev) => {
              const next = new Map(prev);
              next.set(photoId, stickers);
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
