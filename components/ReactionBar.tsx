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
  const [pickerPosition, setPickerPosition] = useState<'bottom' | 'top'>('bottom');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const canReact = currentUserId !== letterOwnerId;
  const myReaction = reactions.find((r) => r.user_id === currentUserId);

  useEffect(() => {
    fetchReactions();
  }, [letterId, token]);

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

  const calculatePickerPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const pickerHeight = 60;
    
    if (rect.bottom + pickerHeight > viewportHeight) {
      setPickerPosition('top');
    } else {
      setPickerPosition('bottom');
    }
  };

  const handleMouseDown = () => {
    if (!canReact) return;
    calculatePickerPosition();
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!canReact) return;
    calculatePickerPosition();
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
        <>
          <button
            ref={buttonRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              calculatePickerPosition();
              setShowPicker(!showPicker);
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

          {/* Picker popup - grid 4 cột */}
          {showPicker && (
            <div
              ref={pickerRef}
              className={`absolute left-1/2 -translate-x-1/2 z-50 ${
                pickerPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-3">
                <div className="grid grid-cols-4 gap-2">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className={`${
                        compact ? 'text-2xl' : 'text-3xl'
                      } hover:scale-125 transition-transform p-2 ${
                        myReaction?.emoji === emoji ? 'scale-110 bg-pink-50 rounded-full' : ''
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
