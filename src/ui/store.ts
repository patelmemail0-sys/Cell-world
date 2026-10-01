import type { Quality } from '../world/types';

// Settings and codex progress. Saved to localStorage when it is available; everything
// still works in memory when it is not (private windows, blocked storage).

export interface Settings {
  quality: Quality;
  sensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
  labels: boolean;
  sound: boolean;
}

const KEY_SETTINGS = 'cytonaut.settings.v1';
const KEY_FOUND = 'cytonaut.discovered.v1';
const KEY_COACHED = 'cytonaut.coached.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: keep going with in-memory state.
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export class Store {
  settings: Settings;
  readonly discovered: Set<string>;
  onDiscover?: (id: string, total: number) => void;
  /** True once the player has been through the getting-started steps. */
  coached: boolean;

  constructor() {
    const saved = read<Partial<Settings>>(KEY_SETTINGS) ?? {};
    this.settings = {
      quality: saved.quality === 'low' || saved.quality === 'medium' ? saved.quality : 'high',
      sensitivity: typeof saved.sensitivity === 'number' ? saved.sensitivity : 1,
      invertY: !!saved.invertY,
      reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : prefersReducedMotion(),
      labels: saved.labels !== false,
      sound: saved.sound !== false,
    };
    this.discovered = new Set(read<string[]>(KEY_FOUND) ?? []);
    this.coached = read<boolean>(KEY_COACHED) === true;
  }

  markCoached(): void {
    this.coached = true;
    write(KEY_COACHED, true);
  }

  save(): void {
    write(KEY_SETTINGS, this.settings);
  }

  /** Mark an entry as found. Returns true the first time. */
  discover(id: string): boolean {
    if (this.discovered.has(id)) return false;
    this.discovered.add(id);
    write(KEY_FOUND, [...this.discovered]);
    this.onDiscover?.(id, this.discovered.size);
    return true;
  }
}
