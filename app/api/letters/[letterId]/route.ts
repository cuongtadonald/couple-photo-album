import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { toMysqlDateTime, isValidDate } from '@/lib/datetime';

async function authorize(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Invalid token', status: 401 as const };
  return { decoded };
}

// Sửa thư - chỉ chính chủ (from_user_id)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { letterId } = await params;
    const { title, textContent, scheduledUnlockDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (scheduledUnlockDate && !isValidDate(scheduledUnlockDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT from_user_id FROM letters WHERE id = ?',
      [letterId]
    );
    const letter = (rows as any[])[0];
    if (!letter) {
      connection.release();
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }
    if (letter.from_user_id !== auth.decoded.userId) {
      connection.release();
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa thư này' },
        { status: 403 }
      );
    }

    await connection.execute(
      `UPDATE letters SET title = ?, text_content = ?, scheduled_unlock_date = ? WHERE id = ?`,
      [title, textContent || null, toMysqlDateTime(scheduledUnlockDate), letterId]
    );
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating letter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xóa thư - chỉ chính chủ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { letterId } = await params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT from_user_id FROM letters WHERE id = ?',
      [letterId]
    );
    const letter = (rows as any[])[0];
    if (!letter) {
      connection.release();
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }
    if (letter.from_user_id !== auth.decoded.userId) {
      connection.release();
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa thư này' },
        { status: 403 }
      );
    }

    await connection.execute('DELETE FROM letters WHERE id = ?', [letterId]);
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting letter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
