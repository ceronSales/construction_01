/**
 * WHAT: Hero section — Apple-style scroll-driven video scrubbing.
 * HOW:  The construction-sequence.mp4 is loaded into a hidden <video> element
 *       with autoPlay and muted disabled. On each scroll event, the video's
 *       currentTime is set directly to (scrollProgress × video.duration),
 *       scrubbing the video frame-by-frame in perfect sync with scroll position.
 *       A tall wrapper (600vh) provides scroll distance. The video is sticky
 *       and covers the full viewport. Stage metadata overlays animate in per stage.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/HeroSection.css";

// Import video directly from src/assets — Webpack bundles and resolves the path
import videoSrc from "../assets/construction-sequence.mp4";

/* ── Construction stage metadata — maps to video time segments ── */
const STAGES = [
  { id: 0, num: "01", label: "Site & Foundation",  description: "Excavation complete. Reinforced concrete footings poured into bedrock." },
  { id: 1, num: "02", label: "Structural Frame",   description: "Steel columns, beams and structural framework erected to full height." },
  { id: 2, num: "03", label: "Wall Construction",  description: "CHB walls rising floor by floor. All structural columns poured full height." },
  { id: 3, num: "04", label: "Roof Structure",     description: "Roof framing and truss installation. Ridge beam set and decking nailed down." },
  { id: 4, num: "05", label: "Roofing",            description: "Premium clay tile roofing installed with full waterproofing membrane." },
  { id: 5, num: "06", label: "Windows & Doors",    description: "Aluminum frames, sliding glass panels and solid hardwood doors set." },
  { id: 6, num: "07", label: "Finishing",          description: "Interior and exterior finishes, electrical, plumbing, paint and tile work." },
  { id: 7, num: "08", label: "Completed Home",     description: "Fully inspected and move-in ready. Crafted by Triconix with pride.", isFinale: true },
];

/**
 * WHAT: HeroSection — scroll-scrubbed video with stage overlays.
 * HOW:  useEffect attaches a passive scroll listener. On scroll, computes
 *       progress 0–1 from wrapper bounding rect, sets video.currentTime,
 *       and derives the current stage index from progress.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const wrapperRef    = useRef(null);
  const videoRef      = useRef(null);
  const rafRef        = useRef(null);
  const targetTimeRef = useRef(0);
  const prevStageRef  = useRef(0);

  const [progress,   setProgress]   = useState(0);
  const [uiStage,    setUiStage]    = useState(0);
  const [contentKey, setContentKey] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  /**
   * WHAT: Smoothly interpolates video.currentTime toward targetTime each rAF frame.
   * HOW:  Uses linear interpolation at 12% per frame for silky scrubbing.
   *       Schedules itself recursively via requestAnimationFrame.
   * CALLED BY: startScrubLoop on mount.
   */
  const scrubLoop = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      const diff = targetTimeRef.current - video.currentTime;
      // Only update if difference is meaningful — avoids thrashing
      if (Math.abs(diff) > 0.001) {
        video.currentTime += diff * 0.12;
      }
    }
    rafRef.current = requestAnimationFrame(scrubLoop);
  }, []);

  /**
   * WHAT: Computes scroll progress and updates targetTime + stage UI.
   * HOW:  Reads wrapper bounding rect, derives 0–1 progress, maps to video duration.
   *       Stage index = floor(progress × STAGES.length).
   * CALLED BY: scroll event listener.
   */
  const handleScroll = useCallback(() => {
    const wrapper = wrapperRef.current;
    const video   = videoRef.current;
    if (!wrapper || !video || !video.duration) return;

    const rect         = wrapper.getBoundingClientRect();
    const wrapperH     = wrapper.offsetHeight - window.innerHeight;
    const scrolled     = Math.min(Math.max(-rect.top, 0), wrapperH);
    const p            = scrolled / wrapperH;

    // Update target time — scrubLoop lerps toward this each frame
    targetTimeRef.current = p * video.duration;
    setProgress(p);

    // Derive current stage
    const stageIdx = Math.min(
      Math.floor(p * STAGES.length),
      STAGES.length - 1
    );
    if (stageIdx !== prevStageRef.current) {
      prevStageRef.current = stageIdx;
      setUiStage(stageIdx);
      setContentKey(k => k + 1);
    }
  }, []);

  /* Mount — attach scroll listener, start rAF scrub loop */
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    rafRef.current = requestAnimationFrame(scrubLoop);

    // Safety fallback — dismiss loader after 4s even if video stalls
    const loaderTimeout = setTimeout(() => setVideoReady(true), 4000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(loaderTimeout);
    };
  }, [handleScroll, scrubLoop]);

  const stage = STAGES[uiStage];

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── Scroll-scrubbed video background ── */}
        <video
          ref={videoRef}
          className="heroVideo"
          src={videoSrc}
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(true)}
        />

        {/* Loading state — shown until video metadata is ready */}
        {!videoReady && (
          <div className="heroVideoLoader">
            <div className="heroLoaderSpinner" />
            <span className="heroLoaderText">Loading experience...</span>
          </div>
        )}

        {/* ── Dark cinematic overlay ── */}
        <div className={`heroOverlay ${stage.isFinale ? "heroOverlayLight" : ""}`} />

        {/* ── Large watermark stage number ── */}
        {!stage.isFinale && (
          <div className="heroStageNumber">{stage.num}</div>
        )}

        {/* ── Stage text content ── */}
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
                    <span
                      key={s.id}
                      className={`heroDot ${
                        i === uiStage ? "heroDotActive" : i < uiStage ? "heroDotDone" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="heroProgressCount">
                  {uiStage + 1} / {STAGES.length}
                </span>
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

        {/* ── Scroll prompt — first stage only ── */}
        {uiStage === 0 && videoReady && (
          <div className="heroScrollPrompt">
            <span className="heroScrollText">Scroll to build</span>
            <div className="heroScrollMouse">
              <div className="heroScrollWheel" />
            </div>
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
          <div className="heroProgressFill" style={{ width: `${progress * 100}%` }} />
        </div>

      </div>
    </div>
  );
}

export default HeroSection;