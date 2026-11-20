import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadJson } from "./lib/platform";
import { restore } from "./lib/progress";
import { StoreProvider } from "./store";
import "./styles.css";

const saved = await loadJson("progress");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider initial={restore(saved)}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
