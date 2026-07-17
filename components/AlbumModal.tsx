'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, Globe } from 'lucide-react';

type Visibility = 'private' | 'public';

interface AlbumInitial {
  title: string;
  description: string;
  visibility: Visibility;
}

interface AlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, visibility: Visibility) => Promise<void> | void;
  /** Nếu truyền vào => chế độ chỉnh sửa, ngược lại là tạo mới */
  initial?: AlbumInitial | null;
}

export default function AlbumModal({ isOpen, onClose, onSubmit, initial }: AlbumModalProps) {
  const isEdit = !!initial;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [loading, setLoading] = useState(false);

  // Đồng bộ dữ liệu khi mở modal (tạo mới hoặc sửa)
  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setVisibility(initial?.visibility ?? 'private');
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(title, description, visibility);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border-2 border-rose-100">
        <div className="flex justify-between items-center p-6 border-b border-rose-100">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent font-cute">
            {isEdit ? '✏️ Sửa Album' : '📷 Tạo Album Mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-rose-500 transition-colors"
            aria-label="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              📝 Tên Album
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Ví dụ: Kỷ niệm ngày gặp nhau"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              💭 Mô Tả (Tùy Chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Mô tả chi tiết về album..."
              rows={3}
            />
          </div>

          {/* Chế độ hiển thị */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              🔐 Chế Độ Hiển Thị
            </label>
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
            <p className="text-xs text-gray-500 mt-2">
              {visibility === 'private'
                ? 'Chỉ mình bạn nhìn thấy album này.'
                : 'Cả hai đứa đều nhìn thấy trong tab Công khai.'}
            </p>
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
