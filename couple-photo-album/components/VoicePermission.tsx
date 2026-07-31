'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function VoicePermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if microphone permission is supported
    if (!navigator.permissions || !navigator.mediaDevices) {
      return;
    }

    // Check current permission status
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
      setPermissionStatus(result.state);

      // Show prompt if permission is not granted
      if (result.state === 'prompt' || result.state === 'denied') {
        setShowPrompt(true);
        setTimeout(() => setIsVisible(true), 100);
      }

      // Listen for permission changes
      result.addEventListener('change', () => {
        setPermissionStatus(result.state);
        if (result.state === 'granted') {
          setIsVisible(false);
          setTimeout(() => setShowPrompt(false), 300);
        }
      });
    }).catch((err) => {
      console.log('Permission check not supported:', err);
    });
  }, []);

  const requestPermission = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      setIsVisible(false);
      setTimeout(() => setShowPrompt(false), 300);
    } catch (err) {
      console.error('Microphone permission denied:', err);
      // Keep the prompt visible if denied
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    setTimeout(() => setShowPrompt(false), 300);
  };

  if (!showPrompt) return null;

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-pink-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Mic size={20} />
            <span className="font-semibold text-sm">Quyền truy cập micro</span>
          </div>
          <button
            onClick={dismissPrompt}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {permissionStatus === 'denied' ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <MicOff size={20} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    Bạn đã từ chối quyền truy cập micro.
                  </p>
                  <p className="text-xs text-gray-500">
                    Để sử dụng tính năng ghi âm, vui lòng cấp quyền micro trong cài đặt trình duyệt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.open('chrome://settings/content/microphone', '_blank')}
                className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg"
              >
                Mở cài đặt trình duyệt
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Mic size={20} className="text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    Ứng dụng cần quyền truy cập micro để ghi âm.
                  </p>
                  <p className="text-xs text-gray-500">
                    Bạn có thể ghi âm lời nhắn, âm thanh và.attachments vào album của mình.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={dismissPrompt}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Để sau
                </button>
                <button
                  onClick={requestPermission}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg"
                >
                  Cho phép
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
