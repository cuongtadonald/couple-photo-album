'use client';

import { useState } from 'react';
import { MapPin, ExternalLink, X } from 'lucide-react';

interface LocationPickerProps {
  locationName: string;
  locationUrl: string;
  onLocationNameChange: (value: string) => void;
  onLocationUrlChange: (value: string) => void;
}

export default function LocationPicker({
  locationName,
  locationUrl,
  onLocationNameChange,
  onLocationUrlChange,
}: LocationPickerProps) {
  const [urlError, setUrlError] = useState('');

  const validateGoogleMapsUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname.includes('google.com') ||
        parsed.hostname.includes('maps.google') ||
        parsed.hostname.includes('goo.gl') ||
        parsed.hostname.includes('maps.app.goo.gl')
      );
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    onLocationUrlChange(value);
    if (value && !validateGoogleMapsUrl(value)) {
      setUrlError('Vui lòng dán link Google Maps hợp lệ');
    } else {
      setUrlError('');
    }
  };

  const handleClear = () => {
    onLocationNameChange('');
    onLocationUrlChange('');
    setUrlError('');
  };

  const hasLocation = locationName || locationUrl;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <MapPin size={14} className="text-gray-400" />
        <span>Địa điểm</span>
        <span className="text-gray-400 font-normal">(tùy chọn)</span>
      </label>

      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2.5">
        {/* Location name */}
        <div>
          <input
            type="text"
            value={locationName}
            onChange={(e) => onLocationNameChange(e.target.value)}
            placeholder="Tên địa điểm (vd: Cafe Trung Nguyên, Hồ Hoàn Kiếm...)"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Google Maps URL */}
        <div>
          <div className="relative">
            <input
              type="url"
              value={locationUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Dán link Google Maps vào đây..."
              className={`w-full rounded-md border bg-white px-3 py-2 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-colors ${
                urlError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-200 focus:border-rose-500'
              }`}
            />
            {locationUrl && (
              <button
                type="button"
                onClick={() => handleUrlChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Xóa link"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {urlError && (
            <p className="mt-1 text-xs text-red-500">{urlError}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Mở Google Maps &rarr; chia sẻ địa điểm &rarr; sao chép link dán vào đây
          </p>
        </div>

        {/* Preview */}
        {hasLocation && !urlError && (
          <div className="flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 px-3 py-2">
            <MapPin size={13} className="text-rose-500 shrink-0" />
            <span className="text-xs text-gray-700 flex-1 truncate">
              {locationName || 'Địa điểm đã lưu'}
            </span>
            {locationUrl && (
              <a
                href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-rose-600 hover:underline shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                <span>Xem bản đồ</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              aria-label="Xóa địa điểm"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
