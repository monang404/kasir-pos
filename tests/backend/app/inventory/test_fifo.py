
import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql+psycopg2://kasir:kasir@localhost:5432/kasir_pos_test")
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def setup_tables(db):
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produk_id INTEGER,
            qty_masuk INTEGER,
            qty_sisa INTEGER,
            harga_beli NUMERIC,
            tanggal_masuk DATETIME
        )
    """))
    db.execute(text("DELETE FROM produk"))
    db.execute(text("DELETE FROM produk_batch"))
    db.commit()


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    db_session = TestingSessionLocal(bind=connection)
    setup_tables(db_session)
    yield db_session
    db_session.close()
    transaction.rollback()
    connection.close()


# ─────────────────────────────────────────────────────────────
# Test keluar_fifo
# ─────────────────────────────────────────────────────────────

def test_fifo_satu_batch_penuh(db):
    """Keluar qty yang tepat sama dengan satu batch — batch harus terhapus."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 10, 10, 1000, '2023-01-01')"))
    db.commit()

    hpp, qty_out = keluar_fifo(db, produk_id=1, qty=10)

    assert qty_out == 10
    assert hpp == 10000.0
    # Batch harus dihapus karena qty_sisa = 0
    batch = db.execute(text("SELECT * FROM produk_batch WHERE produk_id = 1")).fetchone()
    assert batch is None


def test_fifo_lintas_dua_batch(db):
    """Keluar qty yang melewati 2 batch — HPP gabungan harus akurat."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    # Batch lama: 5 qty @ 800
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 5, 5, 800, '2023-01-01')"))
    # Batch baru: 10 qty @ 1200
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 10, 10, 1200, '2023-02-01')"))
    db.commit()

    # Keluar 8 qty: ambil 5 dari batch lama (HPP 4000), ambil 3 dari batch baru (HPP 3600)
    hpp, qty_out = keluar_fifo(db, produk_id=1, qty=8)

    assert qty_out == 8
    assert hpp == (5 * 800) + (3 * 1200)  # = 4000 + 3600 = 7600
    # Batch lama harus terhapus (habis)
    batch_lama = db.execute(text("SELECT * FROM produk_batch WHERE harga_beli = 800")).fetchone()
    assert batch_lama is None
    # Batch baru masih ada dengan qty sisa 7
    batch_baru = db.execute(text("SELECT * FROM produk_batch WHERE harga_beli = 1200")).fetchone()
    assert batch_baru.qty_sisa == 7


def test_fifo_lintas_tiga_batch(db):
    """Validasi FIFO melewati 3 batch sekaligus — urutan tanggal harus dipatuhi."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 3, 3, 500, '2022-01-01')"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 4, 4, 700, '2022-06-01')"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 5, 5, 1000, '2023-01-01')"))
    db.commit()

    # Keluar 10 qty: ambil semua dari batch 1 (3@500=1500) + semua dari batch 2 (4@700=2800) + 3 dari batch 3 (3@1000=3000)
    hpp, qty_out = keluar_fifo(db, produk_id=1, qty=10)

    assert qty_out == 10
    assert hpp == (3 * 500) + (4 * 700) + (3 * 1000)  # = 1500 + 2800 + 3000 = 7300

    # Batch 1 dan 2 harus terhapus
    assert db.execute(text("SELECT * FROM produk_batch WHERE harga_beli = 500")).fetchone() is None
    assert db.execute(text("SELECT * FROM produk_batch WHERE harga_beli = 700")).fetchone() is None
    # Batch 3 masih ada, sisa 2
    batch3 = db.execute(text("SELECT * FROM produk_batch WHERE harga_beli = 1000")).fetchone()
    assert batch3.qty_sisa == 2


# ─────────────────────────────────────────────────────────────
# Test tambah_stok
# ─────────────────────────────────────────────────────────────

def test_tambah_stok_selalu_buat_batch_baru(db):
    """tambah_stok harus SELALU membuat baris batch baru, tidak mengubah batch lama."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 5, 5, 1000, '2023-01-01')"))
    db.commit()

    tambah_stok(db, produk_id=1, qty=3, harga_beli=1200)
    db.commit()

    batches = db.execute(text("SELECT * FROM produk_batch WHERE produk_id = 1")).fetchall()
    assert len(batches) == 2  # Harus 2 batch, bukan 1 yang diupdate

    # Batch lama tidak boleh berubah
    batch_lama = db.execute(text("SELECT * FROM produk_batch WHERE qty_sisa = 5")).fetchone()
    assert batch_lama is not None
    # Batch baru ada dengan qty 3
    batch_baru = db.execute(text("SELECT * FROM produk_batch WHERE qty_sisa = 3")).fetchone()
    assert batch_baru is not None


def test_tambah_stok_qty_nol_error(db):
    """tambah_stok dengan qty <= 0 harus raise ValueError."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    db.commit()

    with pytest.raises(ValueError):
        tambah_stok(db, produk_id=1, qty=0, harga_beli=1000)


# ─────────────────────────────────────────────────────────────
# Test keluar_fifo — edge cases
# ─────────────────────────────────────────────────────────────

def test_keluar_fifo_stok_tidak_cukup_parsial(db):
    """keluar_fifo parsial (stok tidak cukup): hanya keluarkan yang tersedia."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 5, 5, 1000, '2023-01-01')"))
    db.commit()

    hpp, qty_out = keluar_fifo(db, produk_id=1, qty=10)  # Minta 10, tersedia 5

    # Hanya 5 yang berhasil keluar
    assert qty_out == 5
    assert hpp == 5000.0
