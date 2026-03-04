"use client";

import { useState, useEffect, useCallback } from 'react';
import { getGuideProgress, markGuideRead, unmarkGuideRead } from '@/lib/api';

interface Achievement {
  id: string;
  icon: string;
  unlocked: boolean;
  threshold: number;
}

const EDUCATION_ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_step', icon: '🎯', threshold: 1 },
  { id: 'active_reader', icon: '📚', threshold: 5 },
  { id: 'expert', icon: '🏆', threshold: 10 },
  { id: 'master', icon: '🎓', threshold: 16 },
];

const LIFE_ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_step', icon: '🎯', threshold: 1 },
  { id: 'active_reader', icon: '📚', threshold: 5 },
  { id: 'expert', icon: '🏆', threshold: 10 },
  { id: 'master', icon: '🎓', threshold: 15 },
];

export function useGuideProgress(guideType: 'education' | 'life', totalGuides: number) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    const entries = await getGuideProgress(guideType);
    setReadIds(new Set(entries.map(e => e.guideId)));
    setLoading(false);
  }, [guideType]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markAsRead = useCallback(async (guideId: string) => {
    if (readIds.has(guideId)) return;
    setReadIds(prev => new Set([...prev, guideId]));
    await markGuideRead(guideId, guideType);
  }, [guideType, readIds]);

  const toggleRead = useCallback(async (guideId: string) => {
    if (readIds.has(guideId)) {
      setReadIds(prev => {
        const next = new Set(prev);
        next.delete(guideId);
        return next;
      });
      await unmarkGuideRead(guideId, guideType);
    } else {
      setReadIds(prev => new Set([...prev, guideId]));
      await markGuideRead(guideId, guideType);
    }
  }, [guideType, readIds]);

  const isRead = useCallback((guideId: string) => readIds.has(guideId), [readIds]);

  const readCount = readIds.size;
  const progressPercent = totalGuides > 0 ? Math.round((readCount / totalGuides) * 100) : 0;

  const achievementsDef = guideType === 'education' ? EDUCATION_ACHIEVEMENTS : LIFE_ACHIEVEMENTS;
  const achievements: Achievement[] = achievementsDef.map(a => ({
    ...a,
    unlocked: readCount >= a.threshold,
  }));

  return {
    readIds,
    loading,
    isRead,
    markAsRead,
    toggleRead,
    readCount,
    totalGuides,
    progressPercent,
    achievements,
  };
}
