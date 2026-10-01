import { childrenOf, entry, lineage, type CodexEntry } from '../content';
import { REFERENCES } from '../content/references';
import { formatRange } from '../engine/units';
import type { Store } from './store';

// The info panel: everything known about one structure, with the live process step
// highlighted while you watch it happen.

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface PanelHooks {
  onOpen(id: string): void;
  onClose(): void;
  onTravel(id: string): void;
}

export class Panel {
  current: string | null = null;
  private readonly el = document.getElementById('panel')!;
  private steps: HTMLElement[] = [];

  constructor(private readonly store: Store, private readonly hooks: PanelHooks) {
    this.el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!t) return;
      const id = t.dataset.id ?? '';
      if (t.dataset.act === 'open') this.hooks.onOpen(id);
      else if (t.dataset.act === 'travel') this.hooks.onTravel(id);
      else if (t.dataset.act === 'close') this.hooks.onClose();
    });
  }

  get isOpen(): boolean {
    return this.current !== null;
  }

  /** Number of steps in the process that is synced to the live animation. */
  get liveSteps(): number {
    return this.steps.length;
  }

  show(id: string): boolean {
    const e = entry(id);
    if (!e) return false;
    this.current = id;
    this.store.discover(id);
    this.el.innerHTML = this.render(e);
    this.el.hidden = false;
    this.el.scrollTop = 0;
    // Only the first process is synced to the live animation.
    this.steps = [...this.el.querySelectorAll<HTMLElement>('.process[data-live] li')];
    return true;
  }

  hide(): void {
    this.current = null;
    this.el.hidden = true;
    this.steps = [];
  }

  /** Highlight the step matching progress 0..1 through the live process, or none. */
  setProgress(progress: number | null): void {
    if (!this.steps.length) return;
    const idx = progress === null ? -1 : Math.min(this.steps.length - 1, Math.floor(progress * this.steps.length));
    this.steps.forEach((li, i) => {
      const on = i === idx;
      if (on && !li.classList.contains('now')) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      li.classList.toggle('now', on);
    });
    const badge = this.el.querySelector<HTMLElement>('.live');
    if (badge) badge.hidden = progress === null;
  }

  private render(e: CodexEntry): string {
    const chain = lineage(e.id);
    const crumbs = chain
      .map((c, i) => (i === chain.length - 1 ? `<span>${esc(c.name)}</span>` : `<button data-act="open" data-id="${c.id}">${esc(c.name)}</button><span>›</span>`))
      .join('');
    const kids = childrenOf(e.id);
    const parts = kids.length
      ? `<h3>Parts to find (${kids.filter((k) => this.store.discovered.has(k.id)).length}/${kids.length})</h3><div class="parts">${kids
          .map((k) =>
            this.store.discovered.has(k.id)
              ? `<button class="part" data-act="open" data-id="${k.id}">${esc(k.name)}</button>`
              : `<button class="part locked" data-act="travel" data-id="${k.id}" title="Not found yet. Click to travel there.">${esc(k.name)} ↗</button>`,
          )
          .join('')}</div>`
      : '';
    const structure = e.structure?.length ? `<h3>Structure</h3><ul>${e.structure.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
    const processes = e.processes?.length
      ? `<h3>What you are watching</h3>${e.processes
          .map(
            (p, i) =>
              `<div class="process"${i === 0 ? ' data-live' : ''}><div class="process-name">${esc(p.name)}${i === 0 ? '<span class="live" hidden>Live</span>' : ''}</div><ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`,
          )
          .join('')}${e.realRate ? `<div class="rate">Real speed: ${esc(e.realRate)}. Shown much slower so you can follow it.</div>` : ''}`
      : '';
    const size = `<dt>True size</dt><dd>${formatRange(e.sizeNm)}${e.enlargement ? ` (drawn about ${e.enlargement}× larger)` : ''}</dd>`;
    const facts = `<h3>Numbers</h3><dl class="facts">${size}${e.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>`;
    const refs = e.references?.length
      ? `<h3>References</h3><ul class="refs">${e.references.map((r) => `<li>${esc(REFERENCES[r]?.citation ?? r)}</li>`).join('')}</ul>`
      : '';
    return `
      <button class="btn small ghost panel-close" data-act="close">Close <kbd>E</kbd></button>
      <nav class="crumbs">${crumbs}</nav>
      <h2>${esc(e.name)}</h2>
      <span class="cat">${esc(e.category)}</span>
      <p class="summary">${esc(e.summary)}</p>
      <h3>What it does</h3>
      <p>${esc(e.function)}</p>
      ${processes}
      ${structure}
      ${parts}
      ${facts}
      <h3>How accurate is this model?</h3>
      <p class="accuracy">${esc(e.accuracy)}</p>
      ${refs}
      <div class="panel-actions"><button class="btn small" data-act="travel" data-id="${e.id}">Travel there</button></div>`;
  }
}
