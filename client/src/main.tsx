// main - React app entry point
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./routes/router";
import "./index.css";
import axios from "axios";

// Primary auth: httpOnly cookie (withCredentials)
// Fallback: Authorization header from storage — needed for iOS Safari/Chrome
// which blocks cross-origin cookies (Apple ITP)
// - Customers: localStorage (persists across sessions — stay logged in)
// - Admins/staff: sessionStorage (cleared on browser close — must re-login)
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (token) config.headers.set("Authorization", `Bearer ${token}`);
    } catch { /* storage unavailable */ }
    return config;
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);