/**
 * WHAT: AppointmentSection — branded section with a centered modal form for booking consultations.
 * HOW:  "Book a Consultation" button opens a centered modal. Modal contains a custom
 *       form: First Name, Surname, Email, Phone, Purpose dropdown + textarea.
 *       On submit: validates → saves to Firestore "appointments" → opens Google Calendar
 *       in new tab → shows success message → auto-closes modal.
 *       Modal closes on backdrop click, Escape key, or close button.
 *       Body scroll is locked while modal is open.
 * CALLED BY: HomePage.js
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import "../css/AppointmentSection.css";

const BOOKING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/" +
  "AcZssZ38K8xNO8WC9y09yHtuHsJUK_aysITVv7-ErjRT1829rbDyNAits_lAVFF5xTI3J4PlcZiNNetL";

const EMPTY_FORM = {
  firstName: "",
  surname:   "",
  email:     "",
  phone:     "",
  purpose:   "",
};

const BOOKING_BENEFITS = [
  { icon: "🗓", title: "Free Consultation",  desc: "30-minute session with our senior architect or engineer — no commitment required." },
  { icon: "📐", title: "Project Assessment", desc: "We'll review your lot size, budget range, and design preferences on the call." },
  { icon: "💰", title: "Cost Estimate",      desc: "Receive a ballpark cost breakdown for your project type and finish level." },
  { icon: "📋", title: "Permit Guidance",    desc: "Get a checklist of building permits required for your specific municipality." },
];

const PURPOSE_SUGGESTIONS = [
  "New Home Construction",
  "Home Renovation / Extension",
  "Architectural Design Consultation",
  "Building Permit Assistance",
  "Cost Estimation for My Project",
  "Interior Design Discussion",
  "Structural Assessment",
  "Other",
];

/**
 * WHAT: AppointmentSection — renders section + modal booking form.
 * HOW:  isModalOpen drives modal visibility. form state holds all input values.
 *       submitState: "idle" | "submitting" | "success" | "error"
 *       On submit: validate → Firestore addDoc → open Google Calendar → success state.
 * CALLED BY: HomePage.js
 */
function AppointmentSection() {
  const [isVisible,   setIsVisible]   = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});
  const [submitState, setSubmitState] = useState("idle");
  const [errorMsg,    setErrorMsg]    = useState("");

  const sectionRef   = useRef(null);
  const firstInputRef = useRef(null);

  /* ── Section fade-in on scroll ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /**
   * WHAT: Opens modal and locks page scroll.
   * HOW:  Sets isModalOpen true, locks body overflow, auto-focuses first input.
   * CALLED BY: onClick on Book buttons.
   */
  function openModal() {
    setIsModalOpen(true);
    setSubmitState("idle");
    setErrors({});
    document.body.style.overflow = "hidden";
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }

  /**
   * WHAT: Closes modal and restores page scroll.
   * HOW:  Sets isModalOpen false, restores body overflow. Delays form reset for animation.
   * CALLED BY: backdrop click, Escape key, close button, auto-close after success.
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitState("idle");
      setErrorMsg("");
    }, 350);
  }, []);

  /* ── Escape key listener ── */
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && isModalOpen) closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, closeModal]);

  /**
   * WHAT: Updates a form field value and clears its error.
   * HOW:  Uses input name attribute to key into form state.
   * CALLED BY: onChange on each input / textarea.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  /**
   * WHAT: Validates all form fields and returns an error map.
   * HOW:  Checks required, email regex, phone regex. Empty map = valid.
   * CALLED BY: handleSubmit.
   */
  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.surname.trim())   e.surname   = "Surname is required.";
    if (!form.email.trim())     e.email     = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                e.email     = "Please enter a valid email address.";
    if (!form.phone.trim())     e.phone     = "Phone number is required.";
    else if (!/^[0-9+\s\-()]{7,20}$/.test(form.phone))
                                e.phone     = "Please enter a valid phone number.";
    if (!form.purpose.trim())   e.purpose   = "Please describe your purpose of appointment.";
    return e;
  }

  /**
   * WHAT: Submits the form — validates, saves to Firestore, opens Google Calendar.
   * HOW:  1. Validate → show errors if invalid.
   *       2. setSubmitState "submitting".
   *       3. addDoc to Firestore "appointments" collection.
   *       4. Open Google Calendar booking URL in new tab.
   *       5. setSubmitState "success" → auto-close after 3.5s.
   * CALLED BY: form onSubmit.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitState("submitting");

    try {
      await addDoc(collection(db, "appointments"), {
        firstName:   form.firstName.trim(),
        surname:     form.surname.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone.trim(),
        purpose:     form.purpose.trim(),
        submittedAt: serverTimestamp(),
        status:      "pending",
      });

      window.open(BOOKING_URL, "_blank", "noopener,noreferrer");
      setSubmitState("success");
      setTimeout(() => closeModal(), 3500);

    } catch (err) {
      console.error("Appointment save error:", err);
      setErrorMsg("Something went wrong. Please try again or contact us directly.");
      setSubmitState("error");
    }
  }

  return (
    <>
      {/* ── SECTION ── */}
      <section
        id="appointment"
        className={`appointmentSection ${isVisible ? "appointmentSectionVisible" : ""}`}
        ref={sectionRef}
      >
        <div className="appointmentBg" aria-hidden="true" />
        <div className="appointmentInner">

          {/* LEFT */}
          <div className="appointmentLeft">
            <div className="appointmentEyebrow">
              <span className="appointmentEyebrowDot" />
              Book a Consultation
            </div>
            <h2 className="appointmentHeading">
              Let's Build Your
              <span className="appointmentHeadingGold"> Dream Home</span>
              <br />Together
            </h2>
            <p className="appointmentSubcopy">
              Schedule a free consultation with the Triconix team. Fill out
              the form, tell us what you need, then pick a time that works —
              your booking saves directly to our Google Calendar.
            </p>
            <div className="appointmentDivider" />
            <div className="appointmentBenefits">
              {BOOKING_BENEFITS.map((b) => (
                <div key={b.title} className="appointmentBenefit">
                  <span className="appointmentBenefitIcon">{b.icon}</span>
                  <div className="appointmentBenefitText">
                    <span className="appointmentBenefitTitle">{b.title}</span>
                    <span className="appointmentBenefitDesc">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="appointmentDivider" />
            <button className="appointmentBookBtn" onClick={openModal}>
              <span>Book a Free Consultation</span>
              <span className="appointmentBookBtnArrow">→</span>
            </button>
            <div className="appointmentContactNudge">
              <span className="appointmentNudgeLabel">Prefer to call or message?</span>
              <div className="appointmentNudgeLinks">
                <a href="tel:+639XXXXXXXXX"              className="appointmentNudgeLink">📞 Call Us</a>
                <a href="mailto:facebookceron@gmail.com" className="appointmentNudgeLink">✉ Email Us</a>
                <a href="#contact"                       className="appointmentNudgeLink">💬 Send Message</a>
              </div>
            </div>
          </div>

          {/* RIGHT — visual card */}
          <div className="appointmentRight">
            <div className="appointmentVisualCard">
              <div className="appointmentVisualCardBg" aria-hidden="true" />
              <div className="appointmentVisualCardContent">
                <span className="appointmentVisualNum">01</span>
                <h3 className="appointmentVisualTitle">From Consultation<br />to Completion</h3>
                <p className="appointmentVisualDesc">
                  Every great home starts with a conversation.
                  Book your slot and let's talk about your vision.
                </p>
                <button className="appointmentVisualBtn" onClick={openModal}>
                  Schedule Now →
                </button>
              </div>
              <div className="appointmentVisualSteps">
                {["Book Slot", "Meet Team", "Get Estimate", "Break Ground"].map((s, i) => (
                  <div key={s} className="appointmentVisualStep">
                    <span className="appointmentVisualStepNum">0{i + 1}</span>
                    <span className="appointmentVisualStepLabel">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div
          className="apptBackdrop"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Book a Consultation"
        >
          <div className="apptModal">

            {/* Header */}
            <div className="apptModalHeader">
              <div>
                <span className="apptModalEyebrow">Triconix Construction</span>
                <h3 className="apptModalTitle">Book a Consultation</h3>
              </div>
              <button className="apptModalClose" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {/* Success state */}
            {submitState === "success" ? (
              <div className="apptSuccess">
                <div className="apptSuccessIcon">✓</div>
                <h4 className="apptSuccessTitle">Request Submitted!</h4>
                <p className="apptSuccessDesc">
                  Your details have been saved. Google Calendar opened in a new tab —
                  please pick your preferred date and time. We'll see you soon!
                </p>
                <p className="apptSuccessNote">This window will close automatically…</p>
              </div>
            ) : (

              /* Form */
              <form className="apptForm" onSubmit={handleSubmit} noValidate>

                {/* Row 1 — First Name + Surname */}
                <div className="apptRow">
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptFirstName">
                      First Name <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptFirstName"
                      name="firstName"
                      type="text"
                      className={`apptInput ${errors.firstName ? "apptInputErr" : ""}`}
                      placeholder="e.g. Juan"
                      value={form.firstName}
                      onChange={handleChange}
                      ref={firstInputRef}
                      autoComplete="given-name"
                      maxLength={50}
                    />
                    {errors.firstName && <span className="apptErrMsg">{errors.firstName}</span>}
                  </div>

                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptSurname">
                      Surname <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptSurname"
                      name="surname"
                      type="text"
                      className={`apptInput ${errors.surname ? "apptInputErr" : ""}`}
                      placeholder="e.g. dela Cruz"
                      value={form.surname}
                      onChange={handleChange}
                      autoComplete="family-name"
                      maxLength={50}
                    />
                    {errors.surname && <span className="apptErrMsg">{errors.surname}</span>}
                  </div>
                </div>

                {/* Row 2 — Email + Phone */}
                <div className="apptRow">
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptEmail">
                      Email Address <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptEmail"
                      name="email"
                      type="email"
                      className={`apptInput ${errors.email ? "apptInputErr" : ""}`}
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={100}
                    />
                    {errors.email && <span className="apptErrMsg">{errors.email}</span>}
                  </div>

                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptPhone">
                      Phone Number <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptPhone"
                      name="phone"
                      type="tel"
                      className={`apptInput ${errors.phone ? "apptInputErr" : ""}`}
                      placeholder="+63 9XX XXX XXXX"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      maxLength={20}
                    />
                    {errors.phone && <span className="apptErrMsg">{errors.phone}</span>}
                  </div>
                </div>

                {/* Row 3 — Purpose quick-select */}
                <div className="apptField apptFieldFull">
                  <label className="apptLabel" htmlFor="apptPurposeSelect">
                    Purpose of Appointment
                    <span className="apptLabelHint"> — quick select</span>
                  </label>
                  <select
                    id="apptPurposeSelect"
                    className="apptSelect"
                    onChange={(e) => {
                      if (e.target.value) {
                        setForm(prev => ({ ...prev, purpose: e.target.value }));
                        if (errors.purpose) setErrors(prev => ({ ...prev, purpose: "" }));
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a purpose…</option>
                    {PURPOSE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Row 4 — Purpose textarea */}
                <div className="apptField apptFieldFull">
                  <label className="apptLabel" htmlFor="apptPurpose">
                    Tell Us More About Your Project <span className="apptRequired">*</span>
                  </label>
                  <textarea
                    id="apptPurpose"
                    name="purpose"
                    className={`apptTextarea ${errors.purpose ? "apptInputErr" : ""}`}
                    placeholder="Describe your project — lot location, estimated budget, number of floors, preferred style, timeline, or any questions for our team…"
                    value={form.purpose}
                    onChange={handleChange}
                    rows={5}
                    maxLength={1000}
                  />
                  <div className="apptTextareaFooter">
                    {errors.purpose && <span className="apptErrMsg">{errors.purpose}</span>}
                    <span className="apptCharCount">{form.purpose.length} / 1000</span>
                  </div>
                </div>

                {/* Firestore error */}
                {submitState === "error" && (
                  <div className="apptSubmitError">{errorMsg}</div>
                )}

                {/* Footer */}
                <div className="apptFormFooter">
                  <p className="apptFormNote">
                    After submitting, Google Calendar will open so you can pick your
                    preferred date and time. Your details are saved securely.
                  </p>
                  <button
                    type="submit"
                    className={`apptSubmitBtn ${submitState === "submitting" ? "apptSubmitBtnLoading" : ""}`}
                    disabled={submitState === "submitting"}
                  >
                    {submitState === "submitting" ? (
                      <><span className="apptSubmitSpinner" /> Saving…</>
                    ) : (
                      "Confirm & Choose a Date →"
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default AppointmentSection;
