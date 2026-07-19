import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join, extname, normalize } from 'path';
import { Readable } from 'stream';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  webm: 'audio/webm',
  pdf: 'application/pdf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Prevent path traversal: each segment must not contain '..'
    if (pathSegments.some((seg) => seg.includes('..'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const storageDir = join(process.cwd(), 'storage', 'uploads');
    const filePath = normalize(join(storageDir, ...pathSegments));

    // Ensure the resolved path is still inside storage/uploads
    if (!filePath.startsWith(storageDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(filePath);
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ext = extname(filePath).replace('.', '').toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
