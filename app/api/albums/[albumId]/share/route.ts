import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  let conn;
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { albumId } = await params;
    
    // Validate albumId
    if (!albumId) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }
    
    conn = await getConnection();

    // Create table if not exists (chạy trước để đảm bảo bảng tồn tại)
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

    // Check if album exists and belongs to user
    const [albums] = await conn.execute(
      'SELECT id, user_id FROM albums WHERE id = ?',
      [albumId]
    );

    if (!albums || (albums as any[]).length === 0) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const album = (albums as any[])[0];
    if (album.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate unique token
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 72 hours - format as MySQL datetime string
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    // Save to database - ensure all parameters are defined
    const albumIdNum = parseInt(albumId);
    if (isNaN(albumIdNum)) {
      return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 });
    }
    
    await conn.execute(
      'INSERT INTO album_shares (album_id, token, expires_at) VALUES (?, ?, ?)',
      [albumIdNum, shareToken, expiresAtStr]
    );

    // Return the share link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const shareLink = `${baseUrl}/shared/${shareToken}`;

    return NextResponse.json({
      token: shareToken,
      shareLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: `Failed to create share link: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}


