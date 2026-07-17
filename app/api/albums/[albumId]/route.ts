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

// Cập nhật album: tiêu đề, mô tả, chế độ hiển thị, ảnh bìa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { albumId } = await params;
    const body = await request.json();
    const { title, description, visibility, coverPhotoId } = body;

    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT * FROM albums WHERE id = ?', [albumId]);
    const album = (rows as any[])[0];
    if (!album) {
      connection.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const newTitle = title ?? album.title;
    const newDescription = description !== undefined ? description : album.description;
    const newVisibility =
      visibility === 'public' || visibility === 'private' ? visibility : album.visibility;
    const newCover = coverPhotoId !== undefined ? coverPhotoId : album.cover_photo_id;

    await connection.execute(
      `UPDATE albums SET title = ?, description = ?, visibility = ?, cover_photo_id = ? WHERE id = ?`,
      [newTitle, newDescription || null, newVisibility, newCover || null, albumId]
    );
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xóa album (kèm xóa các file ảnh trong public/uploads)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { albumId } = await params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT id FROM albums WHERE id = ?', [albumId]);
    if ((rows as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Lấy đường dẫn ảnh để xóa file vật lý
    const [photos] = await connection.execute(
      'SELECT image_url FROM photos WHERE album_id = ?',
      [albumId]
    );

    // Xóa album (photos tự xóa theo ON DELETE CASCADE)
    await connection.execute('DELETE FROM albums WHERE id = ?', [albumId]);
    connection.release();

    // Xóa file ảnh cục bộ (bỏ qua nếu lỗi)
    for (const p of photos as any[]) {
      if (p.image_url && p.image_url.startsWith('/uploads/')) {
        try {
          await unlink(join(process.cwd(), 'public', p.image_url));
        } catch (e) { /* file có thể đã bị xóa */ }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
