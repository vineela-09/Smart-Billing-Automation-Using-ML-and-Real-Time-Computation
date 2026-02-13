import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Forgot from "./pages/Forgot.jsx";
import Reset from "./pages/Reset.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ModernDashboard from "./pages/ModernDashboard.jsx";
import ModernDashboardv2 from "./pages/ModernDashboardv2.jsx";
import "./css/index.css";
function Protected({ children }) {
  const t = localStorage.getItem("token");
  if (!t) return <Navigate to="/" />;
  return children;
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/dashboard" element={<Protected><Dashboard/></Protected>} />
      <Route path="/modern-dashboard" element={<Protected><ModernDashboard/></Protected>} />
      <Route path="/modern-dashboard-v2" element={<Protected><ModernDashboardv2/></Protected>} />
    </Routes>
  </BrowserRouter>
);
