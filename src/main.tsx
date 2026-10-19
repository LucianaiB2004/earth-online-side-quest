import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./layout.css";
import "./desktop-density.css";
import "./feed-ui.css";
import "./welcome-scene.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
