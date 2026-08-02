import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const albumId = params.albumId;
    const conn = await getConnection();

    // Check if album exists and belongs to user
    const [albums] = await conn.execute(
      'SELECT id, user_id FROM albums WHERE id = ?',
      [albumId]
    );

    if (!albums || (albums as any[]).length === 0) {
      conn.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const album = (albums as any[])[0];
    if (album.user_id !== decoded.userId) {
      conn.release();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate unique token
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 72 hours
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Create table if not exists
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS album_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        album_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
      )
    `);

    // Save to database
    await conn.execute(
      'INSERT INTO album_shares (album_id, token, expires_at) VALUES (?, ?, ?)',
      [albumId, shareToken, expiresAt]
    );

    conn.release();

    // Return the share link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/shared/${shareToken}`;

    return NextResponse.json({
      token: shareToken,
      shareLink,
      expiresAt,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}


