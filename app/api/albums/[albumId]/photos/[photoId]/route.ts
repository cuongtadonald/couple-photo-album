import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

async function authorize(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Invalid token', status: 401 as const };
  return { decoded };
}

// Sửa chú thích ảnh
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string; photoId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { photoId } = await params;
    const { caption, locationName, locationUrl } = await request.json();

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id FROM photos WHERE id = ?', [photoId]);
    if ((rows as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    try {
      await connection.execute(
        'UPDATE photos SET caption = ?, location_name = ?, location_url = ? WHERE id = ?',
        [caption || null, locationName || null, locationUrl || null, photoId]
      );
    } catch (updateErr: any) {
      if (updateErr?.code === 'ER_BAD_FIELD_ERROR') {
        await connection.execute('UPDATE photos SET caption = ? WHERE id = ?', [caption || null, photoId]);
      } else {
        connection.release();
        throw updateErr;
      }
    }
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xóa ảnh (kèm xóa file vật lý và gỡ ảnh bìa nếu đang dùng)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string; photoId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { albumId, photoId } = await params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT image_url FROM photos WHERE id = ?', [photoId]);
    const photo = (rows as any[])[0];
    if (!photo) {
      connection.release();
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Nếu ảnh này đang là ảnh bìa của album thì gỡ ra
    await connection.execute(
      'UPDATE albums SET cover_photo_id = NULL WHERE id = ? AND cover_photo_id = ?',
      [albumId, photoId]
    );

    await connection.execute('DELETE FROM photos WHERE id = ?', [photoId]);
    connection.release();

    if (photo.image_url && photo.image_url.startsWith('/uploads/')) {
      try {
        await unlink(join(process.cwd(), 'public', photo.image_url));
      } catch (e) { /* file có thể đã bị xóa */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
