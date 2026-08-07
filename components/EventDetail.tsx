'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, MapPin, Calendar as CalendarIcon, Pencil, Trash2, Lock, Globe, ExternalLink, Download, Eye, X } from 'lucide-react';
import LocationBadge from './LocationBadge';
import { parseDate, formatDateVN, formatTimeVN } from '@/lib/datetime';
import Image from 'next/image';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [token, event.id]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      await uploadAttachment(file, fileType, file.name);
    }
  };

  const uploadAttachment = async (file: Blob, fileType: string, fileName: string) => {
    setUploading(true);
    try {
      // Upload file first
      const formData = new FormData();
      formData.append('files', file, fileName);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      
      if (uploadData.urls && uploadData.urls.length > 0) {
        // Then create attachment record
        const response = await fetch(`/api/events/${event.id}/attachments`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            fileUrl: uploadData.urls[0],
            fileName: fileName,
            fileType: fileType,
          }),
        });
        const data = await response.json();
        if (data.attachment) {
          setAttachments([...attachments, data.attachment]);
        }
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
    } finally {
      setUploading(false);
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
        {/* Washi tape decorations on cover */}
        {event.cover_image_url && (
          <>
            <div className="absolute top-4 left-4 z-30 pointer-events-none" style={{ transform: 'rotate(-25deg)' }}>
              <Image src={WASHI_TAPES[0]} alt="" width={80} height={14} className="opacity-85" />
            </div>
            <div className="absolute top-4 right-4 z-30 pointer-events-none" style={{ transform: 'rotate(20deg)' }}>
              <Image src={WASHI_TAPES[1]} alt="" width={80} height={14} className="opacity-85" />
            </div>
          </>
        )}

        {/* Cover Image */}
        {event.cover_image_url && (
          <div className="relative w-full h-64 bg-gradient-to-br from-rose-100 to-pink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        
        <div className="p-8 relative">
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
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent font-[family-name:var(--font-corinthia)]">
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
              <div className="relative bg-rose-50/50 rounded-2xl p-5 mb-6 border-2 border-rose-100">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-corinthia)]">
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
                  <span className="text-gray-900 font-medium">
                    {formatDateVN(event.event_date, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-rose-600 font-semibold ml-2">
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
                        className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 hover:underline font-medium transition-colors"
                      >
                        <span>{event.location || 'Xem bản đồ'}</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-gray-600 font-medium">{event.location}</span>
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
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border-2 border-rose-100 hover:border-rose-300 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="grid place-items-center w-10 h-10 rounded-full bg-white shadow-sm shrink-0">
                      {attachment.file_type === 'image' ? (
                        <span className="text-xl">🖼️</span>
                      ) : attachment.file_type === 'video' ? (
                        <span className="text-xl">🎥</span>
                      ) : (
                        <span className="text-xl">📄</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-medium truncate">{attachment.file_name}</span>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => attachment.file_type === 'image' ? setPreviewImage(attachment.file_url) : window.open(attachment.file_url, '_blank')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
                    >
                      <Eye size={14} />
                      Xem
                    </button>
                    <a
                      href={attachment.file_url}
                      download
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
                    >
                      <Download size={14} />
                      Tải
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="relative z-10 border-t-2 border-rose-100 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Thêm Tệp Đính Kèm
          </h3>
          <label className="cursor-pointer">
            <div className="flex items-center justify-center gap-3 px-6 py-8 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-2 border-dashed border-rose-300 rounded-2xl transition-all hover:border-rose-400 hover:shadow-md">
              <Upload size={24} className="text-rose-500" />
              <span className="text-rose-600 font-semibold">Tải Lên Tệp</span>
            </div>
            <input
              type="file"
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-rose-300 transition-colors"
            >
              <X size={32} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
