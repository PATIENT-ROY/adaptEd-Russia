import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Reminder } from '@/types';

export function useReminders(userId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getReminders();
        setReminders(data);
        setError(null);
      } catch {
        setError('Ошибка при загрузке напоминаний');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReminders();
    }
  }, [userId]);

  const createReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newReminder = await apiClient.createReminder(reminderData);
      setReminders(prev => [...prev, newReminder]);
      return newReminder;
    } catch (err) {
      setError('Ошибка при создании напоминания');
      throw err;
    }
  };

  const updateReminder = async (id: string, data: Partial<Reminder>) => {
    try {
      const updatedReminder = await apiClient.updateReminder(id, data);
      if (updatedReminder) {
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === id ? updatedReminder : reminder
          )
        );
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