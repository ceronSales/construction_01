/**
 * WHAT: Shared animated blob gradient background — 12 moving color blobs.
 * HOW:  Renders 12 absolutely-positioned spans, each styled in BlobGradient.css
 *       with unique color, size, position, and animation keyframe path.
 *       Drop inside any section with position:relative + overflow:hidden.
 * CALLED BY: CostCalculator.js, HomeLoanCalculator.js
 */

import React from "react";
import "../css/BlobGradient.css";

function BlobBackground() {
  return (
    <>
      <span className="blobb1"  aria-hidden="true" />
      <span className="blobb2"  aria-hidden="true" />
      <span className="blobb3"  aria-hidden="true" />
      <span className="blobb4"  aria-hidden="true" />
      <span className="blobb5"  aria-hidden="true" />
      <span className="blobb6"  aria-hidden="true" />
      <span className="blobb7"  aria-hidden="true" />
      <span className="blobb8"  aria-hidden="true" />
      <span className="blobb9"  aria-hidden="true" />
      <span className="blobb10" aria-hidden="true" />
      <span className="blobb11" aria-hidden="true" />
      <span className="blobb12" aria-hidden="true" />
    </>
  );
}

export default BlobBackground;
