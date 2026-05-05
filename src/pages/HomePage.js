/**
 * WHAT: HomePage — assembles all sections of the Triconix Construction homepage.
 * HOW: Renders Navbar fixed at top, HeroSection as the 50% scroll sequence,
 *      followed by placeholder sections for each nav link. Sections will be
 *      built out per instruction.
 * CALLED BY: App.js
 */

import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import InteriorProjects from "../components/InteriorProjects";
import WhyChooseUs from "../components/WhyChooseUs";
import ContactSection from "../components/ContactSection";
import "../css/HomePage.css";

// Placeholder sections — contact, interior-projects and why-us are now built components
const placeholderSections = [
  { id: "projects",           label: "Projects" },
  { id: "construction-works", label: "Construction Works" },
  { id: "cost-calculator",    label: "Building Cost Calculator" },
  { id: "design-services",    label: "Design Services" },
  { id: "finishes",           label: "Type of Finishes" },
  { id: "earthquake",         label: "Earthquake Faultline" },
  { id: "permits",            label: "Building Permits" },
  { id: "loan",               label: "Home Loan Calculator" },
  { id: "fengshui",           label: "Fengshui" },
];

function HomePage() {
  return (
    <div className="homePage">
      {/* ── Fixed Navigation ── */}
      <Navbar />

      {/* ── 50% — Scroll Construction Sequence Hero ── */}
      <HeroSection />

      {/* ── Interior Projects — video background carousel ── */}
      <InteriorProjects />

      {/* ── Remaining sections ── */}
      {placeholderSections.map((section) => (
        <section key={section.id} id={section.id} className="homeSection">
          <div className="homeSectionInner">
            <span className="homeSectionBadge">Coming Soon</span>
            <h2 className="homeSectionTitle">{section.label}</h2>
            <p className="homeSectionDesc">
              This section is under construction. Awaiting further instructions.
            </p>
          </div>
        </section>
      ))}

      {/* ── Why Choose Us ── */}
      <WhyChooseUs />

      {/* ── Contact Us — two-column composer + 3D globe ── */}
      <ContactSection />
    </div>
  );
}

export default HomePage;