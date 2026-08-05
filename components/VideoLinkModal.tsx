'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { detectVideoType, isValidVideoUrl } from '@/lib/video-utils';
import Image from 'next/image';

interface VideoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoUrl: string, caption: string) => Promise<void>;
}

export default function VideoLinkModal({ isOpen, onClose, onSubmit }: VideoLinkModalProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const videoInfo = videoUrl ? detectVideoType(videoUrl) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!videoUrl) {
      setError('Vui lòng nhập link video');
      return;
    }

    if (!isValidVideoUrl(videoUrl)) {
      setError('Link video không hợp lệ. Hỗ trợ: YouTube, Google Drive, Vimeo, Dailymotion, hoặc link trực tiếp (.mp4, .webm)');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(videoUrl, caption);
      setVideoUrl('');
      setCaption('');
      onClose();
    } catch (err) {
      setError('Không thể thêm video. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVideoUrl('');
    setCaption('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-rose-100">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Thêm Video từ Link
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-rose-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Video URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Video
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setError('');
                }}
                placeholder="Dán link YouTube, Google Drive, Vimeo..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-700"
                required
              />
            </div>
            {videoInfo?.type && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                <span>
                  Phát hiện: {videoInfo.type === 'youtube' ? 'YouTube' : 
                             videoInfo.type === 'gdrive' ? 'Google Drive' :
                             videoInfo.type === 'vimeo' ? 'Vimeo' :
                             videoInfo.type === 'dailymotion' ? 'Dailymotion' :
                             'Video trực tiếp'}
                </span>
              </div>
            )}
          </div>

          {/* Preview */}
          {videoInfo?.embedUrl && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-2 text-xs text-gray-600 font-medium">
                Xem trước
              </div>
              <div className="aspect-video bg-black">
                {videoInfo.type === 'direct' ? (
                  <video
                    src={videoInfo.embedUrl}
                    className="w-full h-full object-contain"
                    controls
                    muted
                  />
                ) : (
                  <iframe
                    src={videoInfo.embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}

          {/* Thumbnail preview for YouTube */}
          {videoInfo?.thumbnailUrl && videoInfo.type === 'youtube' && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-2 text-xs text-gray-600 font-medium">
                Thumbnail
              </div>
              <Image
                src={videoInfo.thumbnailUrl}
                alt="Video thumbnail"
                width={400}
                height={225}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chú thích (tùy chọn)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Mô tả về video này..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-700 resize-none"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Supported formats */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">
              Định dạng hỗ trợ:
            </p>
            <ul className="text-xs text-blue-600 space-y-0.5">
              <li>• YouTube: https://youtube.com/watch?v=...</li>
              <li>• Google Drive: https://drive.google.com/file/d/...</li>
              <li>• Vimeo: https://vimeo.com/...</li>
              <li>• Dailymotion: https://dailymotion.com/video/...</li>
              <li>• Video trực tiếp: .mp4, .webm, .ogg</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !videoUrl}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Đang thêm...' : 'Thêm Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
