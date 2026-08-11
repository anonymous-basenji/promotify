import { useState, useEffect, useCallback } from 'react';
import type { FacebookGroup, DayOfWeek } from '../types/promotify';
import { INITIAL_GROUPS, DEFAULT_PROMO_TEXT } from '../data/initialSchedule';

const GROUPS_STORAGE_KEY = 'promotify_groups_v1';
const PROMO_TEXT_STORAGE_KEY = 'promotify_promo_text_v1';

export function usePromotifyData() {
  const [groups, setGroups] = useState<FacebookGroup[]>(INITIAL_GROUPS);
  const [promoText, setPromoText] = useState<string>(DEFAULT_PROMO_TEXT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client side
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      } else {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_GROUPS));
      }

      const savedPromoText = localStorage.getItem(PROMO_TEXT_STORAGE_KEY);
      if (savedPromoText) {
        setPromoText(savedPromoText);
      } else {
        localStorage.setItem(PROMO_TEXT_STORAGE_KEY, DEFAULT_PROMO_TEXT);
      }
    } catch (e) {
      console.warn('LocalStorage error, fallback to memory state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync groups to localStorage
  const saveGroups = useCallback((newGroups: FacebookGroup[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(newGroups));
    } catch (e) {
      console.error('Failed to save groups:', e);
    }
  }, []);

  // Sync promo text to localStorage
  const savePromoText = useCallback((text: string) => {
    setPromoText(text);
    try {
      localStorage.setItem(PROMO_TEXT_STORAGE_KEY, text);
    } catch (e) {
      console.error('Failed to save promo text:', e);
    }
  }, []);

  // Add group
  const addGroup = useCallback((group: Omit<FacebookGroup, 'id'>) => {
    const newId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGroup: FacebookGroup = { ...group, id: newId };
    saveGroups([newGroup, ...groups]);
  }, [groups, saveGroups]);

  // Update group
  const updateGroup = useCallback((updatedGroup: FacebookGroup) => {
    const updatedList = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
    saveGroups(updatedList);
  }, [groups, saveGroups]);

  // Delete group
  const deleteGroup = useCallback((id: string) => {
    const updatedList = groups.filter(g => g.id !== id);
    saveGroups(updatedList);
  }, [groups, saveGroups]);

  // Toggle single day for a group
  const toggleGroupDay = useCallback((groupId: string, day: DayOfWeek) => {
    const updatedList = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          days: {
            ...g.days,
            [day]: !g.days[day]
          }
        };
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);

  // Mark group posted date
  const markGroupPosted = useCallback((groupId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedList = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, lastPostedDate: todayStr };
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);

  // Clear posted date (untrack)
  const unmarkGroupPosted = useCallback((groupId: string) => {
    const updatedList = groups.map(g => {
      if (g.id === groupId) {
        const updated = { ...g };
        delete updated.lastPostedDate;
        return updated;
      }
      return g;
    });
    saveGroups(updatedList);
  }, [groups, saveGroups]);

  // Reset to original CSV schedule
  const resetToDefault = useCallback(() => {
    saveGroups(INITIAL_GROUPS);
    savePromoText(DEFAULT_PROMO_TEXT);
  }, [saveGroups, savePromoText]);

  return {
    groups,
    promoText,
    isLoaded,
    savePromoText,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupDay,
    markGroupPosted,
    unmarkGroupPosted,
    resetToDefault
  };
}
