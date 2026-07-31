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
      setUrlError('Vui long dan link Google Maps hop le');
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MapPin size={14} className="text-muted-foreground" />
        <span>Dia diem</span>
        <span className="text-muted-foreground font-normal">(tuy chon)</span>
      </label>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
        {/* Location name */}
        <div>
          <input
            type="text"
            value={locationName}
            onChange={(e) => onLocationNameChange(e.target.value)}
            placeholder="Ten dia diem (vd: Cafe Trung Nguyen, Ho Hoan Kiem...)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        {/* Google Maps URL */}
        <div>
          <div className="relative">
            <input
              type="url"
              value={locationUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Dan link Google Maps vao day..."
              className={`w-full rounded-md border bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                urlError ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : 'border-border focus:border-primary'
              }`}
            />
            {locationUrl && (
              <button
                type="button"
                onClick={() => handleUrlChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Xoa link"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {urlError && (
            <p className="mt-1 text-xs text-destructive">{urlError}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Mo Google Maps &rarr; chia se dia diem &rarr; sao chep link dan vao day
          </p>
        </div>

        {/* Preview */}
        {hasLocation && !urlError && (
          <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
            <MapPin size={13} className="text-primary shrink-0" />
            <span className="text-xs text-foreground flex-1 truncate">
              {locationName || 'Dia diem da luu'}
            </span>
            {locationUrl && (
              <a
                href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                <span>Xem ban do</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              aria-label="Xoa dia diem"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
