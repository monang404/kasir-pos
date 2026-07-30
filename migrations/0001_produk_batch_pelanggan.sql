-- KEPUTUSAN (Dead Columns): 
-- Kolom is_bonus_eligible dan is_active dari tabel produk lama dihapus.
-- Alasan: Sesuai observasi (PRD §15 poin 4), is_bonus_eligible tidak pernah digunakan.
-- is_active dihapus karena implementasi nyata aplikasi melakukan hard-delete,
-- sehingga flag soft-delete ini hanya mengotori database tanpa pernah dievaluasi.

CREATE TABLE produk (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    ukuran VARCHAR(100),
    harga_beli DECIMAL(15, 2) DEFAULT 0,
    harga_jual DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_kode_uppercase CHECK (kode = UPPER(kode))
);

CREATE TABLE produk_batch (
    id SERIAL PRIMARY KEY,
    produk_id INT NOT NULL,
    supplier VARCHAR(255),
    qty_masuk INT NOT NULL,
    qty_sisa INT NOT NULL,
    harga_beli DECIMAL(15, 2) NOT NULL,
    tanggal_masuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
);

CREATE TABLE pelanggan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT,
    no_hp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
