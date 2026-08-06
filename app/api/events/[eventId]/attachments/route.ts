import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/events/[eventId]/attachments - Lấy danh sách tệp đính kèm của sự kiện
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
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

    const { eventId } = await params;

    const connection = await pool.getConnection();
    const [attachments] = await connection.execute(
      `SELECT ea.*, u.full_name as uploaded_by_name 
       FROM event_attachments ea
       JOIN users u ON ea.uploaded_by_user_id = u.id
       WHERE ea.event_id = ?
       ORDER BY ea.created_at ASC`,
      [eventId]
    );
    connection.release();

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching event attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/[eventId]/attachments - Thêm tệp đính kèm vào sự kiện
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
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

    const { eventId } = await params;
    const { fileUrl, fileName, fileType } = await request.json();

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'File URL and file name are required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    
    // Ensure table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        uploaded_by_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event (event_id)
      )
    `);
    
    const [result] = await connection.execute(
      `INSERT INTO event_attachments (event_id, file_url, file_name, file_type, uploaded_by_user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [eventId, fileUrl, fileName, fileType || 'image', decoded.userId]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        attachment: {
          id: (result as any).insertId,
          event_id: Number(eventId),
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType || 'image',
          uploaded_by_user_id: decoded.userId,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId]/attachments/[attachmentId] - Xóa tệp đính kèm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; attachmentId: string }> }
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

    const { eventId, attachmentId } = await params;

    const connection = await pool.getConnection();
    
    // Verify attachment belongs to this event and user owns it
    const [attachments] = await connection.execute(
      `SELECT ea.*, e.created_by_user_id 
       FROM event_attachments ea
       JOIN events e ON ea.event_id = e.id
       WHERE ea.id = ? AND ea.event_id = ? AND ea.uploaded_by_user_id = ?`,
      [attachmentId, eventId, decoded.userId]
    );

    if ((attachments as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Attachment not found or unauthorized' }, { status: 404 });
    }

    await connection.execute(
      'DELETE FROM event_attachments WHERE id = ?',
      [attachmentId]
    );
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
