import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Reminder } from '@/types';
import { ReminderStatus, ReminderPriority, ReminderCategory } from '@/types';

// Функция нормализации напоминания
const normalizeReminder = (reminder: Partial<Reminder> | Reminder): Reminder => {
  // Нормализуем категорию
  let category = ReminderCategory.OTHER;
  if (reminder.category) {
    const catUpper = String(reminder.category).toUpperCase().trim();
    
    if (catUpper === 'EDUCATION') category = ReminderCategory.EDUCATION;
    else if (catUpper === 'LIFE') category = ReminderCategory.LIFE;
    else if (catUpper === 'DOCUMENTS') category = ReminderCategory.DOCUMENTS;
    else if (catUpper === 'HEALTH') category = ReminderCategory.HEALTH;
    else category = ReminderCategory.OTHER;
  }

  // Нормализуем приоритет
  let priority = ReminderPriority.MEDIUM;
  if (reminder.priority) {
    const priUpper = String(reminder.priority).toUpperCase();
    if (priUpper === 'LOW') priority = ReminderPriority.LOW;
    else if (priUpper === 'MEDIUM') priority = ReminderPriority.MEDIUM;
    else if (priUpper === 'HIGH') priority = ReminderPriority.HIGH;
    else if (priUpper === 'URGENT') priority = ReminderPriority.URGENT;
  }

  // Нормализуем статус
  let status = ReminderStatus.PENDING;
  if (reminder.status) {
    const statUpper = String(reminder.status).toUpperCase();
    if (statUpper === 'PENDING') status = ReminderStatus.PENDING;
    else if (statUpper === 'COMPLETED') status = ReminderStatus.COMPLETED;
    else if (statUpper === 'CANCELLED') status = ReminderStatus.CANCELLED;
  }

  // Нормализуем дату
  let dueDate: string | null = null;
  const dueDateValue = reminder.dueDate;
  
  if (dueDateValue !== null && dueDateValue !== undefined && dueDateValue !== 'null' && dueDateValue !== '') {
    if (typeof dueDateValue === 'string') {
      if (dueDateValue.trim() !== '' && dueDateValue !== 'null' && dueDateValue !== 'undefined') {
        const date = new Date(dueDateValue);
        if (!isNaN(date.getTime())) {
          dueDate = dueDateValue;
        }
      }
    } else if (dueDateValue && typeof dueDateValue === 'object' && 'toISOString' in dueDateValue) {
      dueDate = (dueDateValue as Date).toISOString();
    } else {
      const date = new Date(dueDateValue);
      if (!isNaN(date.getTime())) {
        dueDate = date.toISOString();
      }
    }
  }

  return {
    ...reminder,
    category,
    priority,
    status,
    dueDate,
    notificationMethod: reminder.notificationMethod || 'email',
  } as Reminder;
};

export function useReminders(userId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getReminders();
      
      // Нормализуем все напоминания
      const normalized = Array.isArray(data) 
        ? data.map((reminder) => {
            const norm = normalizeReminder(reminder);
            
            // Восстанавливаем дату если потерялась
            if (!norm.dueDate && reminder.dueDate) {
              norm.dueDate = typeof reminder.dueDate === 'string' 
                ? reminder.dueDate 
                : reminder.dueDate && typeof reminder.dueDate === 'object' && 'toISOString' in reminder.dueDate
                  ? (reminder.dueDate as Date).toISOString()
                  : String(reminder.dueDate || '');
            }
            
            // Восстанавливаем категорию если потерялась
            if (!norm.category || norm.category === ReminderCategory.OTHER) {
              const originalCategory = reminder.category;
              if (originalCategory && String(originalCategory).toUpperCase().trim() !== 'OTHER') {
                const catUpper = String(originalCategory).toUpperCase().trim();
                if (catUpper === 'EDUCATION') norm.category = ReminderCategory.EDUCATION;
                else if (catUpper === 'LIFE') norm.category = ReminderCategory.LIFE;
                else if (catUpper === 'DOCUMENTS') norm.category = ReminderCategory.DOCUMENTS;
                else if (catUpper === 'HEALTH') norm.category = ReminderCategory.HEALTH;
              }
            }
            
            return norm;
          })
        : [];
      
      setReminders(normalized);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'ConnectionError') {
        setError('Сервер недоступен. Проверьте подключение.');
      } else {
        setError('Ошибка при загрузке напоминаний');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchReminders();
    }
  }, [userId, fetchReminders]);

  const createReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      let response;
      try {
        response = await apiClient.createReminder(reminderData);
      } catch {
        // При ошибке API создаём временное напоминание
        const manualReminder: Reminder = {
          id: `temp-${Date.now()}`,
          userId: '',
          title: reminderData.title,
          description: reminderData.description,
          dueDate: reminderData.dueDate,
          category: reminderData.category,
          priority: reminderData.priority,
          status: reminderData.status || ReminderStatus.PENDING,
          notificationMethod: reminderData.notificationMethod || 'email',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const normalized = normalizeReminder(manualReminder);
        if (!normalized.dueDate && reminderData.dueDate) normalized.dueDate = reminderData.dueDate;
        if (!normalized.category && reminderData.category) normalized.category = reminderData.category;
        setReminders(prev => [normalized, ...prev]);
        return normalized;
      }
      
      // Если ответ пустой, используем данные из запроса
      let reminderToNormalize = response;
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0) || !response.id) {
        reminderToNormalize = {
          id: `temp-${Date.now()}`,
          userId: '',
          ...reminderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Reminder;
      }
      
      const normalized = normalizeReminder(reminderToNormalize);
      
      // Восстанавливаем данные если потерялись
      if (!normalized.dueDate && reminderData.dueDate) normalized.dueDate = reminderData.dueDate;
      if (!normalized.category && reminderData.category) normalized.category = reminderData.category;
      
      setReminders(prev => [normalized, ...prev]);
      return normalized;
    } catch (err) {
      // Fallback при ошибке
      try {
        const fallbackReminder: Reminder = {
          id: `temp-${Date.now()}`,
          userId: '',
          ...reminderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Reminder;
        const normalized = normalizeReminder(fallbackReminder);
        if (!normalized.dueDate && reminderData.dueDate) normalized.dueDate = reminderData.dueDate;
        if (!normalized.category && reminderData.category) normalized.category = reminderData.category;
        setReminders(prev => [normalized, ...prev]);
        return normalized;
      } catch {
        setError('Ошибка при создании напоминания');
        throw err;
      }
    }
  };

  const updateReminder = async (id: string, data: Partial<Reminder>) => {
    try {
      const updatedReminder = await apiClient.updateReminder(id, data);
      if (updatedReminder) {
        // Нормализуем обновленное напоминание
        const normalized = normalizeReminder(updatedReminder);
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === id ? normalized : reminder
          )
        );
        return normalized;
      }
      return updatedReminder;
    } catch (err) {
      setError('Ошибка при обновлении напоминания');
      throw err;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await apiClient.deleteReminder(id);
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      return true;
    } catch (err) {
      setError('Ошибка при удалении напоминания');
      throw err;
    }
  };

  return {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
  };
} 