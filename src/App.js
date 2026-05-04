/**
 * WHAT: Root application component. Renders the global router and layout shell.
 * HOW: Imports global CSS and wraps all routes. Pages are added here as the
 *      project expands with further instructions.
 * CALLED BY: index.js (ReactDOM.render)
 */

/**
 * WHAT: Root application component.
 * HOW: Imports global CSS and renders the HomePage. Additional routes will
 *      be wired here as pages are built per instruction.
 * CALLED BY: index.js (ReactDOM.render)
 */

import React from "react";
import "./css/global.css";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="appRoot">
      <HomePage />
    </div>
  );
}

export default App;