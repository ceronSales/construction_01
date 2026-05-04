/**
 * WHAT: HeroSection — scroll-driven 3D house assembly (Three.js).
 * HOW:  Full 3D architectural house built from BufferGeometry shapes.
 *       Each construction stage drops parts in from above with smooth lerp.
 *       Camera orbits around the house as user scrolls — 360° perspective.
 *       Pitched roof, overhangs, chimney, porch columns, garage — real depth.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "../css/HeroSection.css";

/* ── Stage metadata ── */
const STAGES = [
  { id:0, num:"01", label:"Site & Foundation",   description:"Excavation complete. Reinforced concrete footings poured into bedrock." },
  { id:1, num:"02", label:"Ground Floor Slab",   description:"Ground slab cast. Plumbing conduits and waterproof membrane embedded." },
  { id:2, num:"03", label:"Ground Floor Walls",  description:"CHB walls rising floor by floor. Structural columns poured full height." },
  { id:3, num:"04", label:"Second Floor Deck",   description:"Upper slab poured. Steel rebar cage tied for second storey." },
  { id:4, num:"05", label:"Upper Floor Walls",   description:"Second floor walls complete. All opening frames fixed and level." },
  { id:5, num:"06", label:"Roof Trusses",        description:"Steel trusses erected. Ridge beam set. Roof decking nailed down." },
  { id:6, num:"07", label:"Roof Cladding",       description:"Clay tile roofing installed. Fascia, soffit and gutters fixed." },
  { id:7, num:"08", label:"Windows & Doors",     description:"Aluminum frames, sliding glass panels and solid hardwood doors set." },
  { id:8, num:"09", label:"Exterior Finishes",   description:"Render, paint, cladding and gold accent trims applied to facade." },
  { id:9, num:"10", label:"Completed Home",      description:"Fully inspected and move-in ready. Crafted by Triconix with pride.", isFinale:true },
];

/* ── Palette ── */
const C = {
  gold:      0xc9a84c,
  goldDark:  0x8a6000,
  concrete:  0x4a4540,
  slab:      0x3a3028,
  wallGF:    0x5a4e40,
  wallUF:    0x4a3e32,
  roofFrame: 0x2a1e10,
  roofTile:  0x8b3a1a,
  roofTile2: 0x7a2e10,
  glass:     0x7ab4d4,
  doorWood:  0x3a1e08,
  trim:      0xc9a84c,
  render:    0xd4c4a0,
  dark:      0x1a1008,
  chimney:   0x5a3020,
  garage:    0x3a2e22,
};

/* ────────────────────────────────────────────────────────────────
   createMat — shorthand MeshStandardMaterial factory
   ──────────────────────────────────────────────────────────────── */
function createMat(color, rough = 0.82, metal = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

/* ────────────────────────────────────────────────────────────────
   addBox — creates a BoxGeometry mesh, registers it as a build part.
   Starts at y = startBelow so it animates UP into targetY on reveal.
   ──────────────────────────────────────────────────────────────── */
function addBox(scene, parts, w, h, d, x, targetY, z, mat, stage) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, -25, z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  parts.push({ mesh, targetY, stage });
  return mesh;
}

/* ────────────────────────────────────────────────────────────────
   buildPitchedRoofHalf — creates one sloped roof panel using a
   custom prism geometry (triangular cross-section extruded along Z).
   HOW: Builds vertices for a right-triangle prism, then maps faces.
   ──────────────────────────────────────────────────────────────── */
function buildRoofPanel(scene, parts, stage, xOffset, rotY, rise, run, depth, posY, posZ) {
  // Prism: base=run, height=rise, depth=depth
  const hw = run / 2;
  const verts = new Float32Array([
    // front face (z = +depth/2)
    -hw,   0,  depth/2,
     hw,   0,  depth/2,
      0, rise,  depth/2,
    // back face (z = -depth/2)
    -hw,   0, -depth/2,
     hw,   0, -depth/2,
      0, rise, -depth/2,
  ]);
  const idx = [
    0,1,2,  // front
    5,4,3,  // back
    0,3,4, 0,4,1,  // bottom
    1,4,5, 1,5,2,  // right slope
    2,5,3, 2,3,0,  // left slope
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, createMat(C.roofTile, 0.88));
  mesh.position.set(xOffset, -25, posZ);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  scene.add(mesh);
  parts.push({ mesh, targetY: posY, stage, rotY });
  return mesh;
}

/* ────────────────────────────────────────────────────────────────
   buildScene — constructs entire house part set.
   RETURNS: parts[] array — { mesh, targetY, stage, rotY? }
   ──────────────────────────────────────────────────────────────── */
function buildScene(scene) {
  const parts = [];
  const P = (c,r,m) => createMat(c,r,m);

  /* ── STAGE 0: Foundation footings ── */
  // Main footing strip
  addBox(scene, parts, 10.0, 0.50, 7.0, 0, -0.25, 0, P(C.concrete,0.92), 0);
  // Side footing lips
  addBox(scene, parts,  0.60, 0.60, 7.0,-5.3, -0.22, 0, P(C.concrete,0.92), 0);
  addBox(scene, parts,  0.60, 0.60, 7.0, 5.3, -0.22, 0, P(C.concrete,0.92), 0);
  addBox(scene, parts, 10.0,  0.60, 0.60, 0, -0.22, 3.8, P(C.concrete,0.92), 0);
  addBox(scene, parts, 10.0,  0.60, 0.60, 0, -0.22,-3.8, P(C.concrete,0.92), 0);

  /* ── STAGE 1: Ground slab ── */
  addBox(scene, parts,  9.6, 0.22, 6.6, 0, 0.11, 0, P(C.slab,0.88), 1);

  /* ── STAGE 2: Ground floor walls (4 sides + 2 columns) ── */
  const wm = P(C.wallGF, 0.85);
  // front wall — left panel (space for door+windows)
  addBox(scene, parts,  2.20, 1.65, 0.28,  -3.40, 1.02, 3.30, wm, 2);
  // front wall — right panel
  addBox(scene, parts,  2.20, 1.65, 0.28,   3.40, 1.02, 3.30, wm, 2);
  // front wall — top lintel strip
  addBox(scene, parts,  9.60, 0.32, 0.28,   0,    2.01, 3.30, wm, 2);
  // back wall full
  addBox(scene, parts,  9.60, 1.65, 0.28,   0,    1.02,-3.30, wm, 2);
  // left wall full
  addBox(scene, parts,  0.28, 1.65, 6.60, -4.80,  1.02, 0,    wm, 2);
  // right wall full
  addBox(scene, parts,  0.28, 1.65, 6.60,  4.80,  1.02, 0,    wm, 2);
  // Interior columns (visible through windows)
  addBox(scene, parts,  0.28, 1.65, 0.28, -1.10,  1.02, 3.30, P(C.concrete,0.8), 2);
  addBox(scene, parts,  0.28, 1.65, 0.28,  1.10,  1.02, 3.30, P(C.concrete,0.8), 2);

  /* ── STAGE 3: Second floor slab ── */
  addBox(scene, parts,  9.60, 0.22, 6.60, 0, 1.96, 0, P(C.concrete,0.88), 3);
  // Slab overhang front (porch canopy)
  addBox(scene, parts, 10.20, 0.18, 1.20, 0, 1.94, 4.20, P(C.concrete,0.85), 3);

  /* ── STAGE 4: Upper floor walls ── */
  const um = P(C.wallUF, 0.84);
  addBox(scene, parts,  2.00, 1.55, 0.26, -3.50, 2.85, 3.20, um, 4);
  addBox(scene, parts,  2.00, 1.55, 0.26,  3.50, 2.85, 3.20, um, 4);
  addBox(scene, parts,  9.60, 0.30, 0.26,  0,    3.78, 3.20, um, 4);
  addBox(scene, parts,  9.60, 1.55, 0.26,  0,    2.85,-3.20, um, 4);
  addBox(scene, parts,  0.26, 1.55, 6.60, -4.80, 2.85, 0,    um, 4);
  addBox(scene, parts,  0.26, 1.55, 6.60,  4.80, 2.85, 0,    um, 4);
  // Upper interior column
  addBox(scene, parts,  0.26, 1.55, 0.26, -1.00, 2.85, 3.20, P(C.concrete,0.8), 4);
  addBox(scene, parts,  0.26, 1.55, 0.26,  1.00, 2.85, 3.20, P(C.concrete,0.8), 4);

  /* ── STAGE 5: Roof truss frame ── */
  const rf = P(C.roofFrame, 0.92);
  // Ridge beam
  addBox(scene, parts,  9.80, 0.22, 0.22, 0, 5.30, 0, rf, 5);
  // Hip rafters front-left, front-right, back-left, back-right
  addBox(scene, parts,  0.16, 2.10, 7.40, -4.60, 4.42, 0, rf, 5);
  addBox(scene, parts,  0.16, 2.10, 7.40,  4.60, 4.42, 0, rf, 5);
  // Truss verticals
  for (let xi = -3.5; xi <= 3.5; xi += 1.75) {
    addBox(scene, parts, 0.14, 1.50, 0.14, xi, 4.50, 0, rf, 5);
  }

  /* ── STAGE 6: Roof cladding (pitched panels) ── */
  // Main pitched roof — two long slopes
  // Left slope (tilted ~30°)
  buildRoofPanel(scene, parts, 6,  0, 0, 1.60, 5.00, 7.00, 4.88,  0);
  // Actually use box panels rotated for cleaner look
  const rm = P(C.roofTile, 0.90);
  const rm2 = P(C.roofTile2, 0.92);

  // Left slope panel
  const slopeL = new THREE.Mesh(new THREE.BoxGeometry(9.80, 0.18, 5.60), rm);
  slopeL.position.set(0, -25, 0);
  slopeL.rotation.x =  0.31;
  slopeL.castShadow = true;
  scene.add(slopeL);
  parts.push({ mesh: slopeL, targetY: 4.50, stage: 6, rotX:  0.31 });

  // Right slope panel
  const slopeR = new THREE.Mesh(new THREE.BoxGeometry(9.80, 0.18, 5.60), rm2);
  slopeR.position.set(0, -25, 0);
  slopeR.rotation.x = -0.31;
  slopeR.castShadow = true;
  scene.add(slopeR);
  parts.push({ mesh: slopeR, targetY: 4.50, stage: 6, rotX: -0.31 });

  // Fascia boards — front, back, left, right
  addBox(scene, parts, 10.20, 0.22, 0.16, 0, 3.95,  3.80, P(C.trim,0.5,0.3), 6);
  addBox(scene, parts, 10.20, 0.22, 0.16, 0, 3.95, -3.80, P(C.trim,0.5,0.3), 6);
  // Gable end triangles (left/right)
  // Approximate with thin tall boxes on left/right edges
  addBox(scene, parts,  0.18, 1.62, 0.18, -4.90, 4.62, 0, P(C.roofTile,0.9), 6);
  addBox(scene, parts,  0.18, 1.62, 0.18,  4.90, 4.62, 0, P(C.roofTile,0.9), 6);

  // Chimney
  addBox(scene, parts,  0.70, 2.20, 0.70, 2.80, 5.10, -1.50, P(C.chimney,0.93), 6);
  addBox(scene, parts,  0.84, 0.18, 0.84, 2.80, 6.22, -1.50, P(C.concrete,0.8), 6);

  /* ── STAGE 7: Windows & doors ── */
  const gm = P(C.glass, 0.05, 0.85);
  const fm = P(C.trim, 0.3, 0.6);   // gold frame
  const dm = P(C.doorWood, 0.65);

  // Ground floor — front left window
  addBox(scene, parts, 1.60, 1.05, 0.08, -3.40, 1.00, 3.35, gm, 7);
  addBox(scene, parts, 1.74, 1.18, 0.06, -3.40, 1.00, 3.36, fm, 7); // frame
  // Ground floor — front right window
  addBox(scene, parts, 1.60, 1.05, 0.08,  3.40, 1.00, 3.35, gm, 7);
  addBox(scene, parts, 1.74, 1.18, 0.06,  3.40, 1.00, 3.36, fm, 7);
  // Front door (centre)
  addBox(scene, parts, 1.10, 1.50, 0.10,  0,    0.90, 3.35, dm, 7);
  addBox(scene, parts, 1.24, 1.64, 0.06,  0,    0.90, 3.36, fm, 7);
  // Upper floor windows
  addBox(scene, parts, 1.40, 0.95, 0.08, -3.50, 2.85, 3.26, gm, 7);
  addBox(scene, parts, 1.54, 1.08, 0.06, -3.50, 2.85, 3.27, fm, 7);
  addBox(scene, parts, 1.40, 0.95, 0.08,  3.50, 2.85, 3.26, gm, 7);
  addBox(scene, parts, 1.54, 1.08, 0.06,  3.50, 2.85, 3.27, fm, 7);
  // Side windows (left wall)
  addBox(scene, parts, 0.08, 0.90, 1.20, -4.85, 1.00,  1.50, gm, 7);
  addBox(scene, parts, 0.08, 0.90, 1.20, -4.85, 1.00, -1.50, gm, 7);

  /* ── STAGE 8: Exterior finishes ── */
  // Rendered facade panels (thin overlay on front)
  const ren = P(C.render, 0.88);
  addBox(scene, parts, 2.18, 1.60, 0.04, -3.40, 1.02, 3.34, ren, 8);
  addBox(scene, parts, 2.18, 1.60, 0.04,  3.40, 1.02, 3.34, ren, 8);
  addBox(scene, parts, 2.00, 1.50, 0.04, -3.50, 2.85, 3.23, ren, 8);
  addBox(scene, parts, 2.00, 1.50, 0.04,  3.50, 2.85, 3.23, ren, 8);

  // Gold trim horizontal lines
  addBox(scene, parts, 9.62, 0.08, 0.12, 0, 1.97, 3.32, P(C.gold,0.3,0.7), 8);
  addBox(scene, parts, 9.62, 0.08, 0.12, 0, 3.93, 3.32, P(C.gold,0.3,0.7), 8);
  addBox(scene, parts, 9.62, 0.08, 0.12, 0, 0.06, 3.32, P(C.gold,0.3,0.7), 8);

  // Porch columns (front)
  addBox(scene, parts, 0.22, 2.00, 0.22, -1.90, 1.12, 3.90, P(C.render,0.7), 8);
  addBox(scene, parts, 0.22, 2.00, 0.22,  1.90, 1.12, 3.90, P(C.render,0.7), 8);
  // Column caps
  addBox(scene, parts, 0.34, 0.12, 0.34, -1.90, 2.18, 3.90, P(C.gold,0.3,0.6), 8);
  addBox(scene, parts, 0.34, 0.12, 0.34,  1.90, 2.18, 3.90, P(C.gold,0.3,0.6), 8);

  /* ── STAGE 9: Landscaping (finale) ── */
  // Lawn
  addBox(scene, parts, 18, 0.10, 14, 0, -0.48, 0, P(0x1a2a10, 0.98), 9);
  // Driveway path
  addBox(scene, parts, 1.8, 0.06, 6.0, 0, -0.44, 6.0, P(0x2a2418, 0.92), 9);
  // Left hedge
  addBox(scene, parts, 0.60, 0.80, 5.50, -6.0, 0.00, 0, P(0x1a3210,0.98), 9);
  addBox(scene, parts, 0.60, 0.80, 5.50,  6.0, 0.00, 0, P(0x1a3210,0.98), 9);
  // Stepping stones
  for (let si = 0; si < 4; si++) {
    addBox(scene, parts, 0.5, 0.06, 0.5, 0, -0.44, 4.2 + si * 1.1, P(0x3a3028,0.9), 9);
  }

  return parts;
}

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * WHAT: HeroSection — mounts Three.js scene and wires scroll-to-3D-build.
 * HOW:  useEffect creates renderer, scene, camera, lights, house parts array.
 *       rAF loop lerps scroll progress → stage activation → Y animation.
 *       Camera orbits 180° around house from right-side to front-left.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const mountRef    = useRef(null);
  const wrapperRef  = useRef(null);
  const scrollRef   = useRef({ progress: 0, target: 0 });
  const frameRef    = useRef(null);
  const prevStage   = useRef(0);

  const [uiStage,    setUiStage]    = useState(0);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace    = THREE.SRGBColorSpace;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06050a);
    scene.fog        = new THREE.FogExp2(0x06050a, 0.038);

    /* ── Camera — positioned for strong 3/4 view ── */
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(14, 8, 16);
    camera.lookAt(0, 2, 0);

    /* ── Lights ── */
    // Sky ambient
    scene.add(new THREE.AmbientLight(0x251c10, 1.8));

    // Primary sun — warm gold, top-left, casts shadows
    const sun = new THREE.DirectionalLight(0xffe8a0, 4.5);
    sun.position.set(-8, 14, 10);
    sun.castShadow              = true;
    sun.shadow.mapSize.width    = 4096;
    sun.shadow.mapSize.height   = 4096;
    sun.shadow.camera.left      = -16;
    sun.shadow.camera.right     = 16;
    sun.shadow.camera.top       = 16;
    sun.shadow.camera.bottom    = -16;
    sun.shadow.camera.far       = 50;
    sun.shadow.bias             = -0.0008;
    scene.add(sun);

    // Cool blue fill — opposite side
    const fill = new THREE.DirectionalLight(0x4060a0, 1.2);
    fill.position.set(10, 6, -8);
    scene.add(fill);

    // Gold rim back-light
    const rim = new THREE.PointLight(0xc9a84c, 3.5, 25);
    rim.position.set(-6, 8, -7);
    scene.add(rim);

    // Ground bounce — warm low light
    const bounce = new THREE.PointLight(0xd08030, 1.2, 15);
    bounce.position.set(2, -0.5, 5);
    scene.add(bounce);

    /* ── Shadow catcher ground plane ── */
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    gnd.rotation.x    = -Math.PI / 2;
    gnd.position.y    = -0.5;
    gnd.receiveShadow = true;
    scene.add(gnd);

    /* ── Construction dust particles ── */
    const pCount = 500;
    const pPos   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i*3]   = (Math.random()-0.5) * 28;
      pPos[i*3+1] = (Math.random()-0.5) * 18;
      pPos[i*3+2] = (Math.random()-0.5) * 20;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat      = new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.05, transparent: true, opacity: 0.25 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── Build house ── */
    const parts = buildScene(scene);

    /* ── Resize ── */
    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    /* ── Scroll ── */
    function onScroll() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect  = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      scrollRef.current.target = Math.min(Math.max(-rect.top, 0) / total, 1);
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── Animation loop ── */
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const sc = scrollRef.current;

      // Smooth scroll inertia
      sc.progress += (sc.target - sc.progress) * 0.06;

      const total  = STAGES.length;
      const raw    = sc.progress * total;
      const si     = Math.min(Math.floor(raw), total - 1);
      const sub    = raw - Math.floor(raw);

      // Update UI on stage change
      if (si !== prevStage.current) {
        prevStage.current = si;
        setUiStage(si);
        setContentKey(k => k + 1);
      }

      // Animate each part — lerp Y toward target when stage reached
      parts.forEach(part => {
        const active = si > part.stage || (si === part.stage && sub > 0.12);
        const goalY  = active ? part.targetY : -25;
        part.mesh.position.y = lerp(part.mesh.position.y, goalY, 0.068);
        // Preserve stored rotations
        if (part.rotX !== undefined) part.mesh.rotation.x = part.rotX;
        if (part.rotY !== undefined) part.mesh.rotation.y = part.rotY;
      });

      // Camera orbit — sweeps from right-3/4 view to front-left as scroll progresses
      const angle   = lerp(0.82, -0.55, sc.progress);
      const radius  = lerp(22, 16, sc.progress);
      const height  = lerp(8.5, 5.0, sc.progress);
      const lookY   = lerp(1.5, 3.0, sc.progress);
      camera.position.set(
        Math.sin(angle) * radius,
        height,
        Math.cos(angle) * radius
      );
      camera.lookAt(0, lookY, 0);

      // Particle drift
      particles.rotation.y += 0.00035;

      // Rim pulse
      rim.intensity = 3.5 + Math.sin(Date.now() * 0.0009) * 0.5;

      renderer.render(scene, camera);
    }
    animate();

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      parts.forEach(p => {
        p.mesh.geometry.dispose();
        const m = p.mesh.material;
        Array.isArray(m) ? m.forEach(x => x.dispose()) : m.dispose();
      });
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const stage = STAGES[uiStage];

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── Three.js WebGL canvas ── */}
        <div className="heroCanvas" ref={mountRef} />

        {/* ── Subtle gold corner vignette ── */}
        <div className="heroTint" />

        {/* ── Large watermark stage number ── */}
        {!stage.isFinale && (
          <div className="heroStageNumber">{stage.num}</div>
        )}

        {/* ── Stage text ── */}
        {!stage.isFinale && (
          <div className="heroContent">
            <div className="heroContentInner" key={contentKey}>
              <div className="heroStageBadge">
                <span className="heroStageBadgeDot" />
                Construction Sequence
              </div>
              <h2 className="heroStageLabel">
                <span className="heroStageLabelNum">{stage.num} —</span> {stage.label}
              </h2>
              <p className="heroStageDesc">{stage.description}</p>
              <div className="heroProgressRow">
                <div className="heroProgressDots">
                  {STAGES.map((s, i) => (
                    <span key={s.id} className={`heroDot ${
                      i === uiStage ? "heroDotActive" : i < uiStage ? "heroDotDone" : ""
                    }`} />
                  ))}
                </div>
                <span className="heroProgressCount">{uiStage + 1} / {STAGES.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Right vertical label ── */}
        {!stage.isFinale && (
          <div className="heroSideLabel">
            <div className="heroSideLine" />
            <span className="heroSideText">Triconix Build Process</span>
          </div>
        )}

        {/* ── Scroll prompt — stage 0 only ── */}
        {uiStage === 0 && (
          <div className="heroScrollPrompt">
            <span className="heroScrollText">Scroll to build</span>
            <div className="heroScrollMouse"><div className="heroScrollWheel" /></div>
          </div>
        )}

        {/* ── Finale CTA ── */}
        {stage.isFinale && (
          <div className="heroFinaleTagline">
            <p className="heroFinaleEyebrow">Triconix Construction Corporation</p>
            <h1 className="heroFinaleTitle">Crafting Dreams,</h1>
            <h1 className="heroFinaleTitleGold">Building Homes</h1>
            <div className="heroFinaleBtns">
              <a href="#projects" className="heroFinaleBtn heroFinaleBtnPrimary">View Our Projects</a>
              <a href="#contact"  className="heroFinaleBtn heroFinaleBtnSecondary">Book a Consultation</a>
            </div>
          </div>
        )}

        {/* ── Bottom gold progress bar ── */}
        <div className="heroProgressBar">
          <div className="heroProgressFill"
            style={{ width: `${(uiStage / (STAGES.length - 1)) * 100}%` }} />
        </div>

      </div>
    </div>
  );
}

export default HeroSection;