'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { parseDate } from '@/lib/datetime';
import { clearSessionKey } from '@/lib/use-session-state';

interface LetterInitial {
  title: string;
  text_content: string;
  scheduled_unlock_date: string | null;
}

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, textContent: string, scheduledUnlockDate: string | null, confirm: boolean) => Promise<void> | void;
  initial?: LetterInitial | null;
  /** sessionStorage prefix used to persist create-mode draft (e.g. "letters:draft") */
  draftKey?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readDraft(key: string, field: string): string {
  if (typeof window === 'undefined') return '';
  try { return sessionStorage.getItem(`${key}:${field}`) ?? ''; } catch { return ''; }
}

function saveDraft(key: string, field: string, value: string) {
  try { sessionStorage.setItem(`${key}:${field}`, value); } catch { /* ignore */ }
}

export default function LetterModal({ isOpen, onClose, onSubmit, initial, draftKey }: LetterModalProps) {
  const isEdit = !!initial;

  // Initialise from draft (create mode) or from initial (edit mode)
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (!isOpen) { setConfirmStep(false); return; }
    setConfirmStep(false);
    if (initial) {
      // Edit mode — always reset to server values
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
    } else if (draftKey) {
      // Create mode — restore draft if present
      setTitle(readDraft(draftKey, 'title'));
      setTextContent(readDraft(draftKey, 'content'));
      setScheduledDate(readDraft(draftKey, 'date'));
      setScheduledTime(readDraft(draftKey, 'time'));
    } else {
      setTitle('');
      setTextContent('');
      setScheduledDate('');
      setScheduledTime('');
    }
  }, [isOpen, initial, draftKey]);

  // Persist draft on every keystroke (create mode only)
  useEffect(() => {
    if (!isOpen || isEdit || !draftKey) return;
    saveDraft(draftKey, 'title', title);
  }, [title, isOpen, isEdit, draftKey]);

  useEffect(() => {
    if (!isOpen || isEdit || !draftKey) return;
    saveDraft(draftKey, 'content', textContent);
  }, [textContent, isOpen, isEdit, draftKey]);

  useEffect(() => {
    if (!isOpen || isEdit || !draftKey) return;
    saveDraft(draftKey, 'date', scheduledDate);
  }, [scheduledDate, isOpen, isEdit, draftKey]);

  useEffect(() => {
    if (!isOpen || isEdit || !draftKey) return;
    saveDraft(draftKey, 'time', scheduledTime);
  }, [scheduledTime, isOpen, isEdit, draftKey]);

  const clearDraft = () => {
    if (!draftKey) return;
    clearSessionKey(`${draftKey}:title`);
    clearSessionKey(`${draftKey}:content`);
    clearSessionKey(`${draftKey}:date`);
    clearSessionKey(`${draftKey}:time`);
  };

  const buildScheduledUnlockDate = () => {
    if (!scheduledDate) return null;
    return `${scheduledDate}T${scheduledTime || '00:00'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    if (scheduledDate) {
      // So sánh ngày (không tính giờ) để cho phép chọn hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosenDay = new Date(scheduledDate + 'T00:00:00');
      if (chosenDay < today) {
        alert('Ngày hẹn mở thư không được nhỏ hơn ngày hiện tại.');
        return;
      }
      // Nếu chọn hôm nay nhưng giờ đã qua, cảnh báo nhẹ
      if (chosenDay.getTime() === today.getTime() && scheduledTime) {
        const chosen = new Date(`${scheduledDate}T${scheduledTime}`);
        if (chosen < new Date()) {
          alert('Giờ hẹn mở thư đã qua. Vui lòng chọn giờ khác.');
          return;
        }
      }
      // Chuyển sang bước xác nhận khóa
      setConfirmStep(true);
      return;
    }
    // Không có ngày hẹn — lưu bình thường, không confirm
    setLoading(true);
    try {
      await onSubmit(title, textContent, null, false);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSubmit(title, textContent, buildScheduledUnlockDate(), true);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Do NOT clear draft on close — user may have typed something they want back after reload
    onClose();
  };

  if (!isOpen) return null;

  // --- Bước xác nhận khóa thư ---
  if (confirmStep) {
    const unlockDate = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
    const dateStr = unlockDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = unlockDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-2 border-rose-100 p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Bạn xác nhận mở thư vào:</h2>
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-6 py-4 mb-4 inline-block w-full">
            <p className="text-2xl font-bold text-rose-600">{dateStr}</p>
            <p className="text-xl font-semibold text-rose-500 mt-1">{timeStr}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Sau khi xác nhận bạn sẽ không thể sửa hoặc xóa thư.
            <br />
            <span className="font-semibold text-gray-700">Bạn có chắc chắn không?</span>
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setConfirmStep(false)}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
            >
              {loading ? 'Đang lưu...' : 'Xác nhận'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-rose-100">
        <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-sm border-b border-rose-100 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent font-cute">
            {isEdit ? 'Sua Thu Tay' : 'Viet Thu Tay'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-rose-500 transition-colors" aria-label="Dong">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Tieu De</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Vi du: Tang em nhan ngay sinh nhat"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">Noi Dung Thu</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Viet noi dung thu tay tai day..."
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Hen Ngay Mo Thu (Tuy Chon)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Neu de trong, thu se mo ngay. Chi can chon ngay, gio de trong mac dinh 00:00
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
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-cute"
            >
              Huy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-cute shadow-lg"
            >
              {loading ? 'Dang luu...' : isEdit ? 'Luu' : 'Gui Thu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
