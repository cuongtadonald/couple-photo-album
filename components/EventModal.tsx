'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, Globe } from 'lucide-react';
import { parseDate } from '@/lib/datetime';
import LocationPicker from './LocationPicker';

type Visibility = 'private' | 'public';

interface EventInitial {
  title: string;
  description: string;
  event_date: string;
  location: string;
  location_url?: string;
  visibility: Visibility;
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
    locationUrl: string
  ) => Promise<void> | void;
  initial?: EventInitial | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function EventModal({ isOpen, onClose, onSubmit, initial }: EventModalProps) {
  const isEdit = !!initial;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description || '');
      setLocation(initial.location || '');
      setLocationUrl(initial.location_url || '');
      setVisibility(initial.visibility);
      const d = parseDate(initial.event_date);
      if (d) {
        setEventDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setEventTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } else {
        setEventDate('');
        setEventTime('');
      }
    } else {
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setLocation('');
      setLocationUrl('');
      setVisibility('private');
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) {
      alert('Vui lòng chọn ngày sự kiện');
      return;
    }
    setLoading(true);
    try {
      const time = eventTime || '00:00';
      const fullDateTime = `${eventDate}T${time}`;
      await onSubmit(title, description, fullDateTime, location, visibility, locationUrl);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-rose-100">
        <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-sm border-b border-rose-100 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent font-cute">
            {isEdit ? '✏️ Sửa Sự Kiện' : '🎉 Tạo Sự Kiện Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-rose-500 transition-colors" aria-label="Đóng">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">🎪 Tên Sự Kiện</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">📝 Mô Tả (Tùy Chọn)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">📅 Ngày</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">🕐 Giờ (Tùy)</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              />
            </div>
          </div>

          {/* Location picker */}
          <LocationPicker
            locationName={location}
            locationUrl={locationUrl}
            onLocationNameChange={setLocation}
            onLocationUrlChange={setLocationUrl}
          />

          {/* Chế độ hiển thị */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">🔐 Chế Độ Hiển Thị</label>
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
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-cute"
            >
              ✕ Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-cute shadow-lg"
            >
              {loading ? '⏳ Đang lưu...' : isEdit ? '💾 Lưu' : '✨ Tạo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
