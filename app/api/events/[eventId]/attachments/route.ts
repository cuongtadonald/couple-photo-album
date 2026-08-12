import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; attachmentId: string }> }
) {
  let conn;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { eventId, attachmentId } = await params;
    conn = await getConnection();

    // Verify attachment exists and belongs to this event
    const [attachments] = await conn.execute(
      'SELECT id FROM event_attachments WHERE id = ? AND event_id = ?',
      [attachmentId, eventId]
    );

    if (!attachments || (attachments as any[]).length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete attachment
    await conn.execute(
      'DELETE FROM event_attachments WHERE id = ?',
      [attachmentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
