import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { solid, extend } from '../fx/materials';
import { blob, merge, place, quatFromY, setInstance, v3, perpendicular } from '../fx/geom';
import { NearSites, type Site } from '../fx/nearSites';
import type { ParticlePool } from '../fx/particles';
import type { BuildContext, FrameCtx, Organelle } from '../world/types';
import type { Layout } from '../world/layout';

// Extracellular matrix: the protein scaffold outside the cell. Banded collagen fibrils give
// tissue its strength; integrins span the plasma membrane and tie the matrix to the actin
// cortex, passing mechanical and survival signals into the cell.

export class ExtracellularMatrix implements Organelle {
  readonly id = 'extracellular-matrix';
  readonly group = new THREE.Group();
  private readonly integrins: NearSites;
  private readonly signal: ParticlePool;
  private progress: number | null = null;

  constructor(layout: Layout, ctx: BuildContext) {
    const { kit, rng, particles } = ctx;
    const radii = v3(layout.cell.radii);
    const showcase = new THREE.Vector3(0.52, 0.44, 0.73).normalize();

    // --- collagen fibrils (true scale: 50-200 nm thick, 67 nm banding) --------------------
    const geos: THREE.BufferGeometry[] = [];
    const contact: THREE.Vector3[] = [];
    for (let i = 0; i < 30; i++) {
      const axis = i === 0 ? perpendicular(showcase) : new THREE.Vector3(...rng.unit());
      const start = i === 0 ? showcase.clone() : perpendicular(axis).applyAxisAngle(axis, rng.range(0, 6.28));
      const arc = rng.range(1.2, 2.6);
      const lift = i === 0 ? 1.035 : rng.range(1.03, 1.16);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 20; k++) {
        const d = start.clone().applyAxisAngle(axis, (k / 20 - 0.5) * arc);
        // Fibrils run straight, so they lift away from the curved cell toward their ends.
        const away = 1 + Math.pow(Math.abs(k / 20 - 0.5) * 2, 2) * 0.35;
        pts.push(new THREE.Vector3(d.x * radii.x, d.y * radii.y, d.z * radii.z).multiplyScalar(lift * away));
        if (lift < 1.07 && k > 7 && k < 13) contact.push(d.clone());
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const length = curve.getLength();
      const g = new THREE.TubeGeometry(curve, 80, rng.range(0.45, 0.95), 8, false);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * length);
      geos.push(g);
    }
    const mat = solid(0xf2dc7a, { emissiveIntensity: 0.3, roughness: 0.7, bump: 0 });
    extend(mat, 'collagen-bands', (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vBand;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBand = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vBand;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
// D-banding: staggered collagen molecules give a light/dark repeat every 67 nm.
float band = smoothstep(0.35, 0.5, abs(fract(vBand.x / 0.67) - 0.5) * 2.0);
float strand = 0.85 + 0.15 * sin(vBand.y * 6.2831853 * 9.0 + vBand.x * 1.5);
diffuseColor.rgb *= mix(0.6, 1.05, band) * strand;`,
        );
    });
    const collagen = new THREE.Mesh(mergeGeometries(geos)!, mat);
    this.group.add(collagen);
    kit.pickable(collagen, { entity: 'extracellular-matrix', nearEntity: 'collagen-fibril', nearDist: 12 });

    // --- integrins: clustered where fibrils touch the cell ---------------------------------
    const n = Math.min(110, contact.length * 2);
    const mesh = new THREE.InstancedMesh(integrinGeo(), solid(0x7fd6ff, { emissiveIntensity: 0.4 }), n);
    const sites: Site[] = [];
    for (let i = 0; i < n; i++) {
      const base = i === 0 ? showcase.clone().add(new THREE.Vector3(-0.04, 0.05, 0)) : contact[i % contact.length].clone().add(new THREE.Vector3(...rng.unit()).multiplyScalar(0.03));
      const d = base.normalize();
      const pos = new THREE.Vector3(d.x * radii.x, d.y * radii.y, d.z * radii.z);
      const normal = new THREE.Vector3(pos.x / radii.x ** 2, pos.y / radii.y ** 2, pos.z / radii.z ** 2).normalize();
      setInstance(mesh, i, pos, quatFromY(normal).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, 6.28))), 1);
      sites.push({ pos, normal, phase: rng.range(0, 10) });
    }
    mesh.computeBoundingSphere();
    this.group.add(mesh);
    kit.pickable(mesh, { entity: 'integrin' });
    this.integrins = new NearSites(sites, 6, 16);
    this.signal = particles.pool(6 * 3, 0x9fe8ff, 0.14);

    const s0 = sites[0];
    kit.anchor('integrin', s0.pos, s0.pos.clone().addScaledVector(s0.normal, -4));
    const out = showcase.clone().multiply(radii);
    kit.anchor('extracellular-matrix', out.clone().multiplyScalar(1.04), out.clone().multiplyScalar(0.9));
    kit.anchor('collagen-fibril', out.clone().multiplyScalar(1.04), out.clone().multiplyScalar(0.93));
  }

  getProcessProgress(entityId: string): number | null {
    return entityId === 'integrin' || entityId === 'extracellular-matrix' ? this.progress : null;
  }

  update(ctx: FrameCtx): void {
    // Outside-in signalling: a matrix-bound integrin relays to talin and the actin cortex.
    this.signal.hideAll();
    this.progress = null;
    this.integrins.update(ctx.camera.position, ctx.dt).forEach((s, i) => {
      for (let j = 0; j < 3; j++) {
        const u = (((ctx.pt * 0.4 + s.phase + j / 3) % 1) + 1) % 1;
        if (i === 0 && j === 0) this.progress = u;
        this.signal.setV(i * 3 + j, _p.copy(s.pos).addScaledVector(s.normal, THREE.MathUtils.lerp(1.3, -2.2, u)));
        this.signal.size(i * 3 + j, 0.14 * Math.sin(u * Math.PI));
      }
    });
  }
}

const _p = new THREE.Vector3();

function integrinGeo(): THREE.BufferGeometry {
  // Alpha/beta heterodimer in its extended, active shape: a ligand-binding head on two
  // legs outside the cell (+Y), two helices through the membrane, short tails bound by talin.
  return merge([
    place(new THREE.CylinderGeometry(0.045, 0.045, 1.25, 5), [0.09, 0.4, 0], new THREE.Euler(0, 0, -0.06)),
    place(new THREE.CylinderGeometry(0.045, 0.045, 1.25, 5), [-0.09, 0.4, 0], new THREE.Euler(0, 0, 0.06)),
    place(blob(0.17, 1, 0.3, 2), [0.1, 1.12, 0]),
    place(blob(0.15, 1, 0.3, 5), [-0.1, 1.1, 0.04]),
    place(blob(0.13, 1, 0.3, 8, [1.6, 0.8, 1]), [0.16, -0.42, 0]),
  ]);
}
