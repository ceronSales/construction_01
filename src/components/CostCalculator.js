/**
 * WHAT: Building Cost Calculator — 3-step scrollytelling wizard.
 * HOW:  Step 1: Select rooms per floor → live total area updates.
 *       Step 2: Choose finish level → bar chart shows live cost range.
 *       Step 3: Generate watermarked PDF invoice with itemized breakdown.
 *       All costs calculate live as the user types/selects — no pre-set estimates.
 * CALLED BY: HomePage.js
 */

import React, { useState, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../css/CostCalculator.css";

// ── Cost rates per sqm by finish type (Philippine Pesos) ──
const RATES = {
  economic:    { min: 18700, max: 19700, label: "Economic",     color: "#c9a84c" },
  regular:     { min: 19700, max: 22100, label: "Regular",      color: "#7fb069" },
  semiElegant: { min: 22100, max: 24800, label: "Semi-Elegant", color: "#4a90d9" },
  elegant:     { min: 24800, max: 27800, label: "Elegant",      color: "#d4a0d0" },
};

// ── Finish level descriptions ──
const FINISH_DESC = {
  economic:    "No ceiling or flat ceiling · Cement/ceramic tiles · Jalousie windows · Steel railings",
  regular:     "Flat ceiling · Ceramic tiles · Aluminum/uPVC windows · Regular locksets",
  semiElegant: "Cove light living room · Granite tiles · Solid wood exterior doors · Semi-elegant fixtures",
  elegant:     "Cove light ceiling · Granite/wood floors · Powder-coated uPVC windows · Solid wood doors · Elegant fixtures",
};

// ── Room definitions ──
const GROUND_ROOMS = [
  { key: "livingRoom",      label: "Living Room",                 area: 16.00, dim: "4m × 4m" },
  { key: "diningRoom",      label: "Dining Room",                 area: 14.00, dim: "3.5m × 4m" },
  { key: "kitchen",         label: "Kitchen",                     area: 12.00, dim: "3m × 4m" },
  { key: "dirtyKitchen",    label: "Dirty Kitchen",               area:  6.00, dim: "2m × 3m" },
  { key: "maidsRoom",       label: "Maid's Room",                 area:  6.00, dim: "2m × 3m" },
  { key: "guestRoom",       label: "Guest Room",                  area:  9.00, dim: "3m × 3m" },
  { key: "masterBed",       label: "Master Bedroom",              area: 16.00, dim: "4m × 4m" },
  { key: "walkInClosetG",   label: "Walk-in Closet",              area:  4.00, dim: "2m × 2m" },
  { key: "toiletBathTub",   label: "Toilet & Bath with Tub",      area:  5.76, dim: "1.8m × 3.2m" },
  { key: "toiletBath",      label: "Toilet & Bath",               area:  3.60, dim: "1.5m × 2.4m" },
  { key: "powderRoom",      label: "Powder Room",                 area:  2.00, dim: "1m × 2m" },
  { key: "entertainment",   label: "Entertainment Room",          area: 12.00, dim: "4m × 4m" },
  { key: "officeRoom",      label: "Office Room",                 area:  9.00, dim: "3m × 3m" },
  { key: "storage",         label: "Storage",                     area:  2.00, dim: "1m × 2m" },
  { key: "additionalRoomG", label: "Additional Room",             area:  9.00, dim: "3m × 3m" },
  { key: "hallwaysG",       label: "Hallways",                    area:  6.00, dim: "1m × 6m" },
  { key: "coveredLanai",    label: "Covered Lanai",               area:  4.20, dim: "1.2m × 3.5m" },
  { key: "garage",          label: "Car Covered Garage",          area: 19.50, dim: "3m × 6.5m" },
  { key: "coveredPorch",    label: "Covered Porch / Area",        area:  2.00, dim: "1m × 2m" },
];

const SECOND_ROOMS = [
  { key: "stairs2",         label: "Stairs",                      area:  6.00, dim: "2m × 3m" },
  { key: "familyArea2",     label: "Family Area",                 area:  9.00, dim: "3m × 3m" },
  { key: "openBelow2",      label: "Open Below Area",             area: 16.00, dim: "4m × 4m" },
  { key: "masterBed2",      label: "Master Bedroom",              area: 16.00, dim: "4m × 4m" },
  { key: "walkInCloset2",   label: "Walk-in Closet",              area:  4.00, dim: "2m × 2m" },
  { key: "bedroom2",        label: "Bedroom",                     area: 10.50, dim: "3m × 3.5m" },
  { key: "toiletTub2",      label: "Toilet & Bath with Tub",      area:  5.76, dim: "1.8m × 3.2m" },
  { key: "toilet2",         label: "Toilet & Bath",               area:  3.60, dim: "1.5m × 2.4m" },
  { key: "balconyGarage",   label: "Balcony on top of Garage",    area: 19.50, dim: "3m × 6.5m" },
  { key: "mediumBalcony",   label: "Medium Balcony",              area: 10.00, dim: "4m × 2.5m" },
  { key: "smallBalcony",    label: "Small Balcony",               area:  2.40, dim: "1.2m × 2m" },
  { key: "additionalRoom2", label: "Additional Room",             area:  9.00, dim: "3m × 3m" },
  { key: "hallways2",       label: "Hallways",                    area:  6.00, dim: "1m × 6m" },
];

const THIRD_ROOMS = [
  { key: "stairs3",         label: "Stairs",                      area:  6.00, dim: "2m × 3m" },
  { key: "familyArea3",     label: "Family Area",                 area: 12.00, dim: "3m × 3m" },
  { key: "openBelow3",      label: "Open Below Area",             area: 16.00, dim: "4m × 4m" },
  { key: "masterBed3",      label: "Master Bedroom",              area: 16.00, dim: "4m × 4m" },
  { key: "walkInCloset3",   label: "Walk-in Closet",              area:  4.00, dim: "2m × 2m" },
  { key: "bedroom3",        label: "Bedroom",                     area: 10.50, dim: "3m × 3.5m" },
  { key: "toiletTub3",      label: "Toilet & Bath with Tub",      area:  5.76, dim: "1.8m × 3.2m" },
  { key: "toilet3",         label: "Toilet & Bath",               area:  3.60, dim: "1.5m × 2.4m" },
  { key: "balconyGarage3",  label: "Balcony on top of Garage",    area: 10.00, dim: "3m × 6.5m" },
  { key: "mediumBalcony3",  label: "Medium Balcony",              area: 10.00, dim: "4m × 2.5m" },
  { key: "smallBalcony3",   label: "Small Balcony",               area:  2.40, dim: "1.2m × 2m" },
  { key: "entertainment3",  label: "Entertainment Room",          area: 16.00, dim: "4m × 4m" },
  { key: "additionalRoom3", label: "Additional Room",             area:  9.00, dim: "3m × 3m" },
  { key: "hallways3",       label: "Hallways",                    area:  6.00, dim: "1m × 6m" },
  { key: "roofDeck",        label: "Open Space Roof Deck",        area: 91.10, dim: "varies" },
];

const ADDITIONAL = [
  { key: "fence",    label: "Fence",           min: 25000,  max: 201740 },
  { key: "permits",  label: "Permits",          min: 25000,  max: 126022.58 },
  { key: "cabinets", label: "Bedroom Cabinets", min: 25000,  max: 122267.28 },
];

/**
 * WHAT: Formats number as Philippine Peso string.
 * HOW:  Uses Intl.NumberFormat with PHP currency settings.
 * CALLED BY: Throughout render functions.
 */
const formatPeso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

/**
 * WHAT: Custom bar chart tooltip showing min–max cost range.
 * HOW:  Renders a styled div when recharts activates the tooltip.
 * CALLED BY: Recharts BarChart Tooltip prop.
 */
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="calcBarTooltip">
      <div className="calcBarTooltipLabel">{d.label}</div>
      <div className="calcBarTooltipRow">
        <span>Min</span><span>{formatPeso(d.min)}</span>
      </div>
      <div className="calcBarTooltipRow">
        <span>Max</span><span>{formatPeso(d.max)}</span>
      </div>
    </div>
  );
};

/**
 * WHAT: CostCalculator — 3-step scrollytelling cost wizard.
 * HOW:  activeStep (1/2/3) controls which panel is expanded. All costs
 *       are derived live from qty and selectedFinish state.
 *       Step 3 renders an invoice div captured by html2canvas → jsPDF.
 * CALLED BY: HomePage.js
 */
function CostCalculator() {
  const [activeStep,     setActiveStep]     = useState(1);
  const [qty,            setQty]            = useState({});
  const [floorInput,     setFloorInput]     = useState("");
  const [selectedFinish, setSelectedFinish] = useState("economic");
  const [clientName,     setClientName]     = useState("");
  const [clientAddr,     setClientAddr]     = useState("");
  const [generating,     setGenerating]     = useState(false);
  // activeFloor: 0=Ground, 1=2nd, 2=3rd — driven by scroll position
  const [activeFloor,    setActiveFloor]    = useState(0);
  const invoiceRef   = useRef(null);

  // activeFloor is now driven purely by tab clicks — no scroll detection needed.

  /**
   * WHAT: Updates room quantity in qty state.
   * HOW:  Clamps value 0–99, parses as int.
   * CALLED BY: onChange on room qty inputs.
   */
  const handleQty = useCallback((key, val) => {
    const n = Math.max(0, Math.min(99, parseInt(val) || 0));
    setQty(prev => ({ ...prev, [key]: n }));
  }, []);

  // ── Live computed values ──
  const computeFloor = (rooms) => rooms.reduce((s, r) => s + (qty[r.key] || 0) * r.area, 0);
  const groundTotal   = computeFloor(GROUND_ROOMS);
  const secondTotal   = computeFloor(SECOND_ROOMS);
  const thirdTotal    = computeFloor(THIRD_ROOMS);
  const estimatedArea = groundTotal + secondTotal + thirdTotal;
  const totalArea     = parseFloat(floorInput) || estimatedArea;

  // All finish costs for current totalArea
  const allCosts = Object.entries(RATES).map(([key, r]) => ({
    key, label: r.label, color: r.color,
    min: Math.round(totalArea * r.min),
    max: Math.round(totalArea * r.max),
  }));

  // Selected finish cost
  const activeCost = allCosts.find(c => c.key === selectedFinish);

  // Bar chart data — mid-point value, min/max for tooltip
  const barData = allCosts.map(c => ({
    label: c.label, color: c.color,
    min: c.min, max: c.max,
    midpoint: Math.round((c.min + c.max) / 2),
  }));

  // Rooms selected for invoice
  const selectedRooms = [
    ...GROUND_ROOMS.map(r => ({ ...r, floor: "Ground Floor" })),
    ...SECOND_ROOMS.map(r => ({ ...r, floor: "2nd Floor" })),
    ...THIRD_ROOMS.map(r => ({ ...r, floor: "3rd Floor" })),
  ].filter(r => (qty[r.key] || 0) > 0);

  /**
   * WHAT: Generates and downloads a watermarked PDF invoice.
   * HOW:  html2canvas captures invoiceRef div at 2x scale, embeds into jsPDF,
   *       then overlays diagonal TRICONIX watermark text before saving.
   * CALLED BY: onClick on Download Invoice button.
   */
  const handleGenerateInvoice = useCallback(async () => {
    if (!invoiceRef.current) return;
    setGenerating(true);
    try {
      const canvas  = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: "#0d0d0d", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.setFontSize(36);
      pdf.setTextColor(201, 168, 76);
      pdf.setGState(pdf.GState({ opacity: 0.07 }));
      for (let y = 40; y < pdfH; y += 60) {
        pdf.text("TRICONIX CONSTRUCTION CORP.", pdfW / 2, y, { angle: 35, align: "center" });
      }
      pdf.save(`Triconix-Estimate-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <section id="cost-calculator" className="calcSection">

      {/* ── Section header ── */}
      <div className="calcHeader">
        <span className="calcBadge"><span className="calcBadgeDot" />Triconix Tools</span>
        <h2 className="calcTitle">Building Cost Calculator</h2>
        <p className="calcSubtitle">
          Three steps to your personalized estimate. Costs update live as you select.
        </p>
      </div>

      {/* ── Step indicators ── */}
      <div className="calcStepNav">
        {[
          { n: 1, label: "Select Rooms" },
          { n: 2, label: "Choose Finish" },
          { n: 3, label: "Get Invoice" },
        ].map(s => (
          <button
            key={s.n}
            className={`calcStepBtn ${activeStep === s.n ? "calcStepBtnActive" : ""} ${activeStep > s.n ? "calcStepBtnDone" : ""}`}
            onClick={() => setActiveStep(s.n)}
          >
            <span className="calcStepNum">{activeStep > s.n ? "✓" : `0${s.n}`}</span>
            <span className="calcStepLabel">{s.label}</span>
          </button>
        ))}
        <div className="calcStepLine" />
      </div>

      {/* ════════════════════════════════════════
          STEP 1 — Select Rooms
      ════════════════════════════════════════ */}
      {activeStep === 1 && (
        <div className="calcStepPanel">
          <div className="calcStep1Body">

            {/* Room selector left — scroll drives floor switching */}
            <div className="calcRooms">

              {/* ── Floor tab buttons — clicking sets activeFloor, shows matching panel ── */}
              <div className="calcFloorTabs">
                {["Ground Floor", "2nd Floor", "3rd Floor"].map((label, i) => (
                  <button
                    key={label}
                    className={`calcFloorTab ${activeFloor === i ? "calcFloorTabActive" : ""}`}
                    onClick={() => setActiveFloor(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Active floor panel — only the selected floor renders ── */}
              {[
                { label: "Ground Floor", rooms: GROUND_ROOMS, total: groundTotal },
                { label: "2nd Floor",    rooms: SECOND_ROOMS, total: secondTotal },
                { label: "3rd Floor",    rooms: THIRD_ROOMS,  total: thirdTotal  },
              ].filter((_, fi) => fi === activeFloor).map((floor) => (
                <div key={floor.label} className="calcFloor">
                  <div className="calcFloorHeader">
                    <span className="calcFloorLabel">{floor.label}</span>
                    <span className="calcFloorTotal">{floor.total.toFixed(2)} m²</span>
                  </div>
                  <div className="calcRoomGrid">
                    {floor.rooms.map(room => (
                      <div key={room.key} className={`calcRoomRow ${(qty[room.key] || 0) > 0 ? "calcRoomActive" : ""}`}>
                        <div className="calcRoomInfo">
                          <span className="calcRoomLabel">{room.label}</span>
                          <span className="calcRoomDim">{room.dim} · {room.area} m²</span>
                        </div>
                        <div className="calcQtyControl">
                          <button className="calcQtyBtn" onClick={() => handleQty(room.key, (qty[room.key] || 0) - 1)}>−</button>
                          <span className="calcQtyVal">{qty[room.key] || 0}</span>
                          <button className="calcQtyBtn" onClick={() => handleQty(room.key, (qty[room.key] || 0) + 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            </div>

            {/* Live area summary right — sticky */}
            <div className="calcStep1Summary">
              <div className="calcSummaryCard">
                <span className="calcSummaryEye">Total Floor Area</span>
                <span className="calcSummaryBig">{totalArea.toFixed(2)}</span>
                <span className="calcSummaryUnit">square meters</span>
                <div className="calcSummaryBreakdown">
                  <div className="calcSummaryRow">
                    <span>Ground Floor</span><span>{groundTotal.toFixed(2)} m²</span>
                  </div>
                  <div className="calcSummaryRow">
                    <span>2nd Floor</span><span>{secondTotal.toFixed(2)} m²</span>
                  </div>
                  <div className="calcSummaryRow">
                    <span>3rd Floor</span><span>{thirdTotal.toFixed(2)} m²</span>
                  </div>
                </div>
              </div>

              {/* Quick cost preview — all 4 finishes */}
              <div className="calcQuickCosts">
                <span className="calcQuickCostsTitle">Live Cost Preview</span>
                {allCosts.map(c => (
                  <div key={c.key} className="calcQuickRow">
                    <span className="calcQuickLabel" style={{ color: c.color }}>{c.label}</span>
                    <span className="calcQuickRange">{formatPeso(c.min)} – {formatPeso(c.max)}</span>
                  </div>
                ))}
                <p className="calcQuickNote">* Approximate only. Updates as you select rooms.</p>
              </div>

              {/* Manual area override — below Live Cost Preview */}
              <div className="calcManualArea">
                <label className="calcManualLabel">
                  Override Total Floor Area
                  <span className="calcManualNote">including garage, balcony, lanai, pathwalk etc.</span>
                </label>
                <div className="calcManualRow">
                  <input
                    type="number"
                    className="calcManualInput"
                    placeholder={estimatedArea.toFixed(2)}
                    value={floorInput}
                    onChange={e => setFloorInput(e.target.value)}
                  />
                  <span className="calcManualUnit">m²</span>
                </div>
              </div>

              <button className="calcNextBtn" onClick={() => setActiveStep(2)}>
                Next: Choose Finish →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — Choose Finish Level
      ════════════════════════════════════════ */}
      {activeStep === 2 && (
        <div className="calcStepPanel">
          <div className="calcStep2Body">

            {/* Finish selector cards */}
            <div className="calcFinishCards">
              {allCosts.map(c => (
                <button
                  key={c.key}
                  className={`calcFinishCard ${selectedFinish === c.key ? "calcFinishCardActive" : ""}`}
                  style={{ "--finish-color": c.color }}
                  onClick={() => setSelectedFinish(c.key)}
                >
                  <div className="calcFinishCardTop">
                    <span className="calcFinishCardDot" style={{ background: c.color }} />
                    <span className="calcFinishCardName">{c.label}</span>
                    {selectedFinish === c.key && <span className="calcFinishCardCheck">✓</span>}
                  </div>
                  <div className="calcFinishCardCost">
                    {formatPeso(c.min)} – {formatPeso(c.max)}
                  </div>
                  <p className="calcFinishCardDesc">{FINISH_DESC[c.key]}</p>
                </button>
              ))}
            </div>

            {/* Bar chart + selected cost */}
            <div className="calcStep2Right">

              {/* Selected finish highlight */}
              {activeCost && (
                <div className="calcSelectedCost" style={{ borderColor: activeCost.color }}>
                  <span className="calcSelectedEye">Selected: {activeCost.label} Finish</span>
                  <span className="calcSelectedMin">{formatPeso(activeCost.min)}</span>
                  <span className="calcSelectedSep">to</span>
                  <span className="calcSelectedMax">{formatPeso(activeCost.max)}</span>
                  <span className="calcSelectedArea">for {totalArea.toFixed(2)} m²</span>
                </div>
              )}

              {/* Bar chart — all finish levels side by side */}
              <div className="calcBarChartCard">
                <span className="calcBarChartTitle">Cost Comparison by Finish Level</span>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }} barSize={36}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#888880", fontSize: 10, fontFamily: "var(--font-ui)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `₱${(v / 1000000).toFixed(1)}M`}
                      tick={{ fill: "#888880", fontSize: 9, fontFamily: "var(--font-ui)" }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="midpoint" radius={[3, 3, 0, 0]}>
                      {barData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.color}
                          opacity={allCosts.find(c => c.label === d.label)?.key === selectedFinish ? 1 : 0.35}
                        />
                      ))}
                      <LabelList
                        dataKey="midpoint"
                        position="top"
                        formatter={v => `₱${(v / 1000000).toFixed(2)}M`}
                        style={{ fill: "#888880", fontSize: 8, fontFamily: "var(--font-ui)" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Additional costs */}
              <div className="calcAdditional">
                <span className="calcAdditionalTitle">Additional Costs (Approximate)</span>
                {ADDITIONAL.map(a => (
                  <div key={a.key} className="calcAdditionalRow">
                    <span>{a.label}</span>
                    <span>{formatPeso(a.min)} – {formatPeso(a.max)}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Next button — full width below both columns */}
          <div className="calcStep2Footer">
            <button className="calcNextBtn" onClick={() => setActiveStep(3)}>
              Next: Get Invoice →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — Invoice
      ════════════════════════════════════════ */}
      {activeStep === 3 && (
        <div className="calcStepPanel">
          <div className="calcStep3Body">
            <div className="calcInvoiceForm">
              <div className="calcInvoiceFormHeader">
                <h3 className="calcInvoiceFormTitle">Client Details</h3>
                <p className="calcInvoiceFormSub">Fill in to personalise your PDF estimate.</p>
              </div>
              <input
                type="text"
                className="calcInvoiceInput"
                placeholder="Client Name"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
              <input
                type="text"
                className="calcInvoiceInput"
                placeholder="Project Address"
                value={clientAddr}
                onChange={e => setClientAddr(e.target.value)}
              />
              <button
                className={`calcInvoiceBtn ${generating ? "calcInvoiceBtnLoading" : ""}`}
                onClick={handleGenerateInvoice}
                disabled={generating}
              >
                {generating ? "Generating PDF…" : "⬇ Download Invoice PDF"}
              </button>
            </div>

            {/* ── Printable invoice (captured by html2canvas) ── */}
            <div className="calcInvoicePreview" ref={invoiceRef}>
              <div className="invoiceWatermark">TRICONIX</div>

              <div className="invoiceTop">
                <div className="invoiceLogoBlock">
                  <img
                    src="https://static.wixstatic.com/media/982f32_45063b7ef8494eb4a11e586503dea6ad~mv2.jpg/v1/crop/x_377,y_524,w_2300,h_1988/fill/w_216,h_187,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20101_edited.jpg"
                    alt="Triconix"
                    className="invoiceLogo"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <div className="invoiceCompany">TRICONIX CONSTRUCTION CORPORATION</div>
                    <div className="invoiceCompanySub">Architects · Engineers · Builders</div>
                    <div className="invoiceCompanyAddr">#66 JP Rizal St. 2nd Floor Unit 2C, Kore Bldg. Nangka, Marikina City</div>
                    <div className="invoiceCompanyContact">Smart: 0946 616 3185 · Globe: 0905 266 6282</div>
                  </div>
                </div>
                <div className="invoiceMeta">
                  <div className="invoiceMetaLabel">ESTIMATE</div>
                  <div className="invoiceMetaNum">#{String(Date.now()).slice(-6)}</div>
                  <div className="invoiceMetaDate">
                    {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="invoiceClientBlock">
                <div className="invoiceClientLabel">PREPARED FOR</div>
                <div className="invoiceClientName">{clientName || "—"}</div>
                <div className="invoiceClientAddr">{clientAddr || "—"}</div>
              </div>

              {selectedRooms.length > 0 && (
                <div className="invoiceItemsTable">
                  <div className="invoiceItemsHeader">
                    <span>Room</span><span>Floor</span><span>Qty</span><span>Area (m²)</span><span>Total m²</span>
                  </div>
                  {selectedRooms.map(r => (
                    <div key={r.key} className="invoiceItemRow">
                      <span>{r.label}</span>
                      <span>{r.floor}</span>
                      <span>{qty[r.key]}</span>
                      <span>{r.area.toFixed(2)}</span>
                      <span>{(qty[r.key] * r.area).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="invoiceItemsFooter">
                    <span>Total Floor Area</span><span /><span /><span />
                    <span>{totalArea.toFixed(2)} m²</span>
                  </div>
                </div>
              )}

              <div className="invoiceFinishBadge" style={{ borderColor: activeCost?.color }}>
                <span className="invoiceFinishLabel">Selected Finish</span>
                <span className="invoiceFinishName" style={{ color: activeCost?.color }}>{activeCost?.label}</span>
                <p className="invoiceFinishDesc">{FINISH_DESC[selectedFinish]}</p>
              </div>

              <div className="invoiceCostSummary">
                <div className="invoiceCostTitle">ESTIMATED BUILD COST</div>
                {allCosts.map(c => (
                  <div key={c.key} className={`invoiceCostLine ${c.key === selectedFinish ? "invoiceCostLineActive" : ""}`}>
                    <span className="invoiceCostFinish" style={{ color: c.color }}>{c.label} Finish</span>
                    <span className="invoiceCostRange">{formatPeso(c.min)} – {formatPeso(c.max)}</span>
                  </div>
                ))}
              </div>

              <div className="invoiceAdditional">
                <div className="invoiceAdditionalTitle">Additional Costs (Approximate Only)</div>
                {ADDITIONAL.map(a => (
                  <div key={a.key} className="invoiceAdditionalLine">
                    <span>{a.label}</span>
                    <span>{formatPeso(a.min)} – {formatPeso(a.max)}</span>
                  </div>
                ))}
              </div>

              <div className="invoiceFooter">
                <div className="invoiceDisclaimer">
                  This estimate is based on selected floor areas and is provided for planning purposes only.
                  Final costs may vary based on site conditions, material availability, and scope changes. Valid 30 days.
                </div>
                <div className="invoiceFooterBrand">TRICONIX CONSTRUCTION CORPORATION · "Crafting Dreams, Building Homes"</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default CostCalculator;