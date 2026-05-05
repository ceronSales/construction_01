/**
 * WHAT: Hero section — Apple-style canvas frame scrubber.
 * HOW:  All 192 JPG frames (extracted from construction-sequence.mp4 at 24fps)
 *       are preloaded as Image objects. A <canvas> fills the viewport.
 *       On every scroll event, the target frame index is computed instantly from
 *       raw scroll progress and drawn to the canvas via drawImage — zero seek lag,
 *       no keyframe jumps, frame-perfect like Apple's iPhone assembly page.
 *       Stage text updates via flushSync + GSAP stagger when frame crosses a
 *       stage boundary. Progress bar written direct to DOM — no rAF needed.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import "../css/HeroSection.css";

/* ── Frame sequence config ── */
const FRAME_COUNT   = 192;                        // total frames extracted from MP4
const FPS           = 24;                         // source video FPS
const FRAME_URL     = (n) =>                      // public/frames/f001.jpg … f192.jpg
  `${process.env.PUBLIC_URL}/frames/f${String(n).padStart(3,"0")}.jpg`;

/**
 * Stage boundaries mapped to frame numbers (24fps).
 * Verified against actual extracted frame content:
 *   f001–f048  = completed house (evening → daylight)
 *   f049–f062  = exterior near-done, garage partial
 *   f063–f072  = garage/cladding framing exposed
 *   f073–f096  = full roof trusses, walls poured
 *   f097–f120  = mid-frame construction
 *   f121–f156  = raw frame, excavator visible
 *   f157–f192  = earliest site / foundation stage
 */
const STAGES = [
  {
    id: 0, num: "01", label: "Completed Home",
    description: "Your dream home — fully finished, inspected, and ready to move in.",
    frame: 1,
  },
  {
    id: 1, num: "02", label: "Exterior Finishing",
    description: "Render, paint, landscaping and all exterior trim applied to the facade.",
    frame: 25,   // ~1.0s
  },
  {
    id: 2, num: "03", label: "Windows & Doors",
    description: "Aluminum frames, sliding glass panels and solid hardwood doors set.",
    frame: 49,   // ~2.0s
  },
  {
    id: 3, num: "04", label: "Garage & Cladding",
    description: "Garage structure framed and cladded. Facade cladding panels fixed.",
    frame: 63,   // ~2.6s
  },
  {
    id: 4, num: "05", label: "Roof Trusses",
    description: "Steel trusses erected. Ridge beam set. Roof decking nailed down.",
    frame: 73,   // ~3.0s
  },
  {
    id: 5, num: "06", label: "Wall & Frame",
    description: "CHB walls and timber frame rising. All structural openings formed.",
    frame: 97,   // ~4.0s
  },
  {
    id: 6, num: "07", label: "Structural Frame",
    description: "Steel columns, beams and structural framework erected to full height.",
    frame: 121,  // ~5.0s
  },
  {
    id: 7, num: "08", label: "Site & Foundation",
    description: "Where every great home begins — excavation and reinforced footings poured.",
    frame: 157,  // ~6.5s
    isFinale: true,
  },
];

/**
 * WHAT: HeroSection — preloads all frames, canvas drawImage on scroll.
 * HOW:  imagesRef holds 192 Image objects. onScroll computes frameIndex from
 *       raw progress, calls ctx.drawImage instantly. No rAF loop needed —
 *       the scroll event IS the animation driver.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const wrapperRef    = useRef(null);
  const canvasRef     = useRef(null);
  const imagesRef     = useRef([]);               // all 192 preloaded Image objects
  const loadedRef     = useRef(0);                // count of loaded frames
  const prevFrameRef  = useRef(1);
  const prevStageRef  = useRef(0);
  const progressFill  = useRef(null);             // direct DOM ref — no re-render
  const setIndexRef   = useRef(null);             // stable ref to setState

  const [activeIndex,  setActiveIndex]  = useState(0);
  const [contentKey,   setContentKey]   = useState(0);
  const [loadProgress, setLoadProgress] = useState(0); // 0–100 preload %

  setIndexRef.current = setActiveIndex;

  /**
   * WHAT: Draws a specific frame to the canvas, cover-fitted to viewport.
   * HOW:  Computes source crop to maintain aspect ratio, then drawImage.
   * CALLED BY: onScroll, preload completion.
   */
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    const img    = imagesRef.current[frameIndex - 1];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    const cw  = canvas.width;
    const ch  = canvas.height;
    const iw  = img.naturalWidth;
    const ih  = img.naturalHeight;

    // Cover-fit: scale image so it fills canvas, crop excess
    const scale  = Math.max(cw / iw, ch / ih);
    const sw     = cw / scale;
    const sh     = ch / scale;
    const sx     = (iw - sw) / 2;
    const sy     = (ih - sh) / 2;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }, []);

  /**
   * WHAT: GSAP stagger — animates .gsapText children into view on stage change.
   * HOW:  Kills active tweens, fromTo y:20→0 + opacity, 0.38s snappy reveal.
   * CALLED BY: onScroll when stage boundary crossed.
   */
  const animateText = useCallback(() => {
    const els = document.querySelectorAll(".heroContentInner .gsapText");
    if (!els.length) return;
    gsap.killTweensOf(els);
    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.06, ease: "power2.out" }
    );
  }, []);

  /**
   * WHAT: Scroll handler — computes frame, draws to canvas, updates stage text.
   * HOW:
   *   1. Raw 0–1 scroll progress from wrapper rect.
   *   2. Maps to frameIndex 1–192.
   *   3. drawFrame instantly — no lerp, no rAF, no keyframe seek.
   *   4. Updates progress bar via direct DOM write.
   *   5. On stage boundary: flushSync → React commits → GSAP fires same paint.
   * CALLED BY: scroll event listener.
   */
  const onScroll = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // 1. Raw scroll progress 0–1
    const rect     = wrapper.getBoundingClientRect();
    const total    = wrapper.offsetHeight - window.innerHeight;
    const raw      = Math.min(Math.max(-rect.top, 0) / total, 1);

    // 2. Frame index 1–192
    const frameIndex = Math.min(
      Math.max(Math.round(raw * (FRAME_COUNT - 1)) + 1, 1),
      FRAME_COUNT
    );

    // 3. Draw frame instantly
    if (frameIndex !== prevFrameRef.current) {
      prevFrameRef.current = frameIndex;
      drawFrame(frameIndex);
    }

    // 4. Progress bar — direct DOM, zero React overhead
    if (progressFill.current) {
      progressFill.current.style.width = `${raw * 100}%`;
    }

    // 5. Determine active stage (scan from end, find last stage whose frame <= current)
    let si = 0;
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (frameIndex >= STAGES[i].frame) { si = i; break; }
    }

    if (si !== prevStageRef.current) {
      prevStageRef.current = si;
      flushSync(() => {
        setIndexRef.current(si);
        setContentKey(k => k + 1);
      });
      animateText();
    }
  }, [drawFrame, animateText]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  /**
   * WHAT: Preloads all 192 frames as Image objects.
   * HOW:  Loads frame 1 first (shows immediately). Then loads frames in order.
   *       Updates loadProgress state every 10 frames for the progress indicator.
   *       On completion, draws frame 1 to canvas.
   * CALLED BY: useEffect on mount.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution to match display size
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      drawFrame(prevFrameRef.current);
    };
    resize();
    window.addEventListener("resize", resize);

    // Preload all frames
    const images = new Array(FRAME_COUNT);
    imagesRef.current = images;

    let loaded = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src   = FRAME_URL(i + 1);

      img.onload = () => {
        loaded++;
        loadedRef.current = loaded;

        // Draw frame 1 as soon as it lands
        if (i === 0) {
          drawFrame(1);
          animateText();
        }

        // Update load progress every 10 frames to avoid excessive re-renders
        if (loaded % 10 === 0 || loaded === FRAME_COUNT) {
          setLoadProgress(Math.round((loaded / FRAME_COUNT) * 100));
        }
      };

      images[i] = img;
    }

    return () => window.removeEventListener("resize", resize);
  }, [drawFrame, animateText]);

  const stage    = STAGES[activeIndex];
  const isLoaded = loadProgress === 100;

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── Canvas — all 192 frames drawn here instantly on scroll ── */}
        <canvas ref={canvasRef} className="heroCanvas" />

        {/* ── Cinematic overlay — left-heavy gradient for text legibility ── */}
        <div className="heroSlideOverlay" />

        {/* ── Preload progress — shown until all frames loaded ── */}
        {!isLoaded && (
          <div className="heroLoading">
            <div className="heroLoadBar">
              <div className="heroLoadBarFill" style={{ width: `${loadProgress}%` }} />
            </div>
            <span className="heroLoadText">Loading {loadProgress}%</span>
          </div>
        )}

        {/* ── Stage text content ── */}
        {!stage.isFinale && (
          <div className="heroContent">
            <div className="heroContentInner" key={contentKey}>
              <div className="heroStageBadge gsapText">
                <span className="heroStageBadgeDot" />
                Construction Sequence
              </div>
              <h2 className="heroStageLabel gsapText">
                <span className="heroStageLabelNum">{stage.num} —</span> {stage.label}
              </h2>
              <p className="heroStageDesc gsapText">{stage.description}</p>
              <div className="heroProgressRow gsapText">
                <div className="heroProgressDots">
                  {STAGES.map((s, i) => (
                    <span
                      key={s.id}
                      className={`heroDot ${
                        i === activeIndex ? "heroDotActive" : i < activeIndex ? "heroDotDone" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="heroProgressCount">{activeIndex + 1} / {STAGES.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Watermark stage number ── */}
        {!stage.isFinale && (
          <div className="heroStageNumber">{stage.num}</div>
        )}

        {/* ── Right vertical label ── */}
        {!stage.isFinale && (
          <div className="heroSideLabel">
            <div className="heroSideLine" />
            <span className="heroSideText">Triconix Build Process</span>
          </div>
        )}

        {/* ── Scroll prompt — first stage only ── */}
        {activeIndex === 0 && isLoaded && (
          <div className="heroScrollPrompt">
            <span className="heroScrollText">Scroll to reveal the build</span>
            <div className="heroScrollMouse">
              <div className="heroScrollWheel" />
            </div>
          </div>
        )}

        {/* ── Finale CTA ── */}
        {stage.isFinale && (
          <div className="heroFinaleTagline">
            <p className="heroFinaleEyebrow">Every Great Home Starts Here</p>
            <h1 className="heroFinaleTitle">From the Ground Up —</h1>
            <h1 className="heroFinaleTitleGold">Built by Triconix</h1>
            <div className="heroFinaleBtns">
              <a href="#projects" className="heroFinaleBtn heroFinaleBtnPrimary">View Our Projects</a>
              <a href="#contact"  className="heroFinaleBtn heroFinaleBtnSecondary">Book a Consultation</a>
            </div>
          </div>
        )}

        {/* ── Gold progress bar — width written direct to DOM ── */}
        <div className="heroProgressBar">
          <div className="heroProgressFill" ref={progressFill} />
        </div>

      </div>
    </div>
  );
}

export default HeroSection;