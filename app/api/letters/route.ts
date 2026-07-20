import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { toMysqlDateTime, isValidDate } from '@/lib/datetime';

// Migration tự động: thêm is_confirmed nếu chưa có
let migrationDone = false;
async function ensureMigration() {
  if (migrationDone) return;
  const conn = await pool.getConnection();
  try {
    await conn.execute('ALTER TABLE letters ADD COLUMN is_confirmed BOOLEAN DEFAULT FALSE');
  } catch (_) { /* cột đã tồn tại */ }
  try {
    await conn.execute('ALTER TABLE letters ADD COLUMN confirmed_at DATETIME');
  } catch (_) { /* cột đã tồn tại */ }
  conn.release();
  migrationDone = true;
}

export async function GET(request: NextRequest) {
  await ensureMigration();
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
    // Lấy tất cả thư (dùng chung), kèm from_user_id để xác định quyền chỉnh sửa
    const [letters] = await connection.execute(
      `SELECT l.*, u.full_name as from_user_name FROM letters l
       JOIN users u ON l.from_user_id = u.id
       ORDER BY l.created_at DESC`
    );
    connection.release();

    return NextResponse.json({ letters });
  } catch (error) {
    console.error('Error fetching letters:', error);
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

    const { title, textContent, scheduledUnlockDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (scheduledUnlockDate && !isValidDate(scheduledUnlockDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const unlockDate = toMysqlDateTime(scheduledUnlockDate);

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO letters (from_user_id, title, text_content, scheduled_unlock_date) 
       VALUES (?, ?, ?, ?)`,
      [decoded.userId, title, textContent || null, unlockDate]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        letter: {
          id: (result as any).insertId,
          from_user_id: decoded.userId,
          title,
          text_content: textContent,
          scheduled_unlock_date: unlockDate,
          is_opened: false,
          is_confirmed: false,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating letter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/letters — xác nhận khóa thư (is_confirmed = true)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { letterId } = await request.json();
    if (!letterId) return NextResponse.json({ error: 'letterId is required' }, { status: 400 });

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT from_user_id, is_confirmed FROM letters WHERE id = ?', [letterId]);
    const letter = (rows as any[])[0];
    if (!letter) {
      connection.release();
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }
    if (letter.from_user_id !== decoded.userId) {
      connection.release();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (letter.is_confirmed) {
      connection.release();
      return NextResponse.json({ error: 'Thư đã được xác nhận trước đó' }, { status: 409 });
    }

    await connection.execute(
      'UPDATE letters SET is_confirmed = TRUE, confirmed_at = NOW() WHERE id = ?',
      [letterId]
    );
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming letter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
