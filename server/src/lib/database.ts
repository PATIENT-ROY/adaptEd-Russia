import { PrismaClient, Prisma } from '../../prisma/generated';
import { Response } from 'express';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Обработчик ошибок Prisma
export function handlePrismaError(error: unknown, res: Response): Response {
  console.error('Database error:', error);
  
  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Запись с такими данными уже существует',
          code: 'DUPLICATE_ENTRY',
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Запись не найдена',
          code: 'NOT_FOUND',
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Ошибка связи данных',
          code: 'FOREIGN_KEY_ERROR',
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Ошибка базы данных',
          code: error.code,
        });
    }
  }
  
  // Prisma initialization error (DB connection)
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      success: false,
      error: 'Сервер временно недоступен',
      code: 'DB_CONNECTION_ERROR',
    });
  }
  
  // Prisma validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Некорректные данные запроса',
      code: 'VALIDATION_ERROR',
    });
  }
  
  // Unknown error
  return res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && {
      debug: error instanceof Error ? error.message : String(error),
    }),
  });
} 