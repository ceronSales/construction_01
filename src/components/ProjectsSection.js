/**
 * WHAT: ProjectsSection — full-viewport video background section for the Projects nav item.
 * HOW: Four mp4 videos play as fullscreen muted backgrounds. A thumbnail slider sits in
 *      the bottom-right corner showing 4 house images. Clicking/sliding a thumbnail
 *      switches to the corresponding video. Active video crossfades via CSS opacity.
 *      No auto-advance — video loops until user picks a different slide.
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/ProjectsSection.css";

import video01 from "../assets/projects/project-01.mp4";
import video02 from "../assets/projects/project-02.mp4";
import video03 from "../assets/projects/project-03.mp4";
import video04 from "../assets/projects/project-04.mp4";

import thumb01 from "../assets/projects/house-01.jpg";
import thumb02 from "../assets/projects/house-02.jpg";
import thumb03 from "../assets/projects/house-03.jpg";
import thumb04 from "../assets/projects/house-04.jpg";

const projectSlides = [
  { id: 1, video: video01, thumb: thumb01, label: "Modern Villa", sub: "Tropical Contemporary" },
  { id: 2, video: video02, thumb: thumb02, label: "Forest Retreat", sub: "Elevated Glass Design" },
  { id: 3, video: video03, thumb: thumb03, label: "Sky Residence", sub: "Multi-Level Luxury" },
  { id: 4, video: video04, thumb: thumb04, label: "Infinity Estate", sub: "Pool & Garden Sanctuary" },
];

/**
 * WHAT: ProjectsSection — renders fullscreen video bg + bottom-right thumbnail slider.
 * HOW: activeIndex drives both the visible video and the highlighted thumbnail.
 *      videoRefs holds one React.createRef per slide. On activeIndex change, the
 *      previously active video pauses+resets; the new one plays from 0 with loop.
 *      Thumbnail click sets activeIndex which triggers the switchVideo effect.
 * CALLED BY: HomePage.js
 */
function ProjectsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef(projectSlides.map(() => React.createRef()));

  /**
   * WHAT: Plays the video at nextIndex, pauses and resets all others.
   * HOW: Iterates all refs; only the target index gets play() called.
   *      play() returns a Promise — catch silences autoplay policy errors.
   * CALLED BY: useEffect on activeIndex change.
   */
  const switchVideo = useCallback((nextIndex) => {
    projectSlides.forEach((_, i) => {
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

  // Run switchVideo whenever the active slide changes
  useEffect(() => {
    switchVideo(activeIndex);
  }, [activeIndex, switchVideo]);

  /**
   * WHAT: Handles thumbnail click — sets the new active slide index.
   * HOW: Directly sets state; the useEffect above handles the actual video switch.
   * CALLED BY: onClick on each thumbnail button.
   */
  const handleThumbClick = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  return (
    <section id="projects" className="projectsSection">

      {/* ── Video background stack — all rendered, only active is visible ── */}
      <div className="projectsVideoStack">
        {projectSlides.map((slide, i) => (
          <video
            key={slide.id}
            ref={videoRefs.current[i]}
            className={`projectsVideo ${i === activeIndex ? "projectsVideoActive" : ""}`}
            src={slide.video}
            muted
            playsInline
            loop
            preload="auto"
            aria-label={slide.label}
          />
        ))}
      </div>

      {/* ── Dark gradient overlay ── */}
      <div className="projectsOverlay" />

      {/* ── Top-left section identity ── */}
      <div className="projectsHeader">
        <div className="projectsEyebrow">
          <span className="projectsEyebrowDot" />
          Our Projects
        </div>
        <h2 className="projectsTitle">
          {projectSlides[activeIndex].label}
        </h2>
        <p className="projectsSub">
          {projectSlides[activeIndex].sub}
        </p>
      </div>

      {/* ── Slide counter — top right ── */}
      <div className="projectsSlideCount">
        <span className="projectsSlideNum">
          {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <span className="projectsSlideTotal">
          / {String(projectSlides.length).padStart(2, "0")}
        </span>
      </div>

      {/* ── Bottom-right thumbnail slider ── */}
      <div className="projectsThumbSlider">
        <div className="projectsThumbLabel">Select Project</div>
        <div className="projectsThumbTrack">
          {projectSlides.map((slide, i) => (
            <button
              key={slide.id}
              className={`projectsThumb ${i === activeIndex ? "projectsThumbActive" : ""}`}
              onClick={() => handleThumbClick(i)}
              aria-label={`View project: ${slide.label}`}
            >
              {/* Thumbnail image */}
              <img
                src={slide.thumb}
                alt={slide.label}
                className="projectsThumbImg"
              />
              {/* Active gold border indicator */}
              <span className="projectsThumbBorder" />
              {/* Hover label */}
              <span className="projectsThumbCaption">{slide.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right side vertical label ── */}
      <div className="projectsSideLabel">
        <div className="projectsSideLine" />
        <span className="projectsSideText">Triconix Projects</span>
      </div>

    </section>
  );
}

export default ProjectsSection;
