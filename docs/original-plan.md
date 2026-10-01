> **Historical document.** This is the plan the project started from, with the scope review
> notes that were written before building. The build moved on from it in several ways
> (the cell is a pancreatic beta cell, the glucose-to-insulin loop drives the whole cell, the
> extracellular matrix was added, the scene was simplified for clarity). The README describes
> what actually exists.

## Implementation plan
# Cytonaut: a first-person journey inside a living cell

## Problem

Cell biology is taught from flat, static, cut-away diagrams. Students memorize "the
mitochondria is the powerhouse of the cell" without ever seeing a proton gradient drive an
ATP synthase rotor, or a kinesin walk a vesicle down a microtubule. The user wants an
immersive, scientifically accurate, academic-grade experience: you are a speck inside a
human (animal) cell, free to fly anywhere, look anywhere, inspect any structure down to its
sub-components, and watch each organelle's real process actually happen.

## Goal

A browser game-quality 3D world, new repo at `~/cell-explorer`:

- First-person free-flight inside a generic human cell, full 6-DOF look and movement.
- Every major organelle modeled with accurate structure and sub-components.
- Every structure is inspectable: name, what it is, what it does, its parts, real numbers.
- Every organelle visibly performs its process, continuously, in the world.
- Looks rich: lit, translucent membranes, glow, depth, a crowded living cytoplasm.

## Non-goals (v1)

- Plant cell / prokaryote variants (chloroplast, cell wall, vacuole).
- Mitosis / cell-cycle simulation.
- Atom-level protein structures from PDB files.
- Multiplayer, accounts, backend, quizzes with saved scores.
- Mobile touch controls (desktop first; page must not break on mobile, shows a notice).

## Stack

- Vite + TypeScript (strict) + three.js (vanilla, imperative game loop; no React).
- Post-processing from three's own addons: EffectComposer, UnrealBloomPass, OutputPass,
  plus a small custom vignette/chromatic pass. No extra postfx dependency.
- UI: vanilla DOM + CSS overlay (HUD, info panel, codex, start screen). No UI framework.
- Tests: vitest for content integrity and pure math/geometry helpers.
- Zero external assets: all geometry procedural, all textures generated in shaders or
  canvas. Fonts via system stack plus one self-hosted display font is out of scope; use
  system fonts.

## Scale model (honesty about accuracy)

1 world unit = 100 nm. Cell radius 100 units (20 µm diameter cell).

- Organelle-scale structures use true relative proportions: nucleus radius ~30 (6 µm
  diameter), mitochondria 5 wide x 10-30 long, Golgi stack ~15 across, lysosomes radius
  2-4, peroxisomes radius 1.5-3, centrioles 2 wide x 5 long.
- Molecular machines (ribosomes 25 nm, ATP synthase 10 nm wide, motor proteins, pores,
  nucleosomes, membrane proteins, lipids) are exaggerated roughly 4-10x so their mechanism
  is visible. Molecule counts are reduced by orders of magnitude.
- Process speeds are slowed and stated: every info panel gives the real rate
  (e.g. ATP synthase ~100-150 rev/s, ribosome ~5 amino acids/s, kinesin ~800 nm/s).
- The start screen and each info panel carry an "Accuracy notes" line that says what is
  exaggerated or simplified. Nothing presented as fact is invented.
- The player can pass through membranes (a real speck could not). Crossing triggers a
  visible ripple and a HUD compartment change, and the notes say this is a liberty.

## World contents

Each item lists structure, pickable sub-components, and the live process.

1. **Plasma membrane**: curved bilayer shell. Near the player a detail patch renders
   individual phospholipids (head + two tails), cholesterol, and proteins.
   Sub-components: phospholipid, cholesterol, Na+/K+-ATPase, K+ leak channel, GLUT1,
   aquaporin, receptor (GPCR), glycocalyx glycoprotein, clathrin-coated pit.
   Process: Na+/K+ pump cycle (3 Na+ out, 2 K+ in, 1 ATP), glucose facilitated diffusion,
   receptor-mediated endocytosis (pit, dynamin scission, uncoating), exocytosis fusion.
2. **Cytosol**: crowded fluid with drifting proteins, free polysomes, glycogen granules,
   lipid droplets. Process: glycolysis summary particles (glucose to 2 pyruvate, net 2 ATP,
   2 NADH); Brownian motion.
3. **Cytoskeleton**: microtubules radiating from the centrosome (13 protofilaments,
   alpha/beta tubulin, plus/minus ends, dynamic instability at tips), actin cortex under
   the membrane (double-helical F-actin), intermediate filament cage around the nucleus.
   Process: kinesin-1 walking hand-over-hand to the plus end with vesicle cargo (8 nm
   steps, 1 ATP per step); dynein carrying cargo to the minus end; a microtubule tip
   growing then undergoing catastrophe.
4. **Centrosome**: two orthogonal centrioles (9 triplet microtubules each), pericentriolar
   material, gamma-tubulin ring complexes nucleating microtubules.
5. **Nucleus**: double envelope, nuclear pore complexes (8-fold symmetric, basket,
   cytoplasmic filaments), nuclear lamina, chromatin (heterochromatin at periphery,
   euchromatin inside), nucleosomes (DNA wrapped ~1.65 turns around histone octamer, H1
   linker), nucleolus (fibrillar center, dense fibrillar component, granular component).
   Process: RNA polymerase II transcribing a gene, pre-mRNA processed (5' cap, splicing,
   poly-A tail), mRNA exported through a pore; ribosomal subunits assembled in the
   nucleolus and exported; import of nuclear proteins.
6. **Rough ER**: stacked cisternae continuous with the outer nuclear membrane, studded
   with ribosomes. Sub-components: bound ribosome, Sec61 translocon, lumen, BiP chaperone,
   oligosaccharyltransferase, COPII bud at ER exit site.
   Process: co-translational translocation (SRP targeting, peptide threaded into lumen,
   N-glycan added, folding), COPII vesicles budding toward the Golgi.
7. **Smooth ER**: branching tubule network. Process: lipid synthesis, Ca2+ uptake by
   SERCA and release through IP3 receptors (ion particles), detox by cytochrome P450.
8. **Ribosomes** (free + bound): 40S + 60S subunits, mRNA, tRNAs at A/P/E sites, nascent
   chain. Process: elongation cycle with tRNA entry, peptide bond, translocation, exit.
9. **Golgi apparatus**: curved cis, medial, trans cisternae plus trans-Golgi network.
   Process: COPII vesicles arrive at cis face, cargo matures through the stack, COPI
   retrograde vesicles, TGN sorting into lysosomal (M6P), secretory, and membrane routes.
10. **Mitochondria** (many, a few fully detailed): outer membrane with VDAC porins,
    intermembrane space, inner membrane with cristae, matrix, circular mtDNA,
    mitoribosomes. Sub-components: Complex I, II, III, IV, ubiquinone, cytochrome c,
    ATP synthase (F0 c-ring, F1 head, stalk), ANT, TOM/TIM.
    Process: pyruvate in, Krebs cycle producing NADH/FADH2/CO2, electrons hopping
    I to Q to III to cyt c to IV, O2 reduced to water, H+ pumped (4, 4, 2), H+ flowing
    back through ATP synthase whose rotor visibly spins and releases ATP, ATP exported.
11. **Lysosomes**: single membrane, acidic lumen, V-ATPase proton pumps, acid hydrolases,
    LAMP glycoprotein lining. Process: V-ATPase pumping H+, fusion with a late endosome
    or autophagosome, cargo digested into monomers that are exported.
12. **Peroxisomes**: single membrane, dense enzyme core. Process: fatty acid
    beta-oxidation producing H2O2, catalase converting 2 H2O2 to 2 H2O + O2.
13. **Endosomes**: early endosome (tubular sorting), late endosome / multivesicular body.
    Process: endocytic vesicle delivery, receptor recycling, maturation to lysosome.
14. **Autophagosome**: double membrane forming around a damaged mitochondrion fragment,
    then fusing with a lysosome.
15. **Proteasome**: 26S barrel (20S core, 19S caps). Process: ubiquitin-tagged protein
    fed in, peptides out, ubiquitin recycled.
16. **Transport vesicles**: COPII, COPI, clathrin-coated, secretory. SNARE fusion.

Target: at least 16 organelle-level entries and at least 70 inspectable sub-component
entries in the codex, every one with a real description.

## Interaction design

- **Start screen**: title, one-paragraph premise, controls legend, "Enter the cell"
  button, quality selector, accuracy disclaimer.
- **Movement**: pointer lock. Mouse look (yaw/pitch, clamped). W/A/S/D move along view,
  Space up, C or Ctrl down, Shift boost, scroll wheel adjusts cruise speed. Velocity with
  viscous damping so it feels like swimming in fluid. Fallback when pointer lock is
  unavailable: click-drag to look.
- **Collision**: soft. The player cannot leave the cell (outer membrane clamps). Organelle
  membranes are passable with a ripple effect; solid molecular machines push the player
  around gently.
- **Compartment awareness**: HUD shows where you are ("Cytosol", "Mitochondrial matrix",
  "Nucleoplasm", "ER lumen", "Golgi lumen", "Lysosome lumen") with compartment-specific
  fog color, particle tint, and ambience so each interior feels different.
- **Scan**: center crosshair raycast. Hover shows a floating name tag with a thin outline
  highlight. Click (or E) opens the info panel for the most specific thing under the
  crosshair (ATP synthase rather than "mitochondrion"), with a breadcrumb up to parents.
- **Info panel**: name, category, one-line definition, function, structure list (each
  component clickable), "What you are watching" process steps synchronized with the live
  animation, real numbers (size, count per cell, rate), accuracy notes.
- **Codex** (Tab): all entries grouped by organelle, discovered vs undiscovered, progress
  counter, search, "Travel there" button.
- **Guided tour** (T): scripted flight that visits each organelle in the order of the
  central dogma + secretory pathway + energy, with captions. Interruptible at any time.
- **Time control**: [ and ] slow down / speed up process animation, P pauses processes.
- **Navigator**: small 3D-ish locator showing player position in the cell and organelle
  markers.
- **Settings**: quality tier (low/medium/high), mouse sensitivity, invert Y, reduced
  motion, labels on/off.
- **Audio**: procedural ambient drone via WebAudio (muffled underwater feel, per
  compartment filter), soft blips on scan. Mute toggle. Starts only after user gesture.

## Visual direction

"Living bioluminescent microscopy": deep teal-to-indigo cytoplasm fog, translucent
membranes with fresnel rim light and slow noise-driven undulation, emissive process
particles (ATP gold, H+ cyan-white, electrons electric blue, Na+ violet, K+ green, Ca2+
orange, mRNA coral), bloom, soft vignette, thousands of drifting motes for depth.
Stable organelle color identity following textbook convention: nucleus violet, ER
teal-blue, Golgi amber, mitochondria red-orange, lysosomes magenta, peroxisomes green,
cytoskeleton pale green / blue-white, membrane warm tan lipids.

## Architecture

```
src/
  main.ts                 bootstrap, wires engine + world + ui
  engine/
    Engine.ts             renderer, composer, loop, resize, quality tiers
    Player.ts             pointer-lock fly controller, damping, soft collision
    Picker.ts             crosshair raycast -> entity id, highlight
    Lod.ts                distance-based detail activation
    Audio.ts              procedural ambience
    rng.ts, math.ts       seeded RNG, curve + geometry helpers
  world/
    Cell.ts               layout, builds all organelles, compartment queries
    compartments.ts       point -> compartment (analytic shapes)
    types.ts              Organelle interface
  organelles/
    PlasmaMembrane.ts  Nucleus.ts  RoughER.ts  SmoothER.ts  Golgi.ts
    Mitochondrion.ts  Lysosome.ts  Peroxisome.ts  Centrosome.ts
    Cytoskeleton.ts  Endosomes.ts  Proteasome.ts  Ribosomes.ts  Cytosol.ts
    Vesicles.ts        Autophagy.ts
  fx/
    materials.ts          membrane shader, glow materials
    particles.ts          instanced particle pools moving along paths
  content/
    codex.ts              typed entries: id, parent, name, category, summary,
                          function, structure[], process[], facts[], accuracy
    tour.ts               tour stops
  ui/
    hud.ts  panel.ts  codexView.ts  start.ts  settings.ts  navigator.ts  styles.css
tests/
  codex.test.ts           every entry complete; every parent exists; ids unique
  pickables.test.ts       every pickable id used by organelles exists in codex
  compartments.test.ts    point classification
  math.test.ts            path / curve helpers
```

Organelle contract:

```ts
interface Organelle {
  id: string;
  group: THREE.Group;
  update(dt: number, t: number, ctx: FrameCtx): void; // ctx: player pos, time scale, quality
  setDetail?(near: boolean): void;                     // LOD hook
}
```

Pickability: each mesh (or InstancedMesh) carries `userData.entityId`; instanced meshes
may map `instanceId -> entityId`. The picker resolves the nearest hit with an entityId.

## Performance budget

- 60 fps at 1440p on Apple-silicon laptops at "high"; "low" tier disables bloom, halves
  particles and pixel ratio for integrated GPUs.
- InstancedMesh for anything repeated (ribosomes, lipids, pores, proteins, particles).
- Detail tiers: molecular sub-components exist only near the player (LOD).
- Target under ~350 draw calls and under ~2.5M triangles in view.

## Scientific accuracy process

- All codex text written from standard textbook knowledge (Alberts, Molecular Biology of
  the Cell; Lodish; Nelson & Cox). Numbers stated with ranges where the literature varies.
- A dedicated accuracy review pass over the codex before ship, checking every numeric
  claim and stoichiometry (ETC proton counts, pump ratios, subunit names).

## Verification

- `npm run build` (tsc -b + vite build) clean.
- `npm test` green.
- Manual + automated browser run: load, enter, fly, scan at least one sub-component in
  each organelle, open codex, run tour, no console errors, frame time sane.
- A `?debug` URL flag exposes `window.__cell` (teleport, list entities, stats) so the
  experience can be verified without pointer lock.

## Delivery

- Git repo at `~/cell-explorer` on `main`, committed in logical steps.
- README with run instructions, controls, accuracy statement, architecture map.

<!-- autoplan-accepted:ceo -->
- E1 Story mode "Follow the protein": key G starts a narrated sequence that follows one insulin molecule: transcription by RNA pol II, mRNA export through a nuclear pore, SRP-guided docking at the rough ER, co-translational translocation, ER folding and disulfide formation, COPII vesicle to cis-Golgi, transit to trans-Golgi network, secretory granule, exocytosis at the plasma membrane. Each step names the organelle, shows a caption, and highlights the live process. Any movement key exits. Verify: unit test that every story step references an existing codex id and a world anchor; browser check that the story runs start to end with no console errors.
- E2 Scale bar: the HUD shows a scale bar with a real-world length (nm or µm) for the current view distance and, when an entity is targeted, its real size from the codex. Verify: unit test of the units formatter (nm/µm boundaries); browser check that the bar updates when flying.
- E3 Cutaway toggle: key X toggles organelle outer membranes between normal and a low-opacity x-ray mode, so interiors (cristae, cisternae, nucleolus, chromatin) are visible from outside. Verify: browser check that toggling changes membrane opacity on nucleus and a mitochondrion.
- E4 References: every organelle-level codex entry carries at least one textbook or review reference (author, title, edition/year). Verify: codex test asserts references on every top-level entry.
- Deferred to TODOS.md with context: E5 knowledge checks, E6 photo mode, E7 other cell types, E8 touch controls.
- S1 Integration of E1-E4 into architecture: add `src/content/story.ts` (story steps), `src/engine/Sequencer.ts` (one shared camera-flight + caption sequencer that drives both the T tour and the G story), scale bar inside `ui/hud.ts` with formatter in `src/engine/units.ts`, cutaway state in `src/world/Cell.ts`; tests `tests/story.test.ts`, `tests/units.test.ts`, `tests/tour.test.ts`. Start screen controls legend lists G (story) and X (cutaway).
- S2 Codex schema: each entry has `id, parent (null for organelle-level), name, category, summary, function, structure[], process[] (ordered steps), facts[] (label/value strings), sizeNm: [min, max], realRate? (string), enlargement? (number, for exaggerated molecules), accuracy (string), references[]`. Each reference is `{source: 'Alberts 7e (2022)' | 'Lodish 9e (2021)' | 'Nelson & Cox 8e (2021)', chapter: string}` or a review with a DOI. Organelle-level means `parent === null`; exactly the 16 world-content entries are organelle-level. Tests assert every field non-empty, every parent exists, ids unique, references present on all 16, sizeNm min <= max.
- S3 World anchors: `Cell` exposes `anchors: Map<string, () => Vector3>` (live positions, e.g. "nucleus.pore.0", "rer.translocon.0", "golgi.cis", "golgi.tgn", "pm.exocytosis", "mito.0.atpsynthase"). Tour and story stops reference anchor keys; `story.test` and `tour.test` assert every key is registered by the built world (world built headless in the test).
- S4 Mode state machine `{free, tour, story}` in `Sequencer`: T or G from free starts that mode; T or G while any sequence runs stops it and returns to free (no restart-on-repeat); starting one mode while the other runs replaces it; any movement key (WASD/Space/C) exits to free with velocity zeroed; mouse-look during a sequence is allowed and does not exit (camera look offsets the scripted gaze); opening the codex or panel pauses the sequence and closing resumes; P and [ ] apply to process time only, never to sequence flight timing; reduced-motion makes sequence flights cut (instant teleport + fade) instead of fly.
- S5 Story accuracy: the story's caption at step 1 states that this cell is treated as a pancreatic beta cell, since insulin is made only there and regulated secretory granules are a specialized feature. Steps include signal-peptide cleavage in the ER (preproinsulin to proinsulin), disulfide bond formation, and proinsulin cleavage to insulin + C-peptide inside the maturing granule. The story owns one tracked "cargo" entity (glowing particle cluster) that travels a spline through the anchors; the ambient process at each stop is highlighted.
- S6 Debug API: with `?debug`, `window.__cell` exposes `teleport(anchorOrVec)`, `entities()`, `stats()` (fps, frame ms p50/p95, draw calls, triangles), `story.start()/skip()/stop()`, `tour.start()/skip()/stop()`, `setCutaway(bool)`, `membraneOpacity(id)`, `scan()` (returns entity id under crosshair), `compartment()` (current compartment label), `timeScale(n)`.
- S7 Cutaway rules: X never affects the plasma membrane. It x-rays the nucleus outer and inner envelope, the mitochondrial outer and inner boundary membrane (cristae stay opaque), and lysosome, peroxisome, endosome and autophagosome membranes; ER and Golgi sheets stay as they are. X-ray opacity 0.08 with rim glow kept; x-rayed membranes are skipped by the picker so you scan what is inside.
- S8 Input safety: no Ctrl binding (down is C, up is Space); `preventDefault` on Tab, Space, arrow keys while in-game; Esc releases pointer lock and pauses into a menu overlay; window blur pauses the simulation (rendering continues at low rate).
- S9 Persistence: codex discovered-set and settings saved to localStorage, every read/write wrapped in try/catch, game works with storage unavailable.
- S10 Reduced motion: near-zero membrane undulation, no ripple, no camera bob, sequence flights cut instead of fly; process animations keep running (they are the content) but particle trails are shortened. Defaults from `prefers-reduced-motion`.
- S11 WebGL2 fallback: if a WebGL2 context cannot be created, show a static message screen naming the requirement; no blank canvas.
- S12 Compartments: full list Cytosol, Nucleoplasm, Nucleolus, Perinuclear space (nuclear envelope lumen), Mitochondrial matrix, Intermembrane space, ER lumen, Golgi lumen, Lysosome lumen, Peroxisomal matrix, Endosome lumen, Autophagosome lumen, Vesicle lumen; the plasma membrane clamps the player inside so extracellular space is never entered. Detection uses per-organelle signed-distance primitives (capsule, ellipsoid, rounded box, torus slab); documented as approximate for thin sheets.
- S13 Picking performance: hover pick runs at 15 Hz, not every frame; first pass against per-organelle bounding proxies, second pass raycasts only the meshes of the hit organelle and only near-LOD instanced sets. No BVH dependency. Click picks run immediately. Soft push collision uses the same organelle-level proxies only (no per-molecule push).
- S14 Transparency: membranes use `depthWrite = false`, explicit `renderOrder` by nesting depth (plasma membrane last), fresnel-weighted alpha so face-on regions stay clear.
- S15 Process LOD: every process runs at all distances as a cheap particle summary (one instanced particle pool per process type); within the LOD radius the full mechanistic detail (moving parts, conformational changes) turns on. This satisfies "continuously" while meeting the draw-call budget.
- S16 Verification numbers: at high tier on Apple silicon at the debug viewpoint "overview", p95 frame time <= 16.7 ms and draw calls <= 350, read from `__cell.stats()`.
- S17 Milestones and cut line: M1 engine, player, picker, codex schema, membrane material, plasma membrane, nucleus, mitochondria, cytosol; M2 remaining 12 organelles and all processes; M3 E1 story, tour, E2 scale bar, E3 cutaway, E4 references, navigator; M4 audio, chromatic pass, polish. Cuttable if time runs short (deferred to TODOS, never silently dropped): audio, chromatic pass, navigator.
- S18 Tour content is distinct from story: tour is an organelle survey ending on energy (mitochondrion ETC + ATP synthase, then ATP used by kinesin), story is the secretory pathway. The CEO vision's ATP-to-kinesin moment is delivered by the tour's final two stops.
- S19 Font line clarified: system font stack only.
- S20 Scale bar definition (refines E2): measured at the crosshair hit distance, or at 10 world units when nothing is hit; labeled "organelle scale". The targeted entity shows its true size from `sizeNm` plus "(shown ~Nx enlarged)" when `enlargement` is set. Formatter: < 1 nm shows Å, 1-999 nm shows nm, >= 1000 nm shows µm with one decimal.
- S21 Process phase API: `Organelle.getProcessPhase?(processId): {step: number, t: number}` so the info panel highlights the current step of "What you are watching".
- S22 Precedence: where an accepted item conflicts with earlier plan text (for example "C or Ctrl down", the tour ordering line, the font sentence), the accepted item wins. The implementation follows E1-E4 and S1-S21 over the base text.
- S23 Story coverage: the codex gains sub-component ids needed by the story: `srp` (signal recognition particle + receptor), `signal-peptidase`, `pdi` (protein disulfide isomerase), `prohormone-convertase` (PC1/3, PC2, carboxypeptidase E), `insulin-granule`, `rna-pol-ii`, `mrna`. Steps without an ambient process (signal-peptide cleavage, proinsulin cleavage in the granule, granule exocytosis) get story-only animations driven by the story cargo entity.
- S24 Discovery and travel: an entry is discovered when its info panel is opened. Every codex entry has a `anchor` key resolved from pure layout data (not live meshes); LOD-only parts resolve to the nearest representative instance location. "Travel there" runs a `travel` mode in the Sequencer with the same exit, pause and reduced-motion rules as tour/story.
- S25 Text input focus: all game key handlers ignore events whose target is an input, textarea or contenteditable, and ignore keys while an overlay owns focus (codex search, settings).
- S26 Compartment hysteresis: a new compartment label must hold for 150 ms before HUD, fog and ambience switch; the membrane ripple has a 400 ms cooldown.
- S27 Milestones (refines S17): M1 also includes start screen, HUD (compartment label, crosshair, name tag), info panel, input safety, WebGL2 fallback, mobile notice. M2 also includes codex view, settings, time controls, persistence.
- S28 Mobile notice: if the device reports coarse pointer or the viewport is narrower than 700 px, the start screen shows a notice that the experience needs a keyboard and mouse; the 3D scene still renders behind it.
- S29 Sequencer keys (supersedes S4 key rule): pressing the key of the running mode stops it (back to free); pressing the other mode key replaces the running sequence with the other mode.
- S30 Collision (supersedes S13 push clause): no push from membrane-bounded organelle volumes; membranes are always passable. Soft push only from small solid proxies (centrioles, proteasomes, ATP synthase and pore clusters at near LOD). The cell boundary clamp remains.
- S31 Codex optional fields (supersedes S2 non-empty rule): `process[]`, `realRate`, `enlargement` are optional; `process[]` is required only for entries that perform a live process in the world. `references[]` is required only for `parent === null`. Required on every entry: id, parent, name, category, summary, function, facts (>= 1), sizeNm, accuracy, anchor.
- S32 Reference format (refines E4/S2): `src/content/references.ts` maps each source key to a full citation (authors, title, edition, publisher, year). Review references use `{authors, title, journal, year, doi}`. Codex test checks every key resolves.
- S33 Process phase API (refines S21): `processId` is the codex id of the entity performing the process. The panel shows the phase of the targeted instance or, if none, the nearest near-LOD instance; at far LOD the call returns null and no step is highlighted.
- S34 Story cargo runs on sequence time, not process time; P and [ ] never freeze or speed the cargo.
- S35 Pointer lock and overlays: opening codex, panel or settings releases pointer lock programmatically and does not open the pause menu; the pause menu opens only when lock exits without a programmatic flag (Esc). Closing an overlay shows a "click to resume" prompt and re-locks on that click. In click-drag fallback mode, a click scans only when the pointer moved less than 4 px.
- S36 Picking order (refines S13): collect every organelle proxy the ray hits, including proxies that contain the ray origin, ordered by entry distance; mesh-raycast each in turn and stop when a mesh hit is nearer than the next proxy's entry distance; prefer the most specific (deepest codex) entity at a given hit. Cytosol is picked only when nothing else is hit.
- S37 Pure layout module: `src/world/layout.ts` produces seeded positions, anchors, pickable ids and SDF params with no DOM or WebGL; organelle classes consume it for rendering. Tests build only the layout. Canvas textures are created lazily at render time.
- S38 Perf gate measurability (refines S16): `renderer.info.autoReset = false`, reset once per frame. Draw calls and triangles at anchor `overview` (registered) are the hard automated gate; frame time p95 is measured in a headed browser on real hardware and reported, not gated in headless runs.
- S39 Depth range: camera near 0.02, far 600, `logarithmicDepthBuffer: true`; all custom ShaderMaterials include three's logdepth shader chunks.
- S40 Interior LOD (refines S7/S15): organelle-scale interiors (cristae, nucleolus, chromatin domains, Golgi cisternae) have an always-on coarse LOD so X-ray never reveals an empty shell; molecular machines remain near-LOD only. The E3 browser check targets a detailed mitochondrion.
- S41 Cell identity (TASTE, supersedes base "generic human cell" and refines S5): the world is a human pancreatic beta cell, a real animal cell type that has every organelle in the plan plus a resident population of insulin secretory granules (dense core, pale halo) clustered near the plasma membrane. The start screen and plasma-membrane accuracy note say so. `insulin-granule`, `prohormone-convertase` and `signal-peptidase` therefore exist in the world (granules ambient; convertase inside granules; signal peptidase at translocons near LOD) and are scannable, travelable and discoverable.
- S42 Undiscovered codex entries show name and category only; their panel cannot be opened from the codex until discovered in the world, but "Travel there" works for every entry.
- S43 Cutaway interiors (refines S40): lysosome (hydrolase haze + digesting debris), peroxisome (crystalline urate-oxidase-like enzyme core), late endosome (intraluminal vesicles), autophagosome (engulfed mitochondrion fragment) get always-on coarse interiors. If a ray crosses an x-rayed proxy and hits no interior mesh, the picker returns that organelle's id.
- S44 Multiple processes (refines S2/S21/S33): codex entries use `processes: {id, name, steps[]}[]` (optional, per S31). Phase API is `getProcessPhase(entityId, processId)`. Organelle-level panels list all their processes; only the process of the targeted sub-component (or the first process when the organelle itself is targeted) is live-synced.
- S45 Anchors (supersedes S3 and the "nearest representative instance" clause of S24): anchors are static keys defined in `layout.ts` with a base position; a moving entity may register a runtime offset function in `Cell`. Each LOD-only entry names a fixed designated representative instance. Tests assert anchor keys against the layout only.
- S46 Overlay resume (refines S4/S35): closing an overlay leaves the sequence paused and shows "click to resume"; the re-lock click resumes the sequence and is consumed (never scans).
- S47 Four-state sequencer (refines S4/S29/S24/S6): states {free, tour, story, travel}. Travel returns to free on arrival; T or G during travel replaces it; "Travel there" closes the codex first, so travel starts unpaused once pointer lock is re-acquired (the click-to-resume click starts it). `__cell.travel(id)` added to the debug API.
- S48 Transparency order (supersedes S14 "plasma membrane last"): each frame, membranes that contain the player render first, outermost-first; all other membranes render after, by nesting depth then far-to-near distance. `depthWrite = false` on membranes stays.
- S49 Process done-definition (refines S15/S17): every process is "done" with its S15 particle summary plus panel steps. Full near-LOD mechanisms are required for the priority set: ATP synthase rotation with H+ flow, kinesin hand-over-hand stepping, Na+/K+ pump cycle, ribosome elongation (tRNA A/P/E), mRNA export through a nuclear pore, Sec61 co-translational translocation, and every story stop. Other full mechanisms are cuttable to TODOS.md if time runs short, never silently dropped. E1 story moves into M2 right after the priority mechanisms.
<!-- /autoplan-accepted:ceo -->
## Review record

### Phase 1: CEO review (autoplan, SELECTIVE EXPANSION)

Pre-review system audit: greenfield repo (`git init` only, no commits, no TODOS.md, no
CLAUDE.md, no design doc). Nothing to retrospect. Outside voice: Codex `not_installed`, so
outside coverage is unavailable; native Claude passes only. Landscape check: no Aside, web
search not run for this phase; in-distribution knowledge used. Known prior art: "The Inner
Life of the Cell" (Harvard/XVIVO animation, non-interactive), "Cell Explorer"-style WebGL
demos (usually a single static cut-away mesh with labels), BioDigital/Visible Body (organ
level, paid). None offers free first-person flight through a crowded, animated cell with a
codex down to molecular machines. Layer 3 insight: the value is not the 3D model, it is
watching a mechanism happen while you are inside it; the plan should prioritize live
processes over polygon detail.

Taste calibration: good references are three.js addons (EffectComposer/UnrealBloomPass) and
the Saras project's Scene3D pattern (one shared scene scaffold, per-model modules). Avoid:
one giant `main.ts` that builds everything inline.

#### 0A. Premise challenge
- Real problem: students cannot see cellular mechanisms; static diagrams hide motion,
  scale and crowding. The plan solves that directly (live processes in-world), not a proxy.
- Do-nothing cost: user has no product; nothing exists.
- Premise P1 "scientifically accurate" conflicts with visibility (true-scale molecules are
  invisible next to a 6 µm nucleus). Plan already resolves this honestly with a stated scale
  model and per-entry accuracy notes. Accepted (P6).
- Premise P2 "every organelle + every process" is large. It is the user's explicit ask.
  Accepted; risk handled by LOD and a shared particle/path system rather than bespoke code
  per process.
- Premise P3 browser-first is right: zero-install is what lets a student or teacher open it.

#### 0B. Existing code leverage
| Sub-problem | Existing code | Decision |
|---|---|---|
| Rendering, postfx | three.js + `three/addons` (EffectComposer, UnrealBloomPass, OutputPass) | Reuse, no extra postfx lib |
| First-person controls | `three/addons/controls/PointerLockControls` | Reuse its lock handling; own the velocity/damping model |
| Picking | `THREE.Raycaster` with InstancedMesh `instanceId` | Reuse |
| Noise for membranes | none in repo | Write a small GLSL simplex noise chunk |
| UI | none | Vanilla DOM |

#### 0C. Dream state
```
  CURRENT STATE              THIS PLAN                          12-MONTH IDEAL
  empty repo      --->  one animal cell, 16 organelles,  --->  cell library (plant, neuron,
                        70+ codex parts, live processes,       bacterium), guided lessons with
                        tour + codex + accuracy notes          teacher mode, quizzes, VR
```
The plan moves directly toward the ideal; the codex data model and organelle contract are
the platform the later cells reuse.

#### 0E. Mode
Mode: SELECTIVE EXPANSION (autoplan override). Approved decisions: none prior. Hold the
user's full scope; cherry-pick additions that make learning land. No new approach decision
was needed (single viable approach: vanilla three.js, procedural).

#### 0G. Selective expansion: HOLD checks
1. Complexity: ~45 files is inherent to 16 organelles + UI; each organelle is one module
   behind one interface, so the moving parts are uniform. No cut.
2. Minimum changes: none deferrable without breaking the user's "every organelle" ask.
3. Invariants kept: every organelle inspectable, every process visible, accuracy notes.

#### 0G. Cherry-pick ceremony (auto-decided, P1/P2)
| # | Proposal | Effort | Risk | Decision | Reasoning |
|---|---|---|---|---|---|
| E1 | "Follow the protein" story mode: follow one secretory protein (insulin) from gene to secretion through nucleus, pore, ribosome, ER, Golgi, vesicle, membrane | M | low | ACCEPTED | Links organelles into the central dogma; reuses tour flight + particles (P2) |
| E2 | Live scale bar in HUD showing real size of the targeted structure and current magnification | S | low | ACCEPTED | Scale is the hardest thing to teach; one HUD element (P1) |
| E3 | Cutaway / X-ray toggle (X) that makes organelle outer membranes see-through | S | low | ACCEPTED | Lets the user see cristae, cisternae, nucleolus without flying in (P1) |
| E4 | Per-entry textbook references in the codex | S | low | ACCEPTED | Academic credibility the user asked for; data-only (P1) |
| E5 | Session-only knowledge checks per organelle | M | med | DEFERRED | Borders the "no quizzes" non-goal; TODOS.md |
| E6 | Photo mode (hide HUD, free camera, screenshot) | S | low | DEFERRED | Nice, not learning-critical; TODOS.md |
| E7 | Plant / neuron / bacterial cell variants | XL | high | DEFERRED | Explicit non-goal; TODOS.md |
| E8 | Touch controls for tablets | M | med | DEFERRED | Explicit non-goal; TODOS.md |

#### 0H. Spec review loop
Iteration 1 (general-purpose subagent, both inputs read in full): score 5/10, FAIL on all
five dimensions, 27 numbered issues. All auto-decided ACCEPT (P1 completeness, P5
explicit) as S1-S19 below, except: Consistency-1 insulin is a TASTE decision (kept insulin,
framed as beta cell with processing steps, rather than switching to a generic secreted
glycoprotein); Scope-3 tour/story overlap resolved by S18 (distinct content, shared
sequencer); Clarity-4 collision with instanced machines resolved by dropping per-molecule
push and keeping soft push from organelle-level proxies only (S13 proxies reused).

Iteration 2: score 6/10, FAIL, 18 issues, all ACCEPTED as S23-S40 (P1/P5).
Iteration 3 (final allowed launch): score 7/10, FAIL, 8 issues, all ACCEPTED as S41-S49.
S41 (world becomes a pancreatic beta cell) is a TASTE decision surfaced at the final gate.
Metrics persisted to ~/.gstack/analytics/spec-review.jsonl (3 iterations, 53 found, 45
fixed-and-reverified, 8 fixed after the cap, score 7).
0H document approval: auto-decided A (approve working plan + CEO summary, continue to 0I).

#### 0I. Temporal interrogation
```
  HOUR 1 (foundations):  Vite+TS scaffold, Engine (renderer, log depth, composer, info
                         autoReset off), Player, layout.ts seeded RNG, codex types.
                         Implementer must know: 1 unit = 100 nm, near 0.02 / far 600.
  HOUR 2-3 (core logic): membrane shader (fresnel, noise, logdepth chunks), particle
                         pools, nucleus/mito/PM. Ambiguity: how to make cristae read at
                         coarse LOD (answer: folded plane stack inside capsule).
  HOUR 4-5 (integration):picker ordering with x-ray, sequencer + pointer-lock overlays,
                         transparency ordering when inside nested membranes. Surprise:
                         transparent sort flicker; renderOrder per frame from S48.
  HOUR 6+ (polish/tests):codex volume (86+ entries) and accuracy pass, story spline,
                         perf gate at overview, reduced-motion pass.
```
Effort: human team ~6-8 weeks / CC+gstack ~6-10 hours of focused build. Feasibility
blockers: none; pending choices: none blocking (all S-items settled).

<!-- autoplan-accepted:ceo -->
- E1 Story mode "Follow the protein": key G starts a narrated sequence that follows one insulin molecule: transcription by RNA pol II, mRNA export through a nuclear pore, SRP-guided docking at the rough ER, co-translational translocation, ER folding and disulfide formation, COPII vesicle to cis-Golgi, transit to trans-Golgi network, secretory granule, exocytosis at the plasma membrane. Each step names the organelle, shows a caption, and highlights the live process. Any movement key exits. Verify: unit test that every story step references an existing codex id and a world anchor; browser check that the story runs start to end with no console errors.
- E2 Scale bar: the HUD shows a scale bar with a real-world length (nm or µm) for the current view distance and, when an entity is targeted, its real size from the codex. Verify: unit test of the units formatter (nm/µm boundaries); browser check that the bar updates when flying.
- E3 Cutaway toggle: key X toggles organelle outer membranes between normal and a low-opacity x-ray mode, so interiors (cristae, cisternae, nucleolus, chromatin) are visible from outside. Verify: browser check that toggling changes membrane opacity on nucleus and a mitochondrion.
- E4 References: every organelle-level codex entry carries at least one textbook or review reference (author, title, edition/year). Verify: codex test asserts references on every top-level entry.
- Deferred to TODOS.md with context: E5 knowledge checks, E6 photo mode, E7 other cell types, E8 touch controls.
- S1 Integration of E1-E4 into architecture: add `src/content/story.ts` (story steps), `src/engine/Sequencer.ts` (one shared camera-flight + caption sequencer that drives both the T tour and the G story), scale bar inside `ui/hud.ts` with formatter in `src/engine/units.ts`, cutaway state in `src/world/Cell.ts`; tests `tests/story.test.ts`, `tests/units.test.ts`, `tests/tour.test.ts`. Start screen controls legend lists G (story) and X (cutaway).
- S2 Codex schema: each entry has `id, parent (null for organelle-level), name, category, summary, function, structure[], process[] (ordered steps), facts[] (label/value strings), sizeNm: [min, max], realRate? (string), enlargement? (number, for exaggerated molecules), accuracy (string), references[]`. Each reference is `{source: 'Alberts 7e (2022)' | 'Lodish 9e (2021)' | 'Nelson & Cox 8e (2021)', chapter: string}` or a review with a DOI. Organelle-level means `parent === null`; exactly the 16 world-content entries are organelle-level. Tests assert every field non-empty, every parent exists, ids unique, references present on all 16, sizeNm min <= max.
- S3 World anchors: `Cell` exposes `anchors: Map<string, () => Vector3>` (live positions, e.g. "nucleus.pore.0", "rer.translocon.0", "golgi.cis", "golgi.tgn", "pm.exocytosis", "mito.0.atpsynthase"). Tour and story stops reference anchor keys; `story.test` and `tour.test` assert every key is registered by the built world (world built headless in the test).
- S4 Mode state machine `{free, tour, story}` in `Sequencer`: T or G from free starts that mode; T or G while any sequence runs stops it and returns to free (no restart-on-repeat); starting one mode while the other runs replaces it; any movement key (WASD/Space/C) exits to free with velocity zeroed; mouse-look during a sequence is allowed and does not exit (camera look offsets the scripted gaze); opening the codex or panel pauses the sequence and closing resumes; P and [ ] apply to process time only, never to sequence flight timing; reduced-motion makes sequence flights cut (instant teleport + fade) instead of fly.
- S5 Story accuracy: the story's caption at step 1 states that this cell is treated as a pancreatic beta cell, since insulin is made only there and regulated secretory granules are a specialized feature. Steps include signal-peptide cleavage in the ER (preproinsulin to proinsulin), disulfide bond formation, and proinsulin cleavage to insulin + C-peptide inside the maturing granule. The story owns one tracked "cargo" entity (glowing particle cluster) that travels a spline through the anchors; the ambient process at each stop is highlighted.
- S6 Debug API: with `?debug`, `window.__cell` exposes `teleport(anchorOrVec)`, `entities()`, `stats()` (fps, frame ms p50/p95, draw calls, triangles), `story.start()/skip()/stop()`, `tour.start()/skip()/stop()`, `setCutaway(bool)`, `membraneOpacity(id)`, `scan()` (returns entity id under crosshair), `compartment()` (current compartment label), `timeScale(n)`.
- S7 Cutaway rules: X never affects the plasma membrane. It x-rays the nucleus outer and inner envelope, the mitochondrial outer and inner boundary membrane (cristae stay opaque), and lysosome, peroxisome, endosome and autophagosome membranes; ER and Golgi sheets stay as they are. X-ray opacity 0.08 with rim glow kept; x-rayed membranes are skipped by the picker so you scan what is inside.
- S8 Input safety: no Ctrl binding (down is C, up is Space); `preventDefault` on Tab, Space, arrow keys while in-game; Esc releases pointer lock and pauses into a menu overlay; window blur pauses the simulation (rendering continues at low rate).
- S9 Persistence: codex discovered-set and settings saved to localStorage, every read/write wrapped in try/catch, game works with storage unavailable.
- S10 Reduced motion: near-zero membrane undulation, no ripple, no camera bob, sequence flights cut instead of fly; process animations keep running (they are the content) but particle trails are shortened. Defaults from `prefers-reduced-motion`.
- S11 WebGL2 fallback: if a WebGL2 context cannot be created, show a static message screen naming the requirement; no blank canvas.
- S12 Compartments: full list Cytosol, Nucleoplasm, Nucleolus, Perinuclear space (nuclear envelope lumen), Mitochondrial matrix, Intermembrane space, ER lumen, Golgi lumen, Lysosome lumen, Peroxisomal matrix, Endosome lumen, Autophagosome lumen, Vesicle lumen; the plasma membrane clamps the player inside so extracellular space is never entered. Detection uses per-organelle signed-distance primitives (capsule, ellipsoid, rounded box, torus slab); documented as approximate for thin sheets.
- S13 Picking performance: hover pick runs at 15 Hz, not every frame; first pass against per-organelle bounding proxies, second pass raycasts only the meshes of the hit organelle and only near-LOD instanced sets. No BVH dependency. Click picks run immediately. Soft push collision uses the same organelle-level proxies only (no per-molecule push).
- S14 Transparency: membranes use `depthWrite = false`, explicit `renderOrder` by nesting depth (plasma membrane last), fresnel-weighted alpha so face-on regions stay clear.
- S15 Process LOD: every process runs at all distances as a cheap particle summary (one instanced particle pool per process type); within the LOD radius the full mechanistic detail (moving parts, conformational changes) turns on. This satisfies "continuously" while meeting the draw-call budget.
- S16 Verification numbers: at high tier on Apple silicon at the debug viewpoint "overview", p95 frame time <= 16.7 ms and draw calls <= 350, read from `__cell.stats()`.
- S17 Milestones and cut line: M1 engine, player, picker, codex schema, membrane material, plasma membrane, nucleus, mitochondria, cytosol; M2 remaining 12 organelles and all processes; M3 E1 story, tour, E2 scale bar, E3 cutaway, E4 references, navigator; M4 audio, chromatic pass, polish. Cuttable if time runs short (deferred to TODOS, never silently dropped): audio, chromatic pass, navigator.
- S18 Tour content is distinct from story: tour is an organelle survey ending on energy (mitochondrion ETC + ATP synthase, then ATP used by kinesin), story is the secretory pathway. The CEO vision's ATP-to-kinesin moment is delivered by the tour's final two stops.
- S19 Font line clarified: system font stack only.
- S20 Scale bar definition (refines E2): measured at the crosshair hit distance, or at 10 world units when nothing is hit; labeled "organelle scale". The targeted entity shows its true size from `sizeNm` plus "(shown ~Nx enlarged)" when `enlargement` is set. Formatter: < 1 nm shows Å, 1-999 nm shows nm, >= 1000 nm shows µm with one decimal.
- S21 Process phase API: `Organelle.getProcessPhase?(processId): {step: number, t: number}` so the info panel highlights the current step of "What you are watching".
- S22 Precedence: where an accepted item conflicts with earlier plan text (for example "C or Ctrl down", the tour ordering line, the font sentence), the accepted item wins. The implementation follows E1-E4 and S1-S21 over the base text.
- S23 Story coverage: the codex gains sub-component ids needed by the story: `srp` (signal recognition particle + receptor), `signal-peptidase`, `pdi` (protein disulfide isomerase), `prohormone-convertase` (PC1/3, PC2, carboxypeptidase E), `insulin-granule`, `rna-pol-ii`, `mrna`. Steps without an ambient process (signal-peptide cleavage, proinsulin cleavage in the granule, granule exocytosis) get story-only animations driven by the story cargo entity.
- S24 Discovery and travel: an entry is discovered when its info panel is opened. Every codex entry has a `anchor` key resolved from pure layout data (not live meshes); LOD-only parts resolve to the nearest representative instance location. "Travel there" runs a `travel` mode in the Sequencer with the same exit, pause and reduced-motion rules as tour/story.
- S25 Text input focus: all game key handlers ignore events whose target is an input, textarea or contenteditable, and ignore keys while an overlay owns focus (codex search, settings).
- S26 Compartment hysteresis: a new compartment label must hold for 150 ms before HUD, fog and ambience switch; the membrane ripple has a 400 ms cooldown.
- S27 Milestones (refines S17): M1 also includes start screen, HUD (compartment label, crosshair, name tag), info panel, input safety, WebGL2 fallback, mobile notice. M2 also includes codex view, settings, time controls, persistence.
- S28 Mobile notice: if the device reports coarse pointer or the viewport is narrower than 700 px, the start screen shows a notice that the experience needs a keyboard and mouse; the 3D scene still renders behind it.
- S29 Sequencer keys (supersedes S4 key rule): pressing the key of the running mode stops it (back to free); pressing the other mode key replaces the running sequence with the other mode.
- S30 Collision (supersedes S13 push clause): no push from membrane-bounded organelle volumes; membranes are always passable. Soft push only from small solid proxies (centrioles, proteasomes, ATP synthase and pore clusters at near LOD). The cell boundary clamp remains.
- S31 Codex optional fields (supersedes S2 non-empty rule): `process[]`, `realRate`, `enlargement` are optional; `process[]` is required only for entries that perform a live process in the world. `references[]` is required only for `parent === null`. Required on every entry: id, parent, name, category, summary, function, facts (>= 1), sizeNm, accuracy, anchor.
- S32 Reference format (refines E4/S2): `src/content/references.ts` maps each source key to a full citation (authors, title, edition, publisher, year). Review references use `{authors, title, journal, year, doi}`. Codex test checks every key resolves.
- S33 Process phase API (refines S21): `processId` is the codex id of the entity performing the process. The panel shows the phase of the targeted instance or, if none, the nearest near-LOD instance; at far LOD the call returns null and no step is highlighted.
- S34 Story cargo runs on sequence time, not process time; P and [ ] never freeze or speed the cargo.
- S35 Pointer lock and overlays: opening codex, panel or settings releases pointer lock programmatically and does not open the pause menu; the pause menu opens only when lock exits without a programmatic flag (Esc). Closing an overlay shows a "click to resume" prompt and re-locks on that click. In click-drag fallback mode, a click scans only when the pointer moved less than 4 px.
- S36 Picking order (refines S13): collect every organelle proxy the ray hits, including proxies that contain the ray origin, ordered by entry distance; mesh-raycast each in turn and stop when a mesh hit is nearer than the next proxy's entry distance; prefer the most specific (deepest codex) entity at a given hit. Cytosol is picked only when nothing else is hit.
- S37 Pure layout module: `src/world/layout.ts` produces seeded positions, anchors, pickable ids and SDF params with no DOM or WebGL; organelle classes consume it for rendering. Tests build only the layout. Canvas textures are created lazily at render time.
- S38 Perf gate measurability (refines S16): `renderer.info.autoReset = false`, reset once per frame. Draw calls and triangles at anchor `overview` (registered) are the hard automated gate; frame time p95 is measured in a headed browser on real hardware and reported, not gated in headless runs.
- S39 Depth range: camera near 0.02, far 600, `logarithmicDepthBuffer: true`; all custom ShaderMaterials include three's logdepth shader chunks.
- S40 Interior LOD (refines S7/S15): organelle-scale interiors (cristae, nucleolus, chromatin domains, Golgi cisternae) have an always-on coarse LOD so X-ray never reveals an empty shell; molecular machines remain near-LOD only. The E3 browser check targets a detailed mitochondrion.
- S41 Cell identity (TASTE, supersedes base "generic human cell" and refines S5): the world is a human pancreatic beta cell, a real animal cell type that has every organelle in the plan plus a resident population of insulin secretory granules (dense core, pale halo) clustered near the plasma membrane. The start screen and plasma-membrane accuracy note say so. `insulin-granule`, `prohormone-convertase` and `signal-peptidase` therefore exist in the world (granules ambient; convertase inside granules; signal peptidase at translocons near LOD) and are scannable, travelable and discoverable.
- S42 Undiscovered codex entries show name and category only; their panel cannot be opened from the codex until discovered in the world, but "Travel there" works for every entry.
- S43 Cutaway interiors (refines S40): lysosome (hydrolase haze + digesting debris), peroxisome (crystalline urate-oxidase-like enzyme core), late endosome (intraluminal vesicles), autophagosome (engulfed mitochondrion fragment) get always-on coarse interiors. If a ray crosses an x-rayed proxy and hits no interior mesh, the picker returns that organelle's id.
- S44 Multiple processes (refines S2/S21/S33): codex entries use `processes: {id, name, steps[]}[]` (optional, per S31). Phase API is `getProcessPhase(entityId, processId)`. Organelle-level panels list all their processes; only the process of the targeted sub-component (or the first process when the organelle itself is targeted) is live-synced.
- S45 Anchors (supersedes S3 and the "nearest representative instance" clause of S24): anchors are static keys defined in `layout.ts` with a base position; a moving entity may register a runtime offset function in `Cell`. Each LOD-only entry names a fixed designated representative instance. Tests assert anchor keys against the layout only.
- S46 Overlay resume (refines S4/S35): closing an overlay leaves the sequence paused and shows "click to resume"; the re-lock click resumes the sequence and is consumed (never scans).
- S47 Four-state sequencer (refines S4/S29/S24/S6): states {free, tour, story, travel}. Travel returns to free on arrival; T or G during travel replaces it; "Travel there" closes the codex first, so travel starts unpaused once pointer lock is re-acquired (the click-to-resume click starts it). `__cell.travel(id)` added to the debug API.
- S48 Transparency order (supersedes S14 "plasma membrane last"): each frame, membranes that contain the player render first, outermost-first; all other membranes render after, by nesting depth then far-to-near distance. `depthWrite = false` on membranes stays.
- S49 Process done-definition (refines S15/S17): every process is "done" with its S15 particle summary plus panel steps. Full near-LOD mechanisms are required for the priority set: ATP synthase rotation with H+ flow, kinesin hand-over-hand stepping, Na+/K+ pump cycle, ribosome elongation (tRNA A/P/E), mRNA export through a nuclear pore, Sec61 co-translational translocation, and every story stop. Other full mechanisms are cuttable to TODOS.md if time runs short, never silently dropped. E1 story moves into M2 right after the priority mechanisms.
<!-- /autoplan-accepted:ceo -->
