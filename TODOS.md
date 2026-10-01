# TODOS

## Knowledge checks per organelle (E5)
- **What:** Optional 3-question check after inspecting an organelle, session-only, no saved scores.
- **Why:** Retrieval practice makes the codex stick.
- **Pros:** Turns exploration into learning evidence; data already lives in the codex.
- **Cons:** Borders the v1 "no quizzes" non-goal; question writing needs the same accuracy review as the codex.
- **Context:** Deferred in the 2026-10-01 CEO review. Start from `src/content/codex.ts`; add a `checks[]` field per entry.
- **Effort:** human M / CC S. **Priority:** P2. **Depends on:** v1 codex shipped.

## Photo mode (E6)
- **What:** Hide HUD, unlock camera roll, save a PNG.
- **Why:** Students and teachers want images for slides and reports.
- **Pros:** Small; showcases the visuals.
- **Cons:** Not learning-critical.
- **Context:** Deferred 2026-10-01. `renderer.domElement.toDataURL` after a composer render with `preserveDrawingBuffer`.
- **Effort:** human S / CC S. **Priority:** P3.

## Other cell types (E7)
- **What:** Plant cell (chloroplasts, cell wall, central vacuole), neuron (axon, synapse), bacterium.
- **Why:** Comparison is how cell biology is taught.
- **Pros:** Reuses the organelle contract and codex.
- **Cons:** XL effort; explicit v1 non-goal.
- **Context:** Deferred 2026-10-01. `world/Cell.ts` should take a layout config so a second cell type is a new layout, not a fork.
- **Effort:** human XL / CC L. **Priority:** P3.

## Touch controls (E8)
- **What:** Virtual joystick + drag-look for tablets.
- **Why:** Many classrooms use iPads.
- **Pros:** Widens reach.
- **Cons:** Needs a separate input model and perf tier.
- **Context:** Deferred 2026-10-01. `engine/Player.ts` already isolates input; add a touch input source.
- **Effort:** human M / CC S. **Priority:** P2.

## Expert review of the codex
- **What:** Have a cell biologist read all 98 entries and the tour and story captions.
- **Why:** The text was written carefully from textbook knowledge but has not been checked by a specialist. For a teaching tool, one visible error costs trust.
- **Pros:** Lets the accuracy claim stand on more than self-review.
- **Cons:** Needs a person with the right background and a few hours.
- **Context:** Entries live in `src/content/codex.ts` and `codexExtra.ts`; captions in `src/content/sequences.ts`. Numbers the writer was least sure of are stated as ranges.
- **Effort:** human M / CC n/a. **Priority:** P1 before using it in a classroom.

## Sub-component references
- **What:** Add a citation to every entry that states a number, not only the 18 organelle-level ones.
- **Why:** Sub-component entries carry most of the numbers.
- **Context:** `references.ts` is the only allowed citation table; `tests/codex.test.ts` enforces known keys.
- **Effort:** human M / CC S. **Priority:** P2.

## Frame-time measurement on real hardware
- **What:** Measure p95 frame time at the worst-case viewpoints (inside a mitochondrion, at the membrane, cutaway on) on a mid-range laptop and a Chromebook.
- **Why:** Draw calls and triangle counts are within budget, but frame time was only observed in a development preview.
- **Context:** `window.__cell.stats()` with `?debug`.
- **Effort:** human S / CC S. **Priority:** P2.
