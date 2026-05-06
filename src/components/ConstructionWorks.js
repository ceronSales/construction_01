/**
 * WHAT: Construction Works section — fullscreen MP4 background + left-side
 *       glassmorphism slide-in panel with all services and cost info.
 * HOW:  The MP4 loops as a sticky full-viewport background. A fixed toggle
 *       tab on the left edge opens/closes a slide-in glassmorphism panel.
 *       Panel contains service list, cost estimates, and disclaimer — all
 *       from the original triconixconstruction.com/construction-works page.
 * CALLED BY: HomePage.js
 */

import React, { useState } from "react";
import "../css/ConstructionWorks.css";
import constructionVideo from "../assets/construction-works.mp4";

/* ── Service categories ── */
const SERVICES = [
  { id: 1, icon: "🏠", label: "House Construction" },
  { id: 2, icon: "🏢", label: "Building Construction" },
  { id: 3, icon: "🛋️", label: "Interior Works" },
  { id: 4, icon: "🏙️", label: "Condominium Unit Fit-outs" },
  { id: 5, icon: "🏪", label: "Commercial Unit Fit-outs" },
  { id: 6, icon: "🔨", label: "Repair and Renovation" },
  { id: 7, icon: "🎭", label: "Stage & Props Construction" },
  { id: 8, icon: "📐", label: "House / Building Construction" },
];

/* ── Finish cost estimates per sqm ── */
const FINISHES = [
  { label: "Economical Finish",  range: "₱20,000 – ₱25,000 / m²", color: "#7fb069" },
  { label: "Regular Finish",     range: "₱22,000 – ₱28,000 / m²", color: "#c9a84c" },
  { label: "Semi-Elegant Finish",range: "₱24,000 – ₱30,000 / m²", color: "#4a90d9" },
  { label: "Elegant Finish",     range: "₱25,000 and above / m²",  color: "#9b59b6" },
];

/**
 * WHAT: ConstructionWorks section component.
 * HOW:  panelOpen state toggles the slide-in panel via CSS transform.
 *       Video loops silently behind. Tab button on left edge is always visible.
 * CALLED BY: HomePage.js
 */
function ConstructionWorks() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <section id="construction-works" className="cwSection">

      {/* ── Full-viewport looping video background ── */}
      <div className="cwVideoBg">
        <video
          className="cwVideo"
          src={constructionVideo}
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Dark overlay for legibility */}
        <div className="cwVideoOverlay" />
      </div>

      {/* ── Centered hero text over video ── */}
      <div className="cwHero">
        <span className="cwBadge"><span className="cwBadgeDot" />Our Services</span>
        <h2 className="cwTitle">Construction<br />Works & Services</h2>
        <p className="cwSubtitle">
          We do a wide variety of construction projects.
        </p>
        <a href="#projects" className="cwProjectsLink">
          View Completed Projects →
        </a>

        {/* Prompt to open panel */}
        {!panelOpen && (
          <button className="cwOpenHint" onClick={() => setPanelOpen(true)}>
            <span className="cwOpenHintIcon">‹</span>
            <span className="cwOpenHintText">View Services & Pricing</span>
          </button>
        )}
      </div>

      {/* ── Slide-in panel toggle tab — always visible on left edge ── */}
      <button
        className={`cwPanelTab ${panelOpen ? "cwPanelTabOpen" : ""}`}
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label="Toggle services panel"
        aria-expanded={panelOpen}
      >
        <span className="cwPanelTabIcon">{panelOpen ? "✕" : "☰"}</span>
        <span className="cwPanelTabLabel">{panelOpen ? "Close" : "Services"}</span>
      </button>

      {/* ── Glassmorphism slide-in panel from left ── */}
      <aside className={`cwPanel ${panelOpen ? "cwPanelOpen" : ""}`} aria-hidden={!panelOpen}>

        {/* Panel header */}
        <div className="cwPanelHeader">
          <div>
            <h3 className="cwPanelTitle">Construction Works</h3>
            <p className="cwPanelSub">Triconix Construction Corporation</p>
          </div>
          <button className="cwPanelClose" onClick={() => setPanelOpen(false)}>✕</button>
        </div>

        <div className="cwPanelDivider" />

        {/* Services list */}
        <div className="cwPanelBlock">
          <div className="cwPanelBlockTitle">What We Do</div>
          <div className="cwServiceList">
            {SERVICES.map(s => (
              <div key={s.id} className="cwServiceItem">
                <span className="cwServiceIcon">{s.icon}</span>
                <span className="cwServiceLabel">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cwPanelDivider" />

        {/* Cost estimates */}
        <div className="cwPanelBlock">
          <div className="cwPanelBlockTitle">Rough Cost Estimates</div>
          <div className="cwFinishList">
            {FINISHES.map(f => (
              <div key={f.label} className="cwFinishItem">
                <div className="cwFinishDot" style={{ background: f.color }} />
                <div className="cwFinishInfo">
                  <span className="cwFinishLabel">{f.label}</span>
                  <span className="cwFinishRange" style={{ color: f.color }}>{f.range}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cwPanelDivider" />

        {/* Important note */}
        <div className="cwPanelBlock">
          <div className="cwPanelBlockTitle">Important Note</div>
          <p className="cwPanelNote">
            Cost per square meter estimates are not always accurate and are used in designing only.
            For example, a 6m × 6m (36 m²) Master Bedroom can be done elegantly at ₱19,000/m²,
            while the same area with 2 bedrooms, 2 toilet & baths, and 1 kitchen can go as high as
            ₱25,000/m² with Economical finish due to more partitions, doors, outlets, plumbing, and
            electrical lines. <strong>Floor plans are needed for an accurate estimate.</strong>
          </p>
        </div>

        {/* CTA */}
        <div className="cwPanelCta">
          <a href="#cost-calculator" className="cwCtaBtn" onClick={() => setPanelOpen(false)}>
            Get a Cost Estimate →
          </a>
          <a href="#contact" className="cwCtaBtnSecondary" onClick={() => setPanelOpen(false)}>
            Contact Us
          </a>
        </div>

      </aside>

      {/* Backdrop — clicking closes panel */}
      {panelOpen && (
        <div className="cwBackdrop" onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}

    </section>
  );
}

export default ConstructionWorks;
