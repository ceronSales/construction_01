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
import ProjectsSection from "../components/ProjectsSection";
import CostCalculator from "../components/CostCalculator";
import HomeLoanCalculator from "../components/HomeLoanCalculator";
import DesignServices from "../components/DesignServices";
import ConstructionWorks from "../components/ConstructionWorks";
import AppointmentSection from "../components/AppointmentSection";
import "../css/HomePage.css";

// Placeholder sections — built components are excluded from this list
const placeholderSections = [
  { id: "finishes",           label: "Type of Finishes" },
  { id: "earthquake",         label: "Earthquake Faultline" },
  { id: "permits",            label: "Building Permits" },
  { id: "fengshui",           label: "Fengshui" },
];

function HomePage() {
  return (
    <div className="homePage">
      {/* ── Fixed Navigation ── */}
      <Navbar />

      {/* ── 50% — Scroll Construction Sequence Hero ── */}
      <HeroSection />

      {/* ── Why Choose Us — build trust before showing tools ── */}
      <WhyChooseUs />

      {/* ── Design Services — what we offer ── */}
      <DesignServices />

      {/* ── Construction Works — what we offer ── */}
      <ConstructionWorks />

      {/* ── Interior Projects — proof of work ── */}
      <InteriorProjects />

      {/* ── Projects — fullscreen video bg + thumbnail slider ── */}
      <ProjectsSection />

      {/* ── Building Cost Calculator — visitor is now ready to calculate ── */}
      <CostCalculator />

      {/* ── Home Loan Calculator — natural next question after cost estimate ── */}
      <HomeLoanCalculator />

      {/* ── Remaining sections — reference material ── */}
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

      {/* ── Book a Consultation — close the deal ── */}
      <AppointmentSection />

      {/* ── Contact Us — two-column composer + 3D globe ── */}
      <ContactSection />
    </div>
  );
}

export default HomePage;