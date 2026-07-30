# Keputusan Desain 0043: Kebijakan Penghapusan Produk

## Konteks
Sistem kasir-POS lama memiliki fitur hapus produk (hard-delete) yang berpotensi menyebabkan error *orphan reference* pada tabel transaksi_detail jika produk tersebut sudah pernah dibeli pelanggan. Selain itu, penghapusan produk tanpa mempedulikan sisa stok di `produk_batch` dapat merusak akurasi total aset persediaan berjalan.

## Keputusan
Kita memilih **Opsi (a)**: Blokir hapus produk yang sudah pernah terjual atau masih memiliki stok. 
Metode yang digunakan adalah blokir keras (hard block) di tingkat Service / Endpoint (API), bukan hanya disembunyikan di UI.

## Alasan
1. **Integritas Transaksi Finansial**: Laporan laba-rugi historis akan rusak atau sulit dilacak jika `produk_id` di `transaksi_detail` dihapus sepenuhnya.
2. **Konsistensi dengan Pelanggan**: Sesuai dengan `PelangganService` yang juga memblokir penghapusan pelanggan jika sudah memiliki riwayat transaksi (referensi dokumen PRD §15 poin 2).
3. **Pencegahan Fraud**: Menghapus produk secara permanen bisa digunakan kasir/admin untuk menghilangkan jejak produk yang hilang/dicuri.

## Konsekuensi
- Fitur penghapusan produk hanya akan bisa digunakan untuk produk yang "baru saja didaftarkan namun belum pernah ditransaksikan sama sekali".
- Untuk produk lama yang sudah tidak dijual, kelak bisa ditambahkan mekanisme soft-delete (`is_active = FALSE`) di task lain jika diperlukan, namun untuk saat ini (Task 4), produk lama tidak bisa dihapus.
