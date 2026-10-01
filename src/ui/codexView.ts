import { ALL_ENTRIES, childrenOf, topLevel } from '../content';
import type { Store } from './store';

// The codex overlay: every structure grouped by organelle. Entries stay locked until you
// find them in the cell; you can always travel to one.

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface CodexHooks {
  onOpen(id: string): void;
  onTravel(id: string): void;
  onClose(): void;
}

export class CodexView {
  private readonly el = document.getElementById('codex')!;
  private readonly grid = document.getElementById('codex-grid')!;
  private readonly search = document.getElementById('codex-search') as HTMLInputElement;
  private readonly progress = document.getElementById('codex-progress')!;

  constructor(private readonly store: Store, private readonly hooks: CodexHooks) {
    this.search.addEventListener('input', () => this.render());
    document.getElementById('codex-close')!.addEventListener('click', () => this.hooks.onClose());
    this.grid.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'open') this.hooks.onOpen(t.dataset.id!);
      else if (t.dataset.act === 'travel') this.hooks.onTravel(t.dataset.id!);
    });
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  open(): void {
    this.el.hidden = false;
    this.search.value = '';
    this.render();
  }

  close(): void {
    this.el.hidden = true;
    this.search.blur();
  }

  private render(): void {
    const q = this.search.value.trim().toLowerCase();
    const found = this.store.discovered;
    this.progress.textContent = `${ALL_ENTRIES.filter((e) => found.has(e.id)).length} / ${ALL_ENTRIES.length} discovered`;
    const cards = topLevel()
      .map((org) => {
        const kids = childrenOf(org.id);
        const match = (name: string) => !q || name.toLowerCase().includes(q);
        const shown = kids.filter((k) => match(k.name) || match(org.name));
        if (!match(org.name) && shown.length === 0) return '';
        const chip = (id: string, name: string) =>
          found.has(id)
            ? `<button class="part" data-act="open" data-id="${id}">${esc(name)}</button>`
            : `<button class="part locked" data-act="travel" data-id="${id}" title="Not found yet. Click to travel there.">${esc(name)} ↗</button>`;
        const have = kids.filter((k) => found.has(k.id)).length + (found.has(org.id) ? 1 : 0);
        return `<article class="codex-card">
          <header><h3>${esc(org.name)}</h3><span class="count">${have}/${kids.length + 1}</span></header>
          <p>${found.has(org.id) ? esc(org.summary) : 'Find it in the cell and inspect it to unlock this entry.'}</p>
          <div class="row">
            ${found.has(org.id) ? `<button class="btn small" data-act="open" data-id="${org.id}">Read</button>` : ''}
            <button class="btn small ghost" data-act="travel" data-id="${org.id}">Travel there</button>
          </div>
          <div class="parts">${shown.map((k) => chip(k.id, k.name)).join('')}</div>
        </article>`;
      })
      .join('');
    this.grid.innerHTML = cards || '<p class="empty">Nothing matches that search.</p>';
  }
}
