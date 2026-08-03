'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Trash2, X, Check } from 'lucide-react';

// const STICKER_LIST = [
//   '❤️', '💖', '😍', '😊', '😂', '😭', '👍', '👎', '🔥',
//   '🌹', '🌸', '⭐', '🎂', '🎉', '💌', '🐻', '🐱', '🌈', '🎈',
// ];

// const STICKER_LIST = [
//   // ❤️ Love
//   '❤️', '🩷', '🧡', '💛', '💚', '🩵', '💙', '💜', '🤍', '🖤',
//   '❤️‍🔥', '❤️‍🩹',
//   '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❣️', '♥️',
//   '💋', '💌', '💍', '💐', '🌹', '🌷', '🌸', '🌺', '🌻', '🌼',
//   '🪻', '🥀', '🍀',

//   // 💑 Couple
//   '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩',
//   '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩',
//   '🫂', '🫶',

//   // 😊 Cute Face
//   '😀', '😃', '😄', '😁', '😆', '😊', '☺️',
//   '🥰', '😍', '😘', '😗', '😙', '😚',
//   '😋', '😜', '🤪', '🤭', '🫢', '🫣',
//   '🥹', '😭', '😂', '🤣', '😇', '🤩',
//   '😎', '🥳', '😴', '😢', '😡', '🤔',

//   // 😻 Face Sticker
//   '😻', '😽', '😺', '😸', '😹',
//   '🙈', '🙉', '🙊',
//   '👀', '👁️',
//   '👄',
//   '👅',

//   // 😈 Đội lên đầu
//   '👑', '👒', '🎩', '🧢',
//   '😈', '👿',
//   '👻', '💀',
//   '🤖',
//   '👽',
//   '👼',
//   '😇',
//   '🦄',

//   // 🐻 Animal
//   '🐻', '🧸', '🐼', '🐰', '🐇', '🐱', '🐶',
//   '🦊', '🐨', '🐯', '🦁', '🐷', '🐸',
//   '🐵', '🐥', '🐧', '🐤', '🦋', '🐝',
//   '🐢', '🐬', '🐳',

//   // ✨ Hiệu ứng
//   '✨', '⭐', '🌟', '💫',
//   '🔥', '⚡', '☄️',
//   '🌈', '☀️', '🌤️', '🌙', '☁️',
//   '❄️', '🌊',

//   // 👍 Reaction
//   '👍', '👎', '👏', '🙌', '👌',
//   '✌️', '🤞', '🤟', '🤙',
//   '🙏', '💪',

//   // 🎀 Cute
//   '🎀', '🎁', '🎈', '🎉', '🎊',
//   '🎂', '🍰', '🧁',
//   '🍫', '🍭', '🍬',
//   '🍓', '🍒', '🍑', '🍉', '🍍', '🍇',
//   '☕', '🧋',

//   // 🎵 Music
//   '🎵', '🎶', '🎤', '🎧', '🎸', '🎹',

//   // 📸 Memory
//   '📷', '📸', '🖼️', '🎞️', '🎬',
//   '💌', '📮', '🕰️', '⌛', '🧩'
// ];

const STICKER_SECTIONS = [
  {
    title: "❤️ Love",
    stickers: [
      '❤️', '🩷', '💖', '💕', '💞', '💘', '💝', '💗', '💓', '💟',
      '💋', '💌', '💍', '💐', '🌹', '🌸', '🌺', '🌷', '🥰', '😍',
      '😘', '🫶', '🫂', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩'
    ]
  },
  {
    title: "👑 Headwear",
    stickers: [
      '👑', '🎩', '👒', '🧢', '🎓', '🪖',
      '😇', '👼', '😈', '👿',
      '🦄', '🐱', '🐻', '🐰', '🦊',
      '🎀', '🌸', '🌺', '⭐', '✨'
    ]
  },
  {
    title: "😎 Face",
    stickers: [
      '😎', '🤓', '🥸',
      '👓', '🕶️',
      '👀', '👁️',
      '👄', '👅',
      '😻', '😽', '😂', '😭', '🥹',
      '🤩', '🤭', '🫣', '😊'
    ]
  },
  {
    title: "✨ Effects",
    stickers: [
      '✨', '💫', '⭐', '🌟',
      '🔥', '💥', '⚡',
      '🌈', '☀️', '🌙', '☁️',
      '🎉', '🎊', '🎈',
      '🦋', '🌸', '🍃',
      '💖', '💕', '❤️‍🔥'
    ]
  },
  {
    title: "🐻 Cute",
    stickers: [
      '🐻', '🧸', '🐰', '🐱', '🐶',
      '🐼', '🦊', '🐨', '🐷', '🐸',
      '🐥', '🐧', '🦄', '🍓', '🍒'
    ]
  },

  // Thêm sticker công chúa, hoàng tử, em bé, anh bé...
  {
    title: "👑 Princess & Prince",
    stickers: [
      // Công chúa và hoàng tử
      '👸', '🤴', '👑', '🫅',
      // Cô gái và chàng trai
      '👧', '👦', '👩', '👨',
      '👩‍🦰', '👨‍🦰',
      '👩‍🦱', '👨‍🦱',
      '👩‍🦳', '👨‍🦳',
      // Cô dâu, chú rể và đám cưới 
      '👰', '👰‍♀️', '👰‍♂️',
      '🤵', '🤵‍♂️', '🤵‍♀️',
      '👰‍♀️‍❤️‍💋‍👨‍🦱', '💒',
      '💍', '💎', '💐',
      '🌹', '🌸', '👠',
      '👔', '🎩', '👑', '🕊️',
      // Em bé
      '👶', '🍼', '🧷',
      '👼', '🧸',
      // Cặp đôi và gia đình
      '👫', '👩‍❤️‍👨',
      '💑', '💏',
      '👨‍👩‍👧', '👨‍👩‍👧‍👦',
      // Nhân vật dễ thương
      '🧑', '🧒', '🧍‍♀️', '🧍‍♂️',
      '🙋‍♀️', '🙋‍♂️',
      '💁‍♀️', '💁‍♂️',
      '🙆‍♀️', '🙆‍♂️',
      '🕺', '💃'
    ]
  }
];

export interface StickerItem {
  id: number;
  photo_id: number;
  emoji: string;
  pos_x: number; // % of container width
  pos_y: number; // % of container height
  size: number;  // px
  rotation: number; // degrees
}

interface StickerOverlayProps {
  photoId: number;
  albumId: number;
  token: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export default function StickerOverlay({
  photoId,
  albumId,
  token,
  containerRef,
  onClose,
}: StickerOverlayProps) {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Track drag state per sticker
  const dragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  // ─── Fetch stickers on mount ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/albums/${albumId}/photos/${photoId}/stickers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setStickers(data.stickers || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [photoId, albumId, token]);

  // ─── Add sticker ──────────────────────────────────────────────────────────
  const addSticker = useCallback(
    async (emoji: string) => {
      const posX = 40 + Math.random() * 20; // random near center
      const posY = 40 + Math.random() * 20;
      try {
        const res = await fetch(`/api/albums/${albumId}/photos/${photoId}/stickers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ emoji, posX, posY, size: 52, rotation: 0 }),
        });
        const data = await res.json();
        if (data.sticker) {
          setStickers((prev) => [...prev, data.sticker]);
          setSelectedId(data.sticker.id);
        }
      } catch {
        // optimistic add with temp id
        const tmp: StickerItem = {
          id: Date.now(),
          photo_id: photoId,
          emoji,
          pos_x: posX,
          pos_y: posY,
          size: 52,
          rotation: 0,
        };
        setStickers((prev) => [...prev, tmp]);
        setSelectedId(tmp.id);
      }
      setShowPicker(false);
    },
    [albumId, photoId, token]
  );

  // ─── Delete one sticker ───────────────────────────────────────────────────
  const deleteSticker = useCallback(
    async (id: number) => {
      setStickers((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
      try {
        await fetch(`/api/albums/${albumId}/photos/${photoId}/stickers?id=${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {/* ignore */ }
    },
    [albumId, photoId, token, selectedId]
  );

  // ─── Delete all stickers ──────────────────────────────────────────────────
  const deleteAll = useCallback(async () => {
    setStickers([]);
    setSelectedId(null);
    try {
      await fetch(`/api/albums/${albumId}/photos/${photoId}/stickers?all=1`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {/* ignore */ }
  }, [albumId, photoId, token]);

  // ─── Save positions (batch PUT) ───────────────────────────────────────────
  const saveAll = useCallback(async () => {
    if (stickers.length === 0) { onClose(); return; }
    setSaving(true);
    try {
      await fetch(`/api/albums/${albumId}/photos/${photoId}/stickers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          stickers: stickers.map((s) => ({
            id: s.id,
            posX: s.pos_x,
            posY: s.pos_y,
            size: s.size,
            rotation: s.rotation,
          })),
        }),
      });
    } catch {/* ignore */ } finally {
      setSaving(false);
      onClose();
    }
  }, [stickers, albumId, photoId, token, onClose]);

  // ─── Drag handlers ────────────────────────────────────────────────────────
  const onStickerPointerDown = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      baseX: sticker.pos_x,
      baseY: sticker.pos_y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onStickerPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100, dragRef.current.baseX + dx));
    const newY = Math.max(0, Math.min(100, dragRef.current.baseY + dy));
    setStickers((prev) =>
      prev.map((s) => (s.id === dragRef.current!.id ? { ...s, pos_x: newX, pos_y: newY } : s))
    );
  };

  const onStickerPointerUp = () => {
    dragRef.current = null;
  };

  // ─── Resize via scroll wheel ──────────────────────────────────────────────
  const onStickerWheel = (e: React.WheelEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    setStickers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, size: Math.max(24, Math.min(120, s.size + (e.deltaY < 0 ? 4 : -4))) }
          : s
      )
    );
  };

  // ─── Rotate ───────────────────────────────────────────────────────────────
  const rotateSelected = (delta: number) => {
    if (selectedId === null) return;
    setStickers((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, rotation: s.rotation + delta } : s))
    );
  };

  // Deselect when clicking container background
  const onContainerClick = () => setSelectedId(null);

  return (
    // Overlay stretches to cover the entire container
    <div
      className="absolute inset-0 z-20"
      onClick={onContainerClick}
    >
      {/* ── Sticker items ─────────────────────────────────────────────────── */}
      {stickers.map((sticker) => {
        const isSelected = sticker.id === selectedId;
        return (
          <div
            key={sticker.id}
            style={{
              position: 'absolute',
              left: `${sticker.pos_x}%`,
              top: `${sticker.pos_y}%`,
              fontSize: `${sticker.size}px`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              cursor: 'grab',
              userSelect: 'none',
              touchAction: 'none',
              lineHeight: 1,
              filter: isSelected ? 'drop-shadow(0 0 6px rgba(251,113,133,0.9))' : undefined,
            }}
            onPointerDown={(e) => onStickerPointerDown(e, sticker.id)}
            onPointerMove={onStickerPointerMove}
            onPointerUp={onStickerPointerUp}
            onWheel={(e) => onStickerWheel(e, sticker.id)}
            onClick={(e) => { e.stopPropagation(); setSelectedId(sticker.id); }}
          >
            {sticker.emoji}

            {/* Delete button shown when selected */}
            {isSelected && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                aria-label="Xoa sticker"
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '-12px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  lineHeight: 1,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: sticker picker trigger + rotate + delete-all */}
        <div className="flex items-center gap-1.5">
          {/* Sticker picker button */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            title="Them sticker"
            className="h-8 px-3 rounded-full text-sm font-medium bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            + Sticker
          </button>

          {/* Rotate controls — only active when a sticker is selected */}
          <button
            disabled={selectedId === null}
            onClick={() => rotateSelected(-15)}
            title="Xoay trai"
            aria-label="Xoay trai"
            className="grid place-items-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            disabled={selectedId === null}
            onClick={() => rotateSelected(15)}
            title="Xoay phai"
            aria-label="Xoay phai"
            className="grid place-items-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
          >
            <RotateCw size={15} />
          </button>

          {stickers.length > 0 && (
            <button
              onClick={deleteAll}
              title="Xoa tat ca sticker"
              aria-label="Xoa tat ca"
              className="grid place-items-center w-8 h-8 rounded-full bg-white/15 hover:bg-red-500 text-white transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Right: cancel + save */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            title="Dong"
            aria-label="Dong"
            className="grid place-items-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X size={15} />
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            title="Luu"
            aria-label="Luu sticker"
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-medium bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white transition-colors"
          >
            <Check size={14} />
            {saving ? 'Dang luu...' : 'Luu'}
          </button>
        </div>
      </div>

      {/* ── Sticker picker panel ───────────────────────────────────────────── */}
      {showPicker && (
        <div
          // className="absolute bottom-14 left-3 z-40 bg-black/80 backdrop-blur-sm rounded-2xl p-3 shadow-2xl"
          className=" absolute bottom-14 left-3 z-40 w-64 bg-black/85 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex flex-col "
          onClick={(e) => e.stopPropagation()}
        >
          {/* <p className="text-white/60 text-xs mb-2 font-medium">Chon sticker</p>
          <div className="grid grid-cols-5 gap-1">
            {STICKER_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addSticker(emoji)}
                className="w-10 h-10 text-2xl flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                aria-label={`Them ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div> */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">
              Chọn Sticker
            </h3>

            <button
              onClick={() => setShowPicker(false)}
              className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="flex flex-col gap-4 max-h-[52vh] overflow-y-auto pr-1">

            {STICKER_SECTIONS.map(section => (

              <div key={section.title}>

                <p className="text-xs text-white/60 font-semibold mb-2">
                  {section.title}
                </p>

                <div className="grid grid-cols-5 gap-1">

                  {section.stickers.map(emoji => (

                    <button
                      key={emoji}
                      onClick={() => addSticker(emoji)}
                      className="
                          w-10
                          h-10
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          text-2xl
                          hover:bg-white/15
                          hover:scale-110
                          transition
                        "
                    >
                      {emoji}
                    </button>

                  ))}

                </div>

              </div>

            ))}

          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
