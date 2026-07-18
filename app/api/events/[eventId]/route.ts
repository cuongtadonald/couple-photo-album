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

// Cập nhật sự kiện
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { eventId } = await params;
    const { title, description, eventDate, location, locationUrl, visibility } = await request.json();

    if (!title || !eventDate) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }
    if (!isValidDate(eventDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id FROM events WHERE id = ?', [eventId]);
    if ((rows as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const vis = visibility === 'public' ? 'public' : 'private';

    await connection.execute(
      `UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, location_url = ?, visibility = ? WHERE id = ?`,
      [title, description || null, toMysqlDateTime(eventDate), location || null, locationUrl || null, vis, eventId]
    );
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xóa sự kiện
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { eventId } = await params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT id FROM events WHERE id = ?', [eventId]);
    if ((rows as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await connection.execute('DELETE FROM events WHERE id = ?', [eventId]);
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
