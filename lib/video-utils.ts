// Video link utilities

export type VideoType = 'youtube' | 'gdrive' | 'vimeo' | 'dailymotion' | 'direct' | null;

export interface VideoInfo {
  type: VideoType;
  id?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Detect video type from URL and extract video ID
 */
export function detectVideoType(url: string): VideoInfo {
  if (!url) return { type: null };

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      type: 'youtube',
      id: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }

  // Google Drive
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    return {
      type: 'gdrive',
      id: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      id: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  // Dailymotion
  const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return {
      type: 'dailymotion',
      id: videoId,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
    };
  }

  // Direct video link
  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return {
      type: 'direct',
      embedUrl: url,
    };
  }

  return { type: null };
}

/**
 * Get video source URL for HTML5 video player
 */
export function getVideoSourceUrl(url: string): string | null {
  const info = detectVideoType(url);
  
  if (info.type === 'direct') {
    return url;
  }
  
  return null;
}

/**
 * Check if URL is a valid video link
 */
export function isValidVideoUrl(url: string): boolean {
  const info = detectVideoType(url);
  return info.type !== null;
}
