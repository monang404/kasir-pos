import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def setup_tables(db):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS produk (
            id INTEGER PRIMARY KEY,
            kode TEXT UNIQUE,
            nama TEXT,
            harga_beli NUMERIC,
            harga_jual NUMERIC
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS produk_batch (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            harga_tinta NUMERIC DEFAULT 0,
            diskon NUMERIC DEFAULT 0,
            harga_asli NUMERIC DEFAULT 0,
            is_bonus BOOLEAN DEFAULT 0
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
    # Bersihkan data
    for t in ['transaksi_detail', 'transaksi', 'produk_batch', 'produk', 'activity_log']:
        db.execute(text(f"DELETE FROM {t}"))
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


def buat_transaksi(db, produk_id, qty, hpp, harga_jual, total, profit):
    """Helper: membuat data transaksi lengkap dengan detail."""
    db.execute(text("INSERT INTO transaksi (kode, total, profit, kasir_nama) VALUES ('TRX-001', :total, :profit, 'Admin')"),
               {"total": total, "profit": profit})
    trx_id = db.execute(text("SELECT last_insert_rowid()")).scalar()
    db.execute(text("""
        INSERT INTO transaksi_detail (transaksi_id, produk_id, qty, harga_jual, harga_beli)
        VALUES (:tid, :pid, :qty, :hj, :hb)
    """), {"tid": trx_id, "pid": produk_id, "qty": qty, "hj": harga_jual, "hb": hpp})
    db.commit()
    return trx_id


# ─────────────────────────────────────────────────────────────
# Test delete transaksi → retur stok
# ─────────────────────────────────────────────────────────────

def test_hapus_transaksi_retur_stok_akurat(db):
    """Hapus transaksi harus membuat batch retur baru dengan HPP dari detail asal."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Produk A',1000,2000)"))
    trx_id = buat_transaksi(db, produk_id=1, qty=5, hpp=1000, harga_jual=2000, total=10000, profit=5000)

    # Stok awal = 0 (semua sudah terjual)
    stok_awal = db.execute(text("SELECT COALESCE(SUM(qty_sisa),0) FROM produk_batch WHERE produk_id = 1")).scalar()
    assert stok_awal == 0

    # Simulasikan delete_transaksi logic
    items = db.execute(text("SELECT produk_id, qty, harga_beli FROM transaksi_detail WHERE transaksi_id = :tid"),
                       {"tid": trx_id}).fetchall()
    for item in items:
        db.execute(
            text("INSERT INTO produk_batch (produk_id, qty_sisa, harga_beli, tanggal_masuk) VALUES (:pid, :qty, :hb, CURRENT_TIMESTAMP)"),
            {"pid": item.produk_id, "qty": item.qty, "hb": float(item.harga_beli)}
        )
    db.execute(text("DELETE FROM transaksi_detail WHERE transaksi_id = :tid"), {"tid": trx_id})
    db.execute(text("DELETE FROM transaksi WHERE id = :id"), {"id": trx_id})
    db.commit()

    # Stok harus kembali sebesar qty yang dihapus (5)
    stok_akhir = db.execute(text("SELECT COALESCE(SUM(qty_sisa),0) FROM produk_batch WHERE produk_id = 1")).scalar()
    assert stok_akhir == 5

    # HPP batch retur harus HPP dari detail asal (1000), bukan harga_beli produk terkini
    batch_retur = db.execute(text("SELECT * FROM produk_batch WHERE produk_id = 1")).fetchone()
    assert batch_retur.harga_beli == 1000.0


def test_hapus_transaksi_multi_item_semua_diretur(db):
    """Semua item dalam transaksi harus diretur saat transaksi dihapus."""
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Prod A',1000,2000)"))
    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (2,'P02','Prod B',500,1000)"))

    db.execute(text("INSERT INTO transaksi (kode, total, profit, kasir_nama) VALUES ('TRX-002', 14000, 6500, 'Admin')"))
    trx_id = db.execute(text("SELECT last_insert_rowid()")).scalar()
    db.execute(text("INSERT INTO transaksi_detail (transaksi_id, produk_id, qty, harga_jual, harga_beli) VALUES (:tid, 1, 5, 2000, 1000)"), {"tid": trx_id})
    db.execute(text("INSERT INTO transaksi_detail (transaksi_id, produk_id, qty, harga_jual, harga_beli) VALUES (:tid, 2, 8, 1000, 500)"), {"tid": trx_id})
    db.commit()

    # Simulasikan delete
    items = db.execute(text("SELECT produk_id, qty, harga_beli FROM transaksi_detail WHERE transaksi_id = :tid"), {"tid": trx_id}).fetchall()
    for item in items:
        db.execute(text("INSERT INTO produk_batch (produk_id, qty_sisa, harga_beli, tanggal_masuk) VALUES (:pid, :qty, :hb, CURRENT_TIMESTAMP)"),
                   {"pid": item.produk_id, "qty": item.qty, "hb": float(item.harga_beli)})
    db.execute(text("DELETE FROM transaksi_detail WHERE transaksi_id = :tid"), {"tid": trx_id})
    db.execute(text("DELETE FROM transaksi WHERE id = :id"), {"id": trx_id})
    db.commit()

    stok_p01 = db.execute(text("SELECT COALESCE(SUM(qty_sisa),0) FROM produk_batch WHERE produk_id = 1")).scalar()
    stok_p02 = db.execute(text("SELECT COALESCE(SUM(qty_sisa),0) FROM produk_batch WHERE produk_id = 2")).scalar()
    assert stok_p01 == 5
    assert stok_p02 == 8


# ─────────────────────────────────────────────────────────────
# Test recalculate_total_profit
# ─────────────────────────────────────────────────────────────

def test_recalculate_setelah_edit_qty(db):
    """Total & profit header harus akurat setelah edit qty item."""
    from app.transaksi.edit_item import recalculate_total_profit

    db.execute(text("INSERT INTO produk (id, kode, nama, harga_beli, harga_jual) VALUES (1,'P01','Prod A',1000,2000)"))
    db.execute(text("INSERT INTO produk_batch (produk_id, qty_sisa, harga_beli, tanggal_masuk) VALUES (1, 100, 1000, '2023-01-01')"))
    trx_id = buat_transaksi(db, produk_id=1, qty=5, hpp=1000, harga_jual=2000, total=10000, profit=5000)

    # Edit qty dari 5 ke 8
    db.execute(text("UPDATE transaksi_detail SET qty = 8 WHERE transaksi_id = :tid"), {"tid": trx_id})

    # Recalculate
    recalculate_total_profit(db, trx_id)
    db.commit()

    trx = db.execute(text("SELECT total, profit FROM transaksi WHERE id = :id"), {"id": trx_id}).fetchone()
    # Total = 8 * 2000 = 16000, Profit = (2000 - 1000) * 8 = 8000
    assert trx.total == 16000
    assert trx.profit == 8000
