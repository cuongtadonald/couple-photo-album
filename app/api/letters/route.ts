import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { toMysqlDateTime, isValidDate } from '@/lib/datetime';

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
