import { trackEventImmediate } from '../api/reactionsApi';

export interface AchievementDef {
  id: string;
  emoji: string;
  tc: string;
  sc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'slow_reader',     emoji: '🐢', tc: '慢活派',     sc: '慢活派' },
  { id: 'bubble_popper',   emoji: '🫧', tc: '全盤托出',   sc: '全盘托出' },
  { id: 'return_visitor',  emoji: '↩️', tc: '回頭客',     sc: '回头客' },
  { id: 'night_owl',       emoji: '🦉', tc: '深夜讀者',   sc: '深夜读者' },
  { id: 'streak_3days',    emoji: '🔥', tc: '連續訪問者',  sc: '连续访问者' },
  { id: 'sound_on',        emoji: '🔊', tc: '聲音探索者',  sc: '声音探索者' },
  { id: 'collage_creator', emoji: '🖼️', tc: '拼貼藝術家',  sc: '拼贴艺术家' },
  { id: 'emotion_voter',   emoji: '🎨', tc: '情緒感應者',  sc: '情绪感应者' },
  { id: 'gallery_complete',emoji: '🏁', tc: '完美收藏家',  sc: '完美收藏家' },

];

const STORAGE_KEY = 'azhan_achievements';
const VISIT_DATES_KEY = 'azhan_visit_dates';

let _unlocked: Set<string> | null = null;

function loadUnlocked(): Set<string> {
  if (_unlocked) return _unlocked;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _unlocked = new Set(JSON.parse(raw));
      return _unlocked;
    }
  } catch {}
  _unlocked = new Set();
  return _unlocked;
}

function saveUnlocked(set: Set<string>) {
  _unlocked = set;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

/** Unlock an achievement. Returns true if it was newly unlocked. */
export function unlockAchievement(id: string): boolean {
  const unlocked = loadUnlocked();
  if (unlocked.has(id)) return false;
  unlocked.add(id);
  saveUnlocked(unlocked);
  trackEventImmediate('achievement_unlocked', undefined, { id, achievementId: id });
  // Dispatch custom event so UI can show toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id } }));
  }
  return true;
}

export function isUnlocked(id: string): boolean {
  return loadUnlocked().has(id);
}

export function getUnlockedAchievements(): string[] {
  return [...loadUnlocked()];
}

// ============================================================
// Specific achievement checks
// ============================================================

/** Call on page load — checks time-based achievements */
export function checkTimeBasedAchievements() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    unlockAchievement('night_owl');
  }
}

/** Record today's visit and check streak */
export function recordVisitAndCheckStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(VISIT_DATES_KEY);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    if (!dates.includes(today)) {
      dates.push(today);
      // Keep only last 30 days
      if (dates.length > 30) dates.shift();
      localStorage.setItem(VISIT_DATES_KEY, JSON.stringify(dates));
    }
    // Check streak of 3 consecutive days
    const sorted = [...dates].sort();
    let streak = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      const d1 = new Date(sorted[i]);
      const d2 = new Date(sorted[i - 1]);
      const diff = (d1.getTime() - d2.getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    if (streak >= 3) {
      unlockAchievement('streak_3days');
    }
  } catch {}
}
