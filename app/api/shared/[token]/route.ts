import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  let conn;
  try {
    const { token } = await params;
    conn = await getConnection();

    // Đảm bảo bảng album_shares tồn tại
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS album_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        album_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_expires (expires_at)
      )
    `);

    // Đảm bảo bảng photo_stickers tồn tại
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS photo_stickers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        photo_id INT NOT NULL,
        user_id INT NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        position_x DOUBLE NOT NULL DEFAULT 50,
        position_y DOUBLE NOT NULL DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_photo (photo_id)
      )
    `);

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

    // Get photos with location info
    let photos: any[];
    try {
      [photos] = await conn.execute(
        'SELECT id, image_url, caption, created_at, location_name, location_url FROM photos WHERE album_id = ? ORDER BY created_at DESC',
        [share.album_id]
      );
    } catch {
      // Fallback: columns location_name, location_url có thể chưa tồn tại
      [photos] = await conn.execute(
        'SELECT id, image_url, caption, created_at FROM photos WHERE album_id = ? ORDER BY created_at DESC',
        [share.album_id]
      );
    }

    // Get stickers for each photo (skip if table doesn't exist or error)
    const photosWithStickers = await Promise.all(
      (photos as any[]).map(async (photo) => {
        let stickers: any[] = [];
        try {
          const [rows] = await conn.execute(
            'SELECT id, emoji, pos_x, pos_y, size, rotation FROM photo_stickers WHERE photo_id = ?',
            [photo.id]
          );
          stickers = rows as any[];
        } catch {
          // Bỏ qua nếu bảng photo_stickers chưa tồn tại
        }

        return {
          id: photo.id,
          imageUrl: photo.image_url,
          caption: photo.caption,
          createdAt: photo.created_at,
          locationName: photo.location_name || null,
          locationUrl: photo.location_url || null,
          isVideo: !!photo.is_video,
          stickers: stickers.map((s) => ({
            id: s.id,
            emoji: s.emoji,
            positionX: s.pos_x,
            positionY: s.pos_y,
            size: s.size,
            rotation: s.rotation,
          })),
        };
      })
    );

    conn.release();

    // Return album data (without user info for privacy)
    const albumData = {
      id: album.id,
      title: album.title,
      description: album.description,
      expiresAt: share.expires_at,
      photos: photosWithStickers,
    };

    return NextResponse.json({ album: albumData });
  } catch (error) {
    console.error('Error fetching shared album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch shared album: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

