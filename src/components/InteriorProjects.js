/**
 * WHAT: InteriorProjects section — full-viewport video background carousel.
 * HOW: Four videos are cycled as fullscreen muted background videos.
 *      Active video fades in via CSS opacity transition. Each video auto-advances
 *      to the next on 'ended'. Manual prev/next controls allow user navigation.
 *      Dot indicators show current active video.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/InteriorProjects.css";

import video01 from "../assets/interior/interior-01.mp4";
import video02 from "../assets/interior/interior-02.mp4";
import video03 from "../assets/interior/interior-03.mp4";
import video04 from "../assets/interior/interior-04.mp4";
import video05 from "../assets/interior/interior-05.mp4";
import video06 from "../assets/interior/interior-06.mp4";
import video07 from "../assets/interior/interior-07.mp4";
import video08 from "../assets/interior/interior-08.mp4";
import video09 from "../assets/interior/interior-09.mp4";
import video10 from "../assets/interior/interior-10.mp4";
import video11 from "../assets/interior/interior-11.mp4";
import video12 from "../assets/interior/interior-12.mp4";

const interiorVideos = [
  { id: 1,  src: video01, label: "Foyer & Entrance" },
  { id: 2,  src: video02, label: "Living Spaces" },
  { id: 3,  src: video03, label: "Bedroom Design" },
  { id: 4,  src: video04, label: "Full Walkthrough" },
  { id: 5,  src: video05, label: "Cinematic Interior" },
  { id: 6,  src: video06, label: "Architectural Spaces" },
  { id: 7,  src: video07, label: "Living & Dining" },
  { id: 8,  src: video08, label: "Kitchen & Bath" },
  { id: 9,  src: video09, label: "Luxury Finishes" },
  { id: 10, src: video10, label: "Open Concept" },
  { id: 11, src: video11, label: "Modern Details" },
  { id: 12, src: video12, label: "Exterior & Landscape" },
];

/**
 * WHAT: InteriorProjects — video background section.
 * HOW: Maintains activeIndex state. videoRefs array holds one ref per video.
 *      On activeIndex change, the outgoing video pauses and resets, the incoming
 *      video plays from 0. CSS opacity transition handles the crossfade.
 *      'ended' event on each video triggers advanceVideo().
 * CALLED BY: HomePage.js
 */
function InteriorProjects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef(Array.from({ length: 12 }, () => React.createRef()));

  /**
   * WHAT: Plays the video at nextIndex, pauses and resets the current one.
   * HOW: Directly accesses videoRefs by index. Calls play() which returns a
   *      Promise — catch handles autoplay policy rejections silently.
   * CALLED BY: useEffect on activeIndex change, advanceVideo, handlePrev, handleNext.
   */
  const switchVideo = useCallback((nextIndex) => {
    interiorVideos.forEach((_, i) => {
      const vid = videoRefs.current[i]?.current;
      if (!vid) return;
      if (i === nextIndex) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, []);

  // Trigger switchVideo whenever activeIndex changes
  useEffect(() => {
    switchVideo(activeIndex);
  }, [activeIndex, switchVideo]);

  /**
   * WHAT: Advances to the next video when the current one ends.
   * HOW: Wraps index using modulo to loop back to 0 from the last video.
   * CALLED BY: 'ended' event on each <video> element.
   */
  const advanceVideo = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % interiorVideos.length);
  }, []);

  /**
   * WHAT: Navigates to the previous video.
   * HOW: Wraps to last video if at index 0.
   * CALLED BY: Prev button onClick.
   */
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + interiorVideos.length) % interiorVideos.length);
  }, []);

  /**
   * WHAT: Navigates to the next video.
   * HOW: Wraps to first video from the last.
   * CALLED BY: Next button onClick.
   */
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % interiorVideos.length);
  }, []);

  return (
    <section id="interior-projects" className="interiorSection">

      {/* ── Video layers — all rendered, only active one is visible ── */}
      <div className="interiorVideoStack">
        {interiorVideos.map((vid, i) => (
          <video
            key={vid.id}
            ref={videoRefs.current[i]}
            className={`interiorVideo ${i === activeIndex ? "interiorVideoActive" : ""}`}
            src={vid.src}
            muted
            playsInline
            preload="auto"
            onEnded={advanceVideo}
            aria-label={vid.label}
          />
        ))}
      </div>

      {/* ── Dark gradient overlay — bottom fade for text legibility ── */}
      <div className="interiorOverlay" />

      {/* ── Section content ── */}
      <div className="interiorContent">

        {/* Section eyebrow */}
        <div className="interiorEyebrow">
          <span className="interiorEyebrowDot" />
          Interior Projects
        </div>

        {/* Current video label */}
        <h2 className="interiorTitle">
          {interiorVideos[activeIndex].label}
        </h2>

        {/* Dot indicators */}
        <div className="interiorDots">
          {interiorVideos.map((_, i) => (
            <button
              key={i}
              className={`interiorDot ${i === activeIndex ? "interiorDotActive" : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Play video ${i + 1}`}
            />
          ))}
        </div>

        {/* Prev / Next controls */}
        <div className="interiorControls">
          <button className="interiorBtn" onClick={handlePrev} aria-label="Previous video">
            <span className="interiorBtnArrow">←</span>
          </button>
          <span className="interiorCounter">
            {String(activeIndex + 1).padStart(2, "0")} / {String(interiorVideos.length).padStart(2, "0")}
          </span>
          <button className="interiorBtn" onClick={handleNext} aria-label="Next video">
            <span className="interiorBtnArrow">→</span>
          </button>
        </div>

      </div>

      {/* ── Right side vertical label ── */}
      <div className="interiorSideLabel">
        <div className="interiorSideLine" />
        <span className="interiorSideText">Triconix Interiors</span>
      </div>

    </section>
  );
}

export default InteriorProjects;