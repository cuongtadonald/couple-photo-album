'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, MapPin, Calendar as CalendarIcon, Pencil, Trash2, Lock, Globe, ExternalLink } from 'lucide-react';
import LocationBadge from './LocationBadge';
import { parseDate, formatDateVN, formatTimeVN } from '@/lib/datetime';

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

export default function EventDetail({ event, token, onBack, onEdit, onDelete }: EventDetailProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [token, event.id]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/attachments?eventId=${event.id}`, {
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
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('eventId', event.id.toString());
      formData.append('fileType', fileType);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.attachment) {
        setAttachments([...attachments, data.attachment]);
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
    } finally {
      setUploading(false);
    }
  };

  const eventDateTime = parseDate(event.event_date);
  const isUpcoming = eventDateTime ? eventDateTime > new Date() : false;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6"
      >
        <ArrowLeft size={20} />
        Quay Lại
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
                {event.visibility && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                    {event.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                    {event.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                  </span>
                )}
              </div>
              {!isUpcoming && <p className="text-gray-500 text-sm mt-1">Sự kiện đã qua</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Sửa sự kiện"
                  className="grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Pencil size={18} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Xóa sự kiện"
                  className="grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-gray-700 text-lg leading-relaxed mb-6">{event.description}</p>
          )}

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-rose-600" />
              <span className="text-gray-900">
                {formatDateVN(event.event_date, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                lúc {formatTimeVN(event.event_date)}
              </span>
            </div>
            {(event.location || event.location_url) && (
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-rose-600 shrink-0" />
                {event.location_url ? (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:underline font-medium"
                  >
                    <span>{event.location || 'Xem bản đồ'}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-900">{event.location}</span>
                )}
              </div>
            )}
            <p className="text-xs text-gray-600 pt-2">
              Được tạo bởi: {event.created_by_name} vào {formatDateVN(event.created_at)}
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tệp Đính Kèm</h2>

          {loading ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : attachments.length === 0 ? (
            <p className="text-gray-600">Chưa có tệp đính kèm</p>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-700">{attachment.file_name}</span>
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                  >
                    Xem
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm Tệp Đính Kèm</h3>
          <label>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Tải Lên Tệp
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploading && <p className="text-sm text-gray-600 mt-2">Đang tải...</p>}
        </div>
      </div>
    </div>
  );
}
