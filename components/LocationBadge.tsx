'use client';

import { MapPin } from 'lucide-react';

interface LocationBadgeProps {
  locationName?: string | null;
  locationUrl?: string | null;
  /** Text shown when there is no location_name but there is a URL */
  fallbackLabel?: string;
  className?: string;
}

/**
 * Displays a location badge.
 * - If locationUrl is present, the badge is a clickable link that opens Google Maps.
 * - If only locationName is present (no URL), it renders as plain text.
 * - Returns null when both are empty/null.
 */
export default function LocationBadge({
  locationName,
  locationUrl,
  fallbackLabel = 'Xem bản đồ',
  className = '',
}: LocationBadgeProps) {
  if (!locationName && !locationUrl) return null;

  const label = locationName || fallbackLabel;

  const inner = (
    <span className="flex items-center gap-1 min-w-0">
      <MapPin size={11} className="shrink-0" />
      <span className="truncate max-w-[120px] sm:max-w-[160px]" title={locationUrl || label}>{label}</span>
    </span>
  );

  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium truncate ' + className;

  if (locationUrl) {
    return (
      <a
        href={locationUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={base + ' bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors cursor-pointer'}
        title="Mở Google Maps"
        aria-label={`Mở Google Maps: ${label}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <span className={base + ' bg-gray-100 text-gray-700'}>
      {inner}
    </span>
  );
}
