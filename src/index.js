/**
 * WHAT: React app entry point — mounts the App component into the DOM.
 * HOW: Calls ReactDOM.createRoot targeting the #root div in public/index.html.
 * CALLED BY: Webpack/React build system automatically.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);