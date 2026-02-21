import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Импорты API маршрутов
import authRoutes from './api/auth.js';
import userRoutes from './api/user.js';
import guideRoutes from './api/guides.js';
import reminderRoutes from './api/reminders.js';
import chatRoutes from './api/chat.js';
import supportRoutes from './api/support.js';
import grantRoutes from './api/grants.js';
import paymentRoutes from './api/payments.js';
import scheduleRoutes from './api/schedule.js';
import questionRoutes from './api/questions.js';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 56548;

// Middleware безопасности
app.use(helmet());

      // CORS настройки
      app.use(cors({
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3007',
          'http://localhost:3008',
          'http://192.168.0.101:3000',
          'http://192.168.0.101:3001',
          'http://192.168.0.101:3002',
          'http://192.168.0.101:3007',
          'http://192.168.0.101:3008',
          '127.0.4.240:56548',
          'https://adaptedrussia.netlify.app', // Netlify production
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }));

const ENABLE_RATE_LIMIT = process.env.RATE_LIMIT !== 'false';

// Стандартный лимитер для большинства API
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимитер для аутентификации (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 попыток входа
  message: 'Слишком много попыток входа, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимитер для AI чата (ресурсоёмкие запросы)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // максимум 10 сообщений в минуту
  message: 'Слишком много запросов к AI, подождите минуту.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимитер для операций удаления
const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 удалений в час
  message: 'Слишком много операций удаления, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимитер для платежей
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 платежей в час
  message: 'Слишком много платежных операций.',
  standardHeaders: true,
  legacyHeaders: false,
});

if (ENABLE_RATE_LIMIT) {
  // Строгий лимит для аутентификации
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  
  // Лимит для AI запросов
  app.use('/api/chat', aiLimiter);
  
  // Лимит для платежей
  app.use('/api/payments', paymentLimiter);
  
  // Стандартный лимит для остальных API
  app.use('/api', standardLimiter);
}

// Таймауты для запросов
app.use((req, res, next) => {
  // Стандартный таймаут 30 секунд
  req.setTimeout(30000);
  
  // Для AI запросов - до 60 секунд
  if (req.path.includes('/chat')) {
    req.setTimeout(60000);
  }
  
  next();
});

// Парсинг JSON и cookies с лимитами
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check с проверкой БД
app.get('/health', async (req, res) => {
  try {
    // Проверяем database connection
    const { prisma } = await import('./lib/database');
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        server: 'ok',
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Database connection failed',
      checks: {
        database: 'error',
        server: 'ok',
      }
    });
  }
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'AdaptEd Russia API',
    version: '1.0.0',
    endpoints: {
      reminders: '/api/reminders',
      health: '/health'
    }
  });
});

if (process.env.USE_MOCK_REMINDERS === 'true') {
  // Моковые данные для тестирования
  let reminders: any[] = [];
  
  // Импорт authMiddleware для защиты mock routes
  const { authMiddleware } = require('./lib/auth');

  // Простые API роуты для тестирования (с аутентификацией)
  app.get('/api/reminders', authMiddleware, (req: any, res) => {
    const userId = req.user?.userId;
    const userReminders = reminders.filter(r => r.userId === userId);
    res.json({ success: true, data: userReminders });
  });

  app.post('/api/reminders', authMiddleware, (req: any, res) => {
    const userId = req.user?.userId;
    const newReminder = {
      id: Date.now().toString(),
      userId: userId,
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      priority: req.body.priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    reminders.push(newReminder);
    res.json({ success: true, data: newReminder });
  });

  app.put('/api/reminders/:id', authMiddleware, (req: any, res) => {
    const id = req.params.id;
    const userId = req.user?.userId;
    const index = reminders.findIndex((r) => r.id === id && r.userId === userId);
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...req.body, updatedAt: new Date() };
      res.json({ success: true, data: reminders[index] });
    } else {
      res.status(404).json({ success: false, error: 'Напоминание не найдено' });
    }
  });

  app.delete('/api/reminders/:id', authMiddleware, (req: any, res) => {
    const id = req.params.id;
    const userId = req.user?.userId;
    const index = reminders.findIndex((r) => r.id === id && r.userId === userId);
    if (index !== -1) {
      reminders.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Напоминание не найдено' });
    }
  });
}

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/questions', questionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

export default app; 