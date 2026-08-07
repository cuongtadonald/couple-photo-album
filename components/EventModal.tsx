'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, Globe, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { parseDate } from '@/lib/datetime';
import LocationPicker from './LocationPicker';
import { clearSessionKey } from '@/lib/use-session-state';
import { uploadFilesWithProgress } from '@/lib/upload';

type Visibility = 'private' | 'public';

interface Attachment {
  id?: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

interface EventInitial {
  title: string;
  description: string;
  event_date: string;
  location: string;
  location_url?: string;
  visibility: Visibility;
  cover_image_url?: string | null;
  attachments?: Attachment[];
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    eventDate: string,
    location: string,
    visibility: Visibility,
    locationUrl: string,
    coverImageUrl: string | null,
    attachments: Attachment[]
  ) => Promise<void> | void;
  initial?: EventInitial | null;
  /** sessionStorage prefix used to persist create-mode draft (e.g. "events:draft") */
  draftKey?: string;
  /** Token for file upload authentication */
  token?: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readDraft(key: string, field: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  try { return sessionStorage.getItem(`${key}:${field}`) ?? fallback; } catch { return fallback; }
}

function saveDraft(key: string, field: string, value: string) {
  try { sessionStorage.setItem(`${key}:${field}`, value); } catch { /* ignore */ }
}

export default function EventModal({ isOpen, onClose, onSubmit, initial, draftKey, token }: EventModalProps) {
  const isEdit = !!initial;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      // Edit mode — always use server values
      setTitle(initial.title);
      setDescription(initial.description || '');
      setLocation(initial.location || '');
      setLocationUrl(initial.location_url || '');
      setVisibility(initial.visibility);
      setCoverImage(initial.cover_image_url || null);
      setAttachments(initial.attachments || []);
      const d = parseDate(initial.event_date);
      if (d) {
        setEventDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setEventTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } else {
        setEventDate('');
        setEventTime('');
      }
    } else if (draftKey) {
      // Create mode — restore draft
      setTitle(readDraft(draftKey, 'title'));
      setDescription(readDraft(draftKey, 'desc'));
      setEventDate(readDraft(draftKey, 'date'));
      setEventTime(readDraft(draftKey, 'time'));
      setLocation(readDraft(draftKey, 'location'));
      setLocationUrl(readDraft(draftKey, 'locationUrl'));
      setVisibility((readDraft(draftKey, 'visibility', 'private') as Visibility) || 'private');
      setCoverImage(readDraft(draftKey, 'coverImage') || null);
    } else {
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setLocation('');
      setLocationUrl('');
      setVisibility('private');
      setCoverImage(null);
      setAttachments([]);
    }
  }, [isOpen, initial, draftKey]);

  // Persist draft live (create mode only)
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'title', title); }, [title, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'desc', description); }, [description, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'date', eventDate); }, [eventDate, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'time', eventTime); }, [eventTime, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'location', location); }, [location, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'locationUrl', locationUrl); }, [locationUrl, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'visibility', visibility); }, [visibility, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'coverImage', coverImage || ''); }, [coverImage, isOpen, isEdit, draftKey]);

  const clearDraft = () => {
    if (!draftKey) return;
    ['title', 'desc', 'date', 'time', 'location', 'locationUrl', 'visibility', 'coverImage'].forEach((f) =>
      clearSessionKey(`${draftKey}:${f}`)
    );
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const { urls } = await uploadFilesWithProgress(formData, token);
      if (urls.length > 0) {
        setCoverImage(urls[0]);
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Không thể tải ảnh bìa lên');
    } finally {
      setUploading(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleAttachmentsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const { urls } = await uploadFilesWithProgress(formData, token);
      
      const newAttachments: Attachment[] = urls.map((url, idx) => ({
        fileUrl: url,
        fileName: files[idx].name,
        fileType: files[idx].type.startsWith('image/') ? 'image' : files[idx].type.startsWith('video/') ? 'video' : 'other',
      }));
      
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      alert('Không thể tải tệp đính kèm lên');
    } finally {
      setUploading(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) {
      alert('Vui lòng chọn ngày sự kiện');
      return;
    }
    if (!initial) {
      const chosen = new Date(`${eventDate}T${eventTime || '00:00'}`);
      if (chosen < new Date()) {
        alert('Ngày sự kiện không được nhỏ hơn ngày hiện tại.');
        return;
      }
    }
    setLoading(true);
    try {
      const time = eventTime || '00:00';
      const fullDateTime = `${eventDate}T${time}`;
      await onSubmit(title, description, fullDateTime, location, visibility, locationUrl, coverImage, attachments);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Do NOT clear draft on close — preserve for post-reload restore
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-rose-100">
        <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-sm border-b border-rose-100 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent font-cute">
            {isEdit ? 'Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-rose-500 transition-colors" aria-label="Đóng">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Tên Sự Kiện</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Ví dụ: Sinh nhật em"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Mô Tả (Tùy Chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Mô tả chi tiết sự kiện..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Ngày</label>
              <input
                type="date"
                value={eventDate}
                min={!initial ? todayStr() : undefined}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Giờ (Tùy)</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              />
            </div>
          </div>

          <LocationPicker
            locationName={location}
            locationUrl={locationUrl}
            onLocationNameChange={setLocation}
            onLocationUrlChange={setLocationUrl}
          />

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Ảnh Bìa (Tùy Chọn)</label>
            <div className="space-y-2">
              {coverImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border-2 border-rose-200" />
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-8 border-2 border-dashed border-rose-200 rounded-lg hover:border-rose-400 transition-colors flex flex-col items-center gap-2 text-rose-500 disabled:opacity-50"
                >
                  <ImageIcon size={32} />
                  <span className="text-sm font-cute">{uploading ? 'Đang tải...' : 'Chọn ảnh bìa'}</span>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Attachments Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Tệp Đính Kèm (Tùy Chọn)</label>
            <div className="space-y-2">
              {attachments.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
                      <span className="flex-1 text-sm text-gray-700 truncate">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-3 border-2 border-dashed border-rose-200 rounded-lg hover:border-rose-400 transition-colors flex items-center justify-center gap-2 text-rose-500 disabled:opacity-50"
              >
                <Upload size={20} />
                <span className="text-sm font-cute">{uploading ? 'Đang tải...' : 'Thêm tệp đính kèm'}</span>
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                onChange={handleAttachmentsUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Chế Độ Hiển Thị</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 justify-center px-4 py-3 rounded-cute border-2 text-sm font-semibold transition-all ${
                  visibility === 'private'
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-500 hover:border-rose-200'
                }`}
              >
                <Lock size={16} />
                Riêng tư
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 justify-center px-4 py-3 rounded-cute border-2 text-sm font-semibold transition-all ${
                  visibility === 'public'
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-500 hover:border-rose-200'
                }`}
              >
                <Globe size={16} />
                Công khai
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-cute"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-cute shadow-lg"
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
