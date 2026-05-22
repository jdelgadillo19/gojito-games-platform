import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./platform/auth";
import App from "./App";

const rootElement =
  document.getElementById("gojito-account-root") ?? document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #gojito-account-root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
