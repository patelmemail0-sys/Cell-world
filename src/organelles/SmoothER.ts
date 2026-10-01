import * as THREE from 'three';
import { membraneMaterial, solid } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3, cyclePhase, perpendicular } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';
import { PALETTE } from '../fx/materials';

// Smooth ER: a branching network of ribosome-free tubules joined at three-way junctions.
// It makes lipids, stores Ca2+ (pumped in by SERCA, released through IP3 receptors), and
// gives rise to lipid droplets.

const TUBE_R = 0.34;

export class SmoothER implements Organelle {
  readonly id = 'smooth-er';
  readonly group = new THREE.Group();
  private readonly serca: NearSites;
  private readonly ip3r: NearSites;
  private readonly ca: ParticlePool;
  private readonly atp: ParticlePool;
  private readonly burst: ParticlePool;
  private readonly ip3: ParticlePool;
  private sercaProgress: number | null = null;
  private ip3Progress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const center = v3(layout.smoothEr.center);
    const R = layout.smoothEr.radius;

    const nodes: THREE.Vector3[] = [];
    for (let tries = 0; nodes.length < 54 && tries < 4000; tries++) {
      const p = new THREE.Vector3(...rng.unit()).multiplyScalar(Math.cbrt(rng.next()) * R).add(center);
      if (nodes.every((n) => n.distanceTo(p) > 3.6)) nodes.push(p);
    }
    const tubes: THREE.BufferGeometry[] = [];
    const curves: THREE.QuadraticBezierCurve3[] = [];
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
        const mid = n.clone().add(nodes[j]).multiplyScalar(0.5).add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.9));
        const curve = new THREE.QuadraticBezierCurve3(n, mid, nodes[j]);
        curves.push(curve);
        tubes.push(new THREE.TubeGeometry(curve, 12, TUBE_R, 8, false));
      }
      tubes.push(new THREE.SphereGeometry(TUBE_R * 1.25, 10, 8).translate(n.x, n.y, n.z));
    });
    const net = new THREE.Mesh(
      merge(tubes),
      membraneMaterial({ color: 0x2fc4ac, rimColor: 0xa8ffe9, baseAlpha: 0.3, opacity: 0.9, amp: 0.05, freq: 0.6, rimStrength: 0.85, glow: 0.28 }),
    );
    this.group.add(net);
    kit.pickable(net, { entity: 'smooth-er' });
    kit.membrane(net, { depth: 2, xray: false });

    // Membrane proteins on the tubule surface.
    const onTube = (): Site => {
      const c = rng.pick(curves);
      const u = rng.range(0.1, 0.9);
      const p = c.getPoint(u);
      const tangent = c.getTangent(u);
      const normal = perpendicular(tangent).applyAxisAngle(tangent, rng.range(0, Math.PI * 2));
      return { pos: p.addScaledVector(normal, TUBE_R), normal, phase: rng.range(0, 10) };
    };
    const make = (id: string, geo: THREE.BufferGeometry, color: number, count: number): Site[] => {
      const mesh = new THREE.InstancedMesh(geo, solid(color, { emissiveIntensity: 0.45 }), count);
      const sites: Site[] = [];
      for (let i = 0; i < count; i++) {
        const s = onTube();
        sites.push(s);
        setInstance(mesh, i, s.pos, quatFromY(s.normal), 1);
      }
      mesh.computeBoundingSphere();
      this.group.add(mesh);
      kit.pickable(mesh, { entity: id });
      kit.anchor(id, sites[0].pos, sites[0].pos.clone().addScaledVector(sites[0].normal, 2.2));
      return sites;
    };
    this.serca = new NearSites(make('serca', sercaGeo(), 0xffa040, 90), 5, 12);
    this.ip3r = new NearSites(make('ip3-receptor', ip3rGeo(), 0xff5f8a, 60), 4, 12);
    make('cytochrome-p450', p450Geo(), 0xd0a5ff, 80);

    // Lipid droplets budding from the ER membrane: neutral lipid core, phospholipid monolayer.
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xffe98a, roughness: 0.18, clearcoat: 1, emissive: 0xc79a1e, emissiveIntensity: 0.55 });
    [0, 7, 15].forEach((ni, i) => {
      const n = nodes[ni % nodes.length];
      const r = 1.3 + i * 0.45;
      const out = n.clone().sub(center).normalize();
      const drop = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), dropMat);
      drop.position.copy(n).addScaledVector(out, r + TUBE_R * 0.6);
      this.group.add(drop);
      kit.pickable(drop, { entity: 'lipid-droplet' });
      kit.solid(drop.position, r);
      if (i === 0) kit.anchor('lipid-droplet', drop.position, kit.vantage(drop.position.clone(), r + 4, r + 0.6, out));
    });

    this.ca = particles.pool(5 * 2, PALETTE.calcium, 0.17);
    this.atp = particles.pool(5, PALETTE.atp, 0.2);
    this.burst = particles.pool(4 * 8, PALETTE.calcium, 0.17);
    this.ip3 = particles.pool(4, 0xb0ffe0, 0.2);

    kit.anchor('smooth-er', center, kit.vantage(center, R + 8, R + 1, new THREE.Vector3(1, 0.3, 0.3)));
  }

  getProcessProgress(entityId: string): number | null {
    if (entityId === 'serca' || entityId === 'smooth-er') return this.sercaProgress;
    if (entityId === 'ip3-receptor') return this.ip3Progress;
    return null;
  }

  update(ctx: FrameCtx): void {
    const cam = ctx.camera.position;
    const pt = ctx.pt;
    // SERCA: 2 Ca2+ pumped from cytosol into the lumen per ATP.
    this.ca.hideAll();
    this.atp.hideAll();
    this.sercaProgress = null;
    this.serca.update(cam, ctx.dt).forEach((s, i) => {
      const [step, p] = cyclePhase(pt * 0.8 + s.phase, [1.4, 0.7, 1.1, 0.8]);
      if (i === 0) this.sercaProgress = (step + p) / 4;
      perpendicular(s.normal, _a);
      for (let j = 0; j < 2; j++) {
        let y: number;
        if (step === 0) y = THREE.MathUtils.lerp(1.7 + j * 0.3, 0.3, p);
        else if (step === 1) y = 0.3;
        else if (step === 2) y = THREE.MathUtils.lerp(0.3, -0.28, p);
        else { this.ca.hide(i * 2 + j); continue; }
        this.ca.setV(i * 2 + j, _p.copy(s.pos).addScaledVector(s.normal, y).addScaledVector(_a, (j - 0.5) * 0.12));
      }
      if (step <= 1) this.atp.setV(i, _p.copy(s.pos).addScaledVector(s.normal, step === 0 ? THREE.MathUtils.lerp(2, 0.45, p) : 0.45).addScaledVector(_a, 0.25));
    });
    // IP3 receptor: IP3 binds, the channel opens, stored Ca2+ pours into the cytosol.
    this.burst.hideAll();
    this.ip3.hideAll();
    this.ip3Progress = null;
    this.ip3r.update(cam, ctx.dt).forEach((s, i) => {
      const [step, p] = cyclePhase(pt * 0.6 + s.phase, [1.6, 2.2, 1.6]);
      if (i === 0) this.ip3Progress = (step + p) / 3;
      perpendicular(s.normal, _a);
      _b.crossVectors(s.normal, _a);
      if (step === 0) this.ip3.setV(i, _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(2.4, 0.5, p)).addScaledVector(_a, 0.3));
      if (step === 1) {
        this.ip3.setV(i, _p.copy(s.pos).addScaledVector(s.normal, 0.5).addScaledVector(_a, 0.3));
        for (let j = 0; j < 8; j++) {
          const u = (p * 1.5 + j / 8) % 1;
          const a = j * 0.9;
          const spread = u * 0.9;
          this.burst.setV(i * 8 + j, _p.copy(s.pos).addScaledVector(s.normal, 0.2 + u * 2.4).addScaledVector(_a, Math.cos(a) * spread).addScaledVector(_b, Math.sin(a) * spread));
        }
      }
    });
  }
}

const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function sercaGeo(): THREE.BufferGeometry {
  // P-type ATPase: transmembrane helices plus a large three-domain cytosolic head.
  return merge([
    place(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 6), [0, 0, 0]),
    place(blob(0.1, 1, 0.3, 1), [0.05, 0.2, 0]),
    place(blob(0.085, 1, 0.3, 3), [-0.07, 0.26, 0.03]),
    place(blob(0.07, 1, 0.3, 5), [0, 0.37, -0.03]),
  ]);
}

function ip3rGeo(): THREE.BufferGeometry {
  // Giant tetrameric channel: a mushroom-shaped cytosolic cap over a narrow pore.
  const parts: THREE.BufferGeometry[] = [place(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 8), [0, 0, 0])];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    parts.push(place(blob(0.13, 1, 0.25, i + 2), [Math.cos(a) * 0.13, 0.26, Math.sin(a) * 0.13]));
  }
  return merge(parts);
}

function p450Geo(): THREE.BufferGeometry {
  // Single membrane anchor with the haem-containing catalytic domain resting on the surface.
  return merge([place(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 4), [0, 0, 0]), place(blob(0.09, 1, 0.3, 6, [1.3, 0.9, 1]), [0.05, 0.12, 0])]);
}
