/* ============================================
   Three.js — Cinematic Particle Background
   Floating particles with subtle neural connections
   Responds to dark/light theme changes
   ============================================ */

function initThreeBackground() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 300;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* --- Theme-aware colors --- */
  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  /* Medium brightness: balanced for professional look */
  function getParticleColor() { return isDark() ? 0xffffff : 0x000000; }
  function getParticleOpacity() { return isDark() ? 0.35 : 0.18; }
  function getParticleSize() { return isDark() ? 2.2 : 1.8; }
  function getLineColor() { return isDark() ? 0xffffff : 0x000000; }
  function getLineOpacity() { return isDark() ? 0.12 : 0.06; }

  /* --- Particles --- */
  const PARTICLE_COUNT = 700;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];
  const spread = 500;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
    velocities.push({
      x: (Math.random() - 0.5) * 0.16,
      y: (Math.random() - 0.5) * 0.16,
      z: (Math.random() - 0.5) * 0.05
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: getParticleColor(),
    size: getParticleSize(),
    transparent: true,
    opacity: getParticleOpacity(),
    sizeAttenuation: true
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  /* --- Connection Lines --- */
  const MAX_LINE_VERTS = 2000 * 6; 
  const linePositions = new Float32Array(MAX_LINE_VERTS);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: getLineColor(),
    transparent: true,
    opacity: getLineOpacity()
  });

  const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineSegments);

  /* --- Theme change listener --- */
  window.addEventListener('themechange', () => {
    particleMaterial.color.setHex(getParticleColor());
    particleMaterial.opacity = getParticleOpacity();
    particleMaterial.size = getParticleSize();
    particleMaterial.needsUpdate = true;
    lineMaterial.color.setHex(getLineColor());
    lineMaterial.opacity = getLineOpacity();
    lineMaterial.needsUpdate = true;
  });

  /* --- Mouse interaction --- */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
  });

  /* --- Resize --- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* --- Animation Loop --- */
  const CONNECTION_DISTANCE = 90;
  const MAX_CONNECTIONS = 350;

  function animate() {
    requestAnimationFrame(animate);
    const pos = particleGeometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;
      const halfSpread = spread / 2;
      if (Math.abs(pos[i * 3])     > halfSpread) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > halfSpread) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > halfSpread * 0.5) velocities[i].z *= -1;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    let lineIndex = 0, connectionCount = 0;
    const lPos = lineSegments.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; i += 2) {
      for (let j = i + 2; j < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; j += 2) {
        const dx = pos[i*3] - pos[j*3], dy = pos[i*3+1] - pos[j*3+1], dz = pos[i*3+2] - pos[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < CONNECTION_DISTANCE) {
          lPos[lineIndex++] = pos[i*3]; lPos[lineIndex++] = pos[i*3+1]; lPos[lineIndex++] = pos[i*3+2];
          lPos[lineIndex++] = pos[j*3]; lPos[lineIndex++] = pos[j*3+1]; lPos[lineIndex++] = pos[j*3+2];
          connectionCount++;
        }
      }
    }
    for (let i = lineIndex; i < lPos.length; i++) lPos[i] = 0;

    lineSegments.geometry.attributes.position.needsUpdate = true;
    lineSegments.geometry.setDrawRange(0, connectionCount * 2);

    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', initThreeBackground);
