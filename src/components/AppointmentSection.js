/**
 * WHAT: AppointmentSection — consultation booking with inline time slot picker.
 * HOW:  Modal has two steps:
 *       STEP 1 — Contact details form (firstName, surname, email, phone, purpose).
 *       STEP 2 — Inline time slot picker. Shows next 7 days with available slots.
 *                Client selects a date then a time slot.
 *       On confirm: saves to Firestore "appointments" with selectedDate + selectedTime,
 *       opens Google Calendar in new tab pre-filled, shows success state.
 * CALLED BY: HomePage.js
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import "../css/AppointmentSection.css";

const EMPTY_FORM = {
  firstName: "",
  surname:   "",
  email:     "",
  phone:     "",
  purpose:   "",
};

/* ── Available time slots per day (Triconix office hours) ── */
const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "1:00 PM",  "1:30 PM",  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",  "4:00 PM",  "4:30 PM",
];

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

/* ── Day names + month names for display ── */
const DAY_NAMES  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * WHAT: Generates the next 7 available booking days (Mon–Sat only, skip Sunday).
 * HOW:  Starts from tomorrow, collects 7 days that are not Sunday.
 * CALLED BY: AppointmentSection render via useMemo
 */
function getAvailableDays() {
  const days = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1); // start from tomorrow
  let cursor = new Date(start);
  while (days.length < 7) {
    if (cursor.getDay() !== 0) { // skip Sunday
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * WHAT: AppointmentSection — two-step booking modal with inline time picker.
 * HOW:  step state: "details" | "timepicker" | "success"
 *       Step 1 validates form. Step 2 requires day + time selection.
 *       On confirm: Firestore save + Google Calendar open.
 * CALLED BY: HomePage.js
 */
function AppointmentSection() {
  const [isVisible,    setIsVisible]    = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [step,         setStep]         = useState("details"); // details | timepicker | success
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [submitState,  setSubmitState]  = useState("idle");  // idle | submitting | error
  const [errorMsg,     setErrorMsg]     = useState("");
  const [selectedDay,  setSelectedDay]  = useState(null);    // Date object
  const [selectedTime, setSelectedTime] = useState(null);    // "9:00 AM" etc

  const sectionRef    = useRef(null);
  const firstInputRef = useRef(null);

  /* ── Available days — computed once ── */
  const availableDays = useMemo(() => getAvailableDays(), []);

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
   * WHAT: Opens modal, resets to step 1.
   * HOW:  Sets isModalOpen true, locks body scroll, focuses first input.
   * CALLED BY: Book buttons onClick
   */
  function openModal() {
    setIsModalOpen(true);
    setStep("details");
    setSubmitState("idle");
    setErrors({});
    setSelectedDay(null);
    setSelectedTime(null);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }

  /**
   * WHAT: Closes modal and restores page scroll.
   * HOW:  Hides modal, restores overflow, resets all state after animation.
   * CALLED BY: backdrop click, Escape key, close button, auto-close after success.
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setErrors({});
      setStep("details");
      setSubmitState("idle");
      setErrorMsg("");
      setSelectedDay(null);
      setSelectedTime(null);
    }, 350);
  }, []);

  /* ── Escape key ── */
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && isModalOpen) closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, closeModal]);

  /**
   * WHAT: Updates form field and clears its error.
   * HOW:  Uses input name to key into form state.
   * CALLED BY: onChange on inputs / textarea
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  /**
   * WHAT: Builds a Google Calendar "add event" URL pre-filled with appointment details.
   * HOW:  Uses calendar.google.com/calendar/render?action=TEMPLATE with date/time
   *       parameters so the event opens fully filled in for the client to save.
   *       Date format required: YYYYMMDDTHHMMSS
   * CALLED BY: handleConfirm
   */
  function buildCalendarUrl(day, time, name, email) {
    // Parse selected time string to 24h
    const [timePart, meridiem] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    // Build start datetime string YYYYMMDDTHHMMSS
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${day.getFullYear()}${pad(day.getMonth()+1)}${pad(day.getDate())}`;
    const startStr = `${dateStr}T${pad(hours)}${pad(minutes)}00`;

    // End time = start + 1 hour
    const endDate = new Date(day);
    endDate.setHours(hours + 1, minutes, 0, 0);
    const endStr = `${dateStr}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    const params = new URLSearchParams({
      action:   "TEMPLATE",
      text:     `Triconix Consultation — ${name}`,
      dates:    `${startStr}/${endStr}`,
      details:  `Consultation booked via Triconix Construction website.\nClient: ${name}\nEmail: ${email}\nTime: ${time}`,
      location: "66 JP Rizal St., Nangka, Marikina City, Philippines 1808",
      sf:       "true",
      output:   "xml",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
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
   * WHAT: Advances from step 1 (details) to step 2 (time picker).
   * HOW:  Validates form — if errors, shows them. Otherwise goes to timepicker step.
   * CALLED BY: "Choose a Time Slot" button onClick
   */
  function handleNextStep(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep("timepicker");
  }

  /**
   * WHAT: Final confirm — saves to Firestore + opens Google Calendar.
   * HOW:  Requires selectedDay and selectedTime. Saves full appointment doc.
   *       Builds Google Calendar URL with date/time pre-filled.
   *       Opens Calendar in new tab, sets step to success, auto-closes modal.
   * CALLED BY: "Confirm Booking" button onClick
   */
  async function handleConfirm() {
    if (!selectedDay || !selectedTime) return;
    setSubmitState("submitting");

    try {
      // Format date for Firestore + Calendar URL
      const dateStr = selectedDay.toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });

      await addDoc(collection(db, "appointments"), {
        firstName:    form.firstName.trim(),
        surname:      form.surname.trim(),
        email:        form.email.trim().toLowerCase(),
        phone:        form.phone.trim(),
        purpose:      form.purpose.trim(),
        selectedDate: dateStr,
        selectedTime: selectedTime,
        submittedAt:  serverTimestamp(),
        status:       "pending",
        source:       "appointment_modal",
      });

      // Open Google Calendar with date/time pre-filled as a new event
      const calUrl = buildCalendarUrl(
        selectedDay,
        selectedTime,
        `${form.firstName} ${form.surname}`,
        form.email
      );
      window.open(calUrl, "_blank", "noopener,noreferrer");

      setStep("success");
      setTimeout(() => closeModal(), 4000);

    } catch (err) {
      console.error("Appointment save error:", err);
      setErrorMsg("Something went wrong. Please try again.");
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
              the form, pick your preferred date and time — your booking saves
              directly to our Google Calendar.
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

            {/* ── Modal Header ── */}
            <div className="apptModalHeader">
              <div>
                <span className="apptModalEyebrow">Triconix Construction</span>
                <h3 className="apptModalTitle">
                  {step === "details"    && "Book a Consultation"}
                  {step === "timepicker" && "Choose Your Time Slot"}
                  {step === "success"    && "Booking Confirmed!"}
                </h3>
              </div>
              <button className="apptModalClose" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {/* ── Step indicator ── */}
            {step !== "success" && (
              <div className="apptSteps">
                <div className={`apptStep ${step === "details" ? "apptStepActive" : "apptStepDone"}`}>
                  <span className="apptStepNum">{step === "details" ? "1" : "✓"}</span>
                  <span className="apptStepLabel">Your Details</span>
                </div>
                <div className="apptStepLine" />
                <div className={`apptStep ${step === "timepicker" ? "apptStepActive" : ""}`}>
                  <span className="apptStepNum">2</span>
                  <span className="apptStepLabel">Pick a Time</span>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────
                STEP 1 — Contact Details Form
                ──────────────────────────────────────── */}
            {step === "details" && (
              <form className="apptForm" onSubmit={handleNextStep} noValidate>

                <div className="apptRow">
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptFirstName">
                      First Name <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptFirstName" name="firstName" type="text"
                      className={`apptInput ${errors.firstName ? "apptInputErr" : ""}`}
                      placeholder="e.g. Juan"
                      value={form.firstName} onChange={handleChange}
                      ref={firstInputRef} autoComplete="given-name" maxLength={50}
                    />
                    {errors.firstName && <span className="apptErrMsg">{errors.firstName}</span>}
                  </div>
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptSurname">
                      Surname <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptSurname" name="surname" type="text"
                      className={`apptInput ${errors.surname ? "apptInputErr" : ""}`}
                      placeholder="e.g. dela Cruz"
                      value={form.surname} onChange={handleChange}
                      autoComplete="family-name" maxLength={50}
                    />
                    {errors.surname && <span className="apptErrMsg">{errors.surname}</span>}
                  </div>
                </div>

                <div className="apptRow">
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptEmail">
                      Email Address <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptEmail" name="email" type="email"
                      className={`apptInput ${errors.email ? "apptInputErr" : ""}`}
                      placeholder="you@email.com"
                      value={form.email} onChange={handleChange}
                      autoComplete="email" maxLength={100}
                    />
                    {errors.email && <span className="apptErrMsg">{errors.email}</span>}
                  </div>
                  <div className="apptField">
                    <label className="apptLabel" htmlFor="apptPhone">
                      Phone Number <span className="apptRequired">*</span>
                    </label>
                    <input
                      id="apptPhone" name="phone" type="tel"
                      className={`apptInput ${errors.phone ? "apptInputErr" : ""}`}
                      placeholder="+63 9XX XXX XXXX"
                      value={form.phone} onChange={handleChange}
                      autoComplete="tel" maxLength={20}
                    />
                    {errors.phone && <span className="apptErrMsg">{errors.phone}</span>}
                  </div>
                </div>

                <div className="apptField apptFieldFull">
                  <label className="apptLabel" htmlFor="apptPurposeSelect">
                    Purpose of Appointment
                    <span className="apptLabelHint"> — quick select</span>
                  </label>
                  <select
                    id="apptPurposeSelect" className="apptSelect"
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

                <div className="apptField apptFieldFull">
                  <label className="apptLabel" htmlFor="apptPurpose">
                    Tell Us More About Your Project <span className="apptRequired">*</span>
                  </label>
                  <textarea
                    id="apptPurpose" name="purpose"
                    className={`apptTextarea ${errors.purpose ? "apptInputErr" : ""}`}
                    placeholder="Describe your project — lot location, estimated budget, number of floors, preferred style, timeline…"
                    value={form.purpose} onChange={handleChange}
                    rows={4} maxLength={1000}
                  />
                  <div className="apptTextareaFooter">
                    {errors.purpose && <span className="apptErrMsg">{errors.purpose}</span>}
                    <span className="apptCharCount">{form.purpose.length} / 1000</span>
                  </div>
                </div>

                <div className="apptFormFooter">
                  <p className="apptFormNote">
                    Next step: pick your preferred date and available time slot.
                  </p>
                  <button type="submit" className="apptSubmitBtn">
                    Choose a Time Slot →
                  </button>
                </div>

              </form>
            )}

            {/* ────────────────────────────────────────
                STEP 2 — Time Slot Picker
                ──────────────────────────────────────── */}
            {step === "timepicker" && (
              <div className="apptTimePicker">

                {/* Day selector */}
                <div className="apptDayRow">
                  {availableDays.map((day, idx) => {
                    const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
                    return (
                      <button
                        key={idx}
                        className={`apptDayBtn ${isSelected ? "apptDayBtnActive" : ""}`}
                        onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                      >
                        <span className="apptDayName">{DAY_NAMES[day.getDay()]}</span>
                        <span className="apptDayNum">{day.getDate()}</span>
                        <span className="apptDayMonth">{MONTH_NAMES[day.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots grid — shown when day is selected */}
                {selectedDay ? (
                  <>
                    <div className="apptTimeLabel">
                      Available times for{" "}
                      <strong>
                        {selectedDay.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
                      </strong>
                    </div>
                    <div className="apptTimeGrid">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          className={`apptTimeSlot ${selectedTime === slot ? "apptTimeSlotActive" : ""}`}
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="apptTimePrompt">← Select a day to see available times</div>
                )}

                {/* Selected summary */}
                {selectedDay && selectedTime && (
                  <div className="apptSelectionSummary">
                    <span className="apptSelectionIcon">✓</span>
                    <span>
                      <strong>{selectedDay.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}</strong>
                      {" at "}
                      <strong>{selectedTime}</strong>
                    </span>
                  </div>
                )}

                {/* Error message */}
                {submitState === "error" && (
                  <div className="apptSubmitError">{errorMsg}</div>
                )}

                {/* Footer nav */}
                <div className="apptTimeFooter">
                  <button className="apptBackBtn" onClick={() => setStep("details")}>
                    ← Back
                  </button>
                  <button
                    className={`apptSubmitBtn ${(!selectedDay || !selectedTime || submitState === "submitting") ? "apptSubmitBtnDisabled" : ""}`}
                    onClick={handleConfirm}
                    disabled={!selectedDay || !selectedTime || submitState === "submitting"}
                  >
                    {submitState === "submitting" ? (
                      <><span className="apptSubmitSpinner" /> Saving…</>
                    ) : (
                      "Confirm Booking →"
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* ────────────────────────────────────────
                SUCCESS STATE
                ──────────────────────────────────────── */}
            {step === "success" && (
              <div className="apptSuccess">
                <div className="apptSuccessIcon">✓</div>
                <h4 className="apptSuccessTitle">Booking Confirmed!</h4>
                <p className="apptSuccessDesc">
                  Your appointment for{" "}
                  <strong>
                    {selectedDay?.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
                    {" at "}{selectedTime}
                  </strong>{" "}
                  has been saved. Google Calendar opened in a new tab to confirm the event.
                </p>
                <p className="apptSuccessNote">This window will close automatically…</p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default AppointmentSection;