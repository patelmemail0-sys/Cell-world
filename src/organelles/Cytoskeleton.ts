import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { solid, glow, extend, membraneMaterial, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3, perpendicular } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import { ellipsoidRatio, type Layout } from '../world/layout';

// Cytoskeleton: microtubule highways radiating from the centrosome with kinesin and dynein
// motors walking cargo along them, a cortical actin web under the plasma membrane, and an
// intermediate-filament cage around the nucleus.

const MT_R = 0.2;
const STEP = 0.52; // drawn stride per head (true: 16 nm per head, 8 nm per ATP for the motor)
const SAMPLES = 48;

interface Track {
  pts: THREE.Vector3[];
  length: number;
}

interface Motor {
  track: Track;
  /** Distance travelled along the track in world units. */
  x: number;
  speed: number;
  kind: 'kinesin' | 'dynein';
  cargoR: number;
  side: number;
}

interface Tip {
  base: THREE.Vector3;
  dir: THREE.Vector3;
  phase: number;
  mesh: THREE.Mesh;
  cap: THREE.Mesh;
}

export class Cytoskeleton implements Organelle {
  readonly id = 'cytoskeleton';
  readonly group = new THREE.Group();
  private readonly motors: Motor[] = [];
  private readonly heads: Record<'kinesin' | 'dynein', THREE.InstancedMesh>;
  private readonly stalks: Record<'kinesin' | 'dynein', THREE.InstancedMesh>;
  private readonly cargo: Record<'kinesin' | 'dynein', THREE.InstancedMesh>;
  private readonly cargoCore: THREE.InstancedMesh;
  private readonly tips: Tip[] = [];
  private readonly dimerMesh: THREE.InstancedMesh;
  private readonly atp: ParticlePool;
  private readonly motorPos = new THREE.Vector3();
  private readonly motorView = new THREE.Vector3();
  private readonly dyneinPos = new THREE.Vector3();
  private readonly dyneinView = new THREE.Vector3();
  private stepProgress = 0;
  private readonly kit: BuildContext['kit'];
  private tipProgress = 0;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    this.kit = kit;
    const origin = v3(layout.centrosome.center);
    const nuc = layout.nucleus;
    const nucRatio = (p: THREE.Vector3) => ellipsoidRatio([p.x, p.y, p.z], nuc.center, nuc.radii);
    const nucCenter = v3(nuc.center);
    const spawn = v3(layout.spawn.position);
    const spawnAhead = spawn.clone().lerp(v3(layout.spawn.lookAt), 0.3);

    // --- microtubules -------------------------------------------------------------------
    const tracks: Track[] = [];
    const geos: THREE.BufferGeometry[] = [];
    for (const endT of layout.microtubuleEnds) {
      const end = v3(endT);
      const dir = end.clone().sub(origin).normalize();
      const start = origin.clone().addScaledVector(dir, 3.2);
      const mid = start.clone().add(end).multiplyScalar(0.5).add(new THREE.Vector3(...rng.unit()).multiplyScalar(3));
      // Bend around the nucleus instead of passing through it.
      for (let k = 0; k < 20 && nucRatio(mid) < 1.3; k++) mid.addScaledVector(mid.clone().sub(nucCenter).normalize(), 2.5);
      const ctrl = mid.clone().multiplyScalar(2).sub(start.clone().add(end).multiplyScalar(0.5));
      const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
      const pts = curve.getSpacedPoints(SAMPLES);
      if (pts.some((p) => nucRatio(p) < 1.1)) continue;
      // Leave the arrival point's line of sight to the nucleus clear.
      if (pts.some((p) => p.distanceTo(spawn) < 7 || p.distanceTo(spawnAhead) < 6)) continue;
      const length = curve.getLength();
      const g = new THREE.TubeGeometry(curve, SAMPLES, MT_R, 10, false);
      // Rescale u to world units so the tubulin lattice has a constant pitch.
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * length);
      geos.push(g);
      tracks.push({ pts, length });
    }
    const mtMat = solid(PALETTE.microtubule, { emissiveIntensity: 0.3, roughness: 0.55, bump: 0 });
    extend(mtMat, 'tubulin-lattice', (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLattice;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLattice = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLattice;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
// 13 protofilaments around; alpha/beta tubulin alternate along each, offset in a 3-start helix.
float pf = abs(sin(vLattice.y * 3.14159265 * 13.0));
float dimer = step(0.5, fract(vLattice.x / 0.32 + vLattice.y * 1.5));
diffuseColor.rgb *= mix(0.62, 1.0, pf) * mix(0.72, 1.12, dimer);`,
        );
    });
    const mt = new THREE.Mesh(mergeGeometries(geos)!, mtMat);
    this.group.add(mt);
    // From across the cell the tracks read as "the cytoskeleton"; up close, as a microtubule.
    kit.pickable(mt, { entity: 'cytoskeleton', nearEntity: 'microtubule', nearDist: 22 });

    // --- dynamic instability at a few plus ends -------------------------------------------
    const tipGeo = new THREE.CylinderGeometry(MT_R, MT_R, 1, 10, 1, true).translate(0, 0.5, 0);
    const capGeo = new THREE.CylinderGeometry(MT_R * 1.06, MT_R * 1.06, 0.5, 10, 1, true);
    for (let i = 0; i < Math.min(8, tracks.length); i++) {
      const t = tracks[i * 3 % tracks.length];
      const base = t.pts[t.pts.length - 1].clone();
      const dir = base.clone().sub(t.pts[t.pts.length - 2]).normalize();
      const mesh = new THREE.Mesh(tipGeo, mtMat);
      mesh.position.copy(base);
      mesh.quaternion.copy(quatFromY(dir));
      // GTP cap: freshly added tubulin still holding GTP stabilizes the growing end.
      const cap = new THREE.Mesh(capGeo, glow(0xd8ffe9, 1.6));
      cap.quaternion.copy(mesh.quaternion);
      this.group.add(mesh, cap);
      kit.pickable(mesh, { entity: 'microtubule' });
      this.tips.push({ base, dir, phase: i * 2.7, mesh, cap });
    }
    const dimerGeo = merge([place(new THREE.IcosahedronGeometry(0.075, 1), [0, 0.07, 0]), place(new THREE.IcosahedronGeometry(0.075, 1), [0, -0.07, 0])]);
    this.dimerMesh = new THREE.InstancedMesh(dimerGeo, solid(0xd0ffe6, { emissiveIntensity: 0.6 }), this.tips.length * 8);
    this.dimerMesh.frustumCulled = false;
    this.group.add(this.dimerMesh);
    kit.pickable(this.dimerMesh, { entity: 'tubulin-dimer' });

    // --- motors -----------------------------------------------------------------------------
    const headGeo = { kinesin: blob(0.21, 2, 0.25, 2, [1, 0.8, 1.15]), dynein: new THREE.TorusGeometry(0.22, 0.1, 8, 16) };
    const stalkGeo = {
      // Coiled-coil stalk from the two heads up to the cargo-binding tail.
      kinesin: merge([
        place(new THREE.CylinderGeometry(0.045, 0.06, 1.5, 7), [0, 0.95, 0]),
        place(blob(0.13, 2, 0.3, 3), [0, 1.75, 0]),
      ]),
      dynein: merge([
        place(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 6), [0.2, 0.75, 0], new THREE.Euler(0, 0, 0.2)),
        place(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 6), [-0.2, 0.75, 0], new THREE.Euler(0, 0, -0.2)),
        place(blob(0.27, 2, 0.3, 5, [1.3, 0.9, 1]), [0, 1.4, 0]),
      ]),
    };
    const counts = { kinesin: 16, dynein: 10 };
    const colors = { kinesin: 0xffffff, dynein: 0x74b9ff };
    this.heads = {} as typeof this.heads;
    this.stalks = {} as typeof this.stalks;
    this.cargo = {} as typeof this.cargo;
    const cargoGeo = new THREE.SphereGeometry(1, 22, 14);
    const lead = new THREE.Color(0xff9a3d);
    const trail = new THREE.Color(0xffd98a);
    for (const kind of ['kinesin', 'dynein'] as const) {
      const n = counts[kind];
      this.heads[kind] = new THREE.InstancedMesh(headGeo[kind], solid(colors[kind], { emissiveIntensity: kind === 'kinesin' ? 0.0 : 0.55 }), n * 2);
      this.stalks[kind] = new THREE.InstancedMesh(stalkGeo[kind], solid(kind === 'kinesin' ? 0xffb35c : 0x74b9ff, { emissiveIntensity: 0.45 }), n);
      // Kinesin hauls insulin granules outward; dynein carries endosomes back toward the centre.
      this.cargo[kind] = new THREE.InstancedMesh(
        cargoGeo,
        kind === 'kinesin'
          ? membraneMaterial({ color: PALETTE.granule, rimColor: 0xfff3c4, baseAlpha: 0.14, opacity: 0.8, amp: 0.02, freq: 1.5, glow: 0.25 })
          : membraneMaterial({ color: PALETTE.endosome, rimColor: 0xb0c8ff, baseAlpha: 0.26, opacity: 0.9, amp: 0.03, freq: 1.2, glow: 0.3 }),
        n,
      );
      for (const m of [this.heads[kind], this.stalks[kind], this.cargo[kind]]) {
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        m.frustumCulled = false;
        this.group.add(m);
      }
      if (kind === 'kinesin') {
        extend(this.heads.kinesin.material as THREE.Material, 'tinted-glow', (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.5;',
          );
        });
        // The two heads get different colours so the hand-over-hand gait is easy to follow.
        for (let i = 0; i < n; i++) {
          this.heads.kinesin.setColorAt(i * 2, lead);
          this.heads.kinesin.setColorAt(i * 2 + 1, trail);
        }
      }
      kit.pickable(this.heads[kind], { entity: kind });
      kit.pickable(this.stalks[kind], { entity: kind });
      kit.pickable(this.cargo[kind], { entity: kind === 'kinesin' ? 'insulin-granule' : 'early-endosome' });
      for (let i = 0; i < n; i++) {
        const track = tracks[(i * 7 + (kind === 'dynein' ? 3 : 0)) % tracks.length];
        this.motors.push({
          track,
          x: rng.range(0, track.length),
          speed: kind === 'kinesin' ? rng.range(0.6, 0.8) : rng.range(0.45, 0.6),
          kind,
          cargoR: kind === 'kinesin' ? rng.range(1.25, 1.55) : rng.range(0.9, 1.2),
          side: rng.range(0, Math.PI * 2),
        });
      }
    }
    // Granule cargo carries the same crystalline insulin core as every other granule.
    this.cargoCore = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), solid(PALETTE.granuleCore, { emissiveIntensity: 0.45, flat: true, roughness: 0.35 }), counts.kinesin);
    this.cargoCore.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cargoCore.frustumCulled = false;
    this.group.add(this.cargoCore);
    kit.pickable(this.cargoCore, { entity: 'insulin-hexamer' });
    this.atp = particles.pool(4, PALETTE.atp, 0.16);

    // --- cortical actin ---------------------------------------------------------------------
    const radii = v3(layout.cell.radii);
    const strand = (offset: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const a = u * Math.PI * 2 * 2.2 + offset;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.07, (u - 0.5) * 5, Math.sin(a) * 0.07));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.055, 3, false);
    };
    const actinGeo = merge([strand(0), strand(Math.PI)]);
    const nActin = ctx.quality === 'low' ? 320 : 650;
    const actin = new THREE.InstancedMesh(actinGeo, solid(PALETTE.actin, { emissiveIntensity: 0.3 }), nActin);
    for (let i = 0; i < nActin; i++) {
      const d = new THREE.Vector3(...rng.unit());
      const p = d.clone().multiply(radii).multiplyScalar(rng.range(0.945, 0.985));
      const normal = new THREE.Vector3(p.x / radii.x ** 2, p.y / radii.y ** 2, p.z / radii.z ** 2).normalize();
      const tangent = perpendicular(normal).applyAxisAngle(normal, rng.range(0, Math.PI * 2));
      setInstance(actin, i, p, quatFromY(tangent), new THREE.Vector3(1, rng.range(0.6, 1.3), 1));
    }
    actin.computeBoundingSphere();
    this.group.add(actin);
    kit.pickable(actin, { entity: 'actin-filament' });

    // --- intermediate filaments: a rope-like cage around the nucleus -------------------------
    const ropes: THREE.BufferGeometry[] = [];
    const nr = v3(nuc.radii);
    for (let i = 0; i < 34; i++) {
      const axis = new THREE.Vector3(...rng.unit());
      const start = perpendicular(axis);
      const pts: THREE.Vector3[] = [];
      const arc = rng.range(1.6, 3.6);
      const lift = rng.range(1.1, 1.19);
      for (let k = 0; k <= 24; k++) {
        const d = start.clone().applyAxisAngle(axis, (k / 24) * arc).addScaledVector(axis, Math.sin(k * 0.6 + i) * 0.08).normalize();
        pts.push(new THREE.Vector3(d.x * nr.x, d.y * nr.y, d.z * nr.z).multiplyScalar(lift + Math.sin(k * 0.9 + i * 2) * 0.012).add(nucCenter));
      }
      ropes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.13, 5, false));
    }
    const ifMesh = new THREE.Mesh(merge(ropes), solid(PALETTE.intermediate, { emissiveIntensity: 0.22, roughness: 0.85 }));
    this.group.add(ifMesh);
    kit.pickable(ifMesh, { entity: 'intermediate-filament' });

    // --- anchors ----------------------------------------------------------------------------
    const t0 = tracks[0];
    const midPt = t0.pts[Math.floor(SAMPLES / 2)];
    kit.anchor('cytoskeleton', origin, kit.vantage(origin, 18, 5, new THREE.Vector3(12, 7, 12)));
    kit.anchor('microtubule', midPt, kit.vantage(midPt, 2.8, 0.9, perpendicular(t0.pts[SAMPLES].clone().sub(t0.pts[0]).normalize())));
    kit.anchor('kinesin', () => this.motorPos, () => this.motorView);
    kit.anchor('dynein', () => this.dyneinPos, () => this.dyneinView);
    const tip0 = this.tips[0];
    kit.anchor('tubulin-dimer', tip0.base, tip0.base.clone().addScaledVector(perpendicular(tip0.dir), 2.2).addScaledVector(tip0.dir, 1));
    const cortex = new THREE.Vector3(0.52, 0.44, 0.73).normalize().multiply(radii).multiplyScalar(0.965);
    kit.anchor('actin-filament', cortex, cortex.clone().multiplyScalar(0.93));
    const ifPt = new THREE.Vector3(0.78, 0.12, 0.6).normalize().multiply(nr).multiplyScalar(1.15).add(nucCenter);
    kit.anchor('intermediate-filament', ifPt, kit.vantage(ifPt, 4, 1.2, ifPt.clone().sub(nucCenter)));
  }

  /**
   * Where to watch a walking motor from: beside it, on whichever side is open cytosol, so the
   * camera never ends up inside an organelle the track happens to pass.
   */
  private placeView(out: THREE.Vector3, distance: number): void {
    for (const sign of [1, -1]) {
      out.copy(_c).addScaledVector(_n, 1.0).addScaledVector(_side, sign * distance).addScaledVector(_t, -1.0);
      if (this.kit.compartmentAt(out).label === 'Cytosol') return;
    }
    out.copy(_c).addScaledVector(_n, distance + 1.2).addScaledVector(_t, -1.0);
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'kinesin' || entityId === 'dynein' || entityId === 'cytoskeleton') return this.stepProgress;
    if (entityId === 'microtubule') return this.tipProgress;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const index = { kinesin: 0, dynein: 0 };
    const nearest: { d: number; pos: THREE.Vector3; n: THREE.Vector3 }[] = [];
    let firstKinesin = true;
    let firstDynein = true;
    for (const m of this.motors) {
      m.x += m.speed * ctx.pdt;
      if (m.x > m.track.length - 1) m.x = 1;
      // Kinesin walks toward the plus end (cell edge); dynein toward the minus end (centrosome).
      const dirSign = m.kind === 'kinesin' ? 1 : -1;
      const tau = m.x / STEP;
      const phase = tau % 2;
      const b = Math.floor(tau / 2) * 2 * STEP;
      const p = phase % 1;
      const e = p * p * (3 - 2 * p);
      const aX = phase < 1 ? b + 2 * STEP * e : b + 2 * STEP;
      const bX = phase < 1 ? b + STEP : b + STEP + 2 * STEP * e;
      const liftA = phase < 1 ? Math.sin(p * Math.PI) : 0;
      const liftB = phase < 1 ? 0 : Math.sin(p * Math.PI);
      const body = (aX + bX) / 2;
      const toTrack = (x: number) => (m.kind === 'kinesin' ? x : m.track.length - x);

      sample(m.track, toTrack(body), _c, _t);
      _t.multiplyScalar(dirSign);
      perpendicular(_t, _n).applyAxisAngle(_t, m.side);
      _side.crossVectors(_t, _n);
      const i = index[m.kind]++;
      const heads = this.heads[m.kind];
      const q = quatFromY(_n, _q);
      for (const [h, hx, lift, s] of [[0, aX, liftA, 1], [1, bX, liftB, -1]] as const) {
        sample(m.track, toTrack(hx), _p, _t2);
        // The stepping head lifts off, swings past its partner and rebinds ahead of it.
        _p.addScaledVector(_n, MT_R + 0.15 + lift * 0.22).addScaledVector(_side, s * 0.13 + lift * s * 0.12);
        setInstance(heads, i * 2 + h, _p, q, 1);
      }
      _p.copy(_c).addScaledVector(_n, MT_R + 0.2);
      setInstance(this.stalks[m.kind], i, _p, q, 1);
      _p.copy(_c).addScaledVector(_n, MT_R + 2.0 + m.cargoR);
      setInstance(this.cargo[m.kind], i, _p, null, m.cargoR);
      if (m.kind === 'kinesin') setInstance(this.cargoCore, i, _p, null, m.cargoR * 0.6);

      const d = _c.distanceToSquared(cam);
      if (d < 200) nearest.push({ d, pos: _c.clone().addScaledVector(_n, MT_R + 0.15), n: _n.clone() });
      if (m.kind === 'kinesin' && firstKinesin) {
        firstKinesin = false;
        this.motorPos.copy(_c).addScaledVector(_n, MT_R + 0.75);
        this.placeView(this.motorView, 2.5);
        this.stepProgress = p;
      }
      if (m.kind === 'dynein' && firstDynein) {
        firstDynein = false;
        this.dyneinPos.copy(_c).addScaledVector(_n, MT_R + 0.75);
        this.placeView(this.dyneinView, 2.6);
      }
    }
    for (const kind of ['kinesin', 'dynein'] as const) {
      this.heads[kind].instanceMatrix.needsUpdate = true;
      this.stalks[kind].instanceMatrix.needsUpdate = true;
      this.cargo[kind].instanceMatrix.needsUpdate = true;
    }
    this.cargoCore.instanceMatrix.needsUpdate = true;
    // One ATP is hydrolysed per 8 nm step: show it arriving at the nearest motors.
    this.atp.hideAll();
    nearest.sort((a, b) => a.d - b.d).slice(0, this.atp.count).forEach((m, i) => {
      const u = (ctx.pt * 1.6 + i * 0.3) % 1;
      this.atp.setV(i, _p.copy(m.pos).addScaledVector(m.n, (1 - u) * 1.3).addScaledVector(_side, (1 - u) * 0.8));
    });

    // Dynamic instability: slow growth, then sudden catastrophe and rapid shrinkage.
    this.tips.forEach((tip, ti) => {
      const cycle = 14;
      const t = (((ctx.pt * 0.5 + tip.phase) % cycle) + cycle) % cycle;
      const growing = t < 11;
      const len = growing ? (t / 11) * 5 : 5 * (1 - (t - 11) / 3);
      if (ti === 0) this.tipProgress = t / cycle;
      tip.mesh.scale.set(1, Math.max(0.01, len), 1);
      tip.cap.visible = growing;
      tip.cap.position.copy(tip.base).addScaledVector(tip.dir, Math.max(0, len - 0.25));
      const end = _c.copy(tip.base).addScaledVector(tip.dir, len);
      perpendicular(tip.dir, _n);
      _side.crossVectors(tip.dir, _n);
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2;
        const u = (ctx.pt * (growing ? 0.5 : 1.4) + j * 0.31 + ti) % 1;
        // Growing: dimers arrive and add on. Shrinking: protofilaments peel away as dimers leave.
        const r = growing ? MT_R + (1 - u) * 1.6 : MT_R + u * 1.9;
        const along = growing ? (1 - u) * 0.9 : -u * 0.5;
        _p.copy(end).addScaledVector(tip.dir, along).addScaledVector(_n, Math.cos(a) * r).addScaledVector(_side, Math.sin(a) * r);
        setInstance(this.dimerMesh, ti * 8 + j, _p, quatFromY(tip.dir, _q), 1);
      }
    });
    this.dimerMesh.instanceMatrix.needsUpdate = true;
  }
}

const _c = new THREE.Vector3();
const _t = new THREE.Vector3();
const _t2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const _side = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();

/** Position and unit tangent at arc-length x along a pre-sampled track. */
function sample(track: Track, x: number, pos: THREE.Vector3, tangent: THREE.Vector3): void {
  const f = THREE.MathUtils.clamp(x / track.length, 0, 0.9999) * (track.pts.length - 1);
  const i = Math.floor(f);
  const a = track.pts[i];
  const b = track.pts[i + 1];
  pos.lerpVectors(a, b, f - i);
  tangent.subVectors(b, a).normalize();
}
