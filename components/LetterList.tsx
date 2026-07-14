'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import LetterModal from './LetterModal';
import LetterDetail from './LetterDetail';
import { Plus, Lock } from 'lucide-react';

interface Letter {
  id: number;
  title: string;
  text_content: string;
  from_user_name: string;
  scheduled_unlock_date: string | null;
  is_opened: boolean;
  created_at: string;
}

export default function LetterList({ token }: { token: string | null }) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  useEffect(() => {
    fetchLetters();
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

  const handleCreateLetter = async (title: string, textContent: string, scheduledUnlockDate: string | null) => {
    try {
      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, textContent, scheduledUnlockDate }),
      });
      const data = await response.json();
      if (data.letter) {
        setLetters([data.letter, ...letters]);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating letter:', error);
    }
  };

  const canOpenLetter = (letter: Letter): boolean => {
    if (!letter.scheduled_unlock_date) return true;
    return new Date() >= new Date(letter.scheduled_unlock_date);
  };

  if (selectedLetter) {
    return (
      <LetterDetail
        letter={selectedLetter}
        token={token}
        onBack={() => setSelectedLetter(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          💌 Thư Tay
        </h2>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Viết Thư Mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
          <div className="text-6xl mb-4">💕</div>
          <p className="text-gray-600 mb-6 text-lg">Chưa có thư tay nào</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            ✍️ Viết Thư Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter, idx) => {
            const canOpen = canOpenLetter(letter);
            return (
              <div
                key={letter.id}
                onClick={() => canOpen && setSelectedLetter(letter)}
                className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border-l-4 transition-all duration-300 transform hover:-translate-y-1 ${
                  canOpen
                    ? 'cursor-pointer hover:shadow-2xl border-rose-400 hover:border-pink-400'
                    : 'border-yellow-300 opacity-80'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                        {letter.title}
                      </h3>
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
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">
                      <span className="font-semibold">📮 Từ:</span> {letter.from_user_name}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 italic">
                      {letter.text_content || '(Chỉ có tệp đính kèm)'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    {letter.scheduled_unlock_date && (
                      <p className="text-xs text-amber-600 font-semibold mb-1">
                        📅 {new Date(letter.scheduled_unlock_date).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(letter.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LetterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateLetter}
      />
    </div>
  );
}
