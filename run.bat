@echo off
echo ===================================================
echo        Menjalankan Aplikasi Kasir POS
echo ===================================================
echo.

:: Menjalankan Backend di jendela baru (dengan virtual environment)
echo [1/2] Menyalakan Backend (FastAPI)...
start "Kasir POS - Backend" cmd /k "cd backend && call ..\venv\Scripts\activate.bat && uvicorn app.main:app --reload"

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
