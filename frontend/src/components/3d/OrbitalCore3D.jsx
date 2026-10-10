import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Checks if WebGL is supported by the client browser.
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export default function OrbitalCore3D({
  activeDomain = null,
  interactive = true,
  height = '520px',
}) {
  const containerRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    if (!isWebGLAvailable()) {
      setWebGLSupported(false);
    }

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!webGLSupported || reducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 500;
    let heightPx = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Central Intelligence Core (Icosahedron + Wireframe shell)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner glowing sphere
    const innerGeom = new THREE.SphereGeometry(2.2, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7ff,
      transparent: true,
      opacity: 0.85,
    });
    const innerCore = new THREE.Mesh(innerGeom, innerMat);
    coreGroup.add(innerCore);

    // Core halo glow sphere
    const glowGeom = new THREE.SphereGeometry(2.7, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8b7cff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    coreGroup.add(glowMesh);

    // Faceted geometric energy shell
    const shellGeom = new THREE.IcosahedronGeometry(3.2, 1);
    const shellWire = new THREE.WireframeGeometry(shellGeom);
    const shellMat = new THREE.LineBasicMaterial({
      color: 0x6ee7ff,
      transparent: true,
      opacity: 0.35,
    });
    const shellLine = new THREE.LineSegments(shellWire, shellMat);
    coreGroup.add(shellLine);

    // 3. Orbital Rings
    const ringConfigs = [
      { radius: 4.8, tiltX: 0.45, tiltY: 0.2, color: 0x6ee7ff, speed: 0.007 },
      { radius: 6.2, tiltX: -0.5, tiltY: 0.6, color: 0x8b7cff, speed: -0.005 },
      { radius: 7.6, tiltX: 0.8, tiltY: -0.3, color: 0x43e6a3, speed: 0.004 },
      { radius: 9.0, tiltX: -0.2, tiltY: -0.7, color: 0x6ee7ff, speed: -0.003 },
    ];

    const rings = [];
    ringConfigs.forEach((cfg) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.x = cfg.tiltX;
      ringGroup.rotation.y = cfg.tiltY;

      // Ring path
      const ringGeom = new THREE.BufferGeometry();
      const points = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * cfg.radius, 0, Math.sin(theta) * cfg.radius));
      }
      ringGeom.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.3,
      });
      const ringMesh = new THREE.Line(ringGeom, ringMat);
      ringGroup.add(ringMesh);

      // Orbiting Intelligence Node
      const nodeGeom = new THREE.SphereGeometry(0.24, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeMesh.position.x = cfg.radius;
      ringGroup.add(nodeMesh);

      scene.add(ringGroup);
      rings.push({ group: ringGroup, node: nodeMesh, radius: cfg.radius, speed: cfg.speed, angle: Math.random() * Math.PI * 2 });
    });

    // 4. Evidence Cloud (Floating data particles)
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.5 + Math.random() * 6.5;

      particlePositions[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = r * Math.cos(phi);
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x6ee7ff,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 5. Mouse Parallax Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 6. Scroll interaction
    let scrollOffset = 0;
    const handleScroll = () => {
      scrollOffset = window.scrollY || 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 7. Visibility Observer (Pause when off-screen)
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    // 8. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Core rotation & subtle pulse
      coreGroup.rotation.y = elapsedTime * 0.18;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;
      shellLine.rotation.y = -elapsedTime * 0.22;

      const pulseScale = 1.0 + Math.sin(elapsedTime * 2.2) * 0.04;
      innerCore.scale.set(pulseScale, pulseScale, pulseScale);

      // Rotate orbital rings & move nodes
      rings.forEach((r) => {
        r.angle += r.speed;
        r.node.position.x = Math.cos(r.angle) * r.radius;
        r.node.position.z = Math.sin(r.angle) * r.radius;
      });

      // Slowly rotate particle cloud
      particleSystem.rotation.y = elapsedTime * 0.04;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.03) * 0.08;

      // Mouse Parallax smooth lerp
      targetRotY += (mouseX * 0.45 - targetRotY) * 0.05;
      targetRotX += (-mouseY * 0.35 - targetRotX) * 0.05;
      scene.rotation.y = targetRotY;
      scene.rotation.x = targetRotX;

      // Scroll camera zoom depth
      const scrollZ = Math.max(13, 18 - scrollOffset * 0.008);
      camera.position.z += (scrollZ - camera.position.z) * 0.1;

      // Domain highlight effect if activeDomain changed
      if (activeDomain) {
        innerMat.color.setHex(0x8b7cff);
        glowMat.color.setHex(0x6ee7ff);
      } else {
        innerMat.color.setHex(0x6ee7ff);
        glowMat.color.setHex(0x8b7cff);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      heightPx = container.clientHeight || 520;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (interactive) window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [webGLSupported, reducedMotion, activeDomain, interactive]);

  // Graceful Fallback for non-WebGL devices or users preferring reduced motion
  if (!webGLSupported || reducedMotion) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(110, 231, 255, 0.25) 0%, rgba(139, 124, 255, 0.08) 60%, transparent 75%)',
            border: '2px solid rgba(110, 231, 255, 0.4)',
            boxShadow: '0 0 50px rgba(110, 231, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: '1px dashed rgba(139, 124, 255, 0.6)',
              animation: reducedMotion ? 'none' : 'spin 20s linear infinite',
            }}
          />
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6EE7FF, #8B7CFF)',
              boxShadow: '0 0 30px #6EE7FF',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        position: 'relative',
        cursor: interactive ? 'grab' : 'default',
        overflow: 'hidden',
      }}
    />
  );
}
