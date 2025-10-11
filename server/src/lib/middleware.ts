import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Добавляем информацию о пользователе в request
  (req as any).user = payload;
  next();
}

export function getAuthUser(req: Request) {
  return (req as any).user;
} 