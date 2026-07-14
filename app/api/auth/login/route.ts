import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode || passcode.length !== 6) {
      return NextResponse.json(
        { error: 'Mã gán phải đúng 6 số' },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    const [users] = await connection.execute('SELECT * FROM users');

    let user = null;
    if (Array.isArray(users)) {
      for (const u of users as any[]) {
        const passwordMatch = await bcrypt.compare(passcode, u.password);
        if (passwordMatch) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      await connection.end();
      return NextResponse.json(
        { error: 'Mã gán không đúng' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      profileImageUrl: user.profile_image_url,
    };

    await connection.end();

    return NextResponse.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}
