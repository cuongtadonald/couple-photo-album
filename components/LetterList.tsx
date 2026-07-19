'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import LetterModal from './LetterModal';
import LetterDetail from './LetterDetail';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { parseDate, formatDateVN } from '@/lib/datetime';
import { useSeen } from '@/lib/use-seen';

interface Letter {
  id: number;
  from_user_id: number;
  title: string;
  text_content: string;
  from_user_name: string;
  scheduled_unlock_date: string | null;
  is_opened: boolean;
  created_at: string;
}

interface LetterListProps {
  token: string | null;
  currentUserId: number;
}

export default function LetterList({ token, currentUserId }: LetterListProps) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Letter | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const { badge, markSeen } = useSeen('letter');

  useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchLetters = async () => {
    try {
      const response = await fetch('/api/letters', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLetters(data.letters || []);
    } catch (error) {
      console.error('Error fetching letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    title: string,
    textContent: string,
    scheduledUnlockDate: string | null
  ) => {
    try {
      if (editing) {
        const response = await fetch(`/api/letters/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, textContent, scheduledUnlockDate }),
        });
        if (response.ok) {
          await fetchLetters();
        } else {
          const err = await response.json();
          alert(err.error || 'Không thể sửa thư');
          return;
        }
      } else {
        const response = await fetch('/api/letters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, textContent, scheduledUnlockDate }),
        });
        const data = await response.json();
        if (data.letter) {
          setLetters((prev) => [data.letter, ...prev]);
        }
      }
      closeModal();
    } catch (error) {
      console.error('Error saving letter:', error);
    }
  };

  const handleDelete = async (letter: Letter) => {
    if (!confirm(`Xóa thư "${letter.title}"?`)) return;
    try {
      const response = await fetch(`/api/letters/${letter.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setLetters((prev) => prev.filter((l) => l.id !== letter.id));
      } else {
        const err = await response.json();
        alert(err.error || 'Không thể xóa thư');
      }
    } catch (error) {
      console.error('Error deleting letter:', error);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (letter: Letter) => {
    setEditing(letter);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const canOpenLetter = (letter: Letter): boolean => {
    if (!letter.scheduled_unlock_date) return true;
    const d = parseDate(letter.scheduled_unlock_date);
    return d ? new Date() >= d : true;
  };

  const isOwner = (letter: Letter) => letter.from_user_id === currentUserId;

  /** Thư quá 7 ngày kể từ ngày tạo thì không cho sửa/xóa */
  const isLocked = (letter: Letter): boolean => {
    const created = parseDate(letter.created_at);
    if (!created) return false;
    return Date.now() - created.getTime() > 7 * 24 * 60 * 60 * 1000;
  };

  if (selectedLetter) {
    return (
      <LetterDetail
        letter={selectedLetter}
        token={token}
        currentUserId={currentUserId}
        onBack={() => setSelectedLetter(null)}
        onEdit={
          selectedLetter.from_user_id === currentUserId && !isLocked(selectedLetter)
            ? () => { setSelectedLetter(null); openEdit(selectedLetter); }
            : undefined
        }
        onDelete={
          selectedLetter.from_user_id === currentUserId && !isLocked(selectedLetter)
            ? async () => { await handleDelete(selectedLetter); setSelectedLetter(null); }
            : undefined
        }
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 gap-3 flex-wrap">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          💌 Thư Tay
        </h2>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Viết Thư Mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
          <div className="text-6xl mb-4">💕</div>
          <p className="text-gray-600 mb-6 text-lg">Chưa có thư tay nào</p>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            ✍️ Viết Thư Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => {
            const canOpen = canOpenLetter(letter);
            const owner = isOwner(letter);
            const locked = isLocked(letter);
            return (
              <div
                key={letter.id}
                className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border-l-4 transition-all duration-300 transform hover:-translate-y-1 ${
                  canOpen ? 'hover:shadow-2xl border-rose-400 hover:border-pink-400' : 'border-yellow-300 opacity-80'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div
                    className={`flex-1 min-w-0 ${canOpen ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (canOpen) { setSelectedLetter(letter); markSeen(letter.id); } }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                        {letter.title}
                      </h3>
                      {canOpen && (() => {
                        const b = badge(letter.id, letter.created_at);
                        if (!b) return null;
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b === 'new' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                            {b === 'new' ? 'Mới' : 'Chưa xem'}
                          </span>
                        );
                      })()}
                      {!canOpen && (
                        <span className="flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-100 px-3 py-1 rounded-full">
                          🔒 Khóa
                        </span>
                      )}
                      {canOpen && letter.is_opened && (
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                          ✓ Đã mở
                        </span>
                      )}
                      {owner && (
                        <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                          Của bạn
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">
                      <span className="font-semibold">📮 Từ:</span> {letter.from_user_name}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 italic">
                      {letter.text_content || '(Chỉ có tệp đính kèm)'}
                    </p>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                  {/* Chỉ chính chủ mới có nút sửa/xóa — ẩn nếu đã quá 7 ngày */}
                  {owner && !locked && (
                    <div className="flex gap-1 justify-end mb-2">
                      <button
                        onClick={() => openEdit(letter)}
                        aria-label="Sửa thư"
                        className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(letter)}
                        aria-label="Xóa thư"
                        className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {owner && locked && (
                    <span className="text-xs text-gray-400 italic mb-2 block text-right">Đã khóa</span>
                  )}
                    {letter.scheduled_unlock_date && (
                      <p className="text-xs text-amber-600 font-semibold mb-1">
                        📅 {formatDateVN(letter.scheduled_unlock_date)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{formatDateVN(letter.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LetterModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={
          editing
            ? {
                title: editing.title,
                text_content: editing.text_content || '',
                scheduled_unlock_date: editing.scheduled_unlock_date,
              }
            : null
        }
      />
    </div>
  );
}
