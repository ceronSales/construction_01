/**
 * WHAT: Hero section — full-viewport GSAP photo slider using extracted MP4 frames.
 * HOW:  8 JPG frames extracted from construction-sequence.mp4 are imported and used
 *       as full-cover backgrounds per stage. Scroll position maps to active slide.
 *       GSAP crossfades slides (fade + scale) and staggers text children on each change.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import "../css/HeroSection.css";

// ── Stage background images extracted from construction-sequence.mp4 ──
import stage1 from "../assets/stages/stage_1.jpg";
import stage2 from "../assets/stages/stage_2.jpg";
import stage3 from "../assets/stages/stage_3.jpg";
import stage4 from "../assets/stages/stage_4.jpg";
import stage5 from "../assets/stages/stage_5.jpg";
import stage6 from "../assets/stages/stage_6.jpg";
import stage7 from "../assets/stages/stage_7.jpg";
import stage8 from "../assets/stages/stage_8.jpg";
import houseHero from "../assets/house-hero.jpg";

/**
 * STAGES runs 08 → 01 — the completed house is shown first on page load.
 * As the user scrolls, construction is revealed in reverse until the finale:
 * Site & Foundation — where everything began.
 */
const STAGES = [
  {
    id: 0,
    num: "08",
    label: "Completed Home",
    description: "Your dream home — fully finished, inspected, and ready to move in.",
    image: stage8,
  },
  {
    id: 1,
    num: "07",
    label: "Finishing",
    description: "Interior and exterior finishes, electrical, plumbing, paint and tile work.",
    image: stage7,
  },
  {
    id: 2,
    num: "06",
    label: "Windows & Doors",
    description: "Aluminum frames, sliding glass panels and solid hardwood doors set.",
    image: stage6,
  },
  {
    id: 3,
    num: "05",
    label: "Roofing",
    description: "Premium clay tile roofing installed with full waterproofing membrane.",
    image: stage5,
  },
  {
    id: 4,
    num: "04",
    label: "Roof Structure",
    description: "Roof framing and truss installation. Ridge beam set and decking nailed down.",
    image: stage4,
  },
  {
    id: 5,
    num: "03",
    label: "Wall Construction",
    description: "CHB walls rising floor by floor. All structural columns poured full height.",
    image: stage3,
  },
  {
    id: 6,
    num: "02",
    label: "Structural Frame",
    description: "Steel columns, beams and structural framework erected to full height.",
    image: stage2,
  },
  {
    id: 7,
    num: "01",
    label: "Site & Foundation",
    description: "Where every great home begins — excavation and reinforced concrete footings.",
    image: stage1,
    isFinale: true,
  },
];

/**
 * WHAT: HeroSection — scroll-driven GSAP photo slider.
 * HOW:  Slides stacked absolutely. Scroll maps to index. GSAP crossfades
 *       slides and staggers .gsapText children on each stage change.
 * CALLED BY: HomePage.js
 */
function HeroSection() {
  const wrapperRef   = useRef(null);
  const slidesRef    = useRef([]);
  const prevIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [contentKey,  setContentKey]  = useState(0);

  /**
   * WHAT: Stores slide DOM node at index i into slidesRef.
   * HOW:  Used as ref callback on each slide div.
   * CALLED BY: JSX ref callbacks.
   */
  const setSlideRef = useCallback((el, i) => {
    slidesRef.current[i] = el;
  }, []);

  /**
   * WHAT: GSAP crossfade — fades out old slide, fades in new slide + staggers text.
   * HOW:  gsap.to fades + scales outgoing. gsap.fromTo fades + scales incoming.
   *       .gsapText children stagger upward via querySelectorAll inside heroContent.
   * CALLED BY: handleScroll when index changes.
   */
  const animateSlideChange = useCallback((outIdx, inIdx) => {
    const outSlide = slidesRef.current[outIdx];
    const inSlide  = slidesRef.current[inIdx];

    if (outSlide) {
      gsap.killTweensOf(outSlide);
      gsap.to(outSlide, { opacity: 0, scale: 1.05, duration: 1.0, ease: "power2.inOut", zIndex: 1 });
    }

    if (inSlide) {
      gsap.killTweensOf(inSlide);
      gsap.fromTo(
        inSlide,
        { opacity: 0, scale: 0.97, zIndex: 2 },
        { opacity: 1, scale: 1,    duration: 1.1, ease: "power2.inOut", zIndex: 2 }
      );
    }

    // Stagger text elements in the active content block
    const textEls = document.querySelectorAll(".heroContentInner .gsapText");
    if (textEls.length) {
      gsap.killTweensOf(textEls);
      gsap.fromTo(
        textEls,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: 0.35 }
      );
    }
  }, []);

  /**
   * WHAT: Computes scroll progress and triggers slide change when index shifts.
   * HOW:  Reads wrapper rect, derives 0-1 progress, maps to STAGES index.
   * CALLED BY: scroll event listener.
   */
  const handleScroll = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rect     = wrapper.getBoundingClientRect();
    const wrapperH = wrapper.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), wrapperH);
    const p        = scrolled / wrapperH;

    setProgress(p);

    const newIndex = Math.min(Math.floor(p * STAGES.length), STAGES.length - 1);

    if (newIndex !== prevIndexRef.current) {
      animateSlideChange(prevIndexRef.current, newIndex);
      prevIndexRef.current = newIndex;
      setActiveIndex(newIndex);
      setContentKey(k => k + 1);
    }
  }, [animateSlideChange]);

  /* Mount — show slide 0, animate its text, attach scroll listener */
  useEffect(() => {
    const firstSlide = slidesRef.current[0];
    if (firstSlide) gsap.set(firstSlide, { opacity: 1, scale: 1, zIndex: 2 });

    const textEls = document.querySelectorAll(".heroContentInner .gsapText");
    if (textEls.length) {
      gsap.fromTo(
        textEls,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.5 }
      );
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const stage = STAGES[activeIndex];

  return (
    <div className="heroWrapper" ref={wrapperRef} id="home">
      <div className="heroSticky">

        {/* ── Photo slide layers ── */}
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            ref={el => setSlideRef(el, i)}
            className="heroSlide"
            style={{
              backgroundImage: `url(${s.isFinale ? houseHero : s.image})`,
              opacity: i === 0 ? 1 : 0,
              zIndex:  i === 0 ? 2 : 1,
            }}
          >
            {/* Cinematic gradient overlay — left-heavy for text legibility */}
            <div className="heroSlideOverlay" />
          </div>
        ))}

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

        {/* ── Scroll prompt — first slide only ── */}
        {activeIndex === 0 && (
          <div className="heroScrollPrompt">
            <span className="heroScrollText">Scroll to reveal the build</span>
            <div className="heroScrollMouse">
              <div className="heroScrollWheel" />
            </div>
          </div>
        )}

        {/* ── Finale CTA — Site & Foundation ── */}
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

        {/* ── Gold progress bar ── */}
        <div className="heroProgressBar">
          <div className="heroProgressFill" style={{ width: `${progress * 100}%` }} />
        </div>

      </div>
    </div>
  );
}

export default HeroSection;