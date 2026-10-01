import * as THREE from 'three';
import { membraneMaterial, solid, PALETTE } from '../fx/materials';
import { blob, merge, quatFromY, setInstance, v3, smoothstep } from '../fx/geom';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Golgi apparatus: a polarized stack of curved cisternae. Cargo enters at the cis face
// (toward the ER), is processed as it moves through, and is sorted at the trans-Golgi
// network. In a beta cell, proinsulin is packed into immature secretory granules here.

const RC = 14; // radius of curvature of the bowl-shaped cisternae
const SPACING = 1.05;

interface Cisterna {
  y: number;
  theta: number;
  half: number;
  entity: string;
  color: number;
}

export class Golgi implements Organelle {
  readonly id = 'golgi';
  readonly group = new THREE.Group();
  readonly center: THREE.Vector3;
  readonly axis: THREE.Vector3;
  private readonly cisternae: Cisterna[];
  private readonly cargo: ParticlePool;
  private readonly cargoColors: THREE.Color[];

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    this.center = v3(layout.golgi.center);
    this.axis = v3(layout.golgi.axis);
    this.group.position.copy(this.center);
    this.group.quaternion.copy(quatFromY(this.axis));
    this.group.updateMatrixWorld(true);

    const radius = layout.golgi.radius;
    const spec: [number, string, number][] = [
      [0.86, 'cis-golgi', 0xffc233],
      [0.97, 'cis-golgi', 0xffab2e],
      [1.0, 'medial-golgi', 0xfa922b],
      [1.0, 'medial-golgi', 0xf27a29],
      [0.9, 'trans-golgi', 0xea6126],
    ];
    this.cisternae = spec.map(([scale, entity, color], k) => ({
      y: (k - 2.5) * SPACING,
      theta: Math.asin((radius * scale) / RC),
      half: 0.17,
      entity,
      color,
    }));
    this.cisternae.forEach((c, k) => {
      const g = bowlGeo(c.theta, c.half);
      g.translate(0, c.y + RC, 0);
      const mesh = new THREE.Mesh(
        g,
        membraneMaterial({ color: c.color, rimColor: PALETTE.golgiRim, baseAlpha: 0.3, opacity: 0.92, amp: 0.07, freq: 0.5, rimStrength: 0.8, glow: 0.34 }),
      );
      this.group.add(mesh);
      kit.pickable(mesh, { entity: 'golgi', nearEntity: c.entity, nearDist: 12 });
      kit.membrane(mesh, { depth: 2, xray: false, contains: (p) => this.inCisterna(p, k) });
    });

    // Trans-Golgi network: a fenestrated web of tubules where cargo is sorted and packaged.
    const tgnY = 2.5 * SPACING + 0.2;
    const nodes: THREE.Vector3[] = [];
    for (let tries = 0; nodes.length < 34 && tries < 2000; tries++) {
      const th = Math.sqrt(rng.next()) * Math.asin((radius * 0.84) / RC);
      const ph = rng.range(0, Math.PI * 2);
      const p = new THREE.Vector3(Math.sin(th) * Math.cos(ph) * RC, tgnY + RC - Math.cos(th) * RC + rng.range(-0.15, 0.35), Math.sin(th) * Math.sin(ph) * RC);
      if (nodes.every((n) => n.distanceTo(p) > 1.5)) nodes.push(p);
    }
    const tubes: THREE.BufferGeometry[] = [];
    const seen = new Set<string>();
    nodes.forEach((n, i) => {
      const nearest = nodes
        .map((m, j) => ({ j, d: m.distanceTo(n) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const { j } of nearest) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const mid = n.clone().add(nodes[j]).multiplyScalar(0.5).add(new THREE.Vector3(rng.range(-0.3, 0.3), rng.range(-0.2, 0.3), rng.range(-0.3, 0.3)));
        tubes.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(n, mid, nodes[j]), 8, 0.2, 7, false));
      }
      tubes.push(new THREE.SphereGeometry(0.28, 8, 6).translate(n.x, n.y, n.z));
    });
    const tgn = new THREE.Mesh(
      merge(tubes),
      membraneMaterial({ color: 0xe0562a, rimColor: 0xffb48a, baseAlpha: 0.4, opacity: 0.92, amp: 0.03, freq: 0.8, glow: 0.34 }),
    );
    this.group.add(tgn);
    kit.pickable(tgn, { entity: 'tgn' });
    kit.membrane(tgn, { depth: 2, xray: false });

    // Mannose 6-phosphate receptors gather lysosomal enzymes at the TGN.
    const m6p = new THREE.InstancedMesh(blob(0.09, 1, 0.3, 4, [0.8, 1.7, 0.8]), solid(0x8fffd0, { emissiveIntensity: 0.5 }), 40);
    for (let i = 0; i < 40; i++) {
      const n = nodes[i % nodes.length];
      const out = new THREE.Vector3(...rng.unit());
      setInstance(m6p, i, n.clone().addScaledVector(out, 0.3), quatFromY(out), 1);
    }
    m6p.computeBoundingSphere();
    this.group.add(m6p);
    kit.pickable(m6p, { entity: 'm6p-receptor' });
    kit.lod(m6p, this.center, 34);

    // Cargo drifting inside every cisterna, brightening as it matures cis -> trans.
    this.cargo = particles.pool(this.cisternae.length * 14, 0xffd9f0, 0.13);
    this.cargoColors = this.cisternae.map((_, k) => new THREE.Color().setHSL(0.9 - k * 0.012, 0.9, 0.62 + k * 0.05));

    kit.compartment({
      label: 'Golgi lumen',
      priority: 6,
      fog: 0x241404,
      fogDensity: 0.03,
      test: (p) => this.cisternae.some((_, k) => this.inCisterna(p, k)),
    });

    const side = new THREE.Vector3(1, 0.25, 0).applyQuaternion(this.group.quaternion).normalize();
    const world = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(this.group.matrixWorld);
    kit.anchor('golgi', this.center, kit.vantage(this.center, radius + 11, radius + 2.5, side));
    kit.anchor('cis-golgi', world(0, -2.5 * SPACING, 0), world(0, -2.5 * SPACING - 5, 1.5));
    kit.anchor('medial-golgi', world(radius * 0.9, 0.8, 0), world(radius + 4.5, 1.2, 0));
    kit.anchor('trans-golgi', world(radius * 0.8, 1.5 * SPACING + 1, 0), world(radius + 3.5, 2.5 * SPACING + 2.5, 0));
    kit.anchor('tgn', world(0, tgnY + 0.2, 0), world(1, tgnY + 5.5, 1));
    kit.anchor('m6p-receptor', world(nodes[0].x, nodes[0].y, nodes[0].z), world(nodes[0].x, nodes[0].y + 2.2, nodes[0].z + 0.6));

  }

  /** World-space point on a cisterna rim, and the outward direction there. */
  rim(k: number, phi: number): { pos: THREE.Vector3; out: THREE.Vector3 } {
    const c = this.cisternae[Math.min(k, this.cisternae.length - 1)];
    const local = new THREE.Vector3(Math.sin(c.theta) * Math.cos(phi) * RC, c.y + RC - Math.cos(c.theta) * RC, Math.sin(c.theta) * Math.sin(phi) * RC);
    const out = new THREE.Vector3(Math.cos(phi), 0.15, Math.sin(phi)).normalize();
    return { pos: local.applyMatrix4(this.group.matrixWorld), out: out.applyQuaternion(this.group.quaternion) };
  }

  /** World-space point just outside the cis face (ER side). */
  cisFace(dx = 0, dz = 0): THREE.Vector3 {
    return new THREE.Vector3(dx, -2.5 * SPACING - 0.4, dz).applyMatrix4(this.group.matrixWorld);
  }

  /** World-space point on the trans-Golgi network (plasma membrane side). */
  transFace(dx = 0, dz = 0): THREE.Vector3 {
    return new THREE.Vector3(dx, 2.5 * SPACING + 0.9, dz).applyMatrix4(this.group.matrixWorld);
  }

  private inCisterna(p: THREE.Vector3, k: number): boolean {
    const c = this.cisternae[k];
    _l.copy(p);
    this.group.worldToLocal(_l);
    _l.y -= c.y + RC;
    const r = _l.length();
    if (Math.abs(r - RC) > c.half * 2.2) return false;
    return Math.acos(THREE.MathUtils.clamp(-_l.y / r, -1, 1)) < c.theta;
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'golgi' || entityId === 'tgn') return this.progress;
    return null;
  }

  private progress = 0;

  update(ctx: FrameCtx): void {
    const pt = ctx.pt;
    this.progress = (pt * 0.03) % 1;
    const per = 14;
    this.cisternae.forEach((c, k) => {
      for (let i = 0; i < per; i++) {
        const seed = k * 31 + i * 7.3;
        const th = c.theta * (0.15 + 0.8 * (0.5 + 0.5 * Math.sin(seed + pt * 0.07)));
        const ph = seed * 1.7 + pt * 0.05 * (i % 2 ? 1 : -1);
        _l.set(Math.sin(th) * Math.cos(ph) * RC, c.y + RC - Math.cos(th) * RC, Math.sin(th) * Math.sin(ph) * RC);
        this.cargo.setV(k * per + i, _l.applyMatrix4(this.group.matrixWorld));
        this.cargo.color(k * per + i, this.cargoColors[k]);
      }
    });
  }
}

const _l = new THREE.Vector3();

/** Bowl-shaped flattened sac (pole at the origin, rim rising toward +Y), with swollen rims. */
function bowlGeo(theta: number, half: number): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const n = 26;
  const h = (i: number) => half * (1 + 1.3 * smoothstep(0.78, 1, i / n));
  for (let i = 0; i <= n; i++) {
    const th = 0.01 + (theta - 0.01) * (i / n);
    pts.push(new THREE.Vector2(Math.sin(th) * (RC + h(i)), Math.cos(th) * (RC + h(i))));
  }
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const r = RC + Math.cos(a) * h(n);
    const th = theta + (Math.sin(a) * h(n) * 0.9) / RC;
    pts.push(new THREE.Vector2(Math.sin(th) * r, Math.cos(th) * r));
  }
  for (let i = n; i >= 0; i--) {
    const th = 0.01 + (theta - 0.01) * (i / n);
    pts.push(new THREE.Vector2(Math.sin(th) * (RC - h(i)), Math.cos(th) * (RC - h(i))));
  }
  const g = new THREE.LatheGeometry(pts, 56);
  g.rotateX(Math.PI); // pole now at -Y * RC
  return g;
}
