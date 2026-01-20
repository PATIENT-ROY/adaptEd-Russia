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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
});
if (ENABLE_RATE_LIMIT) {
  app.use('/api/auth', limiter);
  app.use('/api/chat', limiter);
}

// Парсинг JSON и cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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

  // Простые API роуты для тестирования
  app.get('/api/reminders', (req, res) => {
    res.json({ success: true, data: reminders });
  });

  app.post('/api/reminders', (req, res) => {
    const newReminder = {
      id: Date.now().toString(),
      userId: req.body.userId,
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

  app.put('/api/reminders/:id', (req, res) => {
    const id = req.params.id;
    const index = reminders.findIndex((r) => r.id === id);
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...req.body, updatedAt: new Date() };
      res.json({ success: true, data: reminders[index] });
    } else {
      res.status(404).json({ success: false, error: 'Напоминание не найдено' });
    }
  });

  app.delete('/api/reminders/:id', (req, res) => {
    const id = req.params.id;
    const index = reminders.findIndex((r) => r.id === id);
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