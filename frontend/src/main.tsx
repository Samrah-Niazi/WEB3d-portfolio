import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GRAIN } from "./lib/textures";
import "./index.css";

// Film grain texture, shared by every dark scene (see .grain in index.css).
document.documentElement.style.setProperty("--grain", GRAIN);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
