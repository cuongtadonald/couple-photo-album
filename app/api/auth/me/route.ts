import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const connection = await getConnection();
    const [users] = await connection.execute(
      'SELECT id, email, full_name, role, profile_image_url FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      connection.release();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = (users as any[])[0];
    connection.release();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        profileImageUrl: user.profile_image_url,
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
