/**
 * WHAT: ConstructionWorks section — services list with RGB heartbeat cards.
 * HOW:  Dark particle-dot background via CSS. Each service card has an animated
 *       RGB gradient border that rotates continuously. On hover, a heartbeat
 *       scale pulse fires via CSS animation. Estimate rates shown in a separate
 *       highlight block. Disclaimer at bottom.
 * CALLED BY: HomePage.js
 */

import React from "react";
import "../css/ConstructionWorks.css";

const services = [
  { icon: "⬜", label: "House Construction" },
  { icon: "🏢", label: "Building Construction" },
  { icon: "🛋", label: "Interior Works" },
  { icon: "🏙", label: "Condominium Unit Fit-outs" },
  { icon: "🏪", label: "Commercial Unit Fit-outs" },
  { icon: "🔨", label: "Repair and Renovation" },
  { icon: "🎭", label: "Stage & Props Construction" },
  { icon: "🏗", label: "House / Building Construction" },
];

const estimates = [
  { label: "Economic Finish",    range: "₱18,700 – ₱19,700 / m²",  color: "#c9a84c" },
  { label: "Regular Finish",     range: "₱19,700 – ₱22,100 / m²",  color: "#7fb069" },
  { label: "Semi-Elegant Finish",range: "₱22,100 – ₱24,800 / m²",  color: "#4a90d9" },
  { label: "Elegant Finish",     range: "₱24,800 – ₱27,800 / m²",  color: "#d4a0d0" },
];

/**
 * WHAT: ConstructionWorks component.
 * HOW:  Renders a section with a dot-grid CSS background. Service cards use
 *       a conic-gradient ::before pseudo-element that rotates via keyframe —
 *       creating the RGB spinning border effect. Hover triggers heartbeat pulse.
 * CALLED BY: HomePage.js
 */
function ConstructionWorks() {
  return (
    <section id="construction-works" className="cwSection">

      {/* ── Animated background dots ── */}
      <div className="cwBg" aria-hidden="true">
        <div className="cwBgGlow cwBgGlowA" />
        <div className="cwBgGlow cwBgGlowB" />
        <div className="cwBgGlow cwBgGlowC" />
      </div>

      {/* ── Section header ── */}
      <div className="cwHeader">
        <div className="cwEyebrow">
          <span className="cwEyebrowDot" />
          What We Build
        </div>
        <h2 className="cwTitle">Construction Works & Services</h2>
        <p className="cwSubtitle">
          We do a wide variety of construction projects.{" "}
          <a href="#projects" className="cwSubtitleLink">
            View our completed projects →
          </a>
        </p>
      </div>

      {/* ── Service cards grid ── */}
      <div className="cwGrid">
        {services.map((s) => (
          <div className="cwCard" key={s.label}>
            {/* Rotating RGB border layer */}
            <div className="cwCardRgb" aria-hidden="true" />
            {/* Card inner content */}
            <div className="cwCardInner">
              <span className="cwCardIcon">{s.icon}</span>
              <span className="cwCardLabel">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Estimate rates ── */}
      <div className="cwEstimates">
        <div className="cwEstimatesHeader">
          <span className="cwEstimatesEye">Rough Cost Estimates</span>
          <h3 className="cwEstimatesTitle">Price Per Square Meter</h3>
        </div>
        <div className="cwEstimateGrid">
          {estimates.map((e) => (
            <div className="cwEstimateCard" key={e.label} style={{ "--est-color": e.color }}>
              <span className="cwEstimateLabel">{e.label}</span>
              <span className="cwEstimateRange">{e.range}</span>
              <div className="cwEstimateBar" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="cwDisclaimer">
        <p>
          Please bear in mind that using cost per square meter estimates are not accurate and
          are used for planning purposes only. For example: a 6m × 6m (36 m²) Master Bedroom
          can be done elegantly at ₱19,000/m² while the same area with 2 bedrooms, 2 toilet
          and baths and 1 kitchen can go as high as ₱25,000/m² with only an economical finish
          due to more partitions, doors, outlets, plumbing lines, and electrical lines.
          Floor plans are needed for an accurate estimate.
        </p>
      </div>

    </section>
  );
}

export default ConstructionWorks;
