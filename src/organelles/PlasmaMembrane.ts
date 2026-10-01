import * as THREE from 'three';
import { membraneMaterial, solid, glow, extend, PALETTE } from '../fx/materials';
import { blob, merge, mergeColored, place, quatFromY, setInstance, perpendicular, cyclePhase, smoothstep } from '../fx/geom';
import { HeroSwap } from '../fx/heroSwap';
import { NearSites, type Site } from '../fx/nearSites';
import { globalUniforms } from '../fx/uniforms';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import { cellState } from '../world/state';

// The beta cell's outer boundary: a fluid lipid bilayer studded with the channels, pumps and
// receptors that turn a rise in blood glucose into insulin release.

const BILAYER = 0.5; // drawn thickness (true: about 5 nm = 0.05 units; shown 10x)

interface ProteinSpec {
  id: string;
  count: number;
  color: number;
  /** hi = the smooth, detailed model swapped in near the player. */
  geometry: (hi: boolean) => THREE.BufferGeometry;
}

export class PlasmaMembrane implements Organelle {
  readonly id = 'plasma-membrane';
  readonly group = new THREE.Group();
  private readonly radii: THREE.Vector3;
  private readonly shellMat;
  private readonly sites = new Map<string, NearSites>();
  private readonly pools = new Map<string, ParticlePool>();
  private readonly lipids: THREE.InstancedMesh;
  private readonly cholesterol: THREE.InstancedMesh;
  private patchKey = '';
  private readonly pits: ClathrinPit[] = [];
  private readonly swaps: HeroSwap[] = [];
  private patchRadius = 18;
  private progress = new Map<string, number>();

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    this.radii = new THREE.Vector3(...layout.cell.radii);

    // --- the bilayer sheet -------------------------------------------------------------
    const shellGeo = new THREE.SphereGeometry(1, 96, 64);
    shellGeo.scale(this.radii.x, this.radii.y, this.radii.z);
    this.shellMat = membraneMaterial({
      color: PALETTE.membrane,
      rimColor: PALETTE.membraneRim,
      opacity: 0.9,
      baseAlpha: 0.05,
      rimStrength: 0.42,
      rimPower: 2.3,
      amp: 0.05,
      freq: 0.08,
      // From a distance the membrane is a faint glassy rim; up close it becomes a wall of lipids.
      near: [9, 30, 0.42],
      dots: 4.4,
      emissive: 0xe8a55c,
      emissiveIntensity: 0.26,
    });
    const shell = new THREE.Mesh(shellGeo, this.shellMat);
    this.group.add(shell);
    kit.pickable(shell, { entity: 'plasma-membrane', passThrough: 4 });
    kit.membrane(shell, { depth: 0, xray: false, contains: () => true });

    // --- membrane proteins ------------------------------------------------------------
    const showcase = new THREE.Vector3(0.52, 0.44, 0.73).normalize();
    const specs: ProteinSpec[] = [
      { id: 'na-k-atpase', count: 100, color: 0x9d7bff, geometry: naKAtpaseGeo },
      { id: 'katp-channel', count: 90, color: 0x58e08f, geometry: katpGeo },
      { id: 'cav-channel', count: 90, color: 0xffa040, geometry: cavGeo },
      { id: 'glut', count: 100, color: 0xf2f5ff, geometry: glutGeo },
      { id: 'aquaporin', count: 70, color: 0x6fc7ff, geometry: aquaporinGeo },
      { id: 'glp1r', count: 70, color: 0xff6fa8, geometry: glp1rGeo },
      { id: 'glycocalyx', count: 140, color: 0xb8f2c8, geometry: glycocalyxGeo },
    ];
    const tangent = perpendicular(showcase);
    const bitangent = new THREE.Vector3().crossVectors(showcase, tangent);
    const few = ctx.quality === 'low' ? 0.5 : 1;
    for (const spec of specs) spec.count = Math.max(8, Math.round(spec.count * few));
    this.patchRadius = ctx.quality === 'low' ? 12 : 18;
    specs.forEach((spec, si) => {
      const material = solid(spec.color, { emissiveIntensity: 0.2, roughness: 0.5, bumpScale: 16 });
      const mesh = new THREE.InstancedMesh(spec.geometry(false), material, spec.count);
      const sites: Site[] = [];
      for (let i = 0; i < spec.count; i++) {
        let dir: THREE.Vector3;
        if (i === 0) {
          // Showcase patch: one of each type close together, used by "Travel there".
          const a = (si / specs.length) * Math.PI * 2;
          dir = showcase.clone().addScaledVector(tangent, Math.cos(a) * 0.05).addScaledVector(bitangent, Math.sin(a) * 0.05).normalize();
        } else {
          dir = new THREE.Vector3(...rng.unit());
        }
        const { pos, normal } = this.surface(dir);
        const q = quatFromY(normal).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, 6.28)));
        setInstance(mesh, i, pos, q, 1);
        sites.push({ pos, normal, phase: rng.range(0, 10) });
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      this.group.add(mesh);
      kit.pickable(mesh, { entity: spec.id });
      const swap = new HeroSwap(mesh, spec.geometry(true), material, 7, 13);
      this.swaps.push(swap);
      this.group.add(swap.high);
      kit.pickables.push(swap.high);
      const first = sites[0];
      kit.anchor(spec.id, first.pos, first.pos.clone().addScaledVector(first.normal, -4.5));
      this.sites.set(spec.id, new NearSites(sites, 5, 16));
    });
    const sc = this.surface(showcase);
    kit.anchor('plasma-membrane', sc.pos, sc.pos.clone().addScaledVector(sc.normal, -9));
    kit.anchor('phospholipid', sc.pos, sc.pos.clone().addScaledVector(sc.normal, -2.2));
    kit.anchor('cholesterol', sc.pos, sc.pos.clone().addScaledVector(sc.normal, -2.2));

    // --- process particles -------------------------------------------------------------
    this.pools.set('na', particles.pool(5 * 3, PALETTE.sodium, 0.2));
    this.pools.set('k', particles.pool(5 * 2, PALETTE.potassium, 0.22));
    this.pools.set('atp', particles.pool(5, PALETTE.atp, 0.26));
    this.pools.set('katpK', particles.pool(5 * 5, PALETTE.potassium, 0.2));
    this.pools.set('ca', particles.pool(5 * 7, PALETTE.calcium, 0.2));
    this.pools.set('glucose', particles.pool(5 * 4, PALETTE.glucose, 0.2));
    this.pools.set('water', particles.pool(5 * 4, 0x8fd4ff, 0.1));
    this.pools.set('glp1', particles.pool(5, 0xff9ac8, 0.3));
    this.pools.set('camp', particles.pool(5 * 4, 0xffe9a0, 0.14));

    // --- lipid detail patch (follows the player along the membrane) ---------------------
    const lipidMat = solid(0xffffff, { emissiveIntensity: 0, roughness: 0.42, bump: 0, rim: 0.5 });
    lipidMat.vertexColors = true;
    extend(lipidMat, 'lipid-jiggle', (shader) => {
      shader.uniforms.uTime = globalUniforms.uTime;
      shader.uniforms.uMotion = globalUniforms.uMotion;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uMotion;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
// Thermal jiggle: tails flex more than the anchored head groups.
float ph = float(gl_InstanceID) * 12.9898;
float flex = (0.27 - position.y) * 0.09 * uMotion;
transformed.x += sin(uTime * 2.3 + ph) * flex;
transformed.z += cos(uTime * 1.9 + ph * 1.3) * flex;`,
        );
      // Vertex-coloured self-glow so the head groups stay golden in the dark.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.34;',
      );
    });
    this.lipids = new THREE.InstancedMesh(lipidGeo(), lipidMat, 2700);
    this.cholesterol = new THREE.InstancedMesh(cholesterolGeo(), solid(0xffd24a, { emissiveIntensity: 0.3, bump: 0 }), 520);
    for (const m of [this.lipids, this.cholesterol]) {
      m.count = 0;
      m.frustumCulled = false;
      this.group.add(m);
    }
    kit.pickable(this.lipids, { entity: 'phospholipid' });
    kit.pickable(this.cholesterol, { entity: 'cholesterol' });

    // --- clathrin-coated pits ----------------------------------------------------------
    for (let i = 0; i < 10; i++) {
      const dir = i === 0 ? showcase.clone().addScaledVector(tangent, -0.12).normalize() : new THREE.Vector3(...rng.unit());
      const s = this.surface(dir);
      const pit = new ClathrinPit(s.pos, s.normal, rng.range(0, 20), ctx);
      this.pits.push(pit);
      this.group.add(pit.group);
      kit.lod(pit.group, s.pos, 38);
      if (i === 0) kit.anchor('clathrin-pit', s.pos, s.pos.clone().addScaledVector(s.normal, -6));
    }
  }

  /** Point and outward normal on the membrane for a direction from the cell centre. */
  surface(dir: THREE.Vector3): { pos: THREE.Vector3; normal: THREE.Vector3 } {
    const d = dir.clone().normalize();
    const pos = new THREE.Vector3(d.x * this.radii.x, d.y * this.radii.y, d.z * this.radii.z);
    const normal = new THREE.Vector3(pos.x / this.radii.x ** 2, pos.y / this.radii.y ** 2, pos.z / this.radii.z ** 2).normalize();
    return { pos, normal };
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const s = cellState;
    // Depolarization glows through the whole membrane; action potentials flicker.
    const depol = THREE.MathUtils.clamp((s.vm + 70) / 50, 0, 1);
    this.shellMat.emissiveIntensity = 0.26 + depol * 0.45;

    this.updatePatch(cam);
    for (const sw of this.swaps) sw.update(cam, ctx.dt);
    this.animatePumps(ctx);
    this.animateChannels(ctx);
    for (const p of this.pits) {
      if (p.group.visible) p.update(ctx.pt);
      else p.hide();
    }
  }

  getProcessProgress(entityId: string): number | null {
    const v = this.progress.get(entityId);
    return v === undefined ? null : v;
  }

  // Na+/K+-ATPase: 3 Na+ out, 2 K+ in, 1 ATP per cycle.
  private animatePumps(ctx: FrameCtx): void {
    const near = this.sites.get('na-k-atpase')!.update(ctx.camera.position, ctx.dt);
    const na = this.pools.get('na')!;
    const k = this.pools.get('k')!;
    const atp = this.pools.get('atp')!;
    na.hideAll();
    k.hideAll();
    atp.hideAll();
    const durations = [1.4, 0.8, 1.2, 1.2, 0.6, 1.2];
    this.progress.delete('na-k-atpase');
    near.forEach((site, i) => {
      const total = durations.reduce((a, b) => a + b, 0);
      const t = ctx.pt * 0.9 + site.phase;
      const [step, p] = cyclePhase(t, durations);
      if (i === 0) this.progress.set('na-k-atpase', (((t % total) + total) % total) / total);
      const inner = -1.6;
      const outer = 1.5;
      for (let j = 0; j < 3; j++) {
        const lateral = lateralOffset(site, j, 3, 0.16);
        let y: number;
        if (step === 0) y = THREE.MathUtils.lerp(inner - 1.2 - j * 0.4, -0.25, ease(p));
        else if (step === 1) y = -0.25;
        else if (step === 2) y = THREE.MathUtils.lerp(-0.1, outer + j * 0.5, ease(p));
        else { na.hide(i * 3 + j); continue; }
        na.setV(i * 3 + j, _p.copy(site.pos).addScaledVector(site.normal, y).add(lateral));
      }
      for (let j = 0; j < 2; j++) {
        const lateral = lateralOffset(site, j, 2, 0.14);
        let y: number;
        if (step === 3) y = THREE.MathUtils.lerp(outer + 1 + j * 0.4, 0.2, ease(p));
        else if (step === 4) y = 0.2;
        else if (step === 5) y = THREE.MathUtils.lerp(0.1, inner - 1 - j * 0.5, ease(p));
        else { k.hide(i * 2 + j); continue; }
        k.setV(i * 2 + j, _p.copy(site.pos).addScaledVector(site.normal, y).add(lateral));
      }
      // ATP docks on the cytoplasmic side during phosphorylation.
      if (step === 0 || step === 1) {
        const y = step === 0 ? THREE.MathUtils.lerp(-3.4, -0.95, ease(p)) : -0.95;
        atp.setV(i, _p.copy(site.pos).addScaledVector(site.normal, y).add(lateralOffset(site, 1, 2, 0.4)));
      } else atp.hide(i);
    });
  }

  private animateChannels(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const s = cellState;
    const pt = ctx.pt;
    // K_ATP: K+ leaks out while the channel is open; closes as ATP rises.
    this.flow('katp-channel', 'katpK', 5, cam, ctx.dt, pt, 1.1, -1.8, 2.4, s.katpOpen);
    // Voltage-gated Ca2+ channel: Ca2+ rushes in during each action potential.
    this.flow('cav-channel', 'ca', 7, cam, ctx.dt, pt, 2.2, 2.2, -3.2, s.cavOpen);
    // GLUT1: facilitated diffusion down the glucose gradient.
    this.flow('glut', 'glucose', 4, cam, ctx.dt, pt, 0.7, 2.4, -2.6, THREE.MathUtils.clamp((s.glucoseMM - 3) / 8, 0.25, 1));
    // Aquaporin: single-file water, both directions.
    this.flow('aquaporin', 'water', 4, cam, ctx.dt, pt, 2.4, 1.4, -1.4, 1);
    this.progress.set('katp-channel', s.phase);
    this.progress.set('cav-channel', s.phase);
    this.progress.set('glut', (pt * 0.7 * 0.25) % 1);

    // GLP-1 receptor: hormone binds outside, Gs protein makes cAMP inside.
    const near = this.sites.get('glp1r')!.update(cam, ctx.dt);
    const glp = this.pools.get('glp1')!;
    const camp = this.pools.get('camp')!;
    glp.hideAll();
    camp.hideAll();
    this.progress.delete('glp1r');
    near.forEach((site, i) => {
      const [step, p] = cyclePhase(pt * 0.6 + site.phase, [2, 1.5, 2.5]);
      if (i === 0) this.progress.set('glp1r', (step + p) / 3);
      const y = step === 0 ? THREE.MathUtils.lerp(4, 1.15, ease(p)) : 1.15;
      glp.setV(i, _p.copy(site.pos).addScaledVector(site.normal, y));
      if (step === 2) {
        for (let j = 0; j < 4; j++) {
          const lat = lateralOffset(site, j, 4, 0.5 + p * 1.6);
          camp.setV(i * 4 + j, _p.copy(site.pos).addScaledVector(site.normal, -1.2 - p * 2.2 - j * 0.2).add(lat));
        }
      }
    });
  }

  /** Stream particles through the nearest channels of one type along the membrane normal. */
  private flow(
    siteId: string,
    poolId: string,
    perSite: number,
    cam: THREE.Vector3,
    dt: number,
    pt: number,
    speed: number,
    from: number,
    to: number,
    open: number,
  ): void {
    const near = this.sites.get(siteId)!.update(cam, dt);
    const pool = this.pools.get(poolId)!;
    pool.hideAll();
    const shown = Math.round(perSite * THREE.MathUtils.clamp(open, 0, 1));
    near.forEach((site, i) => {
      for (let j = 0; j < shown; j++) {
        const u = (((pt * speed * 0.35 + site.phase + j / perSite) % 1) + 1) % 1;
        const y = THREE.MathUtils.lerp(from, to, u);
        // Converge on the pore in the middle of the bilayer, spread out on either side.
        const spread = Math.min(1, Math.abs(y) / 1.2) * 0.45;
        pool.setV(i * perSite + j, _p.copy(site.pos).addScaledVector(site.normal, y).add(lateralOffset(site, j + i, perSite, spread)));
      }
    });
  }

  // Individual lipids are only drawn near the player, snapped to a fixed lattice so they
  // stay put as you move.
  private updatePatch(cam: THREE.Vector3): void {
    const ratio = Math.sqrt((cam.x / this.radii.x) ** 2 + (cam.y / this.radii.y) ** 2 + (cam.z / this.radii.z) ** 2);
    if (ratio < 0.76) {
      if (this.lipids.count !== 0) {
        this.lipids.count = 0;
        this.cholesterol.count = 0;
        this.patchKey = '';
      }
      return;
    }
    const d = cam.clone().divide(this.radii).normalize();
    const ax = Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z) ? 0 : Math.abs(d.y) >= Math.abs(d.z) ? 1 : 2;
    const major = d.getComponent(ax);
    const a1 = (ax + 1) % 3;
    const a2 = (ax + 2) % 3;
    const h = 0.0042;
    const ci = Math.round(d.getComponent(a1) / major / h);
    const cj = Math.round(d.getComponent(a2) / major / h);
    const key = `${ax}:${Math.sign(major)}:${Math.round(ci / 5)}:${Math.round(cj / 5)}`;
    if (key === this.patchKey) return;
    this.patchKey = key;
    const R = this.patchRadius;
    let li = 0;
    let chi = 0;
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    const q = new THREE.Quaternion();
    const qt = new THREE.Quaternion();
    for (let i = -R; i <= R; i++) {
      for (let j = -R; j <= R; j++) {
        if (i * i + j * j > R * R) continue;
        const gi = ci + i;
        const gj = cj + j;
        const hsh = hash2(gi, gj);
        dir.setComponent(ax, Math.sign(major));
        dir.setComponent(a1, (gi + (hsh - 0.5) * 0.7) * h * Math.sign(major));
        dir.setComponent(a2, (gj + (hash2(gj, gi) - 0.5) * 0.7) * h * Math.sign(major));
        const { pos, normal } = this.surface(dir);
        quatFromY(normal, q);
        qt.setFromAxisAngle(up, hsh * 6.28);
        // Shrink lipids toward the edge of the patch so it melts into the smooth sheet.
        const fade = 1 - smoothstep(0.62, 1, Math.sqrt(i * i + j * j) / R);
        if (hsh > 0.84 && chi < 520) {
          // Cholesterol sits between phospholipid tails, in either leaflet.
          const outer = hash2(gi * 3, gj * 7) > 0.5;
          const qq = q.clone().multiply(qt);
          if (!outer) qq.multiply(flip);
          setInstance(this.cholesterol, chi++, pos, qq, fade);
          continue;
        }
        if (li + 2 > 2700) continue;
        setInstance(this.lipids, li++, pos, q.clone().multiply(qt), fade);
        setInstance(this.lipids, li++, pos, q.clone().multiply(qt).multiply(flip), fade);
      }
    }
    this.lipids.count = li;
    this.cholesterol.count = chi;
    this.lipids.instanceMatrix.needsUpdate = true;
    this.cholesterol.instanceMatrix.needsUpdate = true;
  }
}

// --- clathrin-mediated endocytosis --------------------------------------------------------

class ClathrinPit {
  readonly group = new THREE.Group();
  private readonly bud: THREE.Mesh;
  private readonly cage: THREE.LineSegments;
  private readonly dynamin: THREE.Mesh;
  private readonly cargo: ParticlePool;
  private stage = 0;

  constructor(pos: THREE.Vector3, normal: THREE.Vector3, private readonly phase: number, ctx: BuildContext) {
    this.group.position.copy(pos);
    this.group.quaternion.copy(quatFromY(normal));
    this.bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 24, 16),
      membraneMaterial({ color: PALETTE.membrane, rimColor: PALETTE.membraneRim, baseAlpha: 0.45, amp: 0.02 }),
    );
    this.cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.08, 1)),
      new THREE.LineBasicMaterial({ color: new THREE.Color(0xffc24a).multiplyScalar(1.6), transparent: true, toneMapped: false }),
    );
    this.dynamin = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 20), glow(0x7cf0ff, 1.4));
    this.dynamin.rotation.x = Math.PI / 2;
    this.group.add(this.bud, this.cage, this.dynamin);
    ctx.kit.pickable(this.bud, { entity: () => (this.stage >= 2 ? 'clathrin-vesicle' : 'clathrin-pit') });
    this.cargo = ctx.particles.pool(4, 0xffb3d9, 0.16);
  }

  hide(): void {
    this.cargo.hideAll();
  }

  update(pt: number): void {
    // 0 invaginate, 1 dynamin scission, 2 vesicle moves in, 3 uncoating, 4 pause
    const [stage, p] = cyclePhase(pt * 0.5 + this.phase, [4, 1.5, 2, 2.5, 2]);
    this.stage = stage;
    const cageMat = this.cage.material as THREE.LineBasicMaterial;
    let y = 0.75;
    let scale = 1;
    let cageOpacity = 1;
    let cageScale = 1;
    this.dynamin.visible = false;
    if (stage === 0) {
      y = THREE.MathUtils.lerp(0.8, -0.85, ease(p));
      scale = THREE.MathUtils.lerp(0.55, 1, ease(p));
      cageOpacity = p;
    } else if (stage === 1) {
      y = -0.85;
      this.dynamin.visible = true;
      this.dynamin.position.set(0, 0.05, 0);
      const s = THREE.MathUtils.lerp(1, 0.25, ease(p));
      this.dynamin.scale.set(s, s, 1);
    } else if (stage === 2) {
      y = THREE.MathUtils.lerp(-0.85, -3.4, ease(p));
    } else if (stage === 3) {
      y = THREE.MathUtils.lerp(-3.4, -5.2, p);
      cageOpacity = 1 - p;
      cageScale = 1 + p * 0.9;
    } else {
      y = -5.2;
      cageOpacity = 0;
      scale = 1 - ease(p);
    }
    this.bud.position.set(0, y, 0);
    this.bud.scale.setScalar(Math.max(0.001, scale));
    this.cage.position.set(0, y, 0);
    this.cage.scale.setScalar(scale * cageScale);
    cageMat.opacity = cageOpacity;
    this.cage.visible = cageOpacity > 0.01;
    this.group.updateMatrixWorld();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + pt * 0.5;
      _p.set(Math.cos(a) * 0.4 * scale, y + Math.sin(a * 1.7) * 0.3 * scale, Math.sin(a) * 0.4 * scale);
      this.cargo.setV(i, this.group.localToWorld(_p));
    }
  }
}

// --- geometry -----------------------------------------------------------------------------

const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _b = new THREE.Vector3();

function ease(x: number): number {
  return x * x * (3 - 2 * x);
}

function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function lateralOffset(site: Site, j: number, n: number, r: number): THREE.Vector3 {
  perpendicular(site.normal, _t);
  _b.crossVectors(site.normal, _t);
  const a = (j / n) * Math.PI * 2 + site.phase;
  return new THREE.Vector3().addScaledVector(_t, Math.cos(a) * r).addScaledVector(_b, Math.sin(a) * r);
}

function cyl(r: number, h: number, y: number, x = 0, z = 0, seg = 8): THREE.BufferGeometry {
  // Up close, rounded ends read as protein helices rather than machined pegs. The far model
  // (few segments) keeps plain cylinders: a fifth of the triangles, and nobody can tell.
  if (seg <= 6) return place(new THREE.CylinderGeometry(r, r, h, seg), [x, y, z]);
  return place(new THREE.CapsuleGeometry(r, Math.max(0.01, h - 2 * r), 3, seg), [x, y, z]);
}

/** A tilted helix: capsule for the near model, plain cylinder for the far one. */
function helix(r: number, len: number, seg: number): THREE.BufferGeometry {
  return seg <= 6 ? new THREE.CylinderGeometry(r, r, len + 2 * r, seg) : new THREE.CapsuleGeometry(r, len, 3, seg);
}

function lipidGeo(): THREE.BufferGeometry {
  // Phosphate head at the surface, two fatty-acid tails pointing into the bilayer core.
  const head = place(new THREE.IcosahedronGeometry(0.098, 1), [0, BILAYER / 2 - 0.05, 0]);
  const t1 = place(new THREE.CylinderGeometry(0.026, 0.016, 0.2, 4, 1, true), [0.036, 0.1, 0], new THREE.Euler(0, 0, 0.12));
  const t2 = place(new THREE.CylinderGeometry(0.026, 0.016, 0.18, 4, 1, true), [-0.036, 0.11, 0.01], new THREE.Euler(0.1, 0, -0.18));
  return mergeColored([
    [head, 0xffc266],
    [t1, 0xf3e6c8],
    [t2, 0xf3e6c8],
  ]);
}

function cholesterolGeo(): THREE.BufferGeometry {
  // Rigid four-ring steroid plate with a small polar OH head.
  const rings = place(new THREE.BoxGeometry(0.075, 0.15, 0.028), [0, 0.1, 0]);
  const oh = place(new THREE.IcosahedronGeometry(0.035, 1), [0, 0.19, 0]);
  const tail = place(new THREE.CylinderGeometry(0.014, 0.012, 0.06, 4), [0, 0.01, 0]);
  return merge([rings, oh, tail]);
}

// Protein models. +Y points out of the cell; the bilayer mid-plane is y = 0.
// hi = true builds the smooth version used for the few instances nearest the player.

function naKAtpaseGeo(hi: boolean): THREE.BufferGeometry {
  // Alpha subunit: 10 transmembrane helices plus large cytoplasmic A, N and P domains.
  // Beta subunit: single helix with a glycosylated extracellular domain.
  const d = hi ? 3 : 1;
  const seg = hi ? 10 : 5;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = i % 2 ? 0.2 : 0.11;
    parts.push(cyl(0.055, 0.66, 0, Math.cos(a) * r, Math.sin(a) * r, seg));
  }
  parts.push(place(blob(0.3, d, 0.3, 1), [0.18, -0.62, 0]));
  parts.push(place(blob(0.26, d, 0.3, 2), [-0.2, -0.72, 0.1]));
  parts.push(place(blob(0.22, d, 0.3, 3), [0, -1.02, -0.12]));
  parts.push(cyl(0.05, 0.64, 0, 0.32, 0.1, seg));
  parts.push(place(blob(0.2, d, 0.35, 4), [0.32, 0.52, 0.1]));
  return merge(parts);
}

function katpGeo(hi: boolean): THREE.BufferGeometry {
  // Octamer: four Kir6.2 subunits form the pore, four SUR1 subunits surround them.
  const d = hi ? 2 : 1;
  const seg = hi ? 10 : 5;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    parts.push(cyl(0.085, 0.66, 0, Math.cos(a) * 0.13, Math.sin(a) * 0.13, seg));
    parts.push(place(blob(0.16, d, 0.25, i), [Math.cos(a) * 0.16, -0.52, Math.sin(a) * 0.16]));
    const b = a + Math.PI / 4;
    parts.push(cyl(0.13, 0.64, 0, Math.cos(b) * 0.42, Math.sin(b) * 0.42, seg));
    parts.push(place(blob(0.2, d, 0.3, i + 5), [Math.cos(b) * 0.46, -0.58, Math.sin(b) * 0.46]));
  }
  return merge(parts);
}

function cavGeo(hi: boolean): THREE.BufferGeometry {
  // Alpha1 pore subunit: four homologous domains around a central pore, with the
  // extracellular alpha2-delta and cytoplasmic beta auxiliary subunits.
  const d = hi ? 3 : 1;
  const seg = hi ? 10 : 5;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    parts.push(cyl(0.15, 0.66, 0, Math.cos(a) * 0.2, Math.sin(a) * 0.2, seg));
    parts.push(cyl(0.07, 0.6, 0, Math.cos(a + 0.6) * 0.38, Math.sin(a + 0.6) * 0.38, seg));
  }
  parts.push(place(blob(0.3, d, 0.35, 7), [0.22, 0.62, 0.05]));
  parts.push(place(blob(0.22, d, 0.3, 8), [-0.18, -0.6, 0.1]));
  return merge(parts);
}

function glutGeo(hi: boolean): THREE.BufferGeometry {
  // 12 transmembrane helices in two six-helix halves that rock to alternate access.
  const seg = hi ? 10 : 5;
  const parts: THREE.BufferGeometry[] = [];
  for (let half = 0; half < 2; half++) {
    const cx = half ? 0.15 : -0.15;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      parts.push(
        place(helix(0.05, 0.58, seg), [cx + Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1], new THREE.Euler(0, 0, half ? -0.14 : 0.14)),
      );
    }
  }
  parts.push(place(blob(0.13, hi ? 2 : 1, 0.3, 2), [0, -0.44, 0]));
  return merge(parts);
}

function aquaporinGeo(hi: boolean): THREE.BufferGeometry {
  // Homotetramer; each monomer is its own water pore.
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    parts.push(cyl(0.15, 0.66, 0, Math.cos(a) * 0.2, Math.sin(a) * 0.2, hi ? 14 : 6));
  }
  return merge(parts);
}

function glp1rGeo(hi: boolean): THREE.BufferGeometry {
  // Class B GPCR: seven transmembrane helices, a large extracellular hormone-binding
  // domain, and the heterotrimeric Gs protein docked underneath.
  const d = hi ? 3 : 1;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    parts.push(place(helix(0.052, 0.58, hi ? 10 : 5), [Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16], new THREE.Euler(Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12)));
  }
  parts.push(place(blob(0.24, d, 0.3, 3), [0.04, 0.62, 0]));
  parts.push(place(blob(0.24, d, 0.3, 5), [0.1, -0.62, 0]));
  parts.push(place(blob(0.2, d, 0.3, 6), [-0.22, -0.74, 0.08]));
  return merge(parts);
}

function glycocalyxGeo(hi: boolean): THREE.BufferGeometry {
  // Glycoprotein: one transmembrane helix carrying branched sugar chains outside the cell.
  const seg = hi ? 8 : 4;
  const parts: THREE.BufferGeometry[] = [cyl(0.05, 0.9, 0.15, 0, 0, seg + 1)];
  const branch = (x: number, y: number, z: number, rz: number, rx: number, l: number) => {
    parts.push(place(new THREE.CylinderGeometry(0.025, 0.025, l, seg), [x, y, z], new THREE.Euler(rx, 0, rz)));
  };
  branch(0, 0.95, 0, 0, 0, 0.7);
  branch(0.14, 1.25, 0, -0.7, 0, 0.5);
  branch(-0.14, 1.2, 0.05, 0.7, 0.2, 0.5);
  branch(0.02, 1.35, -0.13, 0, -0.7, 0.45);
  for (const [x, y, z] of [[0.3, 1.42, 0], [-0.3, 1.38, 0.08], [0.02, 1.52, -0.28], [0, 1.32, 0]] as const) {
    parts.push(place(new THREE.IcosahedronGeometry(0.06, hi ? 2 : 0), [x, y, z]));
  }
  return merge(parts);
}
