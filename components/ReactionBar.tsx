'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  compact?: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '🥺', '👸', '🤴', '🤗', '😘', '🥰'];

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
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const canReact = currentUserId !== letterOwnerId;
  const myReaction = reactions.find((r) => r.user_id === currentUserId);

  useEffect(() => {
    fetchReactions();
  }, [letterId, token]);

  // Đóng picker khi click bên ngoài
  useEffect(() => {
    if (!showPicker) return;
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
    // Delay để tránh click hiện tại đóng picker ngay
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    setPickerPos(null);

    try {
      if (myReaction && myReaction.emoji === emoji) {
        const res = await fetch(`/api/letters/${letterId}/reactions`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setReactions((prev) => prev.filter((r) => r.user_id !== currentUserId));
        }
      } else {
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

  const calculatePickerPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const pickerWidth = 220;
    const pickerHeight = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Tính vị trí ngang: căn giữa nút, nhưng không tràn viewport
    let left = rect.left + rect.width / 2 - pickerWidth / 2;
    if (left < 8) left = 8;
    if (left + pickerWidth > viewportWidth - 8) left = viewportWidth - pickerWidth - 8;

    // Tính vị trí dọc: ưu tiên phía trên nút (vì nút thường ở dưới card)
    let top: number;
    if (rect.top - pickerHeight - 8 > 0) {
      // Đủ chỗ phía trên
      top = rect.top - pickerHeight - 8;
    } else {
      // Hiện phía dưới
      top = rect.bottom + 8;
    }

    // Nếu phía dưới cũng tràn, clamp
    if (top + pickerHeight > viewportHeight - 8) {
      top = viewportHeight - pickerHeight - 8;
    }

    setPickerPos({ top, left });
  }, []);

  const openPicker = useCallback(() => {
    calculatePickerPosition();
    setShowPicker(true);
  }, [calculatePickerPosition]);

  const handleMouseDown = () => {
    if (!canReact) return;
    longPressTimer.current = setTimeout(openPicker, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!canReact) return;
    longPressTimer.current = setTimeout(openPicker, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (reactions.length === 0 && !canReact) return null;

  return (
    <div className="relative inline-flex items-center">
      {/* Hiển thị danh sách reactions */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className={`flex items-center gap-1.5 ${
                compact
                  ? 'bg-white/60 px-2.5 py-1 rounded-full'
                  : 'bg-white/70 px-3 py-1.5 rounded-full'
              }`}
            >
              <span className={`${compact ? 'text-sm' : 'text-base'} text-gray-700`}>
                {reaction.user_name}
              </span>
              <span className={`${compact ? 'text-sm' : 'text-base'} text-gray-700`}>đã</span>
              <span className={compact ? 'text-lg' : 'text-xl'}>{reaction.emoji}</span>
            </div>
          ))}
        </div>
      )}

      {/* Nút react */}
      {canReact && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (showPicker) {
              setShowPicker(false);
              setPickerPos(null);
            } else {
              openPicker();
            }
          }}
          className={`ml-2 ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          } rounded-full flex items-center justify-center transition-all ${
            myReaction
              ? 'bg-pink-100 text-pink-500'
              : 'bg-white/60 text-gray-400 hover:bg-pink-50 hover:text-pink-400'
          } ${loading ? 'opacity-50' : ''}`}
          title={myReaction ? `Bạn đã react ${myReaction.emoji}` : 'Giữ để chọn emoji'}
        >
          {myReaction ? (
            <span className={compact ? 'text-base' : 'text-lg'}>{myReaction.emoji}</span>
          ) : (
            <span className={`${compact ? 'text-base' : 'text-lg'} opacity-20 animate-pulse`}>❤️</span>
          )}
        </button>
      )}

      {/* Picker popup - render qua Portal để không bị clip */}
      {showPicker && pickerPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={pickerRef}
          className="fixed z-[9999]"
          style={{ top: pickerPos.top, left: pickerPos.left }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-pink-200 p-3 w-[210px]">
            <div className="grid grid-cols-4 gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`text-2xl sm:text-3xl hover:scale-125 active:scale-95 transition-transform p-2 rounded-xl ${
                    myReaction?.emoji === emoji ? 'scale-110 bg-pink-50' : 'hover:bg-pink-50'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
