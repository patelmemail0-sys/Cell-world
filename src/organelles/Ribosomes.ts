import * as THREE from 'three';
import { solid, glow, PALETTE } from '../fx/materials';
import { blob, merge, place, quatFromY, v3, cyclePhase, perpendicular } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import type { BoundSite } from './RoughER';

// Ribosomes: thousands of low-detail instances everywhere, plus a handful of fully
// detailed, animated "hero" ribosomes that attach to whichever sites are nearest the player
// and show the elongation cycle (and, on the ER, translocation into the lumen).

interface RSite {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  quat: THREE.Quaternion;
  bound: boolean;
  phase: number;
}

const HEROES = 6;
const CHAIN = 9;
const MRNA = 9;

export class Ribosomes implements Organelle {
  readonly id = 'ribosome';
  readonly group = new THREE.Group();
  private readonly sites: RSite[] = [];
  private readonly mesh: THREE.InstancedMesh;
  private readonly heroes: Hero[] = [];
  private assigned: number[] = [];
  private acc = 1;
  private heroProgress: number | null = null;

  constructor(layout: Layout, bound: BoundSite[], ctx: BuildContext) {
    const { kit, rng, quality } = ctx;
    const density = quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1;

    for (const b of bound) {
      const q = quatFromY(b.normal).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, 6.28)));
      this.sites.push({ pos: b.pos, normal: b.normal, quat: q, bound: true, phase: rng.range(0, 10) });
    }
    const firstFree = this.sites.length;

    // Free polysomes: several ribosomes reading one mRNA, arranged along a loose helix.
    const mrnaTubes: THREE.BufferGeometry[] = [];
    const polys = layout.polysomes.slice(0, Math.round(layout.polysomes.length * density));
    for (const poly of polys) {
      const c = v3(poly.center);
      const axis = v3(poly.axis);
      const side = perpendicular(axis);
      const side2 = new THREE.Vector3().crossVectors(axis, side);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < poly.count; i++) {
        const a = i * 1.15;
        const along = (i - poly.count / 2) * 0.62;
        const onHelix = c.clone().addScaledVector(axis, along).addScaledVector(side, Math.cos(a) * 0.55).addScaledVector(side2, Math.sin(a) * 0.55);
        const out = onHelix.clone().sub(c.clone().addScaledVector(axis, along)).normalize();
        pts.push(onHelix.clone());
        // mRNA runs through the subunit interface, so the ribosome sits just outside the helix.
        const pos = onHelix.clone().addScaledVector(out, -0.38);
        this.sites.push({ pos, normal: out, quat: quatFromY(out), bound: false, phase: rng.range(0, 10) });
      }
      if (pts.length >= 2) {
        mrnaTubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 4, 0.028, 3, false));
      }
    }
    const mrna = new THREE.Mesh(merge(mrnaTubes), glow(PALETTE.mrna, 1.1));
    this.group.add(mrna);
    kit.pickable(mrna, { entity: 'mrna' });

    // Low-detail instances: large subunit below, small subunit on top.
    const lowGeo = merge([
      place(new THREE.IcosahedronGeometry(0.29, 1), [0, 0.26, 0]),
      place(new THREE.IcosahedronGeometry(0.21, 0), [0.02, 0.55, 0], undefined, [1.2, 0.8, 1]),
    ]);
    this.mesh = new THREE.InstancedMesh(lowGeo, solid(PALETTE.ribosome, { emissiveIntensity: 0.28, roughness: 0.7 }), this.sites.length);
    this.sites.forEach((_, i) => this.setSite(i, true));
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.computeBoundingSphere();
    this.group.add(this.mesh);
    kit.pickable(this.mesh, { entity: 'ribosome' });

    for (let i = 0; i < HEROES; i++) {
      const h = new Hero(ctx);
      this.heroes.push(h);
      this.group.add(h.group);
    }

    const b0 = this.sites[0];
    // Side-on, so both subunits, the mRNA between them and the translocon below are in view.
    const boundView = b0.pos.clone().addScaledVector(b0.normal, 0.75).addScaledVector(perpendicular(b0.normal), 1.75);
    for (const id of ['large-subunit', 'small-subunit', 'trna', 'nascent-chain']) kit.anchor(id, b0.pos, boundView);
    const f0 = this.sites[firstFree] ?? b0;
    kit.anchor('ribosome', f0.pos, f0.pos.clone().addScaledVector(f0.normal, 1.2).addScaledVector(perpendicular(f0.normal), 2.2));
  }

  getProcessProgress(entityId: string): number | null {
    if (['ribosome', 'large-subunit', 'small-subunit', 'trna', 'nascent-chain', 'sec61', 'bip', 'pdi', 'signal-peptidase', 'ost'].includes(entityId)) {
      return this.heroProgress;
    }
    return null;
  }

  private setSite(i: number, shown: boolean): void {
    const s = this.sites[i];
    _s.setScalar(shown ? 1 : 0.0001);
    _m.compose(s.pos, s.quat, _s);
    this.mesh.setMatrixAt(i, _m);
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    this.acc += ctx.dt;
    if (this.acc > 0.4) {
      this.acc = 0;
      // Nearest sites within reach get a hero; their low-detail stand-ins are hidden.
      const near: { i: number; d: number }[] = [];
      for (let i = 0; i < this.sites.length; i++) {
        const d = this.sites[i].pos.distanceToSquared(cam);
        if (d < 64) near.push({ i, d });
      }
      near.sort((a, b) => a.d - b.d);
      const next = near.slice(0, HEROES).map((n) => n.i);
      for (const i of this.assigned) if (!next.includes(i)) this.setSite(i, true);
      for (const i of next) this.setSite(i, false);
      this.assigned = next;
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    this.heroProgress = null;
    this.heroes.forEach((h, k) => {
      const idx = this.assigned[k];
      if (idx === undefined) {
        h.hide();
        return;
      }
      const p = h.update(this.sites[idx], ctx.pt);
      if (k === 0) this.heroProgress = p;
    });
  }
}

/** A fully detailed ribosome mid-translation. Local +Y points away from the ER membrane. */
class Hero {
  readonly group = new THREE.Group();
  private readonly trna: THREE.Mesh[] = [];
  private readonly translocon = new THREE.Group();
  private readonly chain: THREE.InstancedMesh;
  private readonly mrnaBeads: ParticlePool;
  private readonly aa: ParticlePool;
  private readonly folded: THREE.Mesh;

  constructor(ctx: BuildContext) {
    const { kit, particles } = ctx;
    const large = new THREE.Mesh(blob(0.3, 3, 0.26, 3), solid(0x3fa9e6, { emissiveIntensity: 0.3 }));
    large.position.y = 0.26;
    const small = new THREE.Mesh(blob(0.22, 3, 0.3, 6, [1.25, 0.8, 1.05]), solid(0x9fe6ff, { emissiveIntensity: 0.3 }));
    small.position.set(0.02, 0.56, 0);
    this.group.add(large, small);
    kit.pickable(large, { entity: 'large-subunit' });
    kit.pickable(small, { entity: 'small-subunit' });

    // tRNAs at the A, P and E sites: L-shaped adaptors between codon and amino acid.
    const trnaGeo = merge([
      place(new THREE.CapsuleGeometry(0.022, 0.12, 2, 5), [0, 0.06, 0]),
      place(new THREE.CapsuleGeometry(0.022, 0.1, 2, 5), [0.05, 0.13, 0], new THREE.Euler(0, 0, -Math.PI / 2)),
    ]);
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(trnaGeo, glow(0x7dffb0, 0.85));
      this.group.add(t);
      this.trna.push(t);
      kit.pickable(t, { entity: 'trna' });
    }

    // Translocon and its helpers, only shown on ER-bound ribosomes.
    const sec61 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 6, 12).rotateX(Math.PI / 2), solid(0xffb347, { emissiveIntensity: 0.5 }));
    sec61.position.y = -0.04;
    const peptidase = new THREE.Mesh(blob(0.06, 1, 0.3, 2), solid(0xff6b6b, { emissiveIntensity: 0.5 }));
    peptidase.position.set(0.16, -0.14, 0.03);
    const ost = new THREE.Mesh(blob(0.085, 1, 0.3, 5, [1, 1.4, 1]), solid(0xc792ff, { emissiveIntensity: 0.45 }));
    ost.position.set(-0.19, -0.1, 0);
    const bip = new THREE.Mesh(blob(0.075, 1, 0.3, 7, [1.4, 0.9, 0.9]), solid(0x7dffe0, { emissiveIntensity: 0.5 }));
    bip.position.set(0.06, -0.3, 0.1);
    const pdi = new THREE.Mesh(blob(0.07, 1, 0.3, 9, [1.5, 0.8, 0.8]), solid(0xfff07d, { emissiveIntensity: 0.5 }));
    pdi.position.set(-0.12, -0.42, -0.06);
    this.translocon.add(sec61, peptidase, ost, bip, pdi);
    this.group.add(this.translocon);
    kit.pickable(sec61, { entity: 'sec61' });
    kit.pickable(peptidase, { entity: 'signal-peptidase' });
    kit.pickable(ost, { entity: 'ost' });
    kit.pickable(bip, { entity: 'bip' });
    kit.pickable(pdi, { entity: 'pdi' });

    this.chain = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.034, 1), glow(0xffb3e6, 1.5), CHAIN);
    this.chain.frustumCulled = false;
    this.group.add(this.chain);
    kit.pickable(this.chain, { entity: 'nascent-chain' });
    this.folded = new THREE.Mesh(blob(0.08, 2, 0.35, 4), glow(0xffb3e6, 1.2));
    this.group.add(this.folded);
    kit.pickable(this.folded, { entity: 'nascent-chain' });

    this.mrnaBeads = particles.pool(MRNA, PALETTE.mrna, 0.085);
    this.aa = particles.pool(1, 0xffb3e6, 0.1);
    this.group.visible = false;
  }

  hide(): void {
    if (!this.group.visible) return;
    this.group.visible = false;
    this.mrnaBeads.hideAll();
    this.aa.hideAll();
  }

  /** Returns progress 0..1 through the elongation cycle. */
  update(site: RSite, pt: number): number {
    this.group.visible = true;
    this.group.position.copy(site.pos);
    this.group.quaternion.copy(site.quat);
    this.translocon.visible = site.bound;
    this.group.updateMatrixWorld();

    // 0 aminoacyl-tRNA enters the A site, 1 peptide bond forms, 2 translocation, 3 E-site exit
    const durations = [1.1, 0.6, 0.9, 0.7];
    const cycle = 3.3;
    const t = pt * 1.1 + site.phase;
    const [step, p] = cyclePhase(t, durations);
    const e = p * p * (3 - 2 * p);
    const cycles = Math.floor(t / cycle);
    const y = 0.42;
    const A = 0.11;
    const P = 0;
    const E = -0.11;
    const [tA, tP, tE] = this.trna;
    tA.visible = tP.visible = tE.visible = true;
    if (step === 0) {
      tA.position.set(THREE.MathUtils.lerp(0.75, A, e), y + (1 - e) * 0.25, (1 - e) * 0.3);
      tP.position.set(P, y, 0);
      tE.visible = false;
    } else if (step === 1) {
      tA.position.set(A, y, 0);
      tP.position.set(P, y, 0);
      tE.visible = false;
    } else if (step === 2) {
      // The ribosome ratchets one codon along the mRNA: A -> P, P -> E.
      tA.position.set(THREE.MathUtils.lerp(A, P, e), y, 0);
      tP.position.set(THREE.MathUtils.lerp(P, E, e), y, 0);
      tE.visible = false;
    } else {
      tA.position.set(P, y, 0);
      tP.position.set(THREE.MathUtils.lerp(E, -0.7, e), y + e * 0.2, -e * 0.3);
      tE.visible = false;
    }
    // The amino acid riding in on the incoming tRNA.
    if (step === 0) this.aa.setV(0, this.group.localToWorld(_p.set(tA.position.x + 0.05, tA.position.y + 0.17, tA.position.z)));
    else this.aa.hide(0);

    // mRNA slides through the interface one codon per cycle.
    const shift = step === 2 ? e : step === 3 ? 1 : 0;
    for (let i = 0; i < MRNA; i++) {
      const x = (i - MRNA / 2) * 0.11 - shift * 0.11 + 0.22;
      this.mrnaBeads.setV(i, this.group.localToWorld(_p.set(x, y - 0.03 + Math.abs(x) * 0.12, Math.sin(i * 0.9) * 0.03)));
    }

    // Nascent chain: one residue longer each cycle, threaded down the exit tunnel.
    const len = (cycles % (CHAIN + 3)) + (step >= 1 ? 1 : 0);
    const shown = Math.min(CHAIN, len);
    const releasing = len > CHAIN;
    for (let i = 0; i < CHAIN; i++) {
      const depth = (shown - i) * 0.075;
      const visible = i < shown && !releasing;
      if (site.bound) _p.set(Math.sin(i * 1.3) * 0.03 * Math.max(0, depth - 0.3) * 6, 0.18 - depth, Math.cos(i * 1.7) * 0.03 * Math.max(0, depth - 0.3) * 6);
      else _p.set(-0.2 - depth * 0.5 + Math.sin(i * 1.3) * 0.04, 0.2 - depth * 0.35, Math.cos(i * 1.7) * 0.06);
      _s.setScalar(visible ? 1 : 0.0001);
      _m.compose(_p, _q, _s);
      this.chain.setMatrixAt(i, _m);
    }
    this.chain.instanceMatrix.needsUpdate = true;
    // Finished chain folds and drifts away (into the lumen when ER-bound).
    this.folded.visible = releasing;
    if (releasing) {
      const u = ((len - CHAIN - 1) + (step + p) / 4) / 2;
      if (site.bound) this.folded.position.set(0.1 + u * 0.3, -0.34 - u * 0.12, u * 0.5);
      else this.folded.position.set(-0.45 - u * 0.6, 0.05, u * 0.4);
      this.folded.scale.setScalar(1 + Math.sin(u * 3) * 0.1);
    }
    return (((t % cycle) + cycle) % cycle) / cycle;
  }
}

const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
