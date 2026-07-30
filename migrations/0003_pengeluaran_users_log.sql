CREATE TABLE pengeluaran (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    keterangan TEXT,
    jumlah DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_kategori_pengeluaran CHECK (
        kategori IN (
            'Operasional', 
            'Gaji Karyawan', 
            'Sewa Tempat', 
            'Listrik & Air', 
            'Transport', 
            'Pembelian Peralatan', 
            'Promosi & Iklan', 
            'Lainnya'
        )
    )
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL, -- Collation NOCASE handled in application layer if not supported natively in this dialect
    password_hash TEXT NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT check_users_role CHECK (role IN ('admin', 'kasir', 'gudang'))
);

CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    waktu TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    username VARCHAR(100) NOT NULL DEFAULT '—',
    role VARCHAR(50) NOT NULL DEFAULT '—',
    aksi VARCHAR(50) NOT NULL,
    modul VARCHAR(50) NOT NULL,
    target_id VARCHAR(50),
    target_info TEXT,
    detail TEXT, -- JSON or Text
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tambahkan FK ke transaksi untuk kasir_id setelah tabel users dibuat
ALTER TABLE transaksi
ADD CONSTRAINT fk_transaksi_kasir
FOREIGN KEY (kasir_id) REFERENCES users(id) ON DELETE SET NULL;
