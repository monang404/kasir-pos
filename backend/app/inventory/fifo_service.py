from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session


def tambah_stok(db: Session, produk_id: int, qty: int, harga_beli: float, tanggal_masuk: datetime = None) -> int:
    """
    Menambah stok dengan SELALU membuat baris batch baru.
    Sesuai PRD §16 aturan 1-2.
    Return: ID batch yang baru dibuat.
    """
    if qty <= 0:
        raise ValueError("Qty tambah stok harus lebih dari 0")
        
    if tanggal_masuk is None:
        tanggal_masuk = datetime.now(timezone.utc)
        
    result = db.execute(
        text("""
            INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk)
            VALUES (:pid, :qty, :qty, :hb, :tgl)
            RETURNING id
        """),
        {"pid": produk_id, "qty": qty, "hb": harga_beli, "tgl": tanggal_masuk}
    ).fetchone()
    
    return result.id

def keluar_fifo(db: Session, produk_id: int, qty: int) -> tuple[float, int]:
    """
    Mengeluarkan stok sejumlah qty menggunakan metode FIFO presisi.
    Jika batch habis (qty_sisa == 0), batch akan Dihapus.
    
    Return:
        Tuple (total_hpp_aktual, total_qty_berhasil_dikeluarkan)
        
    Catatan: Metode ini bisa jadi memotong qty kurang dari yang diminta jika stok tidak cukup,
    sehingga layer service pemanggil yang wajib handle fail-fast sebelum panggil metode ini jika butuh atomic all-or-nothing.
    Untuk adjustment (mengurangi stok tanpa kasir), validasi stok di atas akan memastikan qty_dikeluarkan == qty_diminta.
    """
    if qty <= 0:
        return 0.0, 0
        
    batches = db.execute(
        text("SELECT id, qty_sisa, harga_beli FROM produk_batch WHERE produk_id = :pid AND qty_sisa > 0 ORDER BY tanggal_masuk ASC FOR UPDATE"),
        {"pid": produk_id}
    ).fetchall()
    
    sisa_harus_potong = qty
    total_hpp = 0.0
    qty_berhasil = 0
    
    for batch in batches:
        if sisa_harus_potong <= 0:
            break
            
        potong = min(batch.qty_sisa, sisa_harus_potong)
        sisa_baru = batch.qty_sisa - potong
        
        if sisa_baru <= 0:
            # Sesuai aturan PRD: Batch dengan qty_sisa=0 otomatis terhapus dari tabel
            db.execute(text("DELETE FROM produk_batch WHERE id = :bid"), {"bid": batch.id})
        else:
            db.execute(
                text("UPDATE produk_batch SET qty_sisa = :sisa_baru WHERE id = :bid"),
                {"sisa_baru": sisa_baru, "bid": batch.id}
            )
            
        total_hpp += float(batch.harga_beli) * potong
        qty_berhasil += potong
        sisa_harus_potong -= potong
        
    return total_hpp, qty_berhasil
