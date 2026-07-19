'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { parseDate } from '@/lib/datetime';

interface LetterInitial {
  title: string;
  text_content: string;
  scheduled_unlock_date: string | null;
}

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, textContent: string, scheduledUnlockDate: string | null) => Promise<void> | void;
  initial?: LetterInitial | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function LetterModal({ isOpen, onClose, onSubmit, initial }: LetterModalProps) {
  const isEdit = !!initial;
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setTitle(initial.title);
      setTextContent(initial.text_content || '');
      const d = parseDate(initial.scheduled_unlock_date);
      if (d) {
        setScheduledDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setScheduledTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } else {
        setScheduledDate('');
        setScheduledTime('');
      }
    } else {
      setTitle('');
      setTextContent('');
      setScheduledDate('');
      setScheduledTime('');
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    // Validate scheduled date is not in the past
    if (scheduledDate) {
      const chosen = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
      if (chosen < new Date()) {
        alert('Ngày hẹn mở thư không được nhỏ hơn ngày hiện tại.');
        return;
      }
    }
    setLoading(true);
    try {
      let scheduledUnlockDate: string | null = null;
      if (scheduledDate) {
        const time = scheduledTime || '00:00';
        scheduledUnlockDate = `${scheduledDate}T${time}`;
      }
      await onSubmit(title, textContent, scheduledUnlockDate);
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
            {isEdit ? '✏️ Sửa Thư Tay' : '💌 Viết Thư Tay'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-rose-500 transition-colors" aria-label="Đóng">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">✍️ Tiêu Đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Ví dụ: Tặng em nhân ngày sinh nhật"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">💝 Nội Dung Thư</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Viết nội dung thư tay tại đây..."
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              📅 Hẹn Ngày Mở Thư (Tùy Chọn)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              ⏰ Nếu để trống, thư sẽ mở ngay. Chỉ cần chọn ngày, giờ để trống mặc định 00:00
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={scheduledDate}
                min={todayStr()}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
              {loading ? '⏳ Đang lưu...' : isEdit ? '💾 Lưu' : '💌 Gửi Thư'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
