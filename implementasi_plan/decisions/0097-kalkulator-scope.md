# Keputusan: Porting kalkulator.py

**Tanggal**: 2026-07-30
**Status**: Diabaikan (Rejected)

**Konteks**: 
Pada PRD §18 terdapat pertanyaan terbuka: "Apakah `kalkulator.py` di sistem lama (skrip CLI independen) perlu diporting menjadi fitur web (misal di halaman Kasir)?". `kalkulator.py` dulunya adalah utility command-line sederhana untuk menghitung kembalian atau diskon secara manual di luar sistem.

**Keputusan**:
Diputuskan untuk **mengabaikan/tidak mem-porting** skrip `kalkulator.py` ke sistem POS baru. 

**Alasan / Pertimbangan**:
1. Fitur perhitungan kembalian dan diskon sudah terintegrasi langsung dengan sangat baik di Halaman Checkout Kasir (UX web).
2. Sistem operasi modern (Windows/Mac/Linux/Android) sudah memiliki aplikasi kalkulator bawaan jika kasir membutuhkan perhitungan kompleks di luar konteks transaksi POS.
3. Menyediakan kalkulator terpisah di UI POS hanya akan menumpuk ruang layar tanpa memberikan nilai tambah signifikan pada alur kerja kasir.

**Konsekuensi**:
- Modul `kalkulator.py` dari kode warisan dianggap *deprecated* dan dihapus sepenuhnya dari rencana pengembangan (tidak akan ada fitur "Kalkulator" khusus di UI).
