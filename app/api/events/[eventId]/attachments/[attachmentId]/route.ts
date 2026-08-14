import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

    // Get file_url before deleting the record
    const [attachments] = await conn.execute(
      'SELECT file_url FROM event_attachments WHERE id = ? AND event_id = ?',
      [attachmentId, eventId]
    );

    if (!attachments || (attachments as any[]).length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const fileUrl = (attachments as any[])[0].file_url;

    // Delete database record
    await conn.execute(
      'DELETE FROM event_attachments WHERE id = ? AND event_id = ?',
      [attachmentId, eventId]
    );

    // Delete physical file (best-effort, don't fail if file doesn't exist)
    if (fileUrl && fileUrl.startsWith('/api/files/')) {
      const fileName = fileUrl.replace('/api/files/', '');
      const filePath = join(process.cwd(), 'storage', 'uploads', fileName);
      try {
        await unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.warn('Could not delete physical file:', filePath, fileError.message);
        }
      }
    }

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
