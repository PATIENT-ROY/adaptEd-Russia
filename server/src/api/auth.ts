import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { hashPassword, generateToken, authenticateUser, authMiddleware } from '../lib/auth';
import { sendInviteEmail } from '../lib/email';
import { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '../types/index.js';
import crypto from 'crypto';

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z
    .string()
    .min(8, 'Пароль минимум 8 символов')
    .regex(/[A-Z]/, 'Минимум одна заглавная буква')
    .regex(/[a-z]/, 'Минимум одна строчная буква')
    .regex(/[0-9]/, 'Минимум одна цифра'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  language: z.enum(['RU', 'EN', 'FR', 'AR', 'ZH']).default('RU'),
  country: z.string().min(2, 'Укажите страну'),
});

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

const adminInviteSchema = z.object({
  email: z.string().email('Неверный формат email'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  country: z.string().min(2, 'Укажите страну'),
  language: z.enum(['RU', 'EN', 'FR', 'AR', 'ZH']).default('RU'),
  role: z.enum(['STUDENT', 'ADMIN', 'GUEST']).default('STUDENT'),
});

const setPasswordSchema = z.object({
  token: z.string().min(16, 'Недействительный токен'),
  password: z
    .string()
    .min(8, 'Пароль минимум 8 символов')
    .regex(/[A-Z]/, 'Минимум одна заглавная буква')
    .regex(/[a-z]/, 'Минимум одна строчная буква')
    .regex(/[0-9]/, 'Минимум одна цифра'),
});

function createPasswordSetupToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

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

// Приглашение пользователя администратором (создание ссылки на установку пароля)
router.post('/admin/invite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещён'
      } as ApiResponse);
    }

    const validatedData = adminInviteSchema.parse(req.body);
    const normalizedEmail = validatedData.email.trim().toLowerCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 часа
    const { rawToken, tokenHash } = createPasswordSetupToken();
    const tempPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, role: true, language: true, country: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: validatedData.name,
          country: validatedData.country,
          language: validatedData.language,
          role: validatedData.role,
          password: tempPasswordHash,
        },
        select: { id: true, email: true, name: true, role: true, language: true, country: true },
      });
    }

    // Отзываем старые неиспользованные токены
    await prisma.passwordSetupToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    await prisma.passwordSetupToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const setupLink = `${appBaseUrl}/set-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    const emailResult = await sendInviteEmail({
      to: user.email,
      recipientName: user.name,
      setupLink,
      expiresAtIso: expiresAt.toISOString(),
    });

    return res.status(201).json({
      success: true,
      data: {
        user,
        setupLink,
        expiresAt: expiresAt.toISOString(),
        emailSent: emailResult.sent,
        emailProvider: emailResult.provider,
        emailError: emailResult.error,
      },
      message: emailResult.sent
        ? 'Пользователь приглашён. Письмо отправлено.'
        : 'Пользователь приглашён. Не удалось отправить письмо автоматически, передайте ссылку вручную.'
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }
    console.error('Admin invite error:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Проверка токена установки пароля
router.get('/set-password/verify', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Токен обязателен'
    } as ApiResponse);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const setupToken = await prisma.passwordSetupToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      }
    }
  });

  if (!setupToken || setupToken.usedAt || setupToken.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Ссылка недействительна или истекла'
    } as ApiResponse);
  }

  return res.json({
    success: true,
    data: {
      valid: true,
      email: setupToken.user.email,
      name: setupToken.user.name,
      expiresAt: setupToken.expiresAt.toISOString(),
    }
  } as ApiResponse);
});

// Установка пароля по одноразовому invite-токену
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const validatedData = setPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(validatedData.token).digest('hex');
    const now = new Date();

    const setupToken = await prisma.passwordSetupToken.findUnique({
      where: { tokenHash },
    });

    if (!setupToken || setupToken.usedAt || setupToken.expiresAt < now) {
      return res.status(400).json({
        success: false,
        error: 'Ссылка недействительна или истекла'
      } as ApiResponse);
    }

    const hashedPassword = await hashPassword(validatedData.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: setupToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordSetupToken.update({
        where: { id: setupToken.id },
        data: { usedAt: now },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Пароль успешно установлен'
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }
    console.error('Set password error:', error);
    return res.status(500).json({
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
    const { verifyToken } = await import('../lib/auth.js');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Недействительный токен'
      } as ApiResponse);
    }

    // Получаем актуальные данные пользователя
    const { getUserById } = await import('../lib/auth.js');
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
