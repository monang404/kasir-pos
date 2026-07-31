import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import { ToastProvider } from "./components/ui/ToastContext";

import Login from "./pages/login";
import DashboardPage from "./pages/DashboardPage";
import KasirPage from "./pages/KasirPage";
import InventoryPage from "./pages/InventoryPage";
import PelangganPage from "./pages/PelangganPage";
import TransaksiPage from "./pages/TransaksiPage";
import PengeluaranPage from "./pages/PengeluaranPage";
import LaporanPage from "./pages/LaporanPage";
import MlPage from "./pages/ml/MlPage";
import UsersPage from "./pages/users/UsersPage";
import ActivityLogPage from "./pages/activity-log/ActivityLogPage";
import BackupPage from "./pages/backup/BackupPage";

// Cermin dari backend/app/auth/access_matrix.py — hanya untuk tampilkan/sembunyikan
// menu di sidebar. Otorisasi SESUNGGUHNYA tetap ditegakkan backend (RequireModule),
// jadi daftar ini boleh out-of-sync tanpa membuka celah keamanan.
const ACCESS_MATRIX: Record<string, string[]> = {
  admin: [
    "dashboard", "inventory", "kasir", "pelanggan", "transaksi",
    "pengeluaran", "laporan", "ml", "users", "activity_log", "backup",
  ],
  kasir: ["inventory", "kasir", "pelanggan", "transaksi"],
  gudang: ["dashboard", "inventory", "pengeluaran", "laporan"],
};

interface CurrentUser {
  id: number;
  username: string;
  nama_lengkap: string;
  role: string;
}

function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const NAV_ITEMS: { module: string; label: string; path: string }[] = [
  { module: "dashboard", label: "Dashboard", path: "/dashboard" },
  { module: "kasir", label: "Kasir", path: "/kasir" },
  { module: "inventory", label: "Inventory", path: "/inventory" },
  { module: "pelanggan", label: "Pelanggan", path: "/pelanggan" },
  { module: "transaksi", label: "Riwayat Transaksi", path: "/transaksi" },
  { module: "pengeluaran", label: "Pengeluaran", path: "/pengeluaran" },
  { module: "laporan", label: "Laporan", path: "/laporan" },
  { module: "ml", label: "Intelligence / ML", path: "/ml" },
  { module: "users", label: "Users", path: "/users" },
  { module: "activity_log", label: "Activity Log", path: "/activity-log" },
  { module: "backup", label: "Backup", path: "/backup" },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const allowedModules = user ? ACCESS_MATRIX[user.role.toLowerCase()] || [] : [];
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const NAV_ICONS: Record<string, string> = {
    '/dashboard': '◈', '/kasir': '⊕', '/inventory': '□', '/pelanggan': '◉',
    '/transaksi': '≡', '/pengeluaran': '◎', '/laporan': '▤', '/ml': '◆',
    '/users': '⊛', '/activity-log': '◌', '/backup': '⊞',
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a2a" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "230px" : "56px",
          minWidth: sidebarOpen ? "230px" : "56px",
          backgroundColor: "#11113a",
          borderRight: "1px solid #2d2d5f",
          padding: "1rem 0",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease, min-width 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header + toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center", padding: sidebarOpen ? "0 1rem 1rem" : "0 0 1rem", minWidth: sidebarOpen ? "230px" : "56px" }}>
          {sidebarOpen && (
            <span style={{ color: "#e2e8f0", fontWeight: "bold", fontSize: "1rem", whiteSpace: "nowrap" }}>kasir-POS</span>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            title={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            style={{
              background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
              padding: "0.25rem", fontSize: "1.1rem", lineHeight: 1,
              transition: "color 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#e2e8f0")}
            onMouseOut={e => (e.currentTarget.style.color = "#94a3b8")}
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        <nav style={{ flex: 1, overflowX: "hidden" }}>
          {NAV_ITEMS.filter((item) => allowedModules.includes(item.module)).map((item) => {
            const active = location.pathname.startsWith(item.path);
            const icon = NAV_ICONS[item.path] || "·";
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                aria-label={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: sidebarOpen ? "0.75rem 1.5rem" : "0.75rem 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  color: active ? "#38bdf8" : "#94a3b8",
                  backgroundColor: active ? "#1e1e4a" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  borderLeft: active ? "3px solid #38bdf8" : "3px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: sidebarOpen ? "1rem 1.5rem" : "1rem 0", borderTop: "1px solid #2d2d5f", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: sidebarOpen ? "flex-start" : "center" }}>
          {sidebarOpen && (
            <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
              {user?.nama_lengkap} <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({user?.role})</span>
            </div>
          )}
          <button
            onClick={logout}
            aria-label="Logout"
            title="Logout"
            style={{
              width: sidebarOpen ? "100%" : "36px",
              height: sidebarOpen ? "auto" : "36px",
              padding: sidebarOpen ? "0.5rem" : "0",
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: sidebarOpen ? "0.875rem" : "1rem",
            }}
          >
            {sidebarOpen ? "Logout" : "⊗"}
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <AppLayout>{children}</AppLayout>
      </ToastProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/kasir" element={<Protected><KasirPage /></Protected>} />
        <Route path="/inventory" element={<Protected><InventoryPage /></Protected>} />
        <Route path="/pelanggan" element={<Protected><PelangganPage /></Protected>} />
        <Route path="/transaksi" element={<Protected><TransaksiPage /></Protected>} />
        <Route path="/pengeluaran" element={<Protected><PengeluaranPage /></Protected>} />
        <Route path="/laporan" element={<Protected><LaporanPage /></Protected>} />
        <Route path="/ml" element={<Protected><MlPage /></Protected>} />
        <Route path="/users" element={<Protected><UsersPage /></Protected>} />
        <Route path="/activity-log" element={<Protected><ActivityLogPage /></Protected>} />
        <Route path="/backup" element={<Protected><BackupPage /></Protected>} />

        <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
