import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './database';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ JWT_SECRET is required in production environment');
  }
  // DEVELOPMENT: Генерируем случайный secret вместо hardcoded
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] ⚠️ No JWT_SECRET provided, generated random secret for development');
}
const JWT_SECRET: string = jwtSecret;
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') return null;
    const payload = decoded as JwtPayload;
    if (!payload.userId || !payload.email || !payload.role) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      language: true,
      country: true,
      university: true,
      faculty: true,
      year: true,
      plan: true,
      phone: true,
      gender: true,
      registeredAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await comparePasswords(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      language: true,
      country: true,
      university: true,
      faculty: true,
      year: true,
      plan: true,
      phone: true,
      gender: true,
      registeredAt: true,
    },
  });
}

// Middleware для проверки аутентификации
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }

  // Добавляем информацию о пользователе в request
  (req as any).user = payload;
  next();
} 
