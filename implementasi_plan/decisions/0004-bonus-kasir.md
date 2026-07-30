# Keputusan: Fitur Bonus Kasir dan Transaksi Bonus

**Tanggal**: 2026-07-30
**Status**: Diterima (Approved)
**Konteks**: 
Berdasarkan PRD §15 poin 4, tabel `bonus_kasir` dan `transaksi_bonus` ada pada skema database sistem lama tetapi tidak pernah digunakan di UI maupun layer service mana pun. Terdapat pertanyaan terbuka di `00_index.yaml` mengenai apakah tabel ini perlu dilanjutkan atau dihapus.

**Keputusan**:
Setelah dikonfirmasi dengan Product Owner, diputuskan untuk **menghapus secara permanen** fitur dan tabel `bonus_kasir` serta `transaksi_bonus` dari skema RDBMS baru.

**Konsekuensi**:
1. Tidak ada tabel `bonus_kasir` dan `transaksi_bonus` di database baru.
2. Item bonus akan tetap direpresentasikan sebagai baris pada `transaksi_detail` biasa (seperti implementasi lama) dengan `harga_jual = 0` dan ditandai dengan flag `is_bonus = true`.
