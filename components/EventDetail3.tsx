'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Upload, MapPin, Calendar as CalendarIcon, Pencil, Trash2, Lock, Globe, ExternalLink } from 'lucide-react';
import LocationBadge from './LocationBadge';
import { parseDate, formatDateVN, formatTimeVN } from '@/lib/datetime';
import Image from 'next/image';
import AttachmentGrid from './AttachmentGrid';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  location_url?: string;
  visibility?: 'private' | 'public';
  created_by_name: string;
  created_at: string;
  cover_image_url?: string | null;
}

interface Attachment {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
}

interface EventDetailProps {
  event: Event;
  token: string | null;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Sticker decorations
const STICKERS = [
  { src: '/assets-new-design/heart_pink_solid_01.png', w: 40, h: 40 },
  { src: '/assets-new-design/heart_pink_solid_02.png', w: 35, h: 35 },
  { src: '/assets-new-design/flower_pink_medium.png', w: 45, h: 45 },
  { src: '/assets-new-design/flower_pink_small.png', w: 38, h: 38 },
  { src: '/assets-new-design/bow_pink_small.png', w: 42, h: 30 },
];

const WASHI_TAPES = [
  '/assets-new-design/tape_washi_pink_solid.png',
  '/assets-new-design/tape_washi_pink_dotted.png',
  '/assets-new-design/tape_washi_pink_light.png',
  '/assets-new-design/tape_washi_blue.png',
];

export default function EventDetail({ event, token, onBack, onEdit, onDelete }: EventDetailProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, token]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Fetch attachments failed:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tệp đính kèm này?')) return;

    try {
      const response = await fetch(`/api/events/${event.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      } else {
        alert('Không thể xóa tệp đính kèm');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Lỗi khi xóa tệp đính kèm');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Upload files to storage
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const urls: string[] = uploadData.urls || [];

      if (urls.length === 0) {
        throw new Error('Upload returned no URLs');
      }

      // Step 2: Create attachment records for each uploaded file
      for (let i = 0; i < urls.length; i++) {
        const fileUrl = urls[i];
        const file = files[i];
        if (!file) break;

        const fileType = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'document';

        const response = await fetch(`/api/events/${event.id}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileUrl,
            fileName: file.name,
            fileType,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('Create attachment record failed:', errData);
          continue;
        }

        const data = await response.json();
        if (data.attachment) {
          setAttachments((prev) => [...prev, data.attachment]);
        }
      }
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      setUploadError(error.message || 'Lỗi khi tải lên tệp đính kèm. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const eventDateTime = parseDate(event.event_date);
  const isUpcoming = eventDateTime ? eventDateTime > new Date() : false;

  // Random stickers for decoration
  const randomStickers = Array.from({ length: 6 }, (_, i) => ({
    ...STICKERS[i % STICKERS.length],
    top: `${10 + Math.random() * 80}%`,
    left: `${5 + Math.random() * 90}%`,
    rotate: Math.random() * 30 - 15,
    opacity: 0.3 + Math.random() * 0.3,
  }));

  return (
    <div className="relative">
      {/* Floating decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <Image src="/assets-new-design/heart_pink_solid_01.png" alt="" width={30} height={30} className="absolute top-[10%] right-[10%] animate-float opacity-40" />
        <Image src="/assets-new-design/heart_pink_solid_02.png" alt="" width={24} height={24} className="absolute top-[30%] left-[5%] animate-float opacity-30" style={{ animationDelay: '1s' }} />
        <Image src="/assets-new-design/flower_pink_small.png" alt="" width={28} height={28} className="absolute top-[50%] right-[15%] animate-float opacity-35" style={{ animationDelay: '2s' }} />
        <Image src="/assets-new-design/flower_cherry_tiny_01.png" alt="" width={20} height={20} className="absolute top-[70%] left-[20%] animate-float opacity-30" style={{ animationDelay: '1.5s' }} />
      </div>

      <button
        onClick={onBack}
        className="relative z-10 flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Quay Lại
      </button>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-3xl overflow-hidden border-4 border-rose-100">
        {/* Cover Image - Always at top */}
        {event.cover_image_url && (
          <>
            <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-rose-100 to-pink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {/* Washi tape decorations */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none" style={{ transform: 'rotate(-25deg)' }}>
                <Image src={WASHI_TAPES[0]} alt="" width={80} height={14} className="opacity-85" />
              </div>
              <div className="absolute top-4 right-4 z-30 pointer-events-none" style={{ transform: 'rotate(20deg)' }}>
                <Image src={WASHI_TAPES[1]} alt="" width={80} height={14} className="opacity-85" />
              </div>
            </div>
          </>
        )}

        <div className="p-6 sm:p-8 relative">
          {/* Decorative stickers */}
          {randomStickers.map((sticker, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none"
              style={{
                top: sticker.top,
                left: sticker.left,
                transform: `rotate(${sticker.rotate}deg)`,
                opacity: sticker.opacity,
              }}
            >
              <Image src={sticker.src} alt="" width={sticker.w} height={sticker.h} />
            </div>
          ))}

          <div className="relative z-10 mb-8">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent font-[family-name:var(--font-corinthia)]">
                    {event.title}
                  </h1>
                  {event.visibility && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      {event.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                      {event.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                    </span>
                  )}
                </div>
                {!isUpcoming && (
                  <p className="text-gray-500 text-sm italic flex items-center gap-1">
                    <span>✨</span> Sự kiện đã qua
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    aria-label="Sửa sự kiện"
                    className="grid place-items-center w-10 h-10 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all hover:scale-110"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    aria-label="Xóa sự kiện"
                    className="grid place-items-center w-10 h-10 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {event.description && (
              <div className="relative bg-rose-50/50 rounded-2xl p-5 sm:p-6 mb-6 border-2 border-rose-100">
                <p className="text-gray-700 text-lg sm:text-xl leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-corinthia)]">
                  {event.description}
                </p>
                {/* Corner sticker */}
                <div className="absolute -top-3 -right-3 pointer-events-none">
                  <Image src="/assets-new-design/bow_pink_small.png" alt="" width={40} height={28} style={{ transform: 'rotate(15deg)' }} />
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center w-10 h-10 rounded-full bg-white shadow-sm">
                  <CalendarIcon size={20} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">Thời gian</p>
                  <span className="text-gray-900 font-medium text-sm sm:text-base">
                    {formatDateVN(event.event_date, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-rose-600 font-semibold ml-2 text-sm sm:text-base">
                    lúc {formatTimeVN(event.event_date)}
                  </span>
                </div>
              </div>

              {(event.location || event.location_url) && (
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-white shadow-sm">
                    <MapPin size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Địa điểm</p>
                    {event.location_url ? (
                      <a
                        href={event.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 hover:underline font-medium transition-colors text-sm sm:text-base"
                      >
                        <span>{event.location || 'Xem bản đồ'}</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-gray-600 font-medium text-sm sm:text-base">{event.location}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-rose-200">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Được tạo bởi:</span> {event.created_by_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  vào {formatDateVN(event.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="relative z-10 border-t-2 border-rose-100 pt-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📎</span>
              Tệp Đính Kèm
              {attachments.length > 0 && (
                <span className="text-sm font-normal text-gray-500">({attachments.length})</span>
              )}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 bg-rose-50/50 rounded-2xl border-2 border-dashed border-rose-200">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 italic">Chưa có tệp đính kèm</p>
              </div>
            ) : (
              <AttachmentGrid
                attachments={attachments}
                onDelete={handleDeleteAttachment}
                showDelete={true}
              />
            )}
          </div>

          {/* Upload Section */}
          <div className="relative z-10 border-t-2 border-rose-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Thêm Tệp Đính Kèm
            </h3>
            <label className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-2 border-dashed border-rose-300 rounded-2xl transition-all hover:border-rose-400 hover:shadow-md">
                <Upload size={32} className="text-rose-500" />
                <div className="text-center">
                  <span className="text-rose-600 font-semibold block">Tải Lên Tệp</span>
                  <span className="text-xs text-gray-500 mt-1 block">
                    Chọn một hoặc nhiều tệp: Ảnh (JPG, PNG, GIF), Video (MP4, MOV), PDF, Word...
                  </span>
                </div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploading && (
              <div className="flex items-center justify-center gap-2 mt-3 text-rose-600">
                <div className="w-4 h-4 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Đang tải...</span>
              </div>
            )}
            {uploadError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer decoration */}
      <div className="flex justify-center mt-6 pointer-events-none">
        <Image
          src="/assets-new-design/footer_bear_love_forever.png"
          alt="Love bear"
          width={180}
          height={150}
          className="object-contain opacity-80"
        />
      </div>
    </div>
  );
}
