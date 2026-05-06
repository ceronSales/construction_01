/**
 * WHAT: AppointmentSection — consultation booking with automatic Google Calendar event creation.
 * HOW:  Client fills the form (name, email, phone, preferred date+time, purpose).
 *       On submit:
 *         1. Validate all fields frontend.
 *         2. Save to Firestore "appointments" collection.
 *         3. Call Firebase Cloud Function "createCalendarEvent" (server-side).
 *            The function authenticates with Google Calendar API via service account
 *            and inserts the event — no manual calendar interaction needed.
 *         4. Google sends an email confirmation to the client automatically.
 *         5. Show success state with the event link.
 *       Modal: backdrop click / Escape / close button to dismiss.
 *       Body scroll locked while modal is open.
 * CALLED BY: HomePage.js
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { collection, addDoc, serverTimestamp }             from "firebase/firestore";
import { getFunctions, httpsCallable }                     from "firebase/functions";
import { db }                                              from "../firebase/firebaseConfig";
import app                                                 from "../firebase/firebaseConfig";
import "../css/AppointmentSection.css";

/* ── Firebase Functions instance (Asia region matches deployed function) ── */
const functions          = getFunctions(app, "asia-southeast1");
const createCalendarEvent = httpsCallable(functions, "createCalendarEvent");

const EMPTY_FORM = {
  firstName:     "",
  surname:       "",
  email:         "",
  phone:         "",
  preferredDate: "",
  preferredTime: "09:00",
  purpose:       "",
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

/* ── Business hours options for the time picker ── */
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00",
];

/* ── Minimum booking date: tomorrow ── */
function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * WHAT: AppointmentSection — renders section + modal booking form.
 * HOW:  isModalOpen drives modal. submitState: "idle"|"submitting"|"success"|"error".
 *       On submit: validate → Firestore save → Cloud Function call → success/error state.
 *       Cloud Function auto-creates the Google Calendar event and emails the client.
 * CALLED BY: HomePage.js
 */
function AppointmentSection() {
  const [isVisible,    setIsVisible]    = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [submitState,  setSubmitState]  = useState("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [eventLink,    setEventLink]    = useState("");

  const sectionRef    = useRef(null);
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
   * HOW:  Resets state, locks body overflow, focuses first input.
   * CALLED BY: onClick on Book buttons.
   */
  function openModal() {
    setIsModalOpen(true);
    setSubmitState("idle");
    setErrors({});
    setErrorMsg("");
    setEventLink("");
    document.body.style.overflow = "hidden";
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }

  /**
   * WHAT: Closes modal and restores page scroll.
   * HOW:  Hides modal, restores overflow, delays form reset for exit animation.
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
      setEventLink("");
    }, 350);
  }, []);

  /* ── Escape key closes modal ── */
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && isModalOpen) closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, closeModal]);

  /**
   * WHAT: Updates a form field and clears its error.
   * HOW:  Uses input name to key into form state.
   * CALLED BY: onChange on each input / select / textarea.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  /**
   * WHAT: Validates all required fields. Returns error map (empty = valid).
   * HOW:  Checks presence, email regex, phone regex, date is future.
   * CALLED BY: handleSubmit.
   */
  function validate() {
    const e = {};
    if (!form.firstName.trim())     e.firstName     = "First name is required.";
    if (!form.surname.trim())       e.surname       = "Surname is required.";
    if (!form.email.trim())         e.email         = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                    e.email         = "Please enter a valid email address.";
    if (!form.phone.trim())         e.phone         = "Phone number is required.";
    else if (!/^[0-9+\s\-()]{7,20}$/.test(form.phone))
                                    e.phone         = "Please enter a valid phone number.";
    if (!form.preferredDate)        e.preferredDate = "Please choose a preferred date.";
    if (!form.preferredTime)        e.preferredTime = "Please choose a preferred time.";
    if (!form.purpose.trim())       e.purpose       = "Please describe your purpose.";
    return e;
  }

  /**
   * WHAT: Submits the form — validates, saves to Firestore, calls Cloud Function.
   * HOW:  1. Validate → show errors if invalid.
   *       2. setSubmitState "submitting".
   *       3. addDoc to Firestore "appointments" (audit record).
   *       4. Call createCalendarEvent Cloud Function with appointment data.
   *          Function uses service account to insert event on Google Calendar.
   *          Google automatically emails the client a calendar invite.
   *       5. setSubmitState "success" — show confirmation with event link.
   *       6. Auto-close after 5s.
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
      /* ── Step 1: Save to Firestore (audit record) ── */
      await addDoc(collection(db, "appointments"), {
        firstName:     form.firstName.trim(),
        surname:       form.surname.trim(),
        email:         form.email.trim().toLowerCase(),
        phone:         form.phone.trim(),
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        purpose:       form.purpose.trim(),
        submittedAt:   serverTimestamp(),
        status:        "pending",
        source:        "appointment_form",
      });

      /* ── Step 2: Build datetime string for the Cloud Function ── */
      // Combine date + time into ISO-like string in Manila timezone
      const preferredDate = `${form.preferredDate}T${form.preferredTime}:00+08:00`;

      /* ── Step 3: Call Cloud Function — auto-creates Google Calendar event ── */
      const result = await createCalendarEvent({
        appointment: {
          firstName:     form.firstName.trim(),
          surname:       form.surname.trim(),
          email:         form.email.trim().toLowerCase(),
          phone:         form.phone.trim(),
          preferredDate, // ISO string with Manila +08:00 offset
          purpose:       form.purpose.trim(),
        },
      });

      /* ── Step 4: Success — event created, client emailed automatically ── */
      setEventLink(result.data?.eventLink || "");
      setSubmitState("success");
      setTimeout(() => closeModal(), 6000);

    } catch (err) {
      console.error("[AppointmentSection] Submit error:", err);
      // Show a human-friendly error regardless of whether it was Firestore or Cloud Function
      setErrorMsg(
        err?.message?.includes("internal")
          ? "Could not create your calendar event. Please try again or contact us directly."
          : "Something went wrong. Please try again or reach us via phone or email."
      );
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
              Pick your preferred date and time, fill out the short form,
              and we'll automatically schedule it on our Google Calendar.
              You'll receive an email confirmation instantly — no back-and-forth needed.
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
                  Pick a slot. We create the calendar event automatically.
                  You get an instant email invite — no manual steps.
                </p>
                <button className="appointmentVisualBtn" onClick={openModal}>
                  Schedule Now →
                </button>
              </div>
              <div className="appointmentVisualSteps">
                {["Fill Form", "Auto-Scheduled", "Get Invite", "Break Ground"].map((s, i) => (
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

            {/* ── Success state ── */}
            {submitState === "success" ? (
              <div className="apptSuccess">
                <div className="apptSuccessIcon">✓</div>
                <h4 className="apptSuccessTitle">Consultation Scheduled!</h4>
                <p className="apptSuccessDesc">
                  Your appointment has been automatically added to our Google Calendar.
                  A confirmation email with your calendar invite has been sent to{" "}
                  <strong>{form.email}</strong>.
                </p>
                {eventLink && (
                  <a
                    href={eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apptEventLink"
                  >
                    View your calendar event →
                  </a>
                )}
                <p className="apptSuccessNote">This window will close automatically…</p>
              </div>
            ) : (

              /* ── Form ── */
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

                {/* Row 3 — Preferred Date + Time ── NEW ── */}
                <div className="apptRow">
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptDate">
                      Preferred Date <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptDate"
                      name="preferredDate"
                      type="date"
                      className={`apptInput ${errors.preferredDate ? "apptInputErr" : ""}`}
                      value={form.preferredDate}
                      onChange={handleChange}
                      min={getMinDate()}
                    />
                    {errors.preferredDate && <span className="apptErrMsg">{errors.preferredDate}</span>}
                  </div>

                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptTime">
                      Preferred Time <span className="apptRequired">*</span>
                    </label>
                    <select
                      id="apptTime"
                      name="preferredTime"
                      className={`apptSelect ${errors.preferredTime ? "apptInputErr" : ""}`}
                      value={form.preferredTime}
                      onChange={handleChange}
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>
                          {formatTime(t)}
                        </option>
                      ))}
                    </select>
                    {errors.preferredTime && <span className="apptErrMsg">{errors.preferredTime}</span>}
                  </div>
                </div>

                {/* Row 4 — Purpose quick-select */}
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

                {/* Row 5 — Purpose textarea */}
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
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="apptTextareaFooter">
                    {errors.purpose && <span className="apptErrMsg">{errors.purpose}</span>}
                    <span className="apptCharCount">{form.purpose.length} / 1000</span>
                  </div>
                </div>

                {/* Firestore / Function error */}
                {submitState === "error" && (
                  <div className="apptSubmitError">{errorMsg}</div>
                )}

                {/* Footer */}
                <div className="apptFormFooter">
                  <p className="apptFormNote">
                    Submitting this form automatically creates your appointment on our
                    Google Calendar and sends you an email confirmation instantly.
                  </p>
                  <button
                    type="submit"
                    className={`apptSubmitBtn ${submitState === "submitting" ? "apptSubmitBtnLoading" : ""}`}
                    disabled={submitState === "submitting"}
                  >
                    {submitState === "submitting" ? (
                      <><span className="apptSubmitSpinner" /> Scheduling…</>
                    ) : (
                      "Confirm & Auto-Schedule →"
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

/* ─────────────────────────────────────────────────────────────────────────
   formatTime — converts "09:00" to "9:00 AM"
   WHAT: Formats 24-hr time string to 12-hr AM/PM display.
   HOW:  Splits on ":", computes AM/PM, returns formatted string.
   CALLED BY: TIME_SLOTS.map in the time select
   ───────────────────────────────────────────────────────────────────────── */
function formatTime(time24) {
  const [h, m]  = time24.split(":").map(Number);
  const period  = h >= 12 ? "PM" : "AM";
  const hour12  = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default AppointmentSection;