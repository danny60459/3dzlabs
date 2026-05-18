"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 90;
const MAX_DIST = 160;
// #00ffa0 normalised
const PR = 0;
const PG = 1.0;
const PB = 0.627;

export default function ParticleNetwork() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Ortho camera: (0,0) bottom-left, (W,H) top-right — y-flip doesn't matter for random particles
    const camera = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);

    // ── Particles ──────────────────────────────────────────────────────────────
    const ptPos = new Float32Array(COUNT * 3);
    const vel = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.45,
      y: (Math.random() - 0.5) * 0.45,
    }));

    for (let i = 0; i < COUNT; i++) {
      ptPos[i * 3]     = Math.random() * W;
      ptPos[i * 3 + 1] = Math.random() * H;
      ptPos[i * 3 + 2] = 0;
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0x00ffa0, size: 2.5, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(ptGeo, ptMat));

    // ── Lines (vertex-colour fade) ─────────────────────────────────────────────
    const MAX_SEGS = (COUNT * (COUNT - 1)) / 2;
    const lnPos = new Float32Array(MAX_SEGS * 6);
    const lnCol = new Float32Array(MAX_SEGS * 6);

    const lnGeo = new THREE.BufferGeometry();
    lnGeo.setAttribute("position", new THREE.BufferAttribute(lnPos, 3));
    lnGeo.setAttribute("color",    new THREE.BufferAttribute(lnCol, 3));
    const lnMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true });
    const lineSegments = new THREE.LineSegments(lnGeo, lnMat);
    scene.add(lineSegments);

    // ── Animation loop ─────────────────────────────────────────────────────────
    let raf;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      for (let i = 0; i < COUNT; i++) {
        ptPos[i * 3]     += vel[i].x;
        ptPos[i * 3 + 1] += vel[i].y;
        if (ptPos[i * 3]     < 0) ptPos[i * 3]     = W;
        if (ptPos[i * 3]     > W) ptPos[i * 3]     = 0;
        if (ptPos[i * 3 + 1] < 0) ptPos[i * 3 + 1] = H;
        if (ptPos[i * 3 + 1] > H) ptPos[i * 3 + 1] = 0;
      }
      ptGeo.attributes.position.needsUpdate = true;

      const D2 = MAX_DIST * MAX_DIST;
      let n = 0;
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = ptPos[i * 3] - ptPos[j * 3];
          const dy = ptPos[i * 3 + 1] - ptPos[j * 3 + 1];
          const d2 = dx * dx + dy * dy;
          if (d2 < D2) {
            const alpha = (1 - Math.sqrt(d2) / MAX_DIST) * 0.45;
            const o = n * 6;
            lnPos[o]     = ptPos[i * 3];     lnPos[o + 1] = ptPos[i * 3 + 1]; lnPos[o + 2] = 0;
            lnPos[o + 3] = ptPos[j * 3];     lnPos[o + 4] = ptPos[j * 3 + 1]; lnPos[o + 5] = 0;
            lnCol[o]     = PR * alpha; lnCol[o + 1] = PG * alpha; lnCol[o + 2] = PB * alpha;
            lnCol[o + 3] = PR * alpha; lnCol[o + 4] = PG * alpha; lnCol[o + 5] = PB * alpha;
            n++;
          }
        }
      }
      lnGeo.setDrawRange(0, n * 2);
      lnGeo.attributes.position.needsUpdate = true;
      lnGeo.attributes.color.needsUpdate    = true;

      renderer.render(scene, camera);
    };

    tick();

    // ── Resize ─────────────────────────────────────────────────────────────────
    const onResize = () => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      renderer.setSize(W, H);
      camera.right = W;
      camera.top   = H;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ptGeo.dispose();
      lnGeo.dispose();
      ptMat.dispose();
      lnMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}
