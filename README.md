# Super App - Management Toko & Kasir (POS)

Aplikasi kasir (Point of Sale) modern berskala *Enterprise* yang dirancang khusus untuk operasional toko (percetakan, retail, dsb). Aplikasi ini dilengkapi dengan Manajemen Inventaris berbasis FIFO, Laporan Keuangan, Log Audit, hingga fitur *Machine Learning* untuk memprediksi omzet dan menganalisis stok.

## 🌟 Fitur Utama

- **Kasir (Point of Sale)**: Transaksi cepat dengan dukungan barcode/pencarian pintar, manajemen diskon, perhitungan HPP otomatis, kalkulasi profit langsung, cetak struk ke thermal printer atau ekspor ke WhatsApp.
- **Inventory & Gudang**: Manajemen stok masuk/keluar dengan metode FIFO (First-In First-Out). Melacak HPP spesifik per batch barang. Fitur stock adjustment dan import massal via Excel.
- **Manajemen Pelanggan**: Pencatatan data pelanggan dan riwayat transaksi mereka untuk membangun loyalitas.
- **Laporan & Analisis**: Ringkasan omzet, laba kotor, laba bersih, stok real-time, dan pengeluaran. Ekspor satu klik ke `.xlsx`.
- **Pengeluaran**: Pencatatan biaya operasional, gaji, dsb., yang langsung memotong laba bersih harian/bulanan.
- **Machine Learning (Kecerdasan Buatan)**:
  - **Prediksi Omzet**: Menggunakan model *Random Forest Regressor* dan *Linear Regression* untuk memprediksi omzet bulan depan berdasar histori.
  - **Prediksi Stok**: Menghitung *days-to-stockout* (sisa hari sebelum stok habis) berdasarkan rata-rata pergerakan produk harian.
  - **Bonus Kasir & Promo**: Algoritma cerdas merekomendasikan bonus performa kasir dan sistem *upsell* atau tebus murah.
- **Audit Trail & Keamanan**:
  - Catatan log aktivitas (Siapa melakukan apa, kapan, dan perubahan data yang terjadi) yang komprehensif.
  - Lockout otomatis berbasis **Redis** (jika gagal login 5x berturut-turut).
- **Multi-Role & Autentikasi**: Role berbasis (Admin, Kasir, Gudang) dengan otorisasi JWT.
- **Backup & Restore**: Modul *1-click* backup database untuk keamanan data.

---

## 🛠️ Prasyarat (Requirements)

Anda memiliki 2 opsi untuk menjalankan aplikasi ini:
1. **Menggunakan Docker (Sangat Disarankan)**: Anda hanya membutuhkan **Docker Desktop** (atau Docker Engine + Docker Compose). Ini adalah cara termudah dan bebas dari konflik *dependency*.
2. **Cara Manual/Lokal**: Anda memerlukan **Python 3.12+**, **Node.js 18+**, **PostgreSQL 16**, dan **Redis 7**.

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi

Kami telah menyediakan script *entry point* untuk memudahkan Anda menjalankan aplikasi di berbagai Sistem Operasi (Windows, Linux, macOS).

### Opsi 1: Menjalankan Menggunakan Docker (Rekomendasi)
Ini akan menyalakan Backend, Frontend, Database PostgreSQL, dan Redis secara otomatis dalam kontainer tertutup.

**Di Windows (CMD / PowerShell):**
```cmd
run-docker.bat
```
*(Atau Anda bisa langsung mengetik `docker-compose up --build -d`)*

**Di Linux / macOS (Terminal):**
```bash
chmod +x run-docker.sh
./run-docker.sh
```

Aplikasi bisa langsung diakses:
- **Frontend UI (Aplikasi Utama)**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`

---

### Opsi 2: Menjalankan Manual Secara Lokal (Development)
Pilih ini jika Anda ingin melakukan koding atau *development*. **Pastikan PostgreSQL dan Redis sudah menyala di sistem Anda**.
Ubah URL database dan redis di dalam `.env` atau *environment variables* Anda bila perlu (Default: `localhost:5432` dan `localhost:6379`).

**Instalasi Awal (Lakukan ini pertama kali saja):**
1. Backend:
   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Frontend:
   ```bash
   cd frontend
   npm install
   ```

**Menjalankan Aplikasi:**

**Di Windows (CMD / PowerShell):**
```cmd
run-local.bat
```

**Di Linux / macOS (Terminal):**
```bash
chmod +x run-local.sh
./run-local.sh
```

---

## 🔐 Akun Default Aplikasi

Gunakan akun berikut untuk login pertama kali setelah database terbentuk:
- **Username:** `admin`
- **Password Sementara:** `Admin@2025!`

> **PENTING**: Segera ubah password Anda melalui menu pengguna setelah berhasil masuk.

---

## 🔧 Troubleshooting (Penyelesaian Masalah Umum)

| Masalah | Solusi |
| --- | --- |
| **Gagal Login (Akun terkunci / Lockout)** | Jika gagal login 5x, akun Anda akan dikunci selama 5 menit oleh Redis. Tunggu 5 menit atau `FLUSHALL` via `redis-cli` jika Anda admin sistem. |
| **Frontend blank putih (Gagal terkoneksi ke backend)** | Pastikan port backend (8000) tidak digunakan oleh aplikasi lain. Jika menjalankan Docker, coba jalankan `docker-compose logs backend` untuk mengecek apakah backend mengalami error (seperti gagal terkoneksi ke DB). |
| **Error "Database URL tidak valid"** | Pastikan servis `PostgreSQL` sudah jalan (jika manual). Pada Docker, Postgres mungkin butuh beberapa detik ekstra untuk inisialisasi pada proses instalasi pertama kali. Restart kontainer backend: `docker-compose restart backend`. |
| **ML/Prediksi tidak muncul** | Prediksi omzet membutuhkan riwayat transaksi. Lakukan beberapa transaksi percobaan pada bulan ini dan bulan sebelumnya. Pastikan container backend bisa mengakses library `scikit-learn` yang telah ter-install. |
| **File Excel (Laporan/Import) tidak jalan** | Jika install manual, pastikan package `openpyxl` dan `pandas` telah terinstall di virtual environment Python Anda (`pip install openpyxl pandas`). |

---

## 📖 Cara Pakai (Alur Kasir Singkat)

1. **Login** menggunakan akun admin atau kasir.
2. Buka menu **Inventory**, klik "Tambah Produk" untuk memasukkan produk dan harga acuan awal.
3. Gunakan menu **Inventory > Batch Produk** (titik tiga) atau *Stock Adjustment* untuk menambah stok awal (hal ini akan mencatat harga HPP/beli Anda secara aktual untuk kalkulasi profit).
4. Buka halaman **Kasir**. Cari produk, *double click* untuk masuk keranjang, atur kuantitas (qty).
5. Klik **Bayar Sekarang**, masukkan nominal uang yang diberikan pelanggan, konfirmasi.
6. Struk transaksi akan muncul dan Anda bisa mencetaknya atau mengekspornya ke format WA.
7. Buka halaman **Laporan** atau **Dashboard** untuk memantau omzet harian Anda!
