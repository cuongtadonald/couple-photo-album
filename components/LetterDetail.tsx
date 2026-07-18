'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Music,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Upload,
  Mic,
  MicOff,
  X,
  Play,
} from 'lucide-react';
import { formatDateVN, formatTimeVN } from '@/lib/datetime';

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

interface Attachment {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
}

interface LetterDetailProps {
  letter: Letter;
  token: string | null;
  currentUserId: number;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function LetterDetail({
  letter,
  token,
  currentUserId,
  onBack,
  onEdit,
  onDelete,
}: LetterDetailProps) {
  const isOwner = letter.from_user_id === currentUserId;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null); // object URL of the latest recorded blob
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/attachments?letterId=${letter.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAttachments(data.attachments || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // --- Image upload ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    await uploadBlob(file, fileType, file.name);
  };

  // --- Recording ---
  const handleStartRecording = async () => {
    setUploadError(null);
    setAudioPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(blob);
        setAudioPreview(previewUrl);
      };

      recorder.start(200); // collect data every 200 ms for reliability
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setUploadError('Không thể truy cập micro. Vui lòng cho phép quyền trong trình duyệt.');
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSaveRecording = async () => {
    if (!audioPreview || chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const fileName = `recording-${Date.now()}.webm`;
    await uploadBlob(blob, 'audio', fileName);
    URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    chunksRef.current = [];
    setRecordingSeconds(0);
  };

  const handleDiscardRecording = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    chunksRef.current = [];
    setRecordingSeconds(0);
  };

  // --- Shared upload helper ---
  const uploadBlob = async (blob: Blob, fileType: string, fileName: string) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('letterId', letter.id.toString());
      formData.append('fileType', fileType);

      const res = await fetch('/api/attachments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.attachment) {
        setAttachments((prev) => [...prev, data.attachment]);
      } else {
        setUploadError('Tải lên thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Lỗi khi tải lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  // --- Delete attachment ---
  const handleDeleteAttachment = async (id: number) => {
    try {
      await fetch(`/api/attachments?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Quay Lai
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-balance">{letter.title}</h1>
            <p className="text-gray-500 mt-1 text-sm">Tu: {letter.from_user_name}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {formatDateVN(letter.created_at, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Sua thu"
                  className="grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Pencil size={17} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Xoa thu"
                  className="grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          )}
        </div>

        {letter.scheduled_unlock_date && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-sm text-rose-700">
              Thu hen mo luc: {formatDateVN(letter.scheduled_unlock_date)} luc{' '}
              {formatTimeVN(letter.scheduled_unlock_date)}
            </p>
          </div>
        )}

        {/* Content */}
        {letter.text_content && (
          <div className="mb-8 p-5 bg-rose-50 rounded-xl border border-rose-100">
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
              {letter.text_content}
            </p>
          </div>
        )}

        {/* Attachments list */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Tep Dinh Kem</h2>

          {loadingAttachments ? (
            <p className="text-sm text-gray-400">Dang tai...</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Chua co tep dinh kem nao.</p>
          ) : (
            <div className="space-y-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
                >
                  {att.file_type === 'image' ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-full max-h-72 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          aria-label="Xoa anh"
                          className="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <p className="px-3 py-1.5 text-xs text-gray-500">{att.file_name}</p>
                    </div>
                  ) : att.file_type === 'audio' ? (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Music size={18} className="text-rose-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate mb-1">{att.file_name}</p>
                        <audio
                          controls
                          src={att.file_url}
                          className="w-full h-8"
                          style={{ accentColor: '#f43f5e' }}
                        />
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          aria-label="Xoa ghi am"
                          className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Upload size={18} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                        >
                          Xem
                        </a>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            aria-label="Xoa tep"
                            className="grid place-items-center w-7 h-7 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload section — only owner can add attachments */}
        {isOwner && (
          <div className="border-t border-gray-100 pt-6 space-y-5">
            <h3 className="text-base font-semibold text-gray-800">Them Tep Dinh Kem</h3>

            {/* Image upload */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Hinh anh</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-rose-200 text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <ImageIcon size={18} />
                {uploading ? 'Dang tai len...' : 'Chon anh tu thiet bi'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Chon anh"
              />
            </div>

            {/* Audio recording */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Ghi am</p>

              {!isRecording && !audioPreview && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-rose-200 text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Mic size={18} />
                  Bat dau ghi am
                </button>
              )}

              {isRecording && (
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="text-sm text-red-600 font-medium flex-1">
                    Dang ghi am... {formatDuration(recordingSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <MicOff size={15} />
                    Dung
                  </button>
                </div>
              )}

              {!isRecording && audioPreview && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Play size={16} className="text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-700 font-medium">Nghe lai truoc khi luu</p>
                  </div>
                  <audio controls src={audioPreview} className="w-full h-8" style={{ accentColor: '#f43f5e' }} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveRecording}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Dang luu...' : 'Luu ghi am'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardRecording}
                      disabled={uploading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Huy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
