import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcryptjs.compare(password, hashedPassword);
};

export const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: number; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch {
    return null;
  }
};
