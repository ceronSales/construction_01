/**
 * WHAT: Hero section with scroll-driven construction sequence animation.
 * HOW: A tall wrapper (800vh) provides scroll distance. A sticky inner panel
 *      stays in viewport. Scroll position maps to 8 construction stages.
 *      Each stage crossfades backgrounds and animates content in.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/HeroSection.css";

// Construction sequence stages — bg is a dark color per stage
const constructionStages = [
  {
    id: 1,
    num: "01",
    label: "Foundation",
    description: "Site excavation, soil testing, and reinforced concrete foundation construction.",
    bg: "linear-gradient(135deg, #0d0d0d 0%, #1a1005 100%)",
    accent: "#6b4f1a",
  },
  {
    id: 2,
    num: "02",
    label: "Structural Frame",
    description: "Steel columns, beams, and structural framework erected to full height.",
    bg: "linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 100%)",
    accent: "#1a3a1a",
  },
  {
    id: 3,
    num: "03",
    label: "Wall Construction",
    description: "CHB walls built with precise window and door openings framed and set.",
    bg: "linear-gradient(135deg, #0d0d14 0%, #0a0a1a 100%)",
    accent: "#1a1a3a",
  },
  {
    id: 4,
    num: "04",
    label: "Roof Structure",
    description: "Roof framing, truss installation, and structural decking completed.",
    bg: "linear-gradient(135deg, #0f0a0f 0%, #1a0a1a 100%)",
    accent: "#2a1a2a",
  },
  {
    id: 5,
    num: "05",
    label: "Roofing",
    description: "Premium roof covering installed with full waterproofing membrane system.",
    bg: "linear-gradient(135deg, #140a0a 0%, #1a0d0d 100%)",
    accent: "#2a1010",
  },
  {
    id: 6,
    num: "06",
    label: "Windows & Doors",
    description: "Aluminum-framed windows, sliding glass panels, and solid wood doors installed.",
    bg: "linear-gradient(135deg, #0a0f14 0%, #0a1420 100%)",
    accent: "#0a2030",
  },
  {
    id: 7,
    num: "07",
    label: "Finishing",
    description: "Interior and exterior finishes, electrical, plumbing, paint, and tile work.",
    bg: "linear-gradient(135deg, #0f0f0a 0%, #1a1a0a 100%)",
    accent: "#2a2a0a",
  },
  {
    id: 8,
    num: "08",
    label: "Completed House",
    description: "Fully finished, inspected, and ready to move in. Crafted with pride.",
    bg: null,
    isFinale: true,
  },
];

// Finished house hero image
const HOUSE_IMAGE = "/assets/house-hero.jpg";

/**
 * WHAT: HeroSection component — sticky scroll construction sequence.
 * HOW: Calculates scroll progress relative to the wrapper element.
 *      Maps progress to a stage index. Each render shows the active stage.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [contentKey, setContentKey] = useState(0); // forces re-animation on stage change
  const wrapperRef = useRef(null);
  const prevStage = useRef(0);

  /**
   * WHAT: Calculates current stage from scroll position.
   * HOW: Gets wrapper bounding rect, computes 0–1 progress, maps to stage index.
   * CALLED BY: scroll event listener.
   */
  const handleScroll = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const wrapperHeight = wrapperRef.current.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const totalProgress = Math.min(Math.max(scrolled / wrapperHeight, 0), 1);
    const stageIndex = Math.min(
      Math.floor(totalProgress * constructionStages.length),
      constructionStages.length - 1
    );

    setProgress(totalProgress);

    // Only trigger re-animation when stage actually changes
    if (stageIndex !== prevStage.current) {
      prevStage.current = stageIndex;
      setCurrentStage(stageIndex);
      setContentKey((k) => k + 1);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const stage = constructionStages[currentStage];

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── Background layers — all rendered, active one fades in ── */}
        {constructionStages.map((s, i) => (
          <div
            key={s.id}
            className={`heroBg ${i === currentStage ? "heroBgActive" : ""} ${s.isFinale ? "heroBgFinale" : ""}`}
            style={
              s.isFinale
                ? {
                    backgroundImage: `url(${HOUSE_IMAGE})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center 30%",
                  }
                : { background: s.bg }
            }
          >
            {/* Blueprint grid texture for non-finale stages */}
            {!s.isFinale && (
              <>
                <div className="heroBgPattern" />
                <div className="heroBgGlow" />
              </>
            )}
          </div>
        ))}

        {/* ── Dark overlay ── */}
        <div className={`heroOverlay ${stage.isFinale ? "heroOverlayLight" : ""}`} />

        {/* ── Large watermark stage number ── */}
        {!stage.isFinale && (
          <div className="heroStageNumber">{stage.num}</div>
        )}

        {/* ── Main stage content ── */}
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

              {/* Progress indicators */}
              <div className="heroProgressRow">
                <div className="heroProgressDots">
                  {constructionStages.map((s, i) => (
                    <span
                      key={s.id}
                      className={`heroDot ${
                        i === currentStage
                          ? "heroDotActive"
                          : i < currentStage
                          ? "heroDotDone"
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="heroProgressCount">
                  {currentStage + 1} / {constructionStages.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Right side vertical label ── */}
        {!stage.isFinale && (
          <div className="heroSideLabel">
            <div className="heroSideLine" />
            <span className="heroSideText">Triconix Build Process</span>
          </div>
        )}

        {/* ── Scroll prompt (first stage only) ── */}
        {currentStage === 0 && (
          <div className="heroScrollPrompt">
            <span className="heroScrollText">Scroll to build</span>
            <div className="heroScrollMouse">
              <div className="heroScrollWheel" />
            </div>
          </div>
        )}

        {/* ── Finale overlay ── */}
        {stage.isFinale && (
          <div className="heroFinaleTagline">
            <p className="heroFinaleEyebrow">Triconix Construction Corporation</p>
            <h1 className="heroFinaleTitle">Crafting Dreams,</h1>
            <h1 className="heroFinaleTitleGold">Building Homes</h1>
            <div className="heroFinaleBtns">
              <a href="#projects" className="heroFinaleBtn heroFinaleBtnPrimary">
                View Our Projects
              </a>
              <a href="#contact" className="heroFinaleBtn heroFinaleBtnSecondary">
                Book a Consultation
              </a>
            </div>
          </div>
        )}

        {/* ── Bottom progress bar ── */}
        <div className="heroProgressBar">
          <div className="heroProgressFill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default HeroSection;