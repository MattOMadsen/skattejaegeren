/**
 * Placeholder Three.js: falling "coin" particles (not final design).
 * Respects prefers-reduced-motion (canvas hidden via CSS).
 */
import * as THREE from 'three';

const canvas = document.getElementById('bg');
if (!canvas) throw new Error('missing #bg');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
  // CSS hides canvas; nothing to run
} else {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0b0d10, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 12;

  const count = 180;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = Math.random() * 14 - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    speeds[i] = 0.015 + Math.random() * 0.04;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xc9a227,
    size: 0.12,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Subtle red “drain” glow at bottom
  const drainGeo = new THREE.CircleGeometry(3.2, 48);
  const drainMat = new THREE.MeshBasicMaterial({
    color: 0xc43c2c,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  });
  const drain = new THREE.Mesh(drainGeo, drainMat);
  drain.rotation.x = -Math.PI / 2.2;
  drain.position.set(0, -5.5, 0);
  scene.add(drain);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const pos = geo.attributes.position.array;
  let t = 0;

  function frame() {
    t += 0.016;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speeds[i];
      pos[i * 3] += Math.sin(t + phases[i]) * 0.004;
      if (pos[i * 3 + 1] < -6) {
        pos[i * 3 + 1] = 7 + Math.random() * 3;
        pos[i * 3] = (Math.random() - 0.5) * 18;
      }
    }
    geo.attributes.position.needsUpdate = true;
    drain.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
