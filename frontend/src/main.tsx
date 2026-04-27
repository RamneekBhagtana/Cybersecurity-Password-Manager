import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { MasterPasswordProvider } from "./context/MasterPasswordContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MasterPasswordProvider>
      <App />
    </MasterPasswordProvider>
  </StrictMode>
);