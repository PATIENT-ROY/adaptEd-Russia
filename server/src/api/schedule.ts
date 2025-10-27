import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '@/types';

const router = Router();

// Интерфейс для расписания
interface ScheduleItem {
  date: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'seminar' | 'lab' | 'exam';
  group?: string;
}

// Валидация запроса расписания
const getScheduleSchema = z.object({
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
  type: z.enum(['group', 'teacher', 'room']),
  value: z.string().min(1, 'Значение обязательно'),
});

// Получить расписание с университетского API
router.get('/', async (req: Request, res: Response) => {
  try {
    // Валидация параметров
    const query = getScheduleSchema.parse(req.query);

    // ЗДЕСЬ: Подключите ваше университетское API
    const universitySchedule = await fetchUniversitySchedule(query);

    res.json({
      success: true,
      data: universitySchedule,
      message: 'Расписание получено успешно'
    } as ApiResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Неверные параметры запроса',
        details: error.errors
      } as ApiResponse);
      return;
    }

    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Функция для получения расписания с университетского API
async function fetchUniversitySchedule(filters: z.infer<typeof getScheduleSchema>): Promise<ScheduleItem[]> {
  
  // 🎯 ВАРИАНТ 1: Прямое подключение к API университета
  // Замените на URL реального API вашего университета
  const UNIVERSITY_API_URL = process.env.UNIVERSITY_API_URL || 'https://rasp.univer.ru/api';
  
  try {
    const response = await fetch(`${UNIVERSITY_API_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Добавьте авторизацию если требуется
        // 'Authorization': `Bearer ${process.env.UNIVERSITY_API_TOKEN}`,
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`University API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Преобразуйте данные университета в наш формат
    return mapUniversityScheduleToOurFormat(data);

  } catch (error) {
    console.error('University API error:', error);
    
    // 🎯 ВАРИАНТ 2: Fallback - вернуть моковые данные
    return getMockSchedule(filters);
  }
}

// Преобразование данных университета в наш формат
function mapUniversityScheduleToOurFormat(universityData: any): ScheduleItem[] {
  // Адаптируйте под формат вашего университета
  return universityData.map((item: any) => ({
    date: item.date || item.day,
    time: item.time || item.timeslot,
    subject: item.subject || item.discipline,
    teacher: item.teacher || item.professor,
    room: item.room || item.auditorium,
    type: mapType(item.type),
    group: item.group,
  }));
}

// Маппинг типов занятий
function mapType(universityType: string): ScheduleItem['type'] {
  const typeMap: Record<string, ScheduleItem['type']> = {
    'лекция': 'lecture',
    'семинар': 'seminar',
    'лабораторная': 'lab',
    'экзамен': 'exam',
  };
  
  return typeMap[universityType.toLowerCase()] || 'lecture';
}

// Моковые данные (fallback)
function getMockSchedule(filters: z.infer<typeof getScheduleSchema>): ScheduleItem[] {
  // Временные данные для демонстрации
  return [
    {
      date: '2024-01-22',
      time: '09:00',
      subject: 'Математика',
      teacher: 'Иванов И.И.',
      room: '101',
      type: 'lecture',
      group: filters.value,
    },
    {
      date: '2024-01-22',
      time: '11:00',
      subject: 'Физика',
      teacher: 'Петрова П.П.',
      room: '203',
      type: 'lab',
      group: filters.value,
    },
  ];
}

export default router;

