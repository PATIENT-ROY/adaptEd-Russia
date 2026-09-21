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
  tokenVersion: number;
}

export const BCRYPT_PASSWORD_MAX_BYTES = 72;

export function passwordFitsBcryptLimit(password: string): boolean {
  return Buffer.byteLength(password, 'utf8') <= BCRYPT_PASSWORD_MAX_BYTES;
}

export async function hashPassword(password: string): Promise<string> {
  if (!passwordFitsBcryptLimit(password)) {
    throw new RangeError(`Password exceeds bcrypt's ${BCRYPT_PASSWORD_MAX_BYTES}-byte limit`);
  }
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  if (!passwordFitsBcryptLimit(password)) return false;
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
      tokenVersion: Number(payload.tokenVersion || 0),
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
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
      tokenVersion: true,
      blockedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await comparePasswords(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  if (user.blockedAt) {
    return { blocked: true as const };
  }

  const { password: _, blockedAt: _blockedAt, ...userWithoutPassword } = user;
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
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true, blockedAt: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Сеанс завершён. Войдите снова.' });
    }

    if (user.blockedAt) {
      return res.status(403).json({ error: 'ACCOUNT_BLOCKED' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ error: 'Не удалось проверить сеанс' });
  }
}
