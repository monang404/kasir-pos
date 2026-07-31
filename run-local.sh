#!/bin/bash
echo "==================================================="
echo "       Menjalankan Aplikasi Kasir POS (LOKAL)"
echo "==================================================="
echo ""
echo "[PERHATIAN] Pastikan layanan PostgreSQL dan Redis"
echo "sudah berjalan secara lokal di komputer ini."
echo ""

if [ ! -f "backend/venv/bin/activate" ]; then
    echo "[ERROR] Virtual environment Python tidak ditemukan!"
    echo "Harap jalankan langkah instalasi manual di README.md terlebih dahulu."
    exit 1
fi

echo "[1/2] Menyalakan Backend (FastAPI)..."
# Jalankan backend di background
(cd backend && source venv/bin/activate && export DATABASE_URL="sqlite:///./kasir.db" && export REDIS_URL="redis://localhost:6379/0" && export SECRET_KEY="supersecret" && python init_db.py && uvicorn app.main:app --reload) &
BACKEND_PID=$!

echo "[2/2] Menyalakan Frontend (React/Vite)..."
# Jalankan frontend di background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "Aplikasi sedang berjalan di background!"
echo ""
echo "- Backend API   : http://localhost:8000"
echo "- Frontend UI   : http://localhost:5173"
echo ""
echo "Tekan CTRL+C untuk menghentikan semua layanan."
echo "==================================================="

# Tangkap signal interrupt (CTRL+C) untuk mematikan subprocess
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

wait $BACKEND_PID $FRONTEND_PID
