/**
 * WHAT: Triconix Construction navbar — luxury dark gold aesthetic.
 * HOW: Single brand bar fixed at top. MENU ≡ button sits right-side.
 *      Clicking opens a full-height slide-in panel from the right with all nav links.
 *      Clicking ✕ or any link closes the panel. Scroll state shrinks brand area.
 * CALLED BY: HomePage.js
 */

import React, { useState, useEffect } from "react";
import "../css/Navbar.css";

// All navigation links consolidated into one flat list for the slide-in panel
const allLinks = [
  { label: "Home",                     href: "#home" },
  { label: "Why Choose Us?",           href: "#why-us" },
  { label: "Projects",                 href: "#projects" },
  { label: "Interior Projects",        href: "#interior-projects" },
  { label: "Construction Works",       href: "#construction-works" },
  { label: "Design Services",          href: "#design-services" },
  { label: "Building Cost Calculator", href: "#cost-calculator" },
  { label: "Home Loan Calculator",     href: "#loan" },
  { label: "Earthquake Faultline",     href: "#earthquake" },
  { label: "Building Permits",         href: "#permits" },
  { label: "Fengshui",                 href: "#fengshui" },
  { label: "Book Appointment",         href: "#appointment" },
  { label: "Contact Us",               href: "#contact" },
];

/**
 * WHAT: Navbar component — brand bar + right-side MENU slide-in panel.
 * HOW: useEffect attaches scroll listener for shrink state.
 *      menuOpen toggles the slide-in panel. Body scroll is locked while panel is open.
 * CALLED BY: HomePage.js
 */
function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  // Scroll shrink effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when panel is open to prevent background scroll
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /**
   * WHAT: Sets active link and closes the panel on nav click.
   * HOW: Updates activeLink state, collapses menuOpen.
   * CALLED BY: onClick on each panelLink anchor.
   */
  const handleLinkClick = (href) => {
    setActiveLink(href);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── Fixed brand bar ── */}
      <nav className={`navbar ${scrolled ? "navbarScrolled" : ""}`}>
        <div className="navbarBrand">
          <img
            src="https://static.wixstatic.com/media/982f32_45063b7ef8494eb4a11e586503dea6ad~mv2.jpg/v1/crop/x_377,y_524,w_2300,h_1988/fill/w_216,h_187,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20101_edited.jpg"
            alt="Triconix Construction Corporation"
            className="navbarLogo"
          />
          <div className="navbarDivider" />
          <div className="navbarTagline">
            <span className="navbarTitle">TRiCONiX</span>
            <span className="navbarSubtitle">Construction Corporation</span>
            <span className="navbarMotto">Architects · Engineers · Builders</span>
          </div>

          {/* ── MENU button — always visible, right side ── */}
          <button
            className={`navMenuBtn ${menuOpen ? "navMenuBtnOpen" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="navMenuBtnIcon">{menuOpen ? "✕" : "≡"}</span>
            <span className="navMenuBtnLabel">{menuOpen ? "CLOSE" : "MENU"}</span>
          </button>
        </div>
      </nav>

      {/* ── Backdrop overlay — clicking it closes panel ── */}
      <div
        className={`navPanelBackdrop ${menuOpen ? "navPanelBackdropVisible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Slide-in navigation panel from right ── */}
      <aside className={`navPanel ${menuOpen ? "navPanelOpen" : ""}`} aria-hidden={!menuOpen}>
        <div className="navPanelHeader">
          <span className="navPanelTitle">Navigation</span>
          <button
            className="navPanelClose"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div className="navPanelDivider" />

        <nav className="navPanelLinks">
          {allLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`panelLink ${activeLink === link.href ? "panelLinkActive" : ""}`}
              onClick={() => handleLinkClick(link.href)}
            >
              <span className="panelLinkDot" />
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navPanelFooter">
          <span className="navPanelMotto">Architects · Engineers · Builders</span>
        </div>
      </aside>
    </>
  );
}

export default Navbar;