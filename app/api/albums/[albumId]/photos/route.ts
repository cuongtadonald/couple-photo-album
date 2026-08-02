import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;

    // Phân trang: ?limit=..&offset=.. (mặc định 24 ảnh mỗi trang)
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const connection = await pool.getConnection();

    const [countRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM photos WHERE album_id = ?',
      [albumId]
    );
    const total = (countRows as any[])[0]?.total ?? 0;

    // LIMIT/OFFSET nội suy trực tiếp (đã ép kiểu số nguyên an toàn ở trên)
    const [photos] = await connection.execute(
      `SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [albumId]
    );
    connection.release();

    return NextResponse.json({
      photos,
      total,
      hasMore: offset + (photos as any[]).length < total,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { albumId } = await params;
    const { imageUrl, caption, locationName, locationUrl, isVideo } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    const [albums] = await connection.execute(
      'SELECT id FROM albums WHERE id = ?',
      [albumId]
    );

    if ((albums as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Ensure is_video column exists
    try {
      await connection.execute('ALTER TABLE photos ADD COLUMN is_video BOOLEAN DEFAULT FALSE');
    } catch {
      // Column already exists
    }

    let result: any;
    try {
      [result] = await connection.execute(
        'INSERT INTO photos (album_id, image_url, caption, location_name, location_url, is_video) VALUES (?, ?, ?, ?, ?, ?)',
        [albumId, imageUrl, caption || null, locationName || null, locationUrl || null, isVideo || false]
      );
    } catch (insertErr: any) {
      // Fallback: columns may not exist yet on older DB — insert without location fields
      if (insertErr?.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await connection.execute(
          'INSERT INTO photos (album_id, image_url, caption) VALUES (?, ?, ?)',
          [albumId, imageUrl, caption || null]
        );
      } else {
        connection.release();
        throw insertErr;
      }
    }
    connection.release();

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: (result as any).insertId,
          album_id: Number(albumId),
          image_url: imageUrl,
          caption: caption || '',
          location_name: locationName || null,
          location_url: locationUrl || null,
          is_video: isVideo || false,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
