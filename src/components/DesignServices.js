/**
 * WHAT: Design Services section — looping MP4 video background + glassmorphism content cards.
 * HOW:  A full-viewport video background loops all 4 project MP4s in sequence.
 *       Scrolling reveals content cards:
 *       - Hero intro card (2 columns, glassmorphism)
 *       - 4 package cards (Class A, AA, AAA, Special Engineering)
 *       - Design Process card (single glassmorphism with internal scroll)
 * CALLED BY: HomePage.js
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "../css/DesignServices.css";

import vid1 from "../assets/projects/project-01.mp4";
import vid2 from "../assets/projects/project-02.mp4";
import vid3 from "../assets/projects/project-03.mp4";
import vid4 from "../assets/projects/project-04.mp4";

const VIDEOS = [vid1, vid2, vid3, vid4];

// ── Design fee packages ──
const PACKAGES = [
  {
    id: "classA",
    tier: "Class A",
    subtitle: "Single A — Standard Design",
    color: "#c9a84c",
    storeys: [
      { label: "1-Storey / Bungalow", min: 30000,  max: 50000  },
      { label: "2-Storey",            min: 40000,  max: 65000  },
      { label: "3-Storey",            min: 50000,  max: 70000  },
      { label: "4-Storey & Above",    min: 60000,  max: 100000 },
    ],
    includes: [
      "Architectural / Civil Engineering Design",
      "Structural, Electrical & Plumbing Plans",
      "Specifications and Bill of Materials",
    ],
    note: "*Interior 3D Perspective and Geotechnical Soil Test (required for 3-storey and above) not included.",
  },
  {
    id: "classAA",
    tier: "Class AA",
    subtitle: "Double A — Standard Design + 3D Interior of Main Rooms",
    color: "#7fb069",
    storeys: [
      { label: "1-Storey / Bungalow", min: 60000,  max: 90000  },
      { label: "2-Storey",            min: 70000,  max: 100000 },
      { label: "3-Storey",            min: 80000,  max: 110000 },
      { label: "4-Storey & Above",    min: 90000,  max: 110000 },
    ],
    includes: [
      "Architectural / Civil Engineering Design",
      "Structural, Electrical & Plumbing Plans",
      "Specifications and Bill of Materials",
      "Interior 3D Perspective: Living, Dining, Kitchen, Master Bedroom, Master T&B",
    ],
    note: "*Geotechnical Soil Test (required for 3-storey and above) not included.",
  },
  {
    id: "classAAA",
    tier: "Class AAA",
    subtitle: "Triple A — Standard Design + 3D Interior of All Rooms",
    color: "#4a90d9",
    storeys: [
      { label: "1-Storey / Bungalow", min: 80000,  max: 300000 },
      { label: "2-Storey",            min: 120000, max: 400000 },
      { label: "3-Storey",            min: 130000, max: 450000 },
      { label: "4-Storey & Above",    min: 150000, max: 500000 },
    ],
    includes: [
      "Architectural / Civil Engineering Design",
      "Structural, Electrical & Plumbing Plans",
      "Specifications and Bill of Materials",
      "Interior 3D Perspective of ALL Rooms including all Bedrooms and T&Bs",
    ],
    note: "*Geotechnical Soil Test (required for 3-storey and above) not included.",
  },
];

const SPECIAL_ITEMS = [
  { label: "Structural Engineering Plans",                                    range: "₱5,000 – ₱25,000 and up" },
  { label: "Electrical Plans",                                                 range: "₱5,000 – ₱25,000" },
  { label: "Plumbing Plans",                                                   range: "₱5,000 – ₱25,000" },
  { label: "Mechanical Plans",                                                 range: "₱5,000 – ₱25,000" },
  { label: "Interior Perspective Plans",                                       range: "₱10,000 – ₱50,000 and up" },
  { label: "Geotechnical Soil Test Report (3-storey & above)",                 range: "₱25,000 – ₱80,000 and up" },
  { label: "Geodetic Lot Plan and Vicinity Map",                               range: "₱2,000" },
  { label: "Feng Shui Planning (Kua Number & Eight Mansions Theory)",          range: "Starts at ₱20,000" },
];

// ── Design process steps ──
const PROCESS_STEPS = [
  {
    step: "1.1",
    title: "First Meeting & Data Gathering",
    body: `To design efficiently, we first meet you at our office. We need: Copy of Title/TCT to plot your property dimensions, lot plan or dimensions, commercial/condo measurements if applicable, room requirements (bedrooms, T&B, family hall, gym, etc.), and your construction budget so we can assess feasibility early.\n\nA 20% or ₱10,000 downpayment is required should you decide to have our team prepare a floor and space plan.`,
  },
  {
    step: "1.2",
    title: "Floor and Space Planning",
    body: `Our team designs your project starting with a floor and space plan including furniture layout — so you can gauge room sizes accurately. This takes approximately 2–3 weeks of back-and-forth submissions until approved. Probable construction costs are monitored throughout. Once approved, an additional 30% of the design fee is requested as downpayment.`,
  },
  {
    step: "1.3",
    title: "3D Perspectives",
    body: `When floor plans are approved and construction costs are within budget, 3D perspectives are designed. We need your preferred style — modern, contemporary, zen, etc. Our team provides several proposals until you decide and approve. This takes approximately 2–3 weeks.`,
  },
  {
    step: "1.4",
    title: "Engineering Plans & Working Drawings",
    body: `After 3D approval, we proceed with Structural, Electrical, Plumbing and Mechanical Plans. This takes 2–3 weeks. Note: a Geotechnical Soil Test report (₱25,000–₱80,000) is required for 3-storey structures and above. When engineering drawings are sent to the client, 30% of the design fee is requested prior to printing.`,
  },
  {
    step: "1.5",
    title: "Printing of Plans & Technical Documents",
    body: `All plans and technical documents are printed then signed and sealed by corresponding professionals. This takes approximately 1–3 days. Upon acceptance of signed and sealed plans, the balance of the design fee is requested as final payment.`,
  },
  {
    step: "Note",
    title: "Making Your Own Sketch to Determine Floor Area",
    body: `Key minimum requirements:\n1. Minimum front setback: 3 meters (high-class subdivisions: 4 meters)\n2. Left, rear & right setback: 2 meters (ground), 1.5 meters (2nd floor and above)\n3. Firewall allowed if setback not followed (depends on area rules)\n4. If all sides are firewalls, a 6 m² airwell is required\n5. Minimum bedroom size: 6 m²\n6. Standard door sizes: 0.9m (front), 0.8m (bedrooms), 0.7m (T&B), 0.6m (toilet)\n7. Check height restrictions — floor-to-floor is usually 3 meters\n8. Reserve 2m × 3m for staircase (including landing, 16 steps)\n9. Consult us for further questions.`,
  },
];

/**
 * WHAT: Formats a PHP peso amount with comma separators.
 * HOW:  Intl.NumberFormat with en-PH locale.
 * CALLED BY: Package card render.
 */
const formatPeso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

/**
 * WHAT: DesignServices component — video BG + glassmorphism cards.
 * HOW:  Background cycles through 4 MP4s. Cards are layered over the video
 *       on a scrollable page within this section.
 * CALLED BY: HomePage.js
 */
function DesignServices() {
  const videoRef  = useRef(null);
  const vidIndex  = useRef(0);
  const [activeStep, setActiveStep] = useState(0);

  /**
   * WHAT: Advances to the next MP4 when current one ends.
   * HOW:  Increments vidIndex ref, wraps around, updates video src and plays.
   * CALLED BY: onEnded on video element.
   */
  const handleVideoEnd = useCallback(() => {
    vidIndex.current = (vidIndex.current + 1) % VIDEOS.length;
    if (videoRef.current) {
      videoRef.current.src = VIDEOS[vidIndex.current];
      videoRef.current.play();
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.play();
  }, []);

  return (
    <section id="design-services" className="dsSection">

      {/* ── Looping video background ── */}
      <div className="dsVideoBg">
        <video
          ref={videoRef}
          className="dsVideo"
          src={VIDEOS[0]}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
        />
        <div className="dsVideoOverlay" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="dsContent">

        {/* ── Section eyebrow ── */}
        <div className="dsEyebrow">
          <span className="dsBadge">Design Services</span>
        </div>

        {/* ── Card 1: Hero intro — 2 columns glassmorphism ── */}
        <div className="dsGlassCard dsHeroCard">
          <div className="dsHeroLeft">
            <h2 className="dsHeroTitle">Design Services</h2>
            <p className="dsHeroBody">
              The design phase is the most important phase in making your project a reality —
              it is also the first step. An overdesigned structure could be beautiful but would
              not materialize because of cost implications. We focus on:
            </p>
            <ul className="dsHeroList">
              <li>Beauty and overall impact</li>
              <li>Cost and Budget</li>
              <li>Efficiency</li>
              <li>Safety</li>
            </ul>
          </div>
          <div className="dsHeroRight">
            <p className="dsHeroBody">
              Experience plays a major role in becoming a great designer. Since we are also builders,
              we always make it a point that our design is beautiful, efficient, safe and — of course —
              within the budget.
            </p>
            <p className="dsHeroBody" style={{ marginTop: "1rem" }}>
              Most design firms say they have construction experience, yet the design is usually out of
              budget. Ask them for a portfolio of <strong style={{ color: "var(--color-primary)" }}>"ACTUAL BUILT DESIGNS"</strong> and they
              will just show you a couple of projects.
            </p>
            <div className="dsHeroDiscount">
              <span className="dsHeroDiscountIcon">💡</span>
              <p>If the construction contract is awarded to us, the cost of Design Plans will be
              <strong> deductible from the construction contract cost</strong> as a discount.</p>
            </div>
          </div>
        </div>

        {/* ── Design Fee heading ── */}
        <div className="dsSectionLabel">
          <span className="dsSectionLabelLine" />
          <span className="dsSectionLabelText">Design Fee Packages</span>
          <span className="dsSectionLabelLine" />
        </div>

        {/* ── Cards 2–4: Package cards ── */}
        <div className="dsPackageGrid">
          {PACKAGES.map(pkg => (
            <div key={pkg.id} className="dsGlassCard dsPackageCard">
              <div className="dsPackageTop" style={{ borderColor: pkg.color }}>
                <span className="dsPackageTier" style={{ color: pkg.color }}>{pkg.tier}</span>
                <span className="dsPackageSubtitle">{pkg.subtitle}</span>
              </div>
              <div className="dsPackageStoreys">
                {pkg.storeys.map(s => (
                  <div key={s.label} className="dsPackageStoreyRow">
                    <span className="dsPackageStoreyLabel">{s.label}</span>
                    <span className="dsPackageStoreyRange" style={{ color: pkg.color }}>
                      {formatPeso(s.min)} – {formatPeso(s.max)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="dsPackageIncludes">
                <span className="dsPackageIncludesLabel">Includes:</span>
                {pkg.includes.map((item, i) => (
                  <div key={i} className="dsPackageIncludeRow">
                    <span className="dsPackageIncludeDot" style={{ background: pkg.color }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="dsPackageNote">{pkg.note}</p>
            </div>
          ))}
        </div>

        {/* ── Card 5: Special Engineering ── */}
        <div className="dsGlassCard dsSpecialCard">
          <div className="dsSpecialHeader">
            <span className="dsSpecialTitle">Special Engineering & Interior Design Packages</span>
            <span className="dsSpecialSubtitle">Individual plan components available separately</span>
          </div>
          <div className="dsSpecialGrid">
            {SPECIAL_ITEMS.map((item, i) => (
              <div key={i} className="dsSpecialRow">
                <span className="dsSpecialLabel">{item.label}</span>
                <span className="dsSpecialRange">{item.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Design Process label ── */}
        <div className="dsSectionLabel">
          <span className="dsSectionLabelLine" />
          <span className="dsSectionLabelText">Design Process · Approx. 5–9 Weeks</span>
          <span className="dsSectionLabelLine" />
        </div>

        {/* ── Card 6: Design Process — single glassmorphism with tab/scroll ── */}
        <div className="dsGlassCard dsProcessCard">
          {/* Step tabs */}
          <div className="dsProcessTabs">
            {PROCESS_STEPS.map((s, i) => (
              <button
                key={s.step}
                className={`dsProcessTab ${activeStep === i ? "dsProcessTabActive" : ""}`}
                onClick={() => setActiveStep(i)}
              >
                {s.step === "Note" ? "Note" : `Step ${s.step}`}
              </button>
            ))}
          </div>

          {/* Active step content */}
          <div className="dsProcessContent">
            <div className="dsProcessStepBadge">
              {PROCESS_STEPS[activeStep].step === "Note" ? "📌 Note" : `Step ${PROCESS_STEPS[activeStep].step}`}
            </div>
            <h3 className="dsProcessStepTitle">{PROCESS_STEPS[activeStep].title}</h3>
            <div className="dsProcessStepBody">
              {PROCESS_STEPS[activeStep].body.split("\n").map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />
              )}
            </div>

            {/* Step navigation */}
            <div className="dsProcessNav">
              {activeStep > 0 && (
                <button className="dsProcessNavBtn" onClick={() => setActiveStep(s => s - 1)}>← Previous</button>
              )}
              {activeStep < PROCESS_STEPS.length - 1 && (
                <button className="dsProcessNavBtn dsProcessNavBtnNext" onClick={() => setActiveStep(s => s + 1)}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default DesignServices;
