/**
 * WHAT: WhyChooseUs section — centered row layout with SVG icons and team profiles.
 * HOW: Each reason renders as a full-width centered row: icon left, gold rule divider,
 *      text right. Team section below with portrait photos and gold bracket accents.
 * CALLED BY: HomePage.js
 */

import React from "react";
import "../css/WhyChooseUs.css";

/* ── SVG Icons — minimal 24px line icons, stroke-based ── */
const IconOffice = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="14" rx="1" />
    <path d="M3 7l9-4 9 4" />
    <rect x="9" y="13" width="6" height="8" />
  </svg>
);

const IconPortfolio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconLicense = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M9 12l-4 9 7-2 7 2-4-9" />
  </svg>
);

const IconRegistered = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <polyline points="7 10 10 13 17 8" />
    <line x1="7" y1="17" x2="13" y2="17" />
  </svg>
);

const IconTransparency = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const IconDiscount = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const IconContractor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20" />
    <path d="M5 20V10l7-7 7 7v10" />
    <rect x="9" y="14" width="6" height="6" />
  </svg>
);

const whyReasons = [
  {
    num: "01",
    title: "We Have an Office",
    body: "Most cheap design and construction firms do not have a formal office. We do — a professional space you can visit to discuss your project in person.",
    Icon: IconOffice,
  },
  {
    num: "02",
    title: "Quality Track Record & Experience",
    body: "We boast actual completed projects — not just drawings. Our portfolio includes addresses and references you can verify, all published on this website.",
    Icon: IconPortfolio,
  },
  {
    num: "03",
    title: "Licensed Professionals",
    body: "Our team carries 15-year Structural, Electrical, Plumbing, and Mechanical Construction Safety Warranties — signed, sealed, and submitted to government authorities.",
    Icon: IconLicense,
  },
  {
    num: "04",
    title: "PCAB & DTI-Registered",
    body: "Fully registered with PCAB and DTI, with a valid Business Permit. Every project you commission with us is protected by law.",
    Icon: IconRegistered,
  },
  {
    num: "05",
    title: "Transparency & Flexibility",
    body: "Detailed itemized quotations and contracts — flooring, walling, ceiling, roofing, electrical, plumbing — all quantified. Clients may change any item during construction.",
    Icon: IconTransparency,
  },
  {
    num: "06",
    title: "Discounted Package Pricing",
    body: "We offer 10–20% lower prices than the market. Our own trucks and equipment — pumps, drills, grinders, scaffolding — reduce construction time and lower your cost.",
    Icon: IconDiscount,
  },
  {
    num: "07",
    title: "We Are Also Contractors",
    body: "Other designers create beautiful plans but can't build within budget. We design and construct — making your dream house a reality, not just a drawing.",
    Icon: IconContractor,
  },
];

const teamMembers = [
  {
    name: "Ar. Kurt Angelo Castillon, UAP",
    title: "Principal Architect",
    imgSrc:
      "https://static.wixstatic.com/media/982f32_3bf260b069464434ad4293f3bc446aef~mv2.jpg/v1/crop/x_46,y_0,w_1067,h_1609/fill/w_368,h_555,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/343775872_1227921161163976_2484360189466003088_n.jpg",
  },
  {
    name: "Engr. Reymun Supan, RMP",
    title: "Principal Civil Engineer",
    imgSrc:
      "https://static.wixstatic.com/media/982f32_06d6388b9b5c44c9898d6ed12189930f~mv2.jpg/v1/crop/x_97,y_151,w_1234,h_1897/fill/w_361,h_555,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/343288937_627436895955929_6280987288220555651_n.jpg",
  },
];

/**
 * WHAT: WhyChooseUs component — row-based reason list with icons and team section.
 * HOW: Maps whyReasons to centered rows. Each row: icon box + gold rule + text block.
 *      Team section below with portrait cards and gold corner brackets.
 * CALLED BY: HomePage.js
 */
function WhyChooseUs() {
  return (
    <section id="why-us" className="whySection">

      {/* ── Section header ── */}
      <div className="whyHeader">
        <div className="whyEyebrow">
          <span className="whyEyebrowDot" />
          Why Choose Us
        </div>
        <h2 className="whyTitle">The Triconix Difference</h2>
        <div className="whyDivider" />
      </div>

      {/* ── Reason rows ── */}
      <div className="whyRows">
        {whyReasons.map(({ num, title, body, Icon }) => (
          <div className="whyRow" key={num}>
            <div className="whyRowIcon">
              <div className="whyIconBox"><Icon /></div>
              <span className="whyRowNum">{num}</span>
            </div>
            <div className="whyRowRule" />
            <div className="whyRowBody">
              <h3 className="whyRowTitle">{title}</h3>
              <p className="whyRowText">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gold separator ── */}
      <div className="whySeparator" />

      {/* ── Team section ── */}
      <div className="whyTeamHeader">
        <div className="whyEyebrow">
          <span className="whyEyebrowDot" />
          Our Leadership
        </div>
        <h2 className="whyTitle">The Professionals Behind Every Project</h2>
      </div>

      <div className="whyTeam">
        {teamMembers.map((member) => (
          <div className="whyTeamCard" key={member.name}>
            <div className="whyTeamImgWrap">
              <img className="whyTeamImg" src={member.imgSrc} alt={member.name} loading="lazy" />
              <span className="whyTeamCornerTl" />
              <span className="whyTeamCornerBr" />
            </div>
            <div className="whyTeamInfo">
              <p className="whyTeamName">{member.name}</p>
              <p className="whyTeamTitle">{member.title}</p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}

export default WhyChooseUs;