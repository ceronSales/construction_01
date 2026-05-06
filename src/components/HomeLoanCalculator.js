/**
 * WHAT: HomeLoanCalculator — Philippine home loan calculator section.
 * HOW:  Left panel: editable inputs (loan amount, interest rate, term, existing
 *       amortization). Right panel: live computed results (monthly payment,
 *       required income, total interest paid). Bottom: recharts line chart of
 *       25-year BSP interest rate history. Fixing period quick-select buttons
 *       auto-fill the interest rate. All values recompute on every input change.
 * CALLED BY: HomePage.js
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "../css/HomeLoanCalculator.css";

/* ── Fixing period presets (Security Bank PH rates) ── */
const FIXING_PERIODS = [
  { label: "1 Year",  rate: 7.00 },
  { label: "3 Years", rate: 7.25 },
  { label: "5 Years", rate: 7.75 },
];

/* ── BSP 25-year interest rate history (approximate annual data) ── */
const BSP_HISTORY = [
  { year: "2000", rate: 12.50 }, { year: "2001", rate: 11.00 },
  { year: "2002", rate: 9.00  }, { year: "2003", rate: 8.50  },
  { year: "2004", rate: 8.25  }, { year: "2005", rate: 8.00  },
  { year: "2006", rate: 7.75  }, { year: "2007", rate: 7.50  },
  { year: "2008", rate: 8.75  }, { year: "2009", rate: 7.50  },
  { year: "2010", rate: 6.50  }, { year: "2011", rate: 6.50  },
  { year: "2012", rate: 5.75  }, { year: "2013", rate: 5.50  },
  { year: "2014", rate: 5.50  }, { year: "2015", rate: 5.50  },
  { year: "2016", rate: 5.25  }, { year: "2017", rate: 5.00  },
  { year: "2018", rate: 5.75  }, { year: "2019", rate: 5.50  },
  { year: "2020", rate: 3.25  }, { year: "2021", rate: 2.00  },
  { year: "2022", rate: 5.50  }, { year: "2023", rate: 6.50  },
  { year: "2024", rate: 6.50  },
];

/* ── Scrollytelling steps — each step locks to viewport while user scrolls ── */
const SCROLL_STEPS = [
  {
    id:    "intro",
    tag:   "Bank Loan & Pag-IBIG",
    title: "What is the Maximum Loanable Amount?",
    body:  "The maximum loanable amount is approximately 70%–80% of the total assessed value of the house and lot. This assessed value is set by the bank — not the market price.",
  },
  {
    id:    "fixing",
    tag:   "Interest Rates",
    title: "What is a Fixing Period?",
    body:  "Also known as the repricing period or tenor. It refers to the time frame during which your fixed interest rate applies. After it expires, your rate is repriced based on current BSP benchmark rates.",
  },
  {
    id:    "choice",
    tag:   "Which Period?",
    title: "Which Fixing Period Should You Choose?",
    body:  "A 1-year fixing means your rate won't change for 1 year. After that, it is recomputed based on Banko Sentral ng Pilipinas rates — which depend on supply, demand, inflation, and global events.",
  },
  {
    id:    "tranche",
    tag:   "Cash Requirements",
    title: "Do You Need Cash Even After Getting the Loan?",
    body:  "Yes. Banks release funds in tranches — 30%, 60%, and 90% completion milestones. You will still need approximately 40% cash or equity to bridge each release and keep construction running.",
  },
  {
    id:    "summary",
    tag:   "Key Takeaway",
    title: "Always Prepare at Least 40% Cash or Equity",
    body:  "Even with a full bank loan approved, you need cash to reach each tranche milestone, cover the bank's 5% under-assessment, and sustain 2 weeks of construction while the bank processes each release.",
    highlight: true,
  },
];


function formatPeso(val) {
  return "₱" + Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Strip non-numeric characters for input parsing ── */
function parseAmount(str) {
  return parseFloat(String(str).replace(/[^0-9.]/g, "")) || 0;
}

/**
 * WHAT: Custom recharts tooltip for the BSP history chart.
 * HOW:  Receives active/payload props from recharts, renders a gold card.
 * CALLED BY: recharts AreaChart
 */
function BspTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="loanChartTooltip">
      <span className="loanChartTooltipYear">{label}</span>
      <span className="loanChartTooltipRate">{payload[0].value.toFixed(2)}%</span>
    </div>
  );
}

/**
 * WHAT: HomeLoanCalculator — full loan calculator section component.
 * HOW:  Uses controlled inputs for loan amount, rate, term, existing amortization.
 *       useMemo recomputes monthly payment and required income on every change.
 *       Monthly payment formula: M = P[r(1+r)^n] / [(1+r)^n - 1]
 * CALLED BY: HomePage.js
 */
function HomeLoanCalculator() {
  const [loanAmount,   setLoanAmount]   = useState("10000000");
  const [interestRate, setInterestRate] = useState("7.00");
  const [termYears,    setTermYears]    = useState("20");
  const [existingAmort,setExistingAmort]= useState("0");
  const [activeFixing, setActiveFixing] = useState(0);

  const [activeStep,   setActiveStep]   = useState(0);
  const hijackRef   = useRef(null);   // outer tall wrapper — provides scroll distance
  const prevStep    = useRef(0);      // avoids unnecessary setState calls

  /* ────────────────────────────────────────────────────────────────
     Scroll-position-driven slide advancement.
     HOW: The outer wrapper is 500vh tall (set in CSS). As the user
          scrolls, we compute how far into the wrapper they are (0→1).
          That progress is divided into N equal segments, one per slide.
          activeStep updates only when the segment changes.
          No wheel hijack, no mouse tracking — pure scroll position.
          Works regardless of where the mouse cursor is.
     CALLED BY: useEffect on mount
     ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    /**
     * WHAT: Reads window scroll and maps it to the active slide index.
     * HOW:  Gets outer wrapper's top offset from viewport. Computes
     *       how many px the user has scrolled into it. Divides that
     *       progress by total scrollable height to get 0→1 raw value.
     *       Maps raw value to step index via Math.floor with clamping.
     * CALLED BY: scroll event on window.
     */
    function onScroll() {
      const el = hijackRef.current;
      if (!el) return;

      // scrolled = how many px of the outer wrapper have passed the top of the viewport
      const rect     = el.getBoundingClientRect();
      const scrolled = -rect.top;                          // negative when not yet reached
      const total    = el.offsetHeight - window.innerHeight; // total scrollable distance

      if (scrolled < 0 || total <= 0) {
        // Haven't reached the section yet — reset to first slide
        if (prevStep.current !== 0) { prevStep.current = 0; setActiveStep(0); }
        return;
      }

      if (scrolled > total) {
        // Scrolled past the section — lock to last slide
        const last = SCROLL_STEPS.length - 1;
        if (prevStep.current !== last) { prevStep.current = last; setActiveStep(last); }
        return;
      }

      // Map 0→1 progress into SCROLL_STEPS.length segments
      const raw  = scrolled / total;                                       // 0 → 1
      const step = Math.min(
        Math.floor(raw * SCROLL_STEPS.length),
        SCROLL_STEPS.length - 1
      );

      if (step !== prevStep.current) {
        prevStep.current = step;
        setActiveStep(step);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount in case page loads mid-section
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const results = useMemo(() => {
    const P = parseAmount(loanAmount);
    const r = parseFloat(interestRate) / 100 / 12;   // monthly rate
    const n = parseFloat(termYears) * 12;             // total months
    const existing = parseAmount(existingAmort);

    if (!P || !r || !n) return { monthly: 0, required: 0, totalInterest: 0, totalPaid: 0 };

    // Standard amortization formula
    const monthly      = P * (r * Math.pow(1+r,n)) / (Math.pow(1+r,n) - 1);
    const totalPaid    = monthly * n;
    const totalInterest = totalPaid - P;
    // Required income = (monthly + existing) / 0.30 (banks allow 30% DSR)
    const required     = (monthly + existing) / 0.30;

    return { monthly, required, totalInterest, totalPaid };
  }, [loanAmount, interestRate, termYears, existingAmort]);

  /**
   * WHAT: Handles fixing period quick-select — sets rate and marks active button.
   * HOW:  Updates interestRate state to the preset rate string.
   * CALLED BY: fixing period button onClick
   */
  const handleFixingSelect = useCallback((idx) => {
    setActiveFixing(idx);
    setInterestRate(FIXING_PERIODS[idx].rate.toFixed(2));
  }, []);

  /* ── Loan amount formatted display ── */
  const loanDisplay = useMemo(() => {
    const n = parseAmount(loanAmount);
    return n > 0 ? formatPeso(n) : "₱0.00";
  }, [loanAmount]);

  return (
    <section id="loan" className="loanSection">

      {/* ── Section header ── */}
      <div className="loanHeader">
        <span className="loanEyebrow">Financial Planning</span>
        <h2 className="loanTitle">Home Loan <span className="loanTitleGold">Calculator</span></h2>
        <p className="loanSubtitle">
          Estimate your monthly bank payments for Security Bank and Pag-IBIG home loans.
          All computations are based on standard Philippine amortization formulas.
        </p>
      </div>

      {/* ── Horizontal scroll-hijack band ── */}
      <div className="loanHijackOuter" ref={hijackRef}>
        <div className="loanHijackSticky">
          <div
            className="loanHijackTrack"
            style={{ transform: `translateX(-${activeStep * 100}%)` }}
          >
            {SCROLL_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`loanHijackSlide ${step.highlight ? 'loanHijackSlideHighlight' : ''}`}
              >
                <span className="loanHijackWatermark">0{idx + 1}</span>
                <div className="loanHijackSlideContent">
                  <span className="loanHijackTag">{step.tag}</span>
                  <h3 className="loanHijackTitle">{step.title}</h3>
                  <p className="loanHijackBody">{step.body}</p>
                  <div className="loanHijackNav">
                    {idx > 0 && (
                      <button className="loanHijackNavBtn" onClick={() => setActiveStep(idx - 1)}>← Prev</button>
                    )}
                    {idx < SCROLL_STEPS.length - 1 && (
                      <button className="loanHijackNavBtn loanHijackNavBtnNext" onClick={() => setActiveStep(idx + 1)}>Next →</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="loanHijackProgressBar">
            <div className="loanHijackProgressFill" style={{ width: `${(activeStep / (SCROLL_STEPS.length - 1)) * 100}%` }} />
          </div>
          <div className="loanHijackDots">
            {SCROLL_STEPS.map((_, idx) => (
              <button key={idx} className={`loanHijackDot ${activeStep === idx ? 'loanHijackDotActive' : ''}`} onClick={() => setActiveStep(idx)} />
            ))}
          </div>
          {activeStep === 0 && (
            <div className="loanHijackHint"><span>Scroll to continue</span><span className="loanHijackHintArrow">↓</span></div>
          )}
          {activeStep === SCROLL_STEPS.length - 1 && (
            <div className="loanHijackHint loanHijackHintEnd"><span>Scroll to reach the calculator</span><span className="loanHijackHintArrow">↓</span></div>
          )}
        </div>
      </div>

            {/* ── Main calculator card ── */}
      <div className="loanCard">

        {/* ── LEFT: Inputs ── */}
        <div className="loanInputCol">
          <div className="loanInputColHeader">
            <span className="loanInputColTitle">Loan Parameters</span>
            <span className="loanInputColNote">Edit the yellow fields below</span>
          </div>

          {/* Loan Amount */}
          <div className="loanField">
            <label className="loanFieldLabel" htmlFor="loanAmount">
              Loan Amount
              <span className="loanFieldHint">Enter total loan in Pesos</span>
            </label>
            <div className="loanInputWrap loanInputHighlight">
              <span className="loanInputPrefix">₱</span>
              <input
                id="loanAmount"
                className="loanInput"
                type="number"
                min="0"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
              />
            </div>
            <span className="loanFieldFormatted">{loanDisplay}</span>
          </div>

          {/* Interest Rate + Fixing Period */}
          <div className="loanField">
            <label className="loanFieldLabel" htmlFor="interestRate">
              Interest Rate (% per year)
              <span className="loanFieldHint">Select a fixing period or enter manually</span>
            </label>
            <div className="loanFixingBtns">
              {FIXING_PERIODS.map((fp, idx) => (
                <button
                  key={fp.label}
                  className={`loanFixingBtn ${activeFixing === idx ? "loanFixingBtnActive" : ""}`}
                  onClick={() => handleFixingSelect(idx)}
                >
                  <span className="loanFixingBtnLabel">{fp.label}</span>
                  <span className="loanFixingBtnRate">{fp.rate.toFixed(2)}%</span>
                </button>
              ))}
            </div>
            <div className="loanInputWrap loanInputHighlight">
              <input
                id="interestRate"
                className="loanInput"
                type="number"
                min="0"
                max="30"
                step="0.25"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
              />
              <span className="loanInputSuffix">%</span>
            </div>
          </div>

          {/* Term in Years */}
          <div className="loanField">
            <label className="loanFieldLabel" htmlFor="termYears">
              Loan Term
              <span className="loanFieldHint">Number of years to pay</span>
            </label>
            <div className="loanInputWrap loanInputHighlight">
              <input
                id="termYears"
                className="loanInput"
                type="number"
                min="1"
                max="30"
                value={termYears}
                onChange={e => setTermYears(e.target.value)}
              />
              <span className="loanInputSuffix">years</span>
            </div>
            <div className="loanTermSlider">
              <input
                type="range" min="5" max="30" step="5"
                value={termYears}
                onChange={e => setTermYears(e.target.value)}
                className="loanRangeSlider"
              />
              <div className="loanTermTicks">
                {[5,10,15,20,25,30].map(y => (
                  <span key={y} className={`loanTermTick ${parseInt(termYears)===y?"loanTermTickActive":""}`}>{y}yr</span>
                ))}
              </div>
            </div>
          </div>

          {/* Existing Amortization */}
          <div className="loanField">
            <label className="loanFieldLabel" htmlFor="existingAmort">
              Existing Loan Amortization
              <span className="loanFieldHint">Enter 0 if none</span>
            </label>
            <div className="loanInputWrap loanInputHighlight">
              <span className="loanInputPrefix">₱</span>
              <input
                id="existingAmort"
                className="loanInput"
                type="number"
                min="0"
                value={existingAmort}
                onChange={e => setExistingAmort(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="loanResultCol">
          <div className="loanResultColHeader">
            <span className="loanResultColTitle">Computed Results</span>
            <span className="loanResultColNote">Updates live as you type</span>
          </div>

          {/* Monthly Payment — hero result */}
          <div className="loanResultHero">
            <span className="loanResultHeroLabel">Monthly Bank Payment</span>
            <span className="loanResultHeroAmount">{formatPeso(results.monthly)}</span>
            <span className="loanResultHeroSub">per month for {termYears} years</span>
          </div>

          {/* Secondary results grid */}
          <div className="loanResultGrid">
            <div className="loanResultItem">
              <span className="loanResultItemLabel">Required Monthly Income</span>
              <span className="loanResultItemValue loanResultItemGold">{formatPeso(results.required)}</span>
              <span className="loanResultItemNote">Based on 30% Debt Service Ratio</span>
            </div>
            <div className="loanResultItem">
              <span className="loanResultItemLabel">Total Interest Paid</span>
              <span className="loanResultItemValue">{formatPeso(results.totalInterest)}</span>
              <span className="loanResultItemNote">Over the full loan term</span>
            </div>
            <div className="loanResultItem">
              <span className="loanResultItemLabel">Total Amount Paid</span>
              <span className="loanResultItemValue">{formatPeso(results.totalPaid)}</span>
              <span className="loanResultItemNote">Principal + all interest</span>
            </div>
            <div className="loanResultItem">
              <span className="loanResultItemLabel">Loan Amount</span>
              <span className="loanResultItemValue">{formatPeso(parseAmount(loanAmount))}</span>
              <span className="loanResultItemNote">Principal borrowed</span>
            </div>
          </div>

          {/* Payment breakdown bar */}
          <div className="loanBreakdownBar">
            <span className="loanBreakdownLabel">Principal vs Interest</span>
            <div className="loanBreakdownTrack">
              <div
                className="loanBreakdownPrincipal"
                style={{ width: `${results.totalPaid > 0 ? (parseAmount(loanAmount)/results.totalPaid*100).toFixed(1) : 50}%` }}
              >
                <span className="loanBreakdownSegLabel">Principal {results.totalPaid > 0 ? (parseAmount(loanAmount)/results.totalPaid*100).toFixed(0) : 0}%</span>
              </div>
              <div className="loanBreakdownInterest">
                <span className="loanBreakdownSegLabel">Interest {results.totalPaid > 0 ? (results.totalInterest/results.totalPaid*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="loanDisclaimer">
            * Results are estimates based on fixed-rate amortization. Actual bank
            computations may vary. Consult your bank for final figures.
          </p>
        </div>
      </div>

      {/* ── Current Home Loan Interest Rates — below calculator card ── */}
      <div className="loanRateTable">
        <span className="loanRateTableTitle">Current Home Loan Interest Rates</span>
        <table className="loanTable">
          <thead>
            <tr>
              <th>Fixing Period</th>
              <th>Interest Rate</th>
              <th>Monthly Payment <span className="loanTableNote">({loanDisplay} / {termYears} yrs)</span></th>
            </tr>
          </thead>
          <tbody>
            {FIXING_PERIODS.map((fp, idx) => {
              const P = parseAmount(loanAmount);
              const r = fp.rate / 100 / 12;
              const n = parseFloat(termYears) * 12;
              const m = (P && r && n)
                ? P * (r * Math.pow(1+r,n)) / (Math.pow(1+r,n) - 1)
                : 0;
              return (
                <tr key={fp.label} className={activeFixing === idx ? "loanTableRowActive" : ""}>
                  <td>{fp.label}</td>
                  <td className="loanTableRate">{fp.rate.toFixed(2)}%</td>
                  <td>{formatPeso(m)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Triconix Insight — below rate table ── */}
      <div className="loanOpinionBox">
        <span className="loanOpinionTag">Triconix Insight</span>
        <p className="loanOpinionText">
          Based on our observation, interest rates tend to drop during presidential elections (1998, 2004, 2010, 2016, 2022)
          and during periods of uncertainty such as the early months of the Covid Pandemic. Rates rise when inflation increases
          due to higher demand for goods and services. <strong>Always prepare at least 40% cash or equity</strong> when
          constructing via home loan — banks release funds in tranches (30%, 60%, 90%) and under-assess completion by ~5%.
        </p>
      </div>

      {/* ── BSP Interest Rate History Chart — below Triconix Insight ── */}
      <div className="loanChartSection">
        <div className="loanChartHeader">
          <h3 className="loanChartTitle">BSP Interest Rate History <span className="loanChartTitleGold">(2000–2024)</span></h3>
          <p className="loanChartDesc">
            The Bangko Sentral ng Pilipinas sets benchmark rates that directly influence home loan interest rates.
            Rates tend to drop during elections and uncertainty, and rise during inflation.
          </p>
        </div>
        <div className="loanChartWrap">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={BSP_HISTORY} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bspGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#888880", fontSize: 11, fontFamily: "Raleway, sans-serif" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                interval={4}
              />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fill: "#888880", fontSize: 11, fontFamily: "Raleway, sans-serif" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 18]}
                width={42}
              />
              <Tooltip content={<BspTooltip />} />
              <ReferenceLine y={parseFloat(interestRate)} stroke="#c9a84c" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: `Current: ${interestRate}%`, fill: "#c9a84c", fontSize: 11, fontFamily: "Raleway, sans-serif" }} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#c9a84c"
                strokeWidth={2}
                fill="url(#bspGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#c9a84c", stroke: "#fff8e1", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="loanChartSource">Source: Bangko Sentral ng Pilipinas (BSP) · Trading Economics</p>
      </div>

    </section>
  );
}

export default HomeLoanCalculator;