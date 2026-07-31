import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a2a" }}>
      <aside
        style={{
          width: "230px",
          backgroundColor: "#11113a",
          borderRight: "1px solid #2d2d5f",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 1.5rem 1.5rem", color: "#e2e8f0", fontWeight: "bold", fontSize: "1.1rem" }}>
          kasir-POS
        </div>
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.filter((item) => allowedModules.includes(item.module)).map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "block",
                  padding: "0.75rem 1.5rem",
                  color: active ? "#38bdf8" : "#94a3b8",
                  backgroundColor: active ? "#1e1e4a" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  borderLeft: active ? "3px solid #38bdf8" : "3px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2d2d5f", color: "#94a3b8" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            {user?.nama_lengkap} <span style={{ color: "#64748b" }}>({user?.role})</span>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
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
      <AppLayout>{children}</AppLayout>
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
