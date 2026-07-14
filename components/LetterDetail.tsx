'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Music, Image as ImageIcon } from 'lucide-react';

interface Letter {
  id: number;
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
  onBack: () => void;
}

export default function LetterDetail({ letter, token, onBack }: LetterDetailProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    fetchAttachments();
    startAudioRecording();
  }, [token, letter.id]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/attachments?letterId=${letter.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const handleStartRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.start();
      setRecordingAudio(true);
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorder && recordingAudio) {
      mediaRecorder.stop();
      setRecordingAudio(false);

      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        const audioBlob = event.data;
        await uploadAttachment(audioBlob, 'audio', 'audio.wav');
      };
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      await uploadAttachment(file, fileType, file.name);
    }
  };

  const uploadAttachment = async (file: Blob, fileType: string, fileName: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('letterId', letter.id.toString());
      formData.append('fileType', fileType);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.attachment) {
        setAttachments([...attachments, data.attachment]);
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-6"
      >
        <ArrowLeft size={20} />
        Quay Lại
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{letter.title}</h1>
              <p className="text-gray-600 mt-2">Từ: {letter.from_user_name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(letter.created_at).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {letter.scheduled_unlock_date && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-rose-700">
                Thư được hẹn mở lúc: {new Date(letter.scheduled_unlock_date).toLocaleDateString('vi-VN')} lúc{' '}
                {new Date(letter.scheduled_unlock_date).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          )}
        </div>

        {/* Letter Content */}
        {letter.text_content && (
          <div className="mb-8 p-6 bg-rose-50 rounded-lg border border-rose-200">
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {letter.text_content}
            </p>
          </div>
        )}

        {/* Attachments */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tệp Đính Kèm</h2>

          {loading ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : attachments.length === 0 ? (
            <p className="text-gray-600">Không có tệp đính kèm</p>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {attachment.file_type === 'image' && (
                      <ImageIcon size={20} className="text-blue-500" />
                    )}
                    {attachment.file_type === 'audio' && (
                      <Music size={20} className="text-green-500" />
                    )}
                    <span className="text-sm text-gray-700">{attachment.file_name}</span>
                  </div>
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                  >
                    Xem
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm Tệp Đính Kèm</h3>
          <div className="flex gap-3 flex-wrap">
            <label className="flex-1 min-w-[200px]">
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <ImageIcon size={20} />
                Tải Ảnh
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <Button
              onClick={recordingAudio ? handleStopRecording : handleStartRecording}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 ${
                recordingAudio
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              disabled={uploading}
            >
              <Music size={20} />
              {recordingAudio ? 'Dừng Ghi Âm' : 'Ghi Âm'}
            </Button>
          </div>
          {uploading && <p className="text-sm text-gray-600 mt-2">Đang tải...</p>}
        </div>
      </div>
    </div>
  );
}
