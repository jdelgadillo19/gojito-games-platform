import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@gojito/nav-styles";
import "../styles.css";
import { AuthProvider } from "./platform/auth";
import App from "./App";

const rootElement = document.getElementById("gojito-nav-root");
if (!rootElement) {
  throw new Error("Root element #gojito-nav-root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
