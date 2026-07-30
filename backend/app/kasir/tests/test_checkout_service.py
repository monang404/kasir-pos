import pytest
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.kasir.checkout_service import proses_checkout, CheckoutRequest, CheckoutItem, InsufficientStockException

# Setup in-memory SQLite test database
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_db(db):
    # Buat tabel yang dibutuhkan
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS produk (
            id INTEGER PRIMARY KEY,
            kode TEXT UNIQUE,
            nama TEXT,
            ukuran TEXT,
            harga_beli NUMERIC,
            harga_jual NUMERIC
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS produk_batch (
            id INTEGER PRIMARY KEY,
            produk_id INTEGER,
            qty_sisa INTEGER,
            harga_beli NUMERIC,
            tanggal_masuk DATETIME
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode TEXT,
            tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
            total NUMERIC,
            profit NUMERIC,
            pelanggan_id INTEGER,
            kasir_id INTEGER,
            metode_bayar TEXT,
            kasir_nama TEXT
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transaksi_detail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER,
            produk_id INTEGER,
            qty INTEGER,
            harga_jual NUMERIC,
            harga_beli NUMERIC,
            warna TEXT,
            harga_tinta NUMERIC,
            diskon NUMERIC,
            harga_asli NUMERIC,
            is_bonus BOOLEAN
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            username TEXT,
            role TEXT,
            aksi TEXT,
            modul TEXT,
            target_id TEXT,
            target_info TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """))
    # Clear data for each test
    db.execute(text("DELETE FROM produk"))
    db.execute(text("DELETE FROM produk_batch"))
    db.execute(text("DELETE FROM transaksi"))
    db.execute(text("DELETE FROM transaksi_detail"))
    db.execute(text("DELETE FROM activity_log"))
    db.commit()

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    db_session = TestingSessionLocal(bind=connection)
    
    setup_db(db_session)
    
    yield db_session
    
    db_session.close()
    transaction.rollback()
    connection.close()

def seed_data(db):
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1, 'P01', 'Produk 1', 1000, 2000)"))
    # Batch 1: sisa 5 (harga beli 1000)
    db.execute(text("INSERT INTO produk_batch (id, produk_id, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 1, 5, 1000, '2023-01-01')"))
    # Batch 2: sisa 10 (harga beli 1200)
    db.execute(text("INSERT INTO produk_batch (id, produk_id, qty_sisa, harga_beli, tanggal_masuk) VALUES (2, 1, 10, 1200, '2023-01-02')"))
    db.commit()

def test_checkout_stok_cukup_fifo(db):
    seed_data(db)
    req = CheckoutRequest(
        pelanggan_id=1,
        uang_bayar=20000,
        items=[
            CheckoutItem(produk_id=1, qty=7, harga_jual=2000, is_bonus=False)
        ]
    )
    # Beli 7 -> Batch 1 potong 5 (habis), Batch 2 potong 2
    # HPP = (5 * 1000) + (2 * 1200) = 5000 + 2400 = 7400
    # Omzet = 7 * 2000 = 14000
    # Profit = 14000 - 7400 = 6600
    
    res = proses_checkout(db, req, kasir_id=1, kasir_nama="Admin")
    
    assert res["total"] == 14000
    assert res["profit"] == 6600
    
    # Cek batch sisa
    batch1 = db.execute(text("SELECT * FROM produk_batch WHERE id = 1")).fetchone()
    batch2 = db.execute(text("SELECT * FROM produk_batch WHERE id = 2")).fetchone()
    
    assert batch1 is None  # Dihapus karena 0
    assert batch2.qty_sisa == 8

def test_checkout_stok_tidak_cukup(db):
    seed_data(db)
    req = CheckoutRequest(
        pelanggan_id=1,
        uang_bayar=50000,
        items=[
            CheckoutItem(produk_id=1, qty=20, harga_jual=2000, is_bonus=False)
        ]
    )
    with pytest.raises(InsufficientStockException):
        proses_checkout(db, req, kasir_id=1, kasir_nama="Admin")
        
    # Pastikan stok tidak berubah (rollback)
    batch1 = db.execute(text("SELECT * FROM produk_batch WHERE id = 1")).fetchone()
    assert batch1.qty_sisa == 5

def test_checkout_item_bonus(db):
    seed_data(db)
    req = CheckoutRequest(
        pelanggan_id=1,
        uang_bayar=0,
        items=[
            CheckoutItem(produk_id=1, qty=2, harga_jual=2000, is_bonus=True)
        ]
    )
    res = proses_checkout(db, req, kasir_id=1, kasir_nama="Admin")
    
    # Bonus tidak nambah omzet/profit (hpp=0, jual=0)
    assert res["total"] == 0
    assert res["profit"] == 0
    
    # Tapi stok harus berkurang
    batch1 = db.execute(text("SELECT * FROM produk_batch WHERE id = 1")).fetchone()
    assert batch1.qty_sisa == 3
