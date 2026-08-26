'use client';

import { useEffect, useState, useRef } from 'react';

interface Reaction {
  id: number;
  letter_id: number;
  user_id: number;
  emoji: string;
  user_name: string;
  created_at: string;
}

interface ReactionBarProps {
  letterId: number;
  token: string | null;
  currentUserId: number;
  letterOwnerId: number;
  compact?: boolean; // true = hiển thị nhỏ gọn trong LetterList
}

const REACTION_EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '😡'];

export default function ReactionBar({
  letterId,
  token,
  currentUserId,
  letterOwnerId,
  compact = false,
}: ReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Chỉ người nhận mới có thể react
  const canReact = currentUserId !== letterOwnerId;
  const myReaction = reactions.find((r) => r.user_id === currentUserId);

  useEffect(() => {
    fetchReactions();
  }, [letterId, token]);

  // Đóng picker khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const fetchReactions = async () => {
    try {
      const res = await fetch(`/api/letters/${letterId}/reactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions || []);
      }
    } catch (err) {
      console.error('Error fetching reactions:', err);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!canReact || loading) return;
    setLoading(true);
    setShowPicker(false);

    try {
      // Nếu đã react emoji này rồi thì xóa
      if (myReaction && myReaction.emoji === emoji) {
        const res = await fetch(`/api/letters/${letterId}/reactions`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setReactions((prev) => prev.filter((r) => r.user_id !== currentUserId));
        }
      } else {
        // Thêm hoặc cập nhật reaction
        const res = await fetch(`/api/letters/${letterId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emoji }),
        });
        if (res.ok) {
          const data = await res.json();
          setReactions((prev) => {
            const filtered = prev.filter((r) => r.user_id !== currentUserId);
            return [...filtered, data.reaction];
          });
        }
      }
    } catch (err) {
      console.error('Error reacting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = () => {
    if (!canReact) return;
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500); // 500ms = long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!canReact) return;
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Nhóm reactions theo emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [] };
    }
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.user_name);
    return acc;
  }, {} as Record<string, { count: number; users: string[] }>);

  // Không hiển thị gì nếu không có reaction và không thể react
  if (reactions.length === 0 && !canReact) return null;

  return (
    <div className={`relative inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Hiển thị các reaction đã có */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(reactionCounts).map(([emoji, data]) => (
            <div
              key={emoji}
              className={`flex items-center gap-1 ${
                compact
                  ? 'bg-white/60 px-2 py-0.5 rounded-full'
                  : 'bg-white/70 px-2.5 py-1 rounded-full'
              }`}
              title={data.users.join(', ')}
            >
              <span className={compact ? 'text-sm' : 'text-base'}>{emoji}</span>
              <span className="text-gray-600 font-medium">{data.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Nút react */}
      {canReact && (
        <>
          <button
            ref={buttonRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setShowPicker(!showPicker)}
            className={`${
              compact ? 'w-7 h-7' : 'w-9 h-9'
            } rounded-full flex items-center justify-center transition-all ${
              myReaction
                ? 'bg-pink-100 text-pink-500'
                : 'bg-white/60 text-gray-400 hover:bg-pink-50 hover:text-pink-400'
            } ${loading ? 'opacity-50' : ''}`}
            title={myReaction ? `Bạn đã react ${myReaction.emoji}` : 'Giữ để chọn emoji'}
          >
            {myReaction ? (
              <span className={compact ? 'text-sm' : 'text-base'}>{myReaction.emoji}</span>
            ) : (
              <span className={compact ? 'text-sm' : 'text-lg'}>😊</span>
            )}
          </button>

          {/* Picker popup */}
          {showPicker && (
            <div
              ref={pickerRef}
              className={`absolute ${
                compact ? 'bottom-full mb-2' : 'bottom-full mb-3'
              } left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-pink-100 px-3 py-2 flex gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`${
                    compact ? 'text-2xl' : 'text-3xl'
                  } hover:scale-125 transition-transform p-1 ${
                    myReaction?.emoji === emoji ? 'scale-110' : ''
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
