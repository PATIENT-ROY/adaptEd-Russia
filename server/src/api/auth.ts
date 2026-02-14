import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { hashPassword, generateToken, authenticateUser } from '../lib/auth';
import { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '@/types';

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  language: z.enum(['RU', 'EN', 'FR', 'AR', 'ZH']).default('RU'),
  country: z.string().min(2, 'Укажите страну'),
});

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

// Регистрация
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      } as ApiResponse);
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(validatedData.password);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        language: validatedData.language,
        country: validatedData.country,
      },
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

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      user: user as any,
      token,
      message: 'Пользователь успешно зарегистрирован',
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'Пользователь успешно зарегистрирован'
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Вход в систему
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Аутентифицируем пользователя
    const user = await authenticateUser(validatedData.email, validatedData.password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      } as ApiResponse);
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      user: user as any,
      token,
      message: 'Успешный вход в систему',
    };

    res.json({
      success: true,
      data: response,
      message: 'Успешный вход в систему'
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Проверка токена
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Токен доступа не предоставлен'
      } as ApiResponse);
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import('../lib/auth');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Недействительный токен'
      } as ApiResponse);
    }

    // Получаем актуальные данные пользователя
    const { getUserById } = await import('../lib/auth');
    const user = await getUserById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { user },
      message: 'Токен действителен'
    } as ApiResponse);

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

export default router; 