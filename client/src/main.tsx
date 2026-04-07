// main - React app entry point
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./routes/router";
import "./index.css";
import axios from "axios";

// Attach token to every request from localStorage (fallback for iOS Safari cross-site cookie blocking)
axios.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("authToken");
        if (token) config.headers.set("Authorization", `Bearer ${token}`);
    } catch { /* localStorage unavailable */ }
    return config;
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);