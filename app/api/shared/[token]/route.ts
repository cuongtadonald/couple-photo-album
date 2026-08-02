import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const conn = await getConnection();

    // Find share record
    const [shares] = await conn.execute(
      'SELECT * FROM album_shares WHERE token = ?',
      [token]
    );

    if (!shares || (shares as any[]).length === 0) {
      conn.release();
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    const share = (shares as any[])[0];

    // Check if expired
    if (new Date() > new Date(share.expires_at)) {
      conn.release();
      return NextResponse.json({ error: 'Share link expired' }, { status: 410 });
    }

    // Get album data
    const [albums] = await conn.execute(
      'SELECT id, title, description FROM albums WHERE id = ?',
      [share.album_id]
    );

    if (!albums || (albums as any[]).length === 0) {
      conn.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const album = (albums as any[])[0];

    // Get photos
    const [photos] = await conn.execute(
      'SELECT id, image_url, caption, created_at FROM photos WHERE album_id = ? ORDER BY created_at DESC',
      [share.album_id]
    );

    conn.release();

    // Return album data (without user info for privacy)
    const albumData = {
      id: album.id,
      title: album.title,
      description: album.description,
      photos: (photos as any[]).map((photo) => ({
        id: photo.id,
        imageUrl: photo.image_url,
        caption: photo.caption,
        createdAt: photo.created_at,
      })),
    };

    return NextResponse.json({ album: albumData });
  } catch (error) {
    console.error('Error fetching shared album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared album' },
      { status: 500 }
    );
  }
}

