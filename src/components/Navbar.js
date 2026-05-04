/**
 * WHAT: Triconix Construction navbar — luxury dark gold aesthetic.
 * HOW: Fixed position with backdrop blur. Brand row + 3 nav rows matching the
 *      original site structure. Scroll state shrinks brand area.
 *      Mobile collapses to hamburger menu.
 * CALLED BY: App.js
 */

import React, { useState, useEffect } from "react";
import "../css/Navbar.css";

const primaryLinks = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Interior Projects", href: "#interior-projects" },
  { label: "Construction Works", href: "#construction-works" },
  { label: "Building Cost Calculator", href: "#cost-calculator" },
  { label: "Design Services", href: "#design-services" },
  { label: "Type of Finishes", href: "#finishes" },
];

const secondaryLinks = [
  { label: "Earthquake Faultline", href: "#earthquake" },
  { label: "Building Permits", href: "#permits" },
  { label: "Home Loan Calculator", href: "#loan" },
];

const tertiaryLinks = [
  { label: "Contact Us !!", href: "#contact" },
  { label: "Fengshui", href: "#fengshui" },
  { label: "Why Choose Us?", href: "#why-us" },
];

/**
 * WHAT: Navbar component with scroll-aware shrinking and mobile hamburger.
 * HOW: useEffect attaches a scroll listener that sets scrolled state.
 *      Active link is tracked by click. Mobile menu toggled by hamburger button.
 * CALLED BY: HomePage.js
 */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * WHAT: Sets active nav link and closes mobile menu on click.
   * HOW: Updates activeLink state and collapses menuOpen.
   * CALLED BY: onClick on each navLink anchor.
   */
  const handleLinkClick = (href) => {
    setActiveLink(href);
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? "navbarScrolled" : ""}`}>
      {/* ── Brand row ── */}
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

        <button
          className={`navbarHamburger ${menuOpen ? "hamburgerOpen" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Nav rows ── */}
      <div className={`navbarLinks ${menuOpen ? "navbarLinksOpen" : ""}`}>
        <div className="navRow navRowPrimary">
          {primaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navLink ${activeLink === link.href ? "navLinkActive" : ""}`}
              onClick={() => handleLinkClick(link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="navRow navRowSecondary">
          {secondaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navLink navLinkSecondary ${activeLink === link.href ? "navLinkActive" : ""}`}
              onClick={() => handleLinkClick(link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="navRow navRowSecondary">
          {tertiaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navLink navLinkSecondary ${activeLink === link.href ? "navLinkActive" : ""}`}
              onClick={() => handleLinkClick(link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;