# Cytonaut

A first-person journey inside a living human cell.

You are a speck adrift in the cytoplasm of a pancreatic beta cell, the cell that makes
insulin. Fly anywhere, look anywhere, point at any structure to learn what it is and what it
does, and watch its real molecular machinery run. Everything is procedural: no downloaded
models, textures or audio files.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5183. Needs a desktop browser with WebGL 2, a keyboard and a mouse.

```bash
npm run build
```

```bash
npm test
```

## Controls

| Key | Action |
| --- | --- |
| Mouse | Look around |
| W A S D | Swim |
| Space / C | Rise / sink |
| Shift | Boost |
| Scroll | Change cruise speed |
| E or click | Inspect whatever is under the circle |
| Tab | Codex of every structure |
| T | Guided tour (21 stops) |
| G | Story: follow one insulin molecule from gene to bloodstream (16 steps) |
| X | Cutaway view (membranes fade so you can see inside) |
| [ and ] | Slow down / speed up the cell's processes |
| P | Pause processes |
| M | Sound on / off |
| Esc | Menu and settings |

## What is in the cell

18 organelle-level structures and 80 inspectable parts (98 codex entries), each with a
description, its function, its parts, real numbers, and notes on what the model simplifies.

| Structure | What you can watch |
| --- | --- |
| Plasma membrane | Individual lipids and cholesterol up close; Na+/K+ pump (3 Na+ out, 2 K+ in per ATP); GLUT1 glucose entry; K_ATP and voltage-gated Ca2+ channels opening and closing; GLP-1 receptor signalling; clathrin-coated pits |
| Extracellular matrix | Banded collagen fibrils outside the cell; integrins linking them to the actin cortex |
| Cytosol | Glucokinase clamping onto glucose; glycolysis flux from membrane to mitochondria |
| Cytoskeleton | Microtubules with their tubulin lattice and growing/shrinking plus ends; kinesin and dynein walking hand over hand with cargo; cortical actin; intermediate filament cage |
| Centrosome | Two orthogonal centrioles (nine triplets each), pericentriolar material, gamma-tubulin ring complexes nucleating microtubules |
| Nucleus | Double envelope, nuclear pore complexes at true scale, lamina, chromatin territories, nucleosomes, nucleoli; RNA polymerase II transcribing the insulin gene; mRNA export; ribosome subunit export |
| Rough ER | Cisternae studded with ribosomes; SRP delivering a ribosome; Sec61 translocation, signal peptidase, BiP, PDI |
| Ribosomes | Elongation cycle: tRNAs through the A, P and E sites, mRNA ratcheting, the chain growing |
| Smooth ER | Tubule network; SERCA pumping Ca2+ in, IP3 receptors releasing it; lipid droplets |
| Golgi apparatus | Polarized stack, cargo maturing cis to trans, trans-Golgi network, M6P receptors |
| Transport vesicles | COPII, COPI and clathrin-coated vesicles budding, shedding coats and fusing |
| Mitochondria | Cristae; TCA cycle; electrons through Complex I, ubiquinone, III, cytochrome c, IV to oxygen; protons pumped (4, 4, 2); ATP synthase rotors spinning; ADP/ATP exchange |
| Insulin granules | Immature granules maturing as proinsulin is cut to insulin; SNARE complexes; Ca2+-triggered exocytosis |
| Lysosomes | V-ATPase acidification, hydrolases, LAMP lining, digestion |
| Peroxisomes | Fatty acid beta-oxidation; catalase turning 2 H2O2 into 2 H2O + O2 |
| Endosomes | Recycling tubules; intraluminal vesicles forming in multivesicular bodies |
| Autophagosome | A phagophore engulfing a worn-out mitochondrion, sealing, fusing with a lysosome |
| Proteasomes | Ubiquitin-tagged proteins recognised, unfolded and cut to peptides |

### One loop drives the whole cell

A beta cell's job is glucose-stimulated insulin secretion, and the cell cycles through it
continuously: glucose rises and enters through GLUT1, mitochondria raise the ATP/ADP ratio,
K_ATP channels close, the membrane depolarizes from about -70 mV, voltage-gated Ca2+ channels
open, and Ca2+ triggers insulin granules to fuse with the membrane. The HUD shows glucose,
ATP and membrane potential as it happens, and the membrane itself glows as it depolarizes.

## Accuracy

The aim is that a biology teacher finds nothing wrong, and that everything simplified is
stated.

- **Scale.** 1 world unit is 100 nm. Organelles are at their true relative sizes. Molecular
  machines are drawn larger than life (usually 2 to 8 times) and in far smaller numbers, so
  they can be seen working. Each entry states its true size and how much it was enlarged.
- **Speed.** Every process is slowed. Each entry gives the real rate. Inspecting something
  slows the cell further so each step can be read as it happens.
- **Liberties.** You can pass through membranes, which a real particle could not. Interiors
  are thinned out so you can see. Each entry has a "How accurate is this model?" note.
- **Human-specific details.** Human beta cells use mainly GLUT1; human peroxisomes have no
  urate oxidase crystal; mammalian ATP synthase has an 8-subunit c-ring (about 2.7 H+ per ATP).
- **Sources.** Organelle-level entries cite Alberts, *Molecular Biology of the Cell* (7th
  ed.), Lodish, *Molecular Cell Biology* (9th ed.), Lehninger (8th ed.), and two reviews
  (Rorsman and Ashcroft 2018; Boyer 1997).

The codex text has not been reviewed by a practising cell biologist. Treat it as a careful
study aid, not a primary source.

## How it is built

Vite, TypeScript and three.js. No UI framework and no external assets.

```
src/
  main.ts                 wires everything; input, overlays, frame loop, debug API
  engine/
    Engine.ts             renderer, bloom, lens grade, quality tiers, frame stats
    Input.ts              keyboard and mouse, pointer lock with a drag-to-look fallback
    Player.ts             free-flight controller with viscous damping
    Picker.ts             crosshair scanner
    Sequencer.ts          drives the tour, the story and "Travel there"
    Audio.ts              procedural ambience
    units.ts, rng.ts      real-unit formatting, seeded random numbers
  world/
    layout.ts             seeded placement of everything (pure data, no WebGL)
    kit.ts                registries: scannable objects, membranes, anchors, compartments
    state.ts              the glucose-to-insulin loop that drives the cell
    Cell.ts               builds the organelles and runs them each frame
  organelles/             one module per structure: geometry plus its live processes
  fx/                     membrane and protein shaders, particles, geometry helpers
  content/
    codex.ts              95 written entries
    codexExtra.ts         extracellular matrix entries
    references.ts         the only citations entries may use
    sequences.ts          tour and story stops
  ui/                     HUD, info panel, codex, coaching, styles
tests/                    content integrity, world consistency, the secretion loop, units
```

Each organelle module implements one small interface: a `group` to render, an `update` that
advances its processes, and `getProcessProgress` so the info panel can highlight the step
that is happening on screen.

### Checks worth knowing about

`npm test` builds the whole cell without a renderer and verifies that every codex entry has
somewhere to travel to and something to scan, that every scannable object maps to a codex
entry, that the tour and story only reference things that exist, and that the secretion loop
runs in the right causal order within physiological bounds.

### Debug hooks

Add `?debug` to the URL for `window.__cell`: `teleport(id)`, `scan()`, `stats()`,
`breakdown()`, `inspect(id)`, `travel(id)`, `tour.start()`, `story.start()`,
`setCutaway(bool)`, `step(n)` and more. These exist so the experience can be verified without
pointer lock.

## Not in this version

See `TODOS.md`: knowledge checks, photo mode, other cell types, touch controls.
