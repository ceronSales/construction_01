/**
 * WHAT: Hero section — scroll-driven construction sequence using the house image.
 * HOW: 800vh wrapper gives scroll distance. Sticky panel stays in viewport.
 *      The house photo dims/brightens via CSS filter as user scrolls through
 *      8 construction stages. Stage text animates in per stage.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/HeroSection.css";
import houseHeroImg from "../assets/house-hero.jpg";

const HOUSE_IMAGE = houseHeroImg;

/**
 * Each stage: overlayOpacity controls the black overlay div on top of the image.
 * 0.85 = very dark (early build), 0.0 = fully revealed (finale).
 */
const constructionStages = [
  {
    id: 1, num: "01", label: "Foundation",
    description: "Site excavation, soil testing, and reinforced concrete foundation construction.",
    overlayOpacity: 0.82,
  },
  {
    id: 2, num: "02", label: "Structural Frame",
    description: "Steel columns, beams, and structural framework erected to full height.",
    overlayOpacity: 0.70,
  },
  {
    id: 3, num: "03", label: "Wall Construction",
    description: "CHB walls built with precise window and door openings framed and set.",
    overlayOpacity: 0.58,
  },
  {
    id: 4, num: "04", label: "Roof Structure",
    description: "Roof framing, truss installation, and structural decking completed.",
    overlayOpacity: 0.46,
  },
  {
    id: 5, num: "05", label: "Roofing",
    description: "Premium roof covering installed with full waterproofing membrane system.",
    overlayOpacity: 0.35,
  },
  {
    id: 6, num: "06", label: "Windows & Doors",
    description: "Aluminum-framed windows, sliding glass panels, and solid wood doors installed.",
    overlayOpacity: 0.24,
  },
  {
    id: 7, num: "07", label: "Finishing",
    description: "Interior and exterior finishes, electrical, plumbing, paint, and tile work.",
    overlayOpacity: 0.14,
  },
  {
    id: 8, num: "08", label: "Completed House",
    description: "Fully finished, inspected, and ready to move in. Crafted with pride.",
    overlayOpacity: 0.0,
    isFinale: true,
  },
];

/**
 * WHAT: HeroSection component — sticky scroll construction sequence.
 * HOW: Scroll listener maps position to stage index + sub-stage fraction.
 *      overlayOpacity interpolates between stages so the black overlay smoothly
 *      lifts, revealing the house photo beneath.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const [currentStage, setCurrentStage] = useState(0);
  const [subProgress,  setSubProgress]  = useState(0);
  const [progress,     setProgress]     = useState(0);
  const [contentKey,   setContentKey]   = useState(0);
  const wrapperRef = useRef(null);
  const prevStage  = useRef(0);

  /**
   * WHAT: Maps scroll position to stage index and sub-stage fraction.
   * HOW: Divides wrapper scroll range into equal stage bands.
   * CALLED BY: scroll event listener.
   */
  const handleScroll = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect          = wrapperRef.current.getBoundingClientRect();
    const wrapperHeight = wrapperRef.current.offsetHeight - window.innerHeight;
    const scrolled      = Math.max(-rect.top, 0);
    const totalProgress = Math.min(scrolled / wrapperHeight, 1);

    const stageCount = constructionStages.length;
    const rawIndex   = totalProgress * stageCount;
    const stageIndex = Math.min(Math.floor(rawIndex), stageCount - 1);
    const sub        = rawIndex - Math.floor(rawIndex);

    setProgress(totalProgress);
    setSubProgress(sub);

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

  const stage     = constructionStages[currentStage];
  const nextStage = constructionStages[Math.min(currentStage + 1, constructionStages.length - 1)];

  // Smoothly interpolate overlay opacity between current and next stage
  const liveOpacity = parseFloat(
    (stage.overlayOpacity + (nextStage.overlayOpacity - stage.overlayOpacity) * subProgress).toFixed(3)
  );

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── House photo — background-image guarantees full cover fill ── */}
        <div
          className="heroHouseImg"
          style={{ backgroundImage: `url(${HOUSE_IMAGE})` }}
          role="img"
          aria-label="Completed Triconix home"
        />

        {/* ── Black overlay — opacity drops each stage to reveal the house ── */}
        <div
          className="heroBlackOverlay"
          style={{ opacity: liveOpacity }}
        />

        {/* ── Gold gradient tint — keeps luxury feel on early stages ── */}
        <div className="heroTint" />

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
                  {constructionStages.map((s, i) => (
                    <span
                      key={s.id}
                      className={`heroDot ${
                        i === currentStage ? "heroDotActive" : i < currentStage ? "heroDotDone" : ""
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

        {/* ── Scroll prompt (stage 0 only) ── */}
        {currentStage === 0 && (
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