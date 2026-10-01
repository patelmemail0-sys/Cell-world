// Keyboard + mouse state with pointer lock, a click-drag fallback, and guards so typing in
// the codex search never triggers game hotkeys.

const GAME_KEYS = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function isTextTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
}

export class Input {
  private readonly down = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  wheel = 0;
  locked = false;
  /** True once pointer lock has succeeded at least once in this session. */
  everLocked = false;
  /** True when the browser refused pointer lock; drag-to-look is used instead. */
  fallback = false;
  /** Game input is ignored while an overlay (codex, panel, menu) owns focus. */
  enabled = false;
  private programmaticUnlock = false;
  private dragging = false;
  private dragStart = { x: 0, y: 0 };
  private dragMoved = 0;

  onKey?: (code: string, e: KeyboardEvent) => void;
  onScanClick?: () => void;
  onUnexpectedUnlock?: () => void;
  onLockChange?: (locked: boolean) => void;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (isTextTarget(e.target)) return;
      if (this.enabled && GAME_KEYS.has(e.code)) e.preventDefault();
      if (e.code === 'Tab') e.preventDefault(); // Tab always belongs to the codex toggle
      if (!e.repeat) this.onKey?.(e.code, e);
      if (this.enabled) this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());

    document.addEventListener('pointerlockchange', () => {
      const nowLocked = document.pointerLockElement === this.canvas;
      const wasLocked = this.locked;
      this.locked = nowLocked;
      if (nowLocked) this.everLocked = true;
      this.onLockChange?.(nowLocked);
      if (wasLocked && !nowLocked) {
        this.down.clear();
        if (!this.programmaticUnlock) this.onUnexpectedUnlock?.();
      }
      this.programmaticUnlock = false;
    });
    document.addEventListener('pointerlockerror', () => {
      // Only fall back to drag-look if lock has never worked; otherwise a click will retry.
      if (!this.everLocked) this.fallback = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked) {
        this.lookDX += e.movementX;
        this.lookDY += e.movementY;
      } else if (this.fallback && this.dragging) {
        this.lookDX += e.movementX;
        this.lookDY += e.movementY;
        this.dragMoved = Math.max(this.dragMoved, Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y));
      }
    });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled || e.button !== 0) return;
      if (this.locked) {
        this.onScanClick?.();
        return;
      }
      if (this.fallback) {
        this.dragging = true;
        this.dragMoved = 0;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    });
    window.addEventListener('mouseup', () => {
      if (this.fallback && this.dragging) {
        this.dragging = false;
        if (this.dragMoved < 4) this.onScanClick?.();
      }
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.wheel += Math.sign(e.deltaY);
      },
      { passive: false },
    );
  }

  /** Must be called from a user gesture. Resolves true if locked, false if falling back. */
  async requestLock(): Promise<boolean> {
    if (this.fallback) return false;
    try {
      const r = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (r && typeof (r as Promise<void>).then === 'function') await r;
      return true;
    } catch {
      if (!this.everLocked) this.fallback = true;
      return false;
    }
  }

  /** Release lock on purpose (opening an overlay); does not trigger the pause menu. */
  releaseLock(): void {
    if (document.pointerLockElement === this.canvas) {
      this.programmaticUnlock = true;
      document.exitPointerLock();
    }
  }

  isDown(code: string): boolean {
    return this.enabled && this.down.has(code);
  }

  axis(neg: string, pos: string): number {
    return (this.isDown(pos) ? 1 : 0) - (this.isDown(neg) ? 1 : 0);
  }

  anyMovementKey(): boolean {
    return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC'].some((k) => this.isDown(k));
  }

  consumeLook(): { dx: number; dy: number } {
    const r = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = 0;
    this.lookDY = 0;
    return r;
  }

  consumeWheel(): number {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }
}
