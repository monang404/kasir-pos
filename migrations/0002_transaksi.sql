-- KEPUTUSAN: 
-- 1. Satukan kolom tanggal dan created_at pada tabel transaksi menjadi satu kolom "tanggal" saja.
-- 2. Tambahkan kolom is_bonus eksplisit pada tabel transaksi_detail.

CREATE TABLE transaksi (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL, -- Format TRX-YYYYMMDD-XXXXXXXX
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(15, 2) NOT NULL,
    profit DECIMAL(15, 2) DEFAULT 0,
    pelanggan_id INT,
    kasir_id INT, -- FK ke users akan ditambahkan di migrasi selanjutnya (setelah tabel users dibuat)
    metode_bayar VARCHAR(50) DEFAULT 'Tunai',
    kasir_nama VARCHAR(255),
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id) ON DELETE SET NULL
);

CREATE TABLE transaksi_detail (
    id SERIAL PRIMARY KEY,
    transaksi_id INT NOT NULL,
    produk_id INT NOT NULL,
    qty INT NOT NULL,
    harga_jual DECIMAL(15, 2) NOT NULL,
    harga_beli DECIMAL(15, 2) NOT NULL,
    warna VARCHAR(100),
    harga_tinta DECIMAL(15, 2) DEFAULT 0,
    diskon DECIMAL(15, 2) DEFAULT 0,
    harga_asli DECIMAL(15, 2) DEFAULT 0,
    is_bonus BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
    FOREIGN KEY (produk_id) REFERENCES produk(id)
);
