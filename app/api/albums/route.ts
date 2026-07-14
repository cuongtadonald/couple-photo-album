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
    const [albums] = await connection.execute(
      `SELECT a.*, COUNT(p.id) as photo_count FROM albums a 
       LEFT JOIN photos p ON a.id = p.album_id
       WHERE a.user_id = ? GROUP BY a.id`,
      [decoded.userId]
    );
    connection.release();

    return NextResponse.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
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

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO albums (user_id, title, description) VALUES (?, ?, ?)',
      [decoded.userId, title, description || null]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        album: {
          id: (result as any).insertId,
          userId: decoded.userId,
          title,
          description,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
