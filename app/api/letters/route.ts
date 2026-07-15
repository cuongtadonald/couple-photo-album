import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import * as jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const connection = await getConnection();
    
    // Get all letters (shared between both users)
    const [letters] = await connection.execute(
      `SELECT l.*, u.full_name as from_user_name FROM letters l
       JOIN users u ON l.from_user_id = u.id
       ORDER BY l.created_at DESC`
    );
    await connection.end();

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

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, textContent, scheduledUnlockDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate date format if provided
    if (scheduledUnlockDate) {
      const date = new Date(scheduledUnlockDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }

    const connection = await getConnection();
    const [result] = await connection.execute(
      `INSERT INTO letters (from_user_id, title, text_content, scheduled_unlock_date) 
       VALUES (?, ?, ?, ?)`,
      [decoded.userId, title, textContent || null, scheduledUnlockDate || null]
    );
    await connection.end();

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
