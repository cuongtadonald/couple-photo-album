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
  Download,
  Eye,
} from 'lucide-react';
import { formatDateVN, formatTimeVN } from '@/lib/datetime';
import { useSeen } from '@/lib/use-seen';
import AttachmentGrid from './AttachmentGrid';

interface Letter {
  id: number;
  from_user_id: number;
  title: string;
  text_content: string;
  from_user_name: string;
  scheduled_unlock_date: string | null;
  is_opened: boolean;
  is_confirmed: boolean;
  created_at: string;
  paper_type?: string | null;
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
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { markSeen } = useSeen('letter');

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id, token]);

  // Mark letter as seen when user views the content
  useEffect(() => {
    markSeen(letter.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id]);

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
      if (!res.ok) {
        console.error('Fetch attachments failed:', res.status, res.statusText);
        return;
      }
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

  // Multi-image upload
  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log('FILE CHANGE:', e.target.files);
  //   const files = e.target.files;
  //   if (!files || files.length === 0) return;
  //   e.target.value = '';
  //   setUploadError(null);
  //   for (let i = 0; i < files.length; i++) {
  //     const file = files[i];
  //     const fileType = file.type.startsWith('image/')
  //       ? 'image'
  //       : file.type.startsWith('video/')
  //         ? 'video'
  //         : file.type.startsWith('audio/')
  //           ? 'audio'
  //           : 'document';
  //     await uploadBlob(file, fileType, file.name);
  //   }
  // };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('1. FILE CHANGE:', e.target.files);

    const files = e.target.files;

    if (!files || files.length === 0) {
      console.log('2. NO FILE');
      return;
    }

    console.log('3. FILE COUNT:', files.length);

    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      console.log('4. BEFORE UPLOAD:', file.name, file.size, file.type);

      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'document';

      console.log('5. FILE TYPE:', fileType);

      await uploadBlob(file, fileType, file.name);

      console.log('6. AFTER UPLOAD:', file.name);
    }

    e.target.value = '';
  };

  // Recording
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
        setAudioPreview(URL.createObjectURL(blob));
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setUploadError('Không thể truy cập micro. Vui lòng cho phép quyền trong trình duyệt.');
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSaveRecording = async () => {
    if (!audioPreview || chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const fileName = `ghi-am-${Date.now()}.webm`;
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

      if (!res.ok) {
        console.error('Upload failed:', res.status, res.statusText);
        setUploadError(`Tải lên thất bại (lỗi ${res.status}). Vui lòng thử lại.`);
        return;
      }

      const data = await res.json();
      if (data.attachment) {
        setAttachments((prev) => [...prev, data.attachment]);
      } else {
        console.error('Upload response missing attachment field. Full response:', data);
        setUploadError('Tải lên thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Lỗi khi tải lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    if (!confirm('Xóa tệp đính kèm này?')) return;
    try {
      const res = await fetch(`/api/attachments?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Delete attachment failed:', res.status, res.statusText);
        return;
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        Quay Lại
      </button>
      <div className="relative max-w-3xl mx-auto">

        {/* Ảnh đầu thư */}
        <img
          src="/assets-new-design/background-letter-3-header.png"
          alt=""
          className="block w-full h-auto"
        />

        {/* Phần thân thư - ảnh nền tự lặp theo chiều dài nội dung */}
        <div
          className="relative bg-repeat-y"
          style={{
            backgroundImage:
              "url('/assets-new-design/background-letter-3-wrap-content.png')",
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
          }}
        >
          {/* Content cách bên trái và bên phải 25px (mobile) / 65px (desktop) */}
          <div className="mx-[25px] md:mx-[65px] px-[15px] pb-[30px] sm:pb-[40px] md:pb-[50px]">

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 text-balance font-[family-name:var(--font-corinthia)]">{letter.title}</h1>
                  <p className="text-gray-700 mt-1 text-sm">Từ: {letter.from_user_name}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {formatDateVN(letter.created_at, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-1 shrink-0">
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        aria-label="Sửa thư"
                        className="grid place-items-center w-9 h-9 rounded-full text-gray-600 hover:text-rose-500 hover:bg-white/50 transition-colors"
                      >
                        <Pencil size={17} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={onDelete}
                        aria-label="Xóa thư"
                        className="grid place-items-center w-9 h-9 rounded-full text-gray-600 hover:text-red-500 hover:bg-white/50 transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {letter.scheduled_unlock_date && (
                <div className="border border-rose-300 rounded-lg px-4 py-3 mb-5 bg-white/30">
                  <p className="text-sm text-rose-900">
                    Thư hẹn mở lúc: {formatDateVN(letter.scheduled_unlock_date)} lúc{' '}
                    {formatTimeVN(letter.scheduled_unlock_date)}
                  </p>
                </div>
              )}

              {/* Content */}
              {letter.text_content && (
                <div className="mb-8">
                  <p className="whitespace-pre-wrap text-gray-900 leading-relaxed text-[20px] font-[family-name:var(--font-corinthia)]">
                    {letter.text_content}
                  </p>
                </div>
              )}

              {/* Attachments list */}
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-800 mb-3">Tệp Đính Kèm</h2>

                {loadingAttachments ? (
                  <p className="text-sm text-gray-400">Đang tải...</p>
                ) : attachments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có tệp đính kèm nào.</p>
                ) : (
                  <AttachmentGrid
                    attachments={attachments}
                    onDelete={isOwner ? handleDeleteAttachment : undefined}
                    showDelete={isOwner}
                  />
                )}
              </div>

              {/* Upload section — only owner, only when not confirmed-locked */}
              {isOwner && !letter.is_confirmed && (
                <div className="border-t border-gray-100 pt-6 space-y-5">
                  <h3 className="text-base font-semibold text-gray-800">Thêm Tệp Đính Kèm</h3>

                  {/* Multi-image upload */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Hình ảnh (chọn nhiều)</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-rose-200 text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <ImageIcon size={18} />
                      {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ thiết bị'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Chọn ảnh"
                    />
                  </div>

                  {/* Audio recording */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Ghi âm</p>

                    {!isRecording && !audioPreview && (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-rose-200 text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Mic size={18} />
                        Bắt đầu ghi âm
                      </button>
                    )}

                    {isRecording && (
                      <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                        <span className="text-sm text-red-600 font-medium flex-1">
                          Đang ghi âm... {formatDuration(recordingSeconds)}
                        </span>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <MicOff size={15} />
                          Dừng
                        </button>
                      </div>
                    )}

                    {!isRecording && audioPreview && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Play size={16} className="text-rose-500 shrink-0" />
                          <p className="text-sm text-rose-700 font-medium">Nghe lại trước khi lưu</p>
                        </div>
                        <audio controls src={audioPreview} className="w-full h-8" style={{ accentColor: '#f43f5e' }} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveRecording}
                            disabled={uploading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {uploading ? 'Đang lưu...' : 'Lưu ghi âm'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDiscardRecording}
                            disabled={uploading}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Hủy
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
        </div>

        {/* Ảnh cuối thư */}
        <img
          src="/assets-new-design/background-letter-3-bottom.png"
          alt=""
          className="block w-full h-auto"
        />

      </div>
    </div>
  );
}
