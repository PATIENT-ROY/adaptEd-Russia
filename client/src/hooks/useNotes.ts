import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Note, NoteParseResult } from '@/types';

export function useNotes(userId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNotes();
      setNotes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'ConnectionError') {
        setError('Сервер недоступен. Проверьте подключение.');
      } else {
        setError('Ошибка при загрузке заметок');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, fetchNotes]);

  const createNote = async (data: { title?: string; content: string; tags?: string }): Promise<Note> => {
    const note = await apiClient.createNote(data);
    setNotes(prev => [note, ...prev]);
    return note;
  };

  const deleteNote = async (id: string) => {
    await apiClient.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const parseNote = async (content: string, notificationMethod: string = 'email'): Promise<NoteParseResult> => {
    try {
      setParsing(true);
      const result = await apiClient.parseNote(content, notificationMethod);
      if (result.note) {
        setNotes(prev => [result.note, ...prev]);
      }
      return result;
    } finally {
      setParsing(false);
    }
  };

  return {
    notes,
    loading,
    parsing,
    error,
    createNote,
    deleteNote,
    parseNote,
    refreshNotes: fetchNotes,
  };
}
