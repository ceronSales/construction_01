/**
 * WHAT: ContactSection — two-column contact section.
 *       Col 1: email composer UI (demo — prompts buyer to make functional).
 *       Col 2: interactive 3D globe (Three.js) pinned to Triconix HQ,
 *              66 JP Rizal St, Nangka, Marikina City, Philippines 1808.
 * HOW:  Left column is a styled form shell — inputs, textarea, send button.
 *       Right column mounts a Three.js WebGLRenderer with a sphere geometry
 *       textured with an Earth image. The globe auto-rotates, then on mount
 *       it tilts and locks to show the Philippines. A gold pin marker and
 *       pulsing ring are placed at lat/lon 14.63°N 121.10°E (Marikina).
 * CALLED BY: HomePage.js
 */

import React, { useState } from "react";
import "../css/ContactSection.css";

/**
 * WHAT: PhilippinesMap — SVG map of the Philippines with a pulsing gold
 *       pin on Marikina City and a tooltip label. No globe, no Three.js.
 * HOW:  Renders an inline SVG using accurate simplified island paths for
 *       Luzon, Visayas, and Mindanao. Marikina is at approx SVG coords
 *       (212, 148) within the 340×500 viewBox. CSS keyframes drive the
 *       pulse ring animation.
 * CALLED BY: ContactSection
 */
function PhilippinesMap() {
  return (
    <div className="contactMapSvgWrap">
      <svg
        className="contactMapSvg"
        viewBox="0 0 340 520"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Map of the Philippines with Marikina City pin"
      >
        {/* ── Ocean background ── */}
        <defs>
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="#0d2a4a" />
            <stop offset="100%" stopColor="#061520" />
          </radialGradient>
          <filter id="islandGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="340" height="520" fill="url(#oceanGrad)" rx="10" />

        {/* ── Grid lines ── */}
        <g stroke="rgba(201,168,76,0.07)" strokeWidth="0.5">
          {[60,120,180,240,300,360,420,480].map(y => <line key={y} x1="0" y1={y} x2="340" y2={y}/>)}
          {[40,80,120,160,200,240,280,320].map(x => <line key={x} x1={x} y1="0" x2={x} y2="520"/>)}
        </g>

        {/* ── Luzon (main northern island) ── */}
        <path
          d="M 155,18 C 160,15 170,14 178,18 L 185,28 C 192,24 200,22 208,26
             L 218,38 C 228,42 232,50 228,60 L 235,68 C 240,76 238,86 230,90
             L 228,102 C 232,110 230,120 222,124 L 218,136 C 222,144 220,155 212,158
             L 208,168 C 204,178 195,182 186,178 L 178,186 C 170,192 160,192 152,186
             L 144,178 C 136,174 130,165 132,155 L 126,146 C 120,138 120,126 128,120
             L 122,110 C 116,100 118,88 126,84 L 120,72 C 116,62 120,50 130,46
             L 134,34 C 138,24 148,18 155,18 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8" filter="url(#islandGlow)"
        />
        {/* Luzon peninsula extensions */}
        <path d="M 178,18 C 185,10 198,8 205,16 L 208,26 L 200,22 L 192,24 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>
        <path d="M 130,46 C 122,42 114,46 112,54 L 118,62 L 120,50 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>
        <path d="M 132,155 C 124,158 118,168 122,178 L 132,182 L 126,170 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>
        <path d="M 186,178 C 192,188 196,200 190,210 L 180,214 L 186,200 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>

        {/* ── Mindoro ── */}
        <path d="M 140,205 C 148,200 158,202 162,212 L 165,228 C 162,238 154,242 146,238 L 138,224 C 134,214 134,208 140,205 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Palawan (long diagonal island) ── */}
        <path d="M 82,220 C 86,212 94,210 100,216 L 112,250 C 118,266 122,282 118,295
                 L 108,310 C 102,318 92,318 88,310 L 76,276 C 70,260 72,240 82,220 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Samar ── */}
        <path d="M 240,190 C 248,186 256,188 260,198 L 264,214 C 262,224 254,228 246,224 L 238,210 C 234,200 234,194 240,190 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Leyte ── */}
        <path d="M 232,222 C 238,218 246,220 248,230 L 250,248 C 248,258 240,260 234,254 L 228,238 C 225,228 226,224 232,222 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Cebu ── */}
        <path d="M 208,228 C 212,222 218,222 220,230 L 222,254 C 220,262 214,264 210,257 L 205,234 C 204,228 206,226 208,228 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Negros ── */}
        <path d="M 185,224 C 192,218 200,220 202,230 L 204,256 C 202,268 194,272 188,266 L 182,242 C 179,230 180,226 185,224 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Panay ── */}
        <path d="M 155,210 C 166,204 180,206 184,218 L 186,232 C 184,242 174,246 164,242 L 152,228 C 146,218 146,214 155,210 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Bohol ── */}
        <path d="M 220,270 C 228,266 236,268 238,278 L 236,292 C 232,300 224,300 220,292 L 216,278 C 215,272 217,270 220,270 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8"/>

        {/* ── Mindanao (large southern island) ── */}
        <path d="M 168,320 C 178,310 196,308 210,314 L 228,322 C 244,326 256,336 260,352
                 L 268,368 C 272,384 268,400 256,408 L 244,418 C 232,426 216,426 204,418
                 L 190,412 C 176,408 164,396 162,380 L 158,362 C 154,344 156,328 168,320 Z"
          fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.8" filter="url(#islandGlow)"/>
        {/* Mindanao peninsula */}
        <path d="M 256,408 C 264,416 268,428 262,438 L 250,444 L 256,428 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>
        <path d="M 162,380 C 152,386 144,396 148,408 L 158,414 L 156,396 Z" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>

        {/* ── Sulu archipelago (small dots) ── */}
        {[[128,390],[112,408],[98,424],[84,440]].map(([x,y],i) => (
          <ellipse key={i} cx={x} cy={y} rx="8" ry="5" fill="#1e3d1a" stroke="#2a5a22" strokeWidth="0.6"/>
        ))}

        {/* ── Marikina City highlight on Luzon ── */}
        {/* Subtle circle to show Metro Manila area */}
        <circle cx="205" cy="148" r="10" fill="rgba(201,168,76,0.12)" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>

        {/* ── Pulsing pin rings ── */}
        <circle cx="205" cy="148" r="16" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" className="contactPinRing contactPinRing1"/>
        <circle cx="205" cy="148" r="22" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8" className="contactPinRing contactPinRing2"/>
        <circle cx="205" cy="148" r="28" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.6" className="contactPinRing contactPinRing3"/>

        {/* ── Pin stem + head ── */}
        <line x1="205" y1="148" x2="205" y2="132" stroke="#c9a84c" strokeWidth="1.5"/>
        <circle cx="205" cy="130" r="5" fill="#c9a84c"/>
        <circle cx="205" cy="130" r="3" fill="#fff8e1"/>

        {/* ── Tooltip label ── */}
        <g>
          <rect x="214" y="118" width="108" height="34" rx="4" fill="rgba(8,6,4,0.88)" stroke="rgba(201,168,76,0.5)" strokeWidth="0.8"/>
          <text x="220" y="131" fontFamily="Raleway, sans-serif" fontSize="7.5" fontWeight="700" letterSpacing="1" fill="#c9a84c" textAnchor="start">TRICONIX HQ</text>
          <text x="220" y="143" fontFamily="Lato, sans-serif" fontSize="7" fill="#d4c9b0" textAnchor="start">Marikina City, PH 1808</text>
        </g>

        {/* ── Country label ── */}
        <text x="170" y="500" fontFamily="Raleway, sans-serif" fontSize="9" fontWeight="600" letterSpacing="3" fill="rgba(201,168,76,0.35)" textAnchor="middle">PHILIPPINES</text>
      </svg>
    </div>
  );
}

/**
 * WHAT: ContactSection — full two-column contact layout.
 * HOW:  Left col = email composer shell (demo). Right col = GlobeMap.
 *       Form submission shows a demo notice instead of sending.
 * CALLED BY: HomePage.js
 */
function ContactSection() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [showNotice, setShowNotice] = useState(false);

  /**
   * WHAT: Updates form state on input change.
   * HOW:  Uses field name attribute as key to spread into existing state.
   * CALLED BY: input onChange events
   */
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /**
   * WHAT: Handles form submit — shows demo purchase notice.
   * HOW:  Prevents default, displays notice overlay for 3.5s.
   * CALLED BY: form onSubmit
   */
  function handleSubmit(e) {
    e.preventDefault();
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3500);
  }

  return (
    <section id="contact" className="contactSection">

      {/* ── Section header ── */}
      <div className="contactHeader">
        <span className="contactEyebrow">Get In Touch</span>
        <h2 className="contactTitle">Contact <span className="contactTitleGold">Us</span></h2>
        <p className="contactSubtitle">
          Reach out to Triconix Construction Corporation for consultations,
          project inquiries, and site visits.
        </p>
      </div>

      {/* ── Two-column body ── */}
      <div className="contactBody">

        {/* ── Column 1: Email composer ── */}
        <div className="contactComposer">
          <div className="contactComposerHeader">
            <div className="contactComposerDots">
              <span className="contactDot contactDotRed"   />
              <span className="contactDot contactDotAmber" />
              <span className="contactDot contactDotGreen" />
            </div>
            <span className="contactComposerTitle">New Message</span>
          </div>

          <form className="contactForm" onSubmit={handleSubmit} noValidate>
            {/* To field — pre-filled */}
            <div className="contactFormRow contactFormRowTo">
              <label className="contactFormLabel">To</label>
              <span className="contactFormStatic">info@triconixconstruction.com</span>
            </div>

            {/* From */}
            <div className="contactFormRow">
              <label className="contactFormLabel" htmlFor="contactName">From</label>
              <input
                id="contactName"
                className="contactFormInput"
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            {/* Reply-to email */}
            <div className="contactFormRow">
              <label className="contactFormLabel" htmlFor="contactEmail">Reply-To</label>
              <input
                id="contactEmail"
                className="contactFormInput"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            {/* Subject */}
            <div className="contactFormRow">
              <label className="contactFormLabel" htmlFor="contactSubject">Subject</label>
              <input
                id="contactSubject"
                className="contactFormInput"
                type="text"
                name="subject"
                placeholder="Project inquiry / Consultation / Quote request"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            {/* Message body */}
            <textarea
              id="contactMessage"
              className="contactFormTextarea"
              name="message"
              placeholder="Write your message here…"
              value={form.message}
              onChange={handleChange}
              rows={7}
            />

            {/* Send bar */}
            <div className="contactFormSendBar">
              <button className="contactSendBtn" type="submit">
                <span className="contactSendBtnIcon">✉</span>
                Send Message
              </button>
              <span className="contactDemoTag">Demo — contact us to activate</span>
            </div>
          </form>

          {/* Demo notice overlay */}
          {showNotice && (
            <div className="contactDemoNotice">
              <span className="contactDemoNoticeIcon">🔒</span>
              <p>This form is a <strong>demo</strong>.</p>
              <p>Purchase this site to activate live email delivery.</p>
            </div>
          )}
        </div>

        {/* ── Column 2: Philippines Map ── */}
        <div className="contactMapCol">
          <PhilippinesMap />
          <div className="contactAddressCard">
            <span className="contactAddressIcon">📍</span>
            <div className="contactAddressText">
              <strong>Triconix Construction Corporation</strong>
              <span>66 JP Rizal St., Nangka</span>
              <span>Marikina City, Philippines 1808</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default ContactSection;