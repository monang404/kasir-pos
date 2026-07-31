@echo off
echo ===================================================
echo        Menjalankan Aplikasi Kasir POS (LOKAL)
echo ===================================================
echo.
echo [PERHATIAN] Pastikan layanan PostgreSQL dan Redis
echo sudah berjalan secara lokal di komputer ini.
echo.

:: Cek apakah venv sudah dibuat
if not exist "backend\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment Python tidak ditemukan!
    echo Harap jalankan langkah instalasi manual di README.md terlebih dahulu.
    pause
    exit /b
)

:: Menjalankan Backend di jendela baru (dengan virtual environment)
echo [1/2] Menyalakan Backend (FastAPI)...
start "Kasir POS - Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && set DATABASE_URL=postgresql+psycopg2://kasir:kasir@localhost:5432/kasir_pos && set REDIS_URL=redis://localhost:6379/0 && set SECRET_KEY=supersecret && uvicorn app.main:app --reload"

:: Menjalankan Frontend di jendela baru
echo [2/2] Menyalakan Frontend (React/Vite)...
start "Kasir POS - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Aplikasi sedang berjalan di jendela terpisah!
echo.
echo - Backend API   : http://localhost:8000
echo - Frontend UI   : http://localhost:5173 (klik link di terminal Frontend)
echo.
echo Biarkan kedua jendela terminal hitam tetap terbuka
echo selama Anda menggunakan aplikasi.
echo ===================================================
pause
