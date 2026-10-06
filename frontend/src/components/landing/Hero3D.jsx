import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import NavigationHUD from './NavigationHUD';
import { ArrowDown, Play, RotateCcw, Sparkles } from 'lucide-react';

export default function Hero3D({ onExploreClick, onLaunchPrototype }) {
  const mountRef = useRef(null);
  const [phase, setPhase] = useState('NORMAL'); // NORMAL, DEGRADED, BRANCHING, DECISION
  const [autoPlay, setAutoPlay] = useState(true);

  // Cycle through simulation phases automatically
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setPhase((prev) => {
        if (prev === 'NORMAL') return 'DEGRADED';
        if (prev === 'DEGRADED') return 'BRANCHING';
        if (prev === 'BRANCHING') return 'DECISION';
        return 'NORMAL';
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [autoPlay]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 18, 38);
    camera.lookAt(0, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060911, 1);
    container.appendChild(renderer.domElement);

    // Coordinate Grid
    const grid = new THREE.GridHelper(120, 60, 0x1e293b, 0x0f172a);
    grid.position.y = -0.5;
    scene.add(grid);

    // Satellites in upper orbit
    const satPositions = [
      new THREE.Vector3(-25, 30, -15),
      new THREE.Vector3(20, 32, -20),
      new THREE.Vector3(-15, 28, 25),
      new THREE.Vector3(25, 34, 15),
    ];

    const satGroup = new THREE.Group();
    const satMeshes = [];
    satPositions.forEach((pos) => {
      const satGeo = new THREE.OctahedronGeometry(0.8);
      const satMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.copy(pos);
      satGroup.add(satMesh);
      satMeshes.push(satMesh);
    });
    scene.add(satGroup);

    // Signal ray lines from satellites to vehicle
    const signalLines = [];
    satPositions.forEach((pos) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, new THREE.Vector3(0, 0, 0)]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      signalLines.push(line);
    });

    // Nominal Trajectory Curve
    const nominalPoints = [];
    for (let i = -30; i <= 0; i += 1) {
      nominalPoints.push(new THREE.Vector3(Math.sin(i * 0.1) * 3, 0, i));
    }
    const nominalGeo = new THREE.BufferGeometry().setFromPoints(nominalPoints);
    const nominalMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    const nominalLine = new THREE.Line(nominalGeo, nominalMat);
    scene.add(nominalLine);

    // 3 Future Branches from origin (0, 0, 0)
    // 1. HYBRID (Green, resilient, stays true)
    const hybridPoints = [];
    for (let i = 0; i <= 35; i += 1) {
      hybridPoints.push(new THREE.Vector3(Math.sin(i * 0.08) * 2.5, 0, i));
    }
    const hybridGeo = new THREE.BufferGeometry().setFromPoints(hybridPoints);
    const hybridMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
    const hybridLine = new THREE.Line(hybridGeo, hybridMat);
    scene.add(hybridLine);

    // 2. GNSS Branch (Cyan, erratic deviation during degradation)
    const gnssPoints = [];
    for (let i = 0; i <= 35; i += 1) {
      const err = (i / 10) * (Math.sin(i * 0.6) * 2.5);
      gnssPoints.push(new THREE.Vector3(Math.sin(i * 0.08) * 2.5 + err, 0, i));
    }
    const gnssGeo = new THREE.BufferGeometry().setFromPoints(gnssPoints);
    const gnssMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const gnssLine = new THREE.Line(gnssGeo, gnssMat);
    scene.add(gnssLine);

    // 3. DR Branch (Amber, quadratic drift outwards)
    const drPoints = [];
    for (let i = 0; i <= 35; i += 1) {
      const drift = -0.015 * i * i;
      drPoints.push(new THREE.Vector3(Math.sin(i * 0.08) * 2.5 + drift, 0, i));
    }
    const drGeo = new THREE.BufferGeometry().setFromPoints(drPoints);
    const drMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
    const drLine = new THREE.Line(drGeo, drMat);
    scene.add(drLine);

    // Stylized Vehicle Marker (Arrow/Pyramid at vehicle position)
    const vehGeo = new THREE.ConeGeometry(0.8, 2.2, 4);
    vehGeo.rotateX(Math.PI / 2);
    const vehMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const vehicle = new THREE.Mesh(vehGeo, vehMat);
    vehicle.position.set(0, 0.4, 0);
    scene.add(vehicle);

    // Sensor Particles flowing along path
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 1] = Math.random() * 2;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate satellites subtly
      satGroup.rotation.y = elapsed * 0.05;

      // Update signal lines to track satellite rotation
      satMeshes.forEach((mesh, idx) => {
        const vPos = vehicle.position;
        const line = signalLines[idx];
        const linePos = line.geometry.attributes.position;
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        linePos.setXYZ(0, worldPos.x, worldPos.y, worldPos.z);
        linePos.setXYZ(1, vPos.x, vPos.y, vPos.z);
        linePos.needsUpdate = true;
      });

      // Move sensor particles forward
      const pAttr = particles.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        pAttr.array[i * 3 + 2] += 0.2;
        if (pAttr.array[i * 3 + 2] > 35) {
          pAttr.array[i * 3 + 2] = -30;
        }
      }
      pAttr.needsUpdate = true;

      // Dynamic phase updates based on current state
      if (phase === 'NORMAL') {
        signalLines.forEach((l) => {
          l.material.color.setHex(0x38bdf8);
          l.material.opacity = 0.5;
        });
        gnssMat.opacity = 0.9;
        hybridMat.opacity = 0.3;
        drMat.opacity = 0.3;
        vehicle.material.color.setHex(0x38bdf8);
      } else if (phase === 'DEGRADED') {
        signalLines.forEach((l) => {
          l.material.color.setHex(0xf59e0b);
          l.material.opacity = 0.25 + Math.sin(elapsed * 12) * 0.15; // flicker
        });
        gnssMat.opacity = 0.6;
        hybridMat.opacity = 0.6;
        drMat.opacity = 0.6;
        vehicle.material.color.setHex(0xf59e0b);
      } else if (phase === 'BRANCHING') {
        signalLines.forEach((l) => {
          l.material.color.setHex(0xef4444);
          l.material.opacity = 0.08;
        });
        // Highlight all three candidate branches
        gnssMat.opacity = 0.85;
        hybridMat.opacity = 0.85;
        drMat.opacity = 0.85;
        vehicle.material.color.setHex(0xef4444);
      } else if (phase === 'DECISION') {
        signalLines.forEach((l) => {
          l.material.color.setHex(0x64748b);
          l.material.opacity = 0.05;
        });
        // Emphasize the chosen HYBRID candidate
        hybridMat.opacity = 1.0;
        gnssMat.opacity = 0.15;
        drMat.opacity = 0.15;
        vehicle.material.color.setHex(0x10b981);
      }

      // Gentle camera sway
      camera.position.x = Math.sin(elapsed * 0.15) * 3;
      camera.lookAt(0, 2, 5);

      renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [phase]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Atmospheric Vignette & Contrast Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#060911] via-transparent to-[#060911]/80 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#060911]/90 via-transparent to-[#060911]/90 pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-12">
        {/* Left: Typography & Value Proposition */}
        <div className="max-w-2xl flex flex-col gap-6 text-left">
          {/* Scientific Credibility Ticker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono tracking-wider text-slate-400 w-fit backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>GNSS • IMU • DEAD RECKONING • SENSOR FUSION • FORECASTING</span>
          </div>

          {/* Main Branding with Official Project Logo */}
          <div className="flex flex-col gap-3">
            <img
              src="/vyra-logo.png"
              alt="VYRA Logo"
              className="h-24 sm:h-32 w-auto object-contain filter drop-shadow-2xl self-start"
            />
            <p className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight">
              Forecast the failure. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                Choose the safer navigation mode.
              </span>
            </p>
          </div>

          {/* Core Technical Statement */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-normal">
            VYRA predicts how <strong className="text-slate-200 font-semibold">GNSS</strong>,{' '}
            <strong className="text-slate-200 font-semibold">HYBRID</strong>, and{' '}
            <strong className="text-slate-200 font-semibold">dead reckoning</strong> are likely to behave
            over the near future (3.0s lookahead horizon), then selects the navigation mode with the lowest
            predicted risk before degradation breaches safety limits.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onLaunchPrototype}
              className="px-6 py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH LIVE PROTOTYPE</span>
            </button>

            <button
              onClick={onExploreClick}
              className="px-6 py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-2"
            >
              <span>EXPLORE VYRA</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* 3D Phase Stepper Controls */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80 text-xs font-mono">
            <span className="text-slate-500 text-[10px] uppercase">Sim Evolution:</span>
            {['NORMAL', 'DEGRADED', 'BRANCHING', 'DECISION'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPhase(p);
                  setAutoPlay(false);
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  phase === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
            {!autoPlay && (
              <button
                onClick={() => setAutoPlay(true)}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 ml-2"
                title="Resume auto simulation"
              >
                <RotateCcw className="w-3 h-3" /> Auto
              </button>
            )}
          </div>
        </div>

        {/* Right: Floating Navigation HUD Overlay */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <NavigationHUD phase={phase} />
        </div>
      </div>

      {/* Subtle Scroll Down Prompt */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-slate-500 text-[10px] font-mono uppercase tracking-widest pointer-events-none">
        <span>Scroll to Discover</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </section>
  );
}
