# Matriks akses terpusat untuk frontend dan backend
# Mengacu pada PRD §4 Peran Pengguna & Kontrol Akses

ACCESS_MATRIX = {
    "admin": [
        "dashboard", "inventory", "kasir", "pelanggan", "transaksi", 
        "pengeluaran", "laporan", "ml", "users", "activity_log", "backup"
    ],
    "kasir": [
        "inventory", "kasir", "pelanggan", "transaksi"
    ],
    "gudang": [
        "dashboard", "inventory", "pengeluaran", "laporan"
    ]
}

def has_access(role: str, module: str) -> bool:
    return module in ACCESS_MATRIX.get(role.lower(), [])
