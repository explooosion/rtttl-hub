import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./index.css";

import App from "./App.tsx";
import { NotificationProvider } from "./components/notification_provider";
import { useAuthStore } from "./stores/auth_store";

// Initialize Firebase Auth state
useAuthStore.getState().initAuth();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <NotificationProvider />
  </StrictMode>,
);
