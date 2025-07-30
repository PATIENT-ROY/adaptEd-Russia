import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Импорты API маршрутов
import authRoutes from './api/auth.js';
import userRoutes from './api/user.js';
import guideRoutes from './api/guides.js';
import reminderRoutes from './api/reminders.js';
import chatRoutes from './api/chat.js';
import supportRoutes from './api/support.js';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware безопасности
app.use(helmet());

// CORS настройки
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting - временно отключено для тестирования
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 минут
//   max: 100, // максимум 100 запросов с одного IP
//   message: 'Слишком много запросов с этого IP, попробуйте позже.',
// });
// app.use(limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Моковые данные для тестирования
let reminders: any[] = [];
let users: any[] = [];

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
    updatedAt: new Date()
  };
  reminders.push(newReminder);
  res.json({ success: true, data: newReminder });
});

app.put('/api/reminders/:id', (req, res) => {
  const id = req.params.id;
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    reminders[index] = { ...reminders[index], ...req.body, updatedAt: new Date() };
    res.json({ success: true, data: reminders[index] });
  } else {
    res.status(404).json({ success: false, error: 'Напоминание не найдено' });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  const id = req.params.id;
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    reminders.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Напоминание не найдено' });
  }
});

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/support', supportRoutes);

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