import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

type Params = { params: Promise<{ albumId: string; photoId: string }> };

// Tự tạo bảng nếu chưa tồn tại (migration-safe)
async function ensureTable(connection: Awaited<ReturnType<typeof pool.getConnection>>) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS photo_stickers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photo_id INT NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      pos_x FLOAT NOT NULL DEFAULT 50,
      pos_y FLOAT NOT NULL DEFAULT 50,
      size INT NOT NULL DEFAULT 48,
      rotation FLOAT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    )
  `);
}

// GET: lấy tất cả sticker của một ảnh
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { photoId } = await params;
    const connection = await pool.getConnection();
    await ensureTable(connection);
    const [rows] = await connection.execute(
      'SELECT * FROM photo_stickers WHERE photo_id = ? ORDER BY created_at ASC',
      [photoId]
    );
    connection.release();
    return NextResponse.json({ stickers: rows });
  } catch (error) {
    console.error('GET stickers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: thêm một sticker mới
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = await params;
    const { emoji, posX, posY, size, rotation } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'emoji is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    await ensureTable(connection);
    const [result] = await connection.execute(
      'INSERT INTO photo_stickers (photo_id, emoji, pos_x, pos_y, size, rotation) VALUES (?, ?, ?, ?, ?, ?)',
      [
        photoId,
        emoji,
        posX ?? 50,
        posY ?? 50,
        size ?? 48,
        rotation ?? 0,
      ]
    );
    connection.release();

    return NextResponse.json(
      {
        sticker: {
          id: (result as any).insertId,
          photo_id: Number(photoId),
          emoji,
          pos_x: posX ?? 50,
          pos_y: posY ?? 50,
          size: size ?? 48,
          rotation: rotation ?? 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST sticker error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: cập nhật vị trí/kích thước/góc xoay của sticker (batch)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stickers } = await request.json() as {
      stickers: { id: number; posX: number; posY: number; size: number; rotation: number }[];
    };

    if (!Array.isArray(stickers) || stickers.length === 0) {
      return NextResponse.json({ error: 'stickers array required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    await ensureTable(connection);
    for (const s of stickers) {
      await connection.execute(
        'UPDATE photo_stickers SET pos_x = ?, pos_y = ?, size = ?, rotation = ? WHERE id = ?',
        [s.posX, s.posY, s.size, s.rotation, s.id]
      );
    }
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT stickers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: xóa một sticker theo id, hoặc xóa tất cả nếu có query ?all=1
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = await params;
    const { searchParams } = request.nextUrl;

    const connection = await pool.getConnection();
    await ensureTable(connection);

    if (searchParams.get('all') === '1') {
      await connection.execute('DELETE FROM photo_stickers WHERE photo_id = ?', [photoId]);
    } else {
      const stickerId = searchParams.get('id');
      if (!stickerId) {
        connection.release();
        return NextResponse.json({ error: 'id or ?all=1 required' }, { status: 400 });
      }
      await connection.execute('DELETE FROM photo_stickers WHERE id = ? AND photo_id = ?', [stickerId, photoId]);
    }

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE sticker error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
