import * as THREE from 'three';
import { membraneMaterial, solid, PALETTE } from '../fx/materials';
import { merge, place, v3, fibonacciSphere, cyclePhase, smoothstep } from '../fx/geom';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Macroautophagy of a damaged mitochondrion (mitophagy): a cup-shaped double membrane, the
// phagophore, grows around the cargo and seals into an autophagosome; a lysosome then fuses
// with it and the contents are digested.

const STAGES = 12;

export class Autophagosome implements Organelle {
  readonly id = 'autophagosome';
  readonly group = new THREE.Group();
  private readonly outer: THREE.Mesh;
  private readonly inner: THREE.Mesh;
  private readonly cups: { outer: THREE.BufferGeometry; inner: THREE.BufferGeometry }[] = [];
  private readonly cargo: THREE.Mesh;
  private readonly lyso: THREE.Mesh;
  private readonly lc3: THREE.InstancedMesh;
  private readonly lc3Dirs: THREE.Vector3[];
  private readonly radius: number;
  private readonly outerMat;
  private readonly baseColor = new THREE.Color(0x4fd0ff);
  private readonly lysoColor = new THREE.Color(PALETTE.lysosome);
  private progress = 0;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit } = ctx;
    const c = v3(layout.autophagosome.center);
    const R = (this.radius = layout.autophagosome.radius);
    this.group.position.copy(c);
    this.group.rotation.set(0.4, 0.3, 0.9);

    // Pre-built cups from a small cap to a nearly closed sphere, swapped as the cup grows.
    for (let i = 0; i < STAGES; i++) {
      const theta = Math.PI * (0.22 + 0.78 * (i / (STAGES - 1)));
      this.cups.push({
        outer: new THREE.SphereGeometry(R, 36, 24, 0, Math.PI * 2, 0, theta),
        inner: new THREE.SphereGeometry(R - 0.42, 36, 24, 0, Math.PI * 2, 0, theta),
      });
    }
    this.outerMat = membraneMaterial({ color: 0x4fd0ff, rimColor: 0xbfefff, baseAlpha: 0.26, opacity: 0.9, amp: 0.04, freq: 0.9, glow: 0.3 });
    const innerMat = membraneMaterial({ color: 0x3aa8e0, rimColor: 0x9fe0ff, baseAlpha: 0.18, opacity: 0.8, amp: 0.03, freq: 0.9, glow: 0.25 });
    this.outer = new THREE.Mesh(this.cups[0].outer, this.outerMat);
    this.inner = new THREE.Mesh(this.cups[0].inner, innerMat);
    this.group.add(this.outer, this.inner);
    kit.pickable(this.outer, { entity: 'autophagosome', xray: true });
    kit.pickable(this.inner, { entity: 'autophagosome', xray: true });
    kit.membrane(this.outer, { depth: 2, xray: true, contains: (p) => p.distanceTo(c) < R });
    kit.membrane(this.inner, { depth: 3, xray: true, contains: (p) => p.distanceTo(c) < R - 0.42 });
    kit.compartment({ label: 'Autophagosome lumen', priority: 6, fog: 0x051a26, fogDensity: 0.028, test: (p) => p.distanceTo(c) < R - 0.45 && this.progress > 0.42 });

    // Cargo: a small, worn-out mitochondrion with a few surviving cristae.
    const cargoParts: THREE.BufferGeometry[] = [new THREE.CapsuleGeometry(1.25, 2.4, 8, 18)];
    for (let i = -1; i <= 1; i++) cargoParts.push(place(new THREE.CylinderGeometry(1.0, 1.0, 0.16, 14), [i % 2 ? 0.3 : -0.3, i * 0.85, 0]));
    this.cargo = new THREE.Mesh(merge(cargoParts), solid(0x8a4a3a, { emissiveIntensity: 0.2, roughness: 0.85 }));
    this.cargo.rotation.z = 0.5;
    this.group.add(this.cargo);
    kit.pickable(this.cargo, { entity: 'mitochondrion' });

    // LC3 is lipidated onto both faces of the growing membrane and recruits the cargo.
    this.lc3Dirs = fibonacciSphere(70);
    this.lc3 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 1), solid(0xfff07a, { emissiveIntensity: 0.9 }), 70);
    this.lc3.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.lc3);
    kit.pickable(this.lc3, { entity: 'lc3' });

    this.lyso = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 24, 16),
      membraneMaterial({ color: PALETTE.lysosome, rimColor: 0xff9ad2, baseAlpha: 0.45, opacity: 0.9, amp: 0.04, freq: 1.4 }),
    );
    this.group.add(this.lyso);
    kit.pickable(this.lyso, { entity: 'lysosome' });

    kit.anchor('autophagosome', c, kit.vantage(c, R + 7, R + 1));
    kit.anchor('lc3', c, kit.vantage(c, R + 3, R + 0.8));
  }

  getProcessProgress(entityId: string): number | null {
    return entityId === 'autophagosome' || entityId === 'lc3' ? this.progress : null;
  }

  update(ctx: FrameCtx): void {
    // 0 phagophore grows, 1 sealed, 2 lysosome docks and fuses, 3 digestion, 4 reset
    const durations = [12, 3, 5, 8, 2];
    const total = 30;
    const t = ctx.pt * 0.6;
    const [step, p] = cyclePhase(t, durations);
    this.progress = (((t % total) + total) % total) / total;
    const R = this.radius;

    const closure = step === 0 ? p : 1;
    const idx = Math.min(STAGES - 1, Math.floor(closure * STAGES));
    this.outer.geometry = this.cups[idx].outer;
    this.inner.geometry = this.cups[idx].inner;
    const theta = Math.PI * (0.22 + 0.78 * (idx / (STAGES - 1)));

    let scale = 1;
    let cargoScale = 1;
    let fused = 0;
    this.lyso.visible = step === 2 || step === 3;
    if (step === 2) {
      const e = smoothstep(0, 0.7, p);
      this.lyso.position.set(0, THREE.MathUtils.lerp(R + 9, R + 1.1, e), 0);
      this.lyso.scale.setScalar(1 - smoothstep(0.7, 1, p) * 0.9);
      fused = smoothstep(0.7, 1, p);
    } else if (step === 3) {
      this.lyso.visible = false;
      fused = 1;
      cargoScale = 1 - p * 0.92; // hydrolases break the cargo down
    } else if (step === 4) {
      fused = 1;
      cargoScale = 0.08;
      scale = 1 - p;
    }
    // The inner membrane is digested along with the cargo; the result is an autolysosome.
    this.inner.visible = step < 3;
    this.outerMat.color.copy(this.baseColor).lerp(this.lysoColor, fused);
    this.group.scale.setScalar(Math.max(0.001, scale));
    this.cargo.scale.setScalar(Math.max(0.001, cargoScale));
    this.cargo.rotation.y = ctx.pt * 0.08;

    this.lc3Dirs.forEach((d, i) => {
      // Only where membrane exists: polar angle measured from the cup's +Y pole.
      const polar = Math.acos(d.y);
      const on = polar < theta && step < 3;
      const r = i % 2 ? R + 0.05 : R - 0.47;
      _p.copy(d).multiplyScalar(r);
      _s.setScalar(on ? 1 : 0.0001);
      _m.compose(_p, _q, _s);
      this.lc3.setMatrixAt(i, _m);
    });
    this.lc3.instanceMatrix.needsUpdate = true;
  }
}

const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
