import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    
    // Get letters sent to this user
    const [letters] = await connection.execute(
      `SELECT l.*, u.full_name as from_user_name FROM letters l
       JOIN users u ON l.from_user_id = u.id
       WHERE l.to_user_id = ? 
       ORDER BY l.created_at DESC`,
      [decoded.userId]
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

    const { title, textContent, toUserId, scheduledUnlockDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO letters (from_user_id, to_user_id, title, text_content, scheduled_unlock_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [decoded.userId, toUserId || null, title, textContent || null, scheduledUnlockDate || null]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        letter: {
          id: (result as any).insertId,
          fromUserId: decoded.userId,
          toUserId: toUserId || null,
          title,
          textContent,
          scheduledUnlockDate,
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
