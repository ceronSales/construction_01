/**
 * WHAT: HomePage — assembles all sections of the Triconix Construction homepage.
 * HOW: Renders Navbar fixed at top, then sections in UX-optimised order:
 *      emotional hook → trust → proof → services → tools → info → conversion.
 * CALLED BY: App.js
 */

import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import WhyChooseUs from "../components/WhyChooseUs";
import ProjectsSection from "../components/ProjectsSection";
import InteriorProjects from "../components/InteriorProjects";
import ConstructionWorks from "../components/ConstructionWorks";
import DesignServices from "../components/DesignServices";
import CostCalculator from "../components/CostCalculator";
import HomeLoanCalculator from "../components/HomeLoanCalculator";
import AppointmentSection from "../components/AppointmentSection";
import ContactSection from "../components/ContactSection";
import "../css/HomePage.css";

// Placeholder sections — built components are excluded from this list
const placeholderSections = [
  { id: "earthquake", label: "Earthquake Faultline" },
  { id: "permits",    label: "Building Permits" },
  { id: "fengshui",   label: "Fengshui" },
];

function HomePage() {
  return (
    <div className="homePage">
      {/* ── 1. Fixed Navigation ── */}
      <Navbar />

      {/* ── 2. Hero — cinematic scroll sequence, emotional hook ── */}
      <HeroSection />

      {/* ── 3. Why Choose Us — establish trust at peak attention ── */}
      <WhyChooseUs />

      {/* ── 4. Projects — proof of work validates trust claims ── */}
      <ProjectsSection />

      {/* ── 5. Interior Projects — deeper showcase after main projects ── */}
      <InteriorProjects />

      {/* ── 6. Construction Works — explain services after showing results ── */}
      <ConstructionWorks />

      {/* ── 7. Design Services — companion to construction works ── */}
      <DesignServices />

      {/* ── 8. Building Cost Calculator — tool for engaged prospects ── */}
      <CostCalculator />

      {/* ── 9. Home Loan Calculator — natural follow-up to cost calculator ── */}
      <HomeLoanCalculator />

      {/* ── 10–12. Informational placeholders ── */}
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

      {/* ── 13. Book Appointment — pre-contact conversion step ── */}
      <AppointmentSection />

      {/* ── 14. Contact Us — final call to action ── */}
      <ContactSection />
    </div>
  );
}

export default HomePage;