import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    // Hiển thị album public của mọi người + album private của chính mình.
    // cover_image_url: ưu tiên ảnh bìa đã chọn, nếu không thì lấy ảnh đầu tiên.
    const [albums] = await connection.execute(
      `SELECT a.*,
        u.full_name as uploader_name,
        COUNT(p.id) as photo_count,
        COALESCE(
          cover.image_url,
          (SELECT image_url FROM photos WHERE album_id = a.id ORDER BY created_at ASC LIMIT 1)
        ) as cover_image_url
       FROM albums a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN photos p ON a.id = p.album_id
       LEFT JOIN photos cover ON cover.id = a.cover_photo_id
       WHERE a.visibility = 'public' OR a.user_id = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [decoded.userId]
    );
    connection.release();

    return NextResponse.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, description, visibility, locationName, locationUrl } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const vis = visibility === 'public' ? 'public' : 'private';

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO albums (user_id, title, description, visibility, location_name, location_url) VALUES (?, ?, ?, ?, ?, ?)',
      [decoded.userId, title, description || null, vis, locationName || null, locationUrl || null]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        album: {
          id: (result as any).insertId,
          user_id: decoded.userId,
          title,
          description,
          visibility: vis,
          location_name: locationName || null,
          location_url: locationUrl || null,
          photo_count: 0,
          cover_image_url: null,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
