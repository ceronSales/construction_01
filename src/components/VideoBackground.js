/**
 * WHAT: VideoBackground — scroll-driven frame animation using Three.js.
 * HOW:  Creates a WebGLRenderer with an OrthographicCamera and a single fullscreen
 *       PlaneGeometry quad. All 60 JPG frames are preloaded as THREE.Texture objects.
 *       The rAF loop reads scrollRef.current.progress (0–1) → maps to frameIndex →
 *       swaps mesh.material.map. Plays forward scrolling down, reverses scrolling up.
 *       A CanvasTexture gradient overlay mesh sits in front for text legibility.
 * CALLED BY: HeroSection.js
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ── Frame count must match files in /public/frames/ ── */
const FRAME_COUNT = 60;

/* ── URL array — served from /public/frames/f001.jpg … f060.jpg ── */
const FRAME_URLS = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return `${process.env.PUBLIC_URL}/frames/f${n}.jpg`;
});

/**
 * WHAT: VideoBackground — Three.js texture-swap scroll player.
 * HOW:  mountRef points to a positioned <div> in HeroSection. This hook creates
 *       a renderer inside that div. Loads all frames as textures. rAF swaps
 *       textures based on scroll progress. Cleans up on unmount.
 * CALLED BY: HeroSection.js (via ref)
 */
function VideoBackground({ mountRef, scrollRef }) {
  const rendererRef = useRef(null);
  const rafRef      = useRef(null);
  const texturesRef = useRef([]);
  const meshRef     = useRef(null);
  const prevIdx     = useRef(-1);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(1); // keep at 1 — we're just blitting images
    renderer.setSize(W, H);
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── Orthographic scene — -1 to 1 maps exactly to screen ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;

    /* ── Fullscreen video-frame quad ── */
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x080604 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    meshRef.current = mesh;

    /* ── Gradient overlay quad — dark top/bottom for legibility ── */
    const oc  = document.createElement("canvas");
    oc.width  = 1;
    oc.height = 256;
    const octx = oc.getContext("2d");
    const g    = octx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0,    "rgba(0,0,0,0.55)");  // dark top
    g.addColorStop(0.25, "rgba(0,0,0,0.10)");  // clear middle
    g.addColorStop(0.75, "rgba(0,0,0,0.05)");  // clear middle
    g.addColorStop(1,    "rgba(0,0,0,0.60)");  // dark bottom
    octx.fillStyle = g;
    octx.fillRect(0, 0, 1, 256);
    const overlayTex  = new THREE.CanvasTexture(oc);
    const overlayMat  = new THREE.MeshBasicMaterial({
      map: overlayTex, transparent: true, depthTest: false,
    });
    const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMat);
    overlayMesh.position.z = 0.1;
    scene.add(overlayMesh);

    /* ── Preload all frames — frame 0 first, rest in background ── */
    const textures = new Array(FRAME_COUNT).fill(null);
    texturesRef.current = textures;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    function loadFrame(idx) {
      loader.load(
        FRAME_URLS[idx],
        (tex) => {
          tex.minFilter      = THREE.LinearFilter;
          tex.magFilter      = THREE.LinearFilter;
          tex.generateMipmaps = false;
          // Correct UV to cover-fit 16:9 video onto any viewport aspect
          const vAspect = 1280 / 720;
          const cAspect = W / H;
          if (cAspect > vAspect) {
            // Canvas wider — fit width, crop top/bottom
            const s = cAspect / vAspect;
            tex.repeat.set(1, 1 / s);
            tex.offset.set(0, (1 - 1 / s) / 2);
          } else {
            // Canvas taller — fit height, crop sides
            const s = vAspect / cAspect;
            tex.repeat.set(1 / s, 1);
            tex.offset.set((1 - 1 / s) / 2, 0);
          }
          textures[idx] = tex;
          // Show frame 0 as soon as it lands
          if (idx === 0) {
            mesh.material.map        = tex;
            mesh.material.needsUpdate = true;
          }
        },
        undefined,
        (err) => console.error("Frame load error:", FRAME_URLS[idx], err)
      );
    }

    // Load frame 0 immediately, stagger the rest to not block the thread
    loadFrame(0);
    for (let i = 1; i < FRAME_COUNT; i++) {
      const fi = i;
      setTimeout(() => loadFrame(fi), fi * 8); // 8ms stagger = all loaded in ~480ms
    }

    /* ── Resize ── */
    function onResize() {
      const nW = container.clientWidth;
      const nH = container.clientHeight;
      renderer.setSize(nW, nH);
    }
    window.addEventListener("resize", onResize);

    /* ── rAF render loop ── */
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const progress = scrollRef.current.progress;
      const idx      = Math.min(
        Math.round(progress * (FRAME_COUNT - 1)),
        FRAME_COUNT - 1
      );
      if (idx !== prevIdx.current && textures[idx]) {
        mesh.material.map         = textures[idx];
        mesh.material.needsUpdate = true;
        prevIdx.current           = idx;
      }
      renderer.render(scene, camera);
    }
    animate();

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      textures.forEach(t => t && t.dispose());
      overlayTex.dispose();
      geo.dispose();
      mat.dispose();
      overlayMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mountRef, scrollRef]);

  // Renders nothing to React DOM — all output is the canvas appended imperatively
  return null;
}

export default VideoBackground;
// rebuilt Mon May  4 08:29:02 UTC 2026