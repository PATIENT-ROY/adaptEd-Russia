import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Reminder } from '@/types';
import { ReminderStatus, ReminderPriority, ReminderCategory } from '@/types';

// Функция нормализации напоминания
const normalizeReminder = (reminder: Partial<Reminder> | Reminder): Reminder => {
  console.log('Normalizing reminder:', {
    id: reminder.id,
    title: reminder.title,
    dueDate: reminder.dueDate,
    dueDateType: typeof reminder.dueDate,
    category: reminder.category,
    allKeys: Object.keys(reminder || {}),
  });

  // Нормализуем категорию
  let category = ReminderCategory.OTHER;
  if (reminder.category) {
    const catUpper = String(reminder.category).toUpperCase().trim();
    console.log('Normalizing category:', { 
      original: reminder.category, 
      upper: catUpper,
      type: typeof reminder.category 
    });
    
    if (catUpper === 'EDUCATION') {
      category = ReminderCategory.EDUCATION;
      console.log('✅ Matched EDUCATION');
    } else if (catUpper === 'LIFE') {
      category = ReminderCategory.LIFE;
      console.log('✅ Matched LIFE');
    } else if (catUpper === 'DOCUMENTS') {
      category = ReminderCategory.DOCUMENTS;
      console.log('✅ Matched DOCUMENTS');
    } else if (catUpper === 'HEALTH') {
      category = ReminderCategory.HEALTH;
      console.log('✅ Matched HEALTH');
    } else if (catUpper === 'OTHER') {
      category = ReminderCategory.OTHER;
      console.log('✅ Matched OTHER');
    } else {
      console.warn('⚠️ Category value not matched:', catUpper, 'using OTHER');
      category = ReminderCategory.OTHER;
    }
  } else {
    console.warn('⚠️ No category in reminder, using OTHER');
  }
  console.log('Normalized category:', category);

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
  
  console.log('Checking dueDate:', {
    value: dueDateValue,
    type: typeof dueDateValue,
    isNull: dueDateValue === null,
    isUndefined: dueDateValue === undefined,
    isFalsy: !dueDateValue,
    hasDueDate: 'dueDate' in reminder,
  });
  
  if (dueDateValue !== null && dueDateValue !== undefined && dueDateValue !== 'null' && dueDateValue !== '') {
    console.log('Normalizing dueDate:', dueDateValue, 'type:', typeof dueDateValue);
    
    if (typeof dueDateValue === 'string') {
      // Если это строка, проверяем что это валидная дата
      if (dueDateValue.trim() === '' || dueDateValue === 'null' || dueDateValue === 'undefined') {
        console.log('Empty or null string date');
        dueDate = null;
      } else {
        const date = new Date(dueDateValue);
        if (!isNaN(date.getTime())) {
          dueDate = dueDateValue;
          console.log('Valid string date:', dueDate);
        } else {
          console.log('Invalid string date:', dueDateValue);
          dueDate = null;
        }
      }
      } else if (dueDateValue && typeof dueDateValue === 'object' && 'toISOString' in dueDateValue) {
        dueDate = (dueDateValue as Date).toISOString();
        console.log('Date object converted:', dueDate);
    } else {
      // Пробуем конвертировать в дату
      const date = new Date(dueDateValue);
      if (!isNaN(date.getTime())) {
        dueDate = date.toISOString();
        console.log('Converted to ISO:', dueDate);
      } else {
        console.log('Invalid date value:', dueDateValue);
        dueDate = null;
      }
    }
  } else {
    console.log('No dueDate field or value is null/undefined');
    dueDate = null;
  }
  
  console.log('Final normalized dueDate:', dueDate);

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
      console.log('=== FETCH REMINDERS ===');
      console.log('Raw reminders from API:', data);
      console.log('Raw reminders count:', Array.isArray(data) ? data.length : 0);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('First reminder details:', {
          id: data[0].id,
          title: data[0].title,
          dueDate: data[0].dueDate,
          dueDateType: typeof data[0].dueDate,
          category: data[0].category,
          categoryType: typeof data[0].category,
          allKeys: Object.keys(data[0] || {}),
          fullReminder: JSON.stringify(data[0], null, 2),
        });
        
        // Проверяем все напоминания на наличие даты
        const remindersWithoutDate = data.filter(r => !r.dueDate || r.dueDate === null || r.dueDate === 'null' || r.dueDate === '');
        console.log('Reminders without date:', remindersWithoutDate.length);
        if (remindersWithoutDate.length > 0) {
          console.warn('⚠️ WARNING: Found reminders without date:', remindersWithoutDate.map(r => ({
            id: r.id,
            title: r.title,
            dueDate: r.dueDate,
          })));
        }
      }
      
      // Нормализуем все напоминания
      const normalized = Array.isArray(data) 
        ? data.map((reminder, index) => {
            console.log(`Normalizing reminder ${index + 1}/${data.length}:`, {
              id: reminder.id,
              title: reminder.title,
              dueDate: reminder.dueDate,
              category: reminder.category,
            });
            const normalized = normalizeReminder(reminder);
            console.log(`Normalized reminder ${index + 1}:`, {
              id: normalized.id,
              dueDate: normalized.dueDate,
              category: normalized.category,
            });
            
            // Если дата потерялась при нормализации, попробуем восстановить
            if (!normalized.dueDate && reminder.dueDate) {
              console.warn(`⚠️ Date lost during normalization for reminder ${normalized.id}, restoring from original`);
              normalized.dueDate = typeof reminder.dueDate === 'string' 
                ? reminder.dueDate 
                : reminder.dueDate && typeof reminder.dueDate === 'object' && 'toISOString' in reminder.dueDate
                  ? (reminder.dueDate as Date).toISOString()
                  : String(reminder.dueDate || '');
            }
            
            // Если категория потерялась при нормализации, попробуем восстановить
            if (!normalized.category || normalized.category === ReminderCategory.OTHER) {
              const originalCategory = reminder.category;
              if (originalCategory && String(originalCategory).toUpperCase().trim() !== 'OTHER') {
                console.warn(`⚠️ Category lost during normalization for reminder ${normalized.id}, restoring from original:`, originalCategory);
                const catUpper = String(originalCategory).toUpperCase().trim();
                if (catUpper === 'EDUCATION') {
                  normalized.category = ReminderCategory.EDUCATION;
                  console.log('✅ Restored category to EDUCATION');
                } else if (catUpper === 'LIFE') {
                  normalized.category = ReminderCategory.LIFE;
                  console.log('✅ Restored category to LIFE');
                } else if (catUpper === 'DOCUMENTS') {
                  normalized.category = ReminderCategory.DOCUMENTS;
                  console.log('✅ Restored category to DOCUMENTS');
                } else if (catUpper === 'HEALTH') {
                  normalized.category = ReminderCategory.HEALTH;
                  console.log('✅ Restored category to HEALTH');
                } else {
                  console.warn('⚠️ Unknown category value during restore:', catUpper);
                }
              }
            }
            
            return normalized;
          })
        : [];
      
      console.log('All normalized reminders:', normalized.map(r => ({
        id: r.id,
        title: r.title,
        dueDate: r.dueDate,
        category: r.category,
      })));
      
      // Проверяем итоговые данные
      const finalRemindersWithoutDate = normalized.filter(r => !r.dueDate || r.dueDate === null || r.dueDate === 'null' || r.dueDate === '');
      if (finalRemindersWithoutDate.length > 0) {
        console.warn('⚠️ WARNING: After normalization, still have reminders without date:', finalRemindersWithoutDate.length);
      }
      
      setReminders(normalized);
      setError(null);
      console.log('=== FETCH REMINDERS END ===');
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Ошибка при загрузке напоминаний');
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
      console.log('=== CREATE REMINDER START ===');
      console.log('Creating reminder with data:', reminderData);
      console.log('DueDate in reminderData:', reminderData.dueDate);
      console.log('Category in reminderData:', reminderData.category);
      console.log('Full reminderData:', JSON.stringify(reminderData, null, 2));
      
      let response;
      try {
        response = await apiClient.createReminder(reminderData);
        console.log('✅ Successfully received response from API');
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        console.error('❌ API Error message:', (apiError as Error)?.message);
        // Если есть ошибка API, но у нас есть данные, создадим объект вручную
        console.log('⚠️ Creating reminder manually from reminderData due to API error');
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
        // Не перезагружаем список, так как это временное напоминание
        console.log('⚠️ Using temporary reminder, not reloading list');
        return normalized;
      }
      
      console.log('Received response from API:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      console.log('Response dueDate:', response?.dueDate);
      console.log('Response category:', response?.category);
      console.log('Response full object:', JSON.stringify(response, null, 2));
      
      // Если ответ пустой или некорректный, используем данные из запроса
      let reminderToNormalize = response;
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0) || !response.id) {
        console.warn('⚠️ WARNING: Empty or invalid response from API. Using reminderData.');
        // Создаем временный объект напоминания из исходных данных
        reminderToNormalize = {
          id: `temp-${Date.now()}`,
          userId: '',
          ...reminderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Reminder;
        console.log('⚠️ Created reminder from reminderData:', reminderToNormalize);
      }
      
      // Нормализуем новое напоминание
      const normalized = normalizeReminder(reminderToNormalize);
      console.log('Normalized new reminder:', normalized);
      console.log('Normalized reminder dueDate:', normalized.dueDate);
      console.log('Normalized reminder category:', normalized.category);
      console.log('Normalized reminder keys:', Object.keys(normalized));
      
      // Проверяем и исправляем данные после нормализации
      if (!normalized.dueDate && reminderData.dueDate) {
        console.warn('⚠️ WARNING: dueDate missing after normalization, using reminderData.dueDate');
        normalized.dueDate = reminderData.dueDate;
      }
      
      if (!normalized.category && reminderData.category) {
        console.warn('⚠️ WARNING: category missing after normalization, using reminderData.category');
        normalized.category = reminderData.category;
      }
      
      // Убеждаемся, что все обязательные поля заполнены
      if (!normalized.dueDate) {
        console.error('⚠️ ERROR: dueDate is still missing!');
        console.error('⚠️ normalized:', normalized);
        console.error('⚠️ reminderData:', reminderData);
      }
      
      if (!normalized.category) {
        console.error('⚠️ ERROR: category is still missing!');
        console.error('⚠️ normalized:', normalized);
        console.error('⚠️ reminderData:', reminderData);
      }
      
      console.log('Final normalized reminder:', normalized);
      console.log('Final dueDate:', normalized.dueDate);
      console.log('Final category:', normalized.category);
      
      // Добавляем новое напоминание в список
      setReminders(prev => [normalized, ...prev]);
      console.log('✅ Reminder added to list');
      
      // ВАЖНО: НЕ перезагружаем список автоматически, чтобы данные не исчезали!
      // Пользователь может обновить страницу вручную, если нужно
      // Автоматическая перезагрузка приводит к потере данных, так как сервер может вернуть
      // напоминания без даты или данные теряются при нормализации
      console.log('⚠️ Skipping automatic reload to preserve data (date, category)');
      console.log('💡 User can refresh the page manually if needed');
      
      console.log('=== CREATE REMINDER END ===');
      return normalized;
    } catch (err) {
      console.error('=== CREATE REMINDER ERROR ===');
      console.error('Error creating reminder:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      // Даже при ошибке попробуем создать напоминание из исходных данных
      try {
        console.log('⚠️ Attempting to create reminder from reminderData despite error');
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
        // НЕ перезагружаем список, чтобы сохранить данные
        console.log('⚠️ Skipping reload after fallback creation');
        return normalized;
      } catch (fallbackError) {
        console.error('Fallback creation also failed:', fallbackError);
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