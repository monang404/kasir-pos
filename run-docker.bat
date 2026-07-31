@echo off
echo ===================================================
echo        Menjalankan Aplikasi via Docker Compose
echo ===================================================
echo.
echo Pastikan Docker Desktop telah menyala...
echo Membangun dan menyalakan container (Backend, Frontend, DB, Redis)...

docker-compose up --build -d

echo.
echo ===================================================
echo [SUKSES] Semua container dijalankan di background (mode -d).
echo.
echo Akses Aplikasi di browser Anda:
echo - Frontend UI   : http://localhost:5173
echo - Backend API   : http://localhost:8000/docs
echo.
echo Untuk melihat log aplikasi, gunakan perintah:
echo    docker-compose logs -f
echo Untuk mematikan aplikasi, gunakan perintah:
echo    docker-compose down
echo ===================================================
pause
