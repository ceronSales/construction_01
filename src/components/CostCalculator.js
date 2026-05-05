/**
 * WHAT: Building Cost Calculator — interactive room selector with pie chart and invoice generator.
 * HOW:  User selects quantities per room across Ground/2nd/3rd floor. Total area auto-calculates.
 *       Recharts PieChart shows cost breakdown by finish type. jsPDF + html2canvas generates
 *       a watermarked invoice PDF with itemized breakdown and cost summary.
 * CALLED BY: HomePage.js
 */

import React, { useState, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../css/CostCalculator.css";

// ── Cost rates per sqm by finish type (in Philippine Pesos) ──
const RATES = {
  economic:   { min: 18700, max: 19700 },
  regular:    { min: 19700, max: 22100 },
  semiElegant:{ min: 22100, max: 24800 },
  elegant:    { min: 24800, max: 27800 },
};

// ── Finish type chart colors ──
const FINISH_COLORS = {
  economic:    "#c9a84c",
  regular:     "#7fb069",
  semiElegant: "#4a90d9",
  elegant:     "#d4a0d0",
};

// ── Room definitions ──
const GROUND_ROOMS = [
  { key: "livingRoom",     label: "Living Room",                    area: 16.00, dim: "4m x 4m" },
  { key: "diningRoom",     label: "Dining Room",                    area: 14.00, dim: "3.5m x 4m" },
  { key: "kitchen",        label: "Kitchen",                        area: 12.00, dim: "3m x 4m" },
  { key: "dirtyKitchen",   label: "Dirty Kitchen",                  area:  6.00, dim: "2m x 3m" },
  { key: "maidsRoom",      label: "Maid's Room",                    area:  6.00, dim: "2m x 3m" },
  { key: "guestRoom",      label: "Guest Room",                     area:  9.00, dim: "3m x 3m" },
  { key: "masterBed",      label: "Master Bedroom",                 area: 16.00, dim: "4m x 4m" },
  { key: "walkInClosetG",  label: "Walk-in Closet",                 area:  4.00, dim: "2m x 2m" },
  { key: "toiletBathTub",  label: "Toilet & Bath with Tub",         area:  5.76, dim: "1.8m x 3.2m" },
  { key: "toiletBath",     label: "Toilet & Bath",                  area:  3.60, dim: "1.5m x 2.4m" },
  { key: "powderRoom",     label: "Powder Room",                    area:  2.00, dim: "1m x 2m" },
  { key: "entertainment",  label: "Entertainment Room",             area: 12.00, dim: "4m x 4m" },
  { key: "officeRoom",     label: "Office Room",                    area:  9.00, dim: "3m x 3m" },
  { key: "storage",        label: "Storage",                        area:  2.00, dim: "1m x 2m" },
  { key: "additionalRoomG",label: "Additional Room",                area:  9.00, dim: "3m x 3m" },
  { key: "hallwaysG",      label: "Hallways",                       area:  6.00, dim: "1m x 6m" },
  { key: "coveredLanai",   label: "Covered Lanai",                  area:  4.20, dim: "1.2m x 3.5m" },
  { key: "garage",         label: "Car Covered Garage",             area: 19.50, dim: "3m x 6.5m" },
  { key: "coveredPorch",   label: "Covered Porch / Area",           area:  2.00, dim: "1m x 2m" },
];

const SECOND_ROOMS = [
  { key: "stairs2",        label: "Stairs",                         area:  6.00, dim: "2m x 3m" },
  { key: "familyArea2",    label: "Family Area",                    area:  9.00, dim: "3m x 3m" },
  { key: "openBelow2",     label: "Open Below Area",                area: 16.00, dim: "4m x 4m" },
  { key: "masterBed2",     label: "Master Bedroom",                 area: 16.00, dim: "4m x 4m" },
  { key: "walkInCloset2",  label: "Walk-in Closet",                 area:  4.00, dim: "2m x 2m" },
  { key: "bedroom2",       label: "Bedroom",                        area: 10.50, dim: "3m x 3.5m" },
  { key: "toiletTub2",     label: "Toilet & Bath with Tub",         area:  5.76, dim: "1.8m x 3.2m" },
  { key: "toilet2",        label: "Toilet & Bath",                  area:  3.60, dim: "1.5m x 2.4m" },
  { key: "balconyGarage",  label: "Balcony on top of Garage",       area: 19.50, dim: "3m x 6.5m" },
  { key: "mediumBalcony",  label: "Medium Balcony",                 area: 10.00, dim: "4m x 2.5m" },
  { key: "smallBalcony",   label: "Small Balcony",                  area:  2.40, dim: "1.2m x 2m" },
  { key: "additionalRoom2",label: "Additional Room",                area:  9.00, dim: "3m x 3m" },
  { key: "hallways2",      label: "Hallways",                       area:  6.00, dim: "1m x 6m" },
];

const THIRD_ROOMS = [
  { key: "stairs3",        label: "Stairs",                         area:  6.00, dim: "2m x 3m" },
  { key: "familyArea3",    label: "Family Area",                    area: 12.00, dim: "3m x 3m" }, // note: site shows 12
  { key: "openBelow3",     label: "Open Below Area",                area: 16.00, dim: "4m x 4m" },
  { key: "masterBed3",     label: "Master Bedroom",                 area: 16.00, dim: "4m x 4m" },
  { key: "walkInCloset3",  label: "Walk-in Closet",                 area:  4.00, dim: "2m x 2m" },
  { key: "bedroom3",       label: "Bedroom",                        area: 10.50, dim: "3m x 3.5m" },
  { key: "toiletTub3",     label: "Toilet & Bath with Tub",         area:  5.76, dim: "1.8m x 3.2m" },
  { key: "toilet3",        label: "Toilet & Bath",                  area:  3.60, dim: "1.5m x 2.4m" },
  { key: "balconyGarage3", label: "Balcony on top of Garage",       area: 10.00, dim: "3m x 6.5m" },
  { key: "mediumBalcony3", label: "Medium Balcony",                 area: 10.00, dim: "4m x 2.5m" },
  { key: "smallBalcony3",  label: "Small Balcony",                  area:  2.40, dim: "1.2m x 2m" },
  { key: "entertainment3", label: "Entertainment Room",             area: 16.00, dim: "4m x 4m" },
  { key: "additionalRoom3",label: "Additional Room",                area:  9.00, dim: "3m x 3m" },
  { key: "hallways3",      label: "Hallways",                       area:  6.00, dim: "1m x 6m" },
  { key: "roofDeck",       label: "Open Space Roof Deck",           area: 91.10, dim: "varies" },
];

// Additional costs
const ADDITIONAL = [
  { key: "fence",    label: "Fence",            min: 25000, max: 201740 },
  { key: "permits",  label: "Permits",           min: 25000, max: 126022.58 },
  { key: "cabinets", label: "Bedroom Cabinets",  min: 25000, max: 122267.28 },
];

/**
 * WHAT: Formats a number as Philippine Peso currency string.
 * HOW:  Uses Intl.NumberFormat with PHP locale settings.
 * CALLED BY: render functions throughout the component.
 */
const formatPeso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n);

/**
 * WHAT: CostCalculator — full building cost estimator with chart and invoice.
 * HOW:  State tracks qty per room key. Derived values compute totalArea and costs.
 *       PieChart visualizes finish breakdown. PDF invoice generated via jsPDF.
 * CALLED BY: HomePage.js
 */
function CostCalculator() {
  // qty map: roomKey → integer quantity (0 = not included)
  const [qty, setQty]             = useState({});
  const [floorInput, setFloorInput] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddr, setClientAddr] = useState("");
  const [generating, setGenerating] = useState(false);
  const invoiceRef                  = useRef(null);

  /**
   * WHAT: Updates qty for a given room key.
   * HOW:  Clamps value to 0-99. Parses as integer.
   * CALLED BY: onChange on qty input fields.
   */
  const handleQty = useCallback((key, val) => {
    const n = Math.max(0, Math.min(99, parseInt(val) || 0));
    setQty(prev => ({ ...prev, [key]: n }));
  }, []);

  // ── Computed totals ──
  const computeFloorArea = (rooms) =>
    rooms.reduce((sum, r) => sum + (qty[r.key] || 0) * r.area, 0);

  const groundTotal  = computeFloorArea(GROUND_ROOMS);
  const secondTotal  = computeFloorArea(SECOND_ROOMS);
  const thirdTotal   = computeFloorArea(THIRD_ROOMS);
  const estimatedArea = groundTotal + secondTotal + thirdTotal;

  // Use manual input if provided, else estimated
  const totalArea = parseFloat(floorInput) || estimatedArea;

  // Cost ranges per finish
  const costs = Object.entries(RATES).map(([key, rate]) => ({
    key,
    label: key === "semiElegant" ? "Semi-Elegant" : key.charAt(0).toUpperCase() + key.slice(1),
    min: totalArea * rate.min,
    max: totalArea * rate.max,
    color: FINISH_COLORS[key],
  }));

  // Pie chart data — mid-point of each finish range
  const pieData = costs.map(c => ({
    name: c.label,
    value: Math.round((c.min + c.max) / 2),
    color: c.color,
  }));

  // Selected rooms for invoice
  const allRooms = [
    ...GROUND_ROOMS.map(r => ({ ...r, floor: "Ground Floor" })),
    ...SECOND_ROOMS.map(r => ({ ...r, floor: "2nd Floor" })),
    ...THIRD_ROOMS.map(r => ({ ...r, floor: "3rd Floor" })),
  ].filter(r => (qty[r.key] || 0) > 0);

  /**
   * WHAT: Generates and downloads a PDF invoice with watermark.
   * HOW:  Captures the invoiceRef div via html2canvas, embeds it into jsPDF,
   *       then adds a diagonal watermark text overlay before saving.
   * CALLED BY: onClick on Generate Invoice button.
   */
  const handleGenerateInvoice = useCallback(async () => {
    if (!invoiceRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#0d0d0d",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      // ── Diagonal watermark ──
      pdf.setFontSize(36);
      pdf.setTextColor(201, 168, 76);
      pdf.setGState(pdf.GState({ opacity: 0.08 }));
      for (let y = 40; y < pdfH; y += 60) {
        pdf.text("TRICONIX CONSTRUCTION CORP.", pdfW / 2, y, {
          angle: 35,
          align: "center",
        });
      }

      pdf.save(`Triconix-Invoice-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Invoice generation error:", err);
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <section id="cost-calculator" className="calcSection">
      {/* ── Section header ── */}
      <div className="calcHeader">
        <span className="calcBadge">
          <span className="calcBadgeDot" />
          Triconix Tools
        </span>
        <h2 className="calcTitle">Building Cost Calculator</h2>
        <p className="calcSubtitle">
          Select the rooms you want to include. We'll estimate your total floor area
          and compute the build cost across four finish levels.
        </p>
      </div>

      <div className="calcBody">
        {/* ── Left: Room selector ── */}
        <div className="calcRooms">
          {[
            { label: "Ground Floor", rooms: GROUND_ROOMS, total: groundTotal },
            { label: "2nd Floor",    rooms: SECOND_ROOMS, total: secondTotal },
            { label: "3rd Floor",    rooms: THIRD_ROOMS,  total: thirdTotal  },
          ].map(floor => (
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
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={qty[room.key] || ""}
                      placeholder="0"
                      className="calcQtyInput"
                      onChange={e => handleQty(room.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Floor area override ── */}
          <div className="calcManualArea">
            <label className="calcManualLabel">
              Override Floor Area
              <span className="calcManualNote">(including garage, balcony, lanai, pathwalk etc.)</span>
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
        </div>

        {/* ── Right: Results panel ── */}
        <div className="calcResults">
          {/* Total area summary */}
          <div className="calcAreaCard">
            <span className="calcAreaLabel">Estimated Floor Area</span>
            <span className="calcAreaValue">{totalArea.toFixed(2)}</span>
            <span className="calcAreaUnit">square meters</span>
          </div>

          {/* Pie chart */}
          <div className="calcChartCard">
            <span className="calcChartTitle">Cost Distribution by Finish</span>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatPeso(val)}
                  contentStyle={{
                    background: "#161616",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "4px",
                    color: "#f5f0e8",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "0.65rem", color: "#888880" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cost breakdown table */}
          <div className="calcCostTable">
            <div className="calcCostHeader">
              <span>Finish Level</span>
              <span>Min Cost</span>
              <span>Max Cost</span>
            </div>
            {costs.map(c => (
              <div key={c.key} className="calcCostRow">
                <span className="calcCostLabel" style={{ color: c.color }}>
                  <span className="calcCostDot" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="calcCostVal">{formatPeso(c.min)}</span>
                <span className="calcCostVal">{formatPeso(c.max)}</span>
              </div>
            ))}
          </div>

          {/* Additional costs */}
          <div className="calcAdditional">
            <span className="calcAdditionalTitle">Additional Costs (Approx.)</span>
            {ADDITIONAL.map(a => (
              <div key={a.key} className="calcAdditionalRow">
                <span>{a.label}</span>
                <span>{formatPeso(a.min)} – {formatPeso(a.max)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Invoice generator ── */}
      <div className="calcInvoiceSection">
        <div className="calcInvoiceHeader">
          <h3 className="calcInvoiceTitle">Generate Invoice</h3>
          <p className="calcInvoiceSubtitle">Fill in client details to produce a watermarked PDF estimate.</p>
        </div>

        <div className="calcInvoiceForm">
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
        </div>

        {/* ── Printable invoice (captured by html2canvas) ── */}
        <div className="calcInvoicePreview" ref={invoiceRef}>
          {/* Watermark */}
          <div className="invoiceWatermark">TRICONIX</div>

          {/* Invoice header */}
          <div className="invoiceTop">
            <div className="invoiceLogoBlock">
              <img
                src="https://static.wixstatic.com/media/982f32_45063b7ef8494eb4a11e586503dea6ad~mv2.jpg/v1/crop/x_377,y_524,w_2300,h_1988/fill/w_216,h_187,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20101_edited.jpg"
                alt="Triconix Logo"
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
              <div className="invoiceMetaDate">{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>

          {/* Client block */}
          <div className="invoiceClientBlock">
            <div className="invoiceClientLabel">PREPARED FOR</div>
            <div className="invoiceClientName">{clientName || "—"}</div>
            <div className="invoiceClientAddr">{clientAddr || "—"}</div>
          </div>

          {/* Room line items */}
          {allRooms.length > 0 && (
            <div className="invoiceItemsTable">
              <div className="invoiceItemsHeader">
                <span>Room</span>
                <span>Floor</span>
                <span>Qty</span>
                <span>Area (m²)</span>
                <span>Total m²</span>
              </div>
              {allRooms.map(r => (
                <div key={r.key} className="invoiceItemRow">
                  <span>{r.label}</span>
                  <span>{r.floor}</span>
                  <span>{qty[r.key]}</span>
                  <span>{r.area.toFixed(2)}</span>
                  <span>{(qty[r.key] * r.area).toFixed(2)}</span>
                </div>
              ))}
              <div className="invoiceItemsFooter">
                <span>Total Floor Area</span>
                <span></span><span></span><span></span>
                <span>{totalArea.toFixed(2)} m²</span>
              </div>
            </div>
          )}

          {/* Cost summary */}
          <div className="invoiceCostSummary">
            <div className="invoiceCostTitle">ESTIMATED BUILD COST</div>
            {costs.map(c => (
              <div key={c.key} className="invoiceCostLine">
                <span className="invoiceCostFinish" style={{ color: c.color }}>{c.label} Finish</span>
                <span className="invoiceCostRange">{formatPeso(c.min)} – {formatPeso(c.max)}</span>
              </div>
            ))}
          </div>

          {/* Additional costs */}
          <div className="invoiceAdditional">
            <div className="invoiceAdditionalTitle">Additional Costs (Approximate Only)</div>
            {ADDITIONAL.map(a => (
              <div key={a.key} className="invoiceAdditionalLine">
                <span>{a.label}</span>
                <span>{formatPeso(a.min)} – {formatPeso(a.max)}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="invoiceFooter">
            <div className="invoiceDisclaimer">
              This estimate is based on the selected floor areas and is provided for planning purposes only.
              Final costs may vary based on actual site conditions, material availability, and scope changes.
              Valid for 30 days from date of issue.
            </div>
            <div className="invoiceFooterBrand">TRICONIX CONSTRUCTION CORPORATION · "Crafting Dreams, Building Homes"</div>
          </div>
        </div>

        <button
          className={`calcInvoiceBtn ${generating ? "calcInvoiceBtnLoading" : ""}`}
          onClick={handleGenerateInvoice}
          disabled={generating}
        >
          {generating ? "Generating PDF..." : "⬇ Download Invoice PDF"}
        </button>
      </div>
    </section>
  );
}

export default CostCalculator;
