import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from pydantic import BaseModel

class CheckoutItem(BaseModel):
    produk_id: int
    qty: int
    harga_jual: float
    diskon: float = 0
    harga_tinta: float = 0
    warna: str = ""
    is_bonus: bool = False

class CheckoutRequest(BaseModel):
    pelanggan_id: int = None
    metode_bayar: str = "Tunai"
    uang_bayar: float
    items: List[CheckoutItem]

class InsufficientStockException(Exception):
    def __init__(self, produk_id: int, nama_produk: str, requested: int, available: int):
        self.produk_id = produk_id
        self.nama_produk = nama_produk
        self.requested = requested
        self.available = available
        super().__init__(f"Stok tidak cukup untuk '{nama_produk}'. Diminta: {requested}, Tersedia: {available}")

def generate_transaksi_kode() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_hex = uuid.uuid4().hex[:8].upper()
    return f"TRX-{date_str}-{random_hex}"

def proses_checkout(db: Session, req: CheckoutRequest, kasir_id: int, kasir_nama: str) -> dict:
    # 1. Validasi keranjang kosong
    if not req.items:
        raise ValueError("Keranjang kosong")

    # Ambil info semua produk di keranjang (menghindari N+1 query)
    produk_ids = list(set([item.produk_id for item in req.items]))
    if not produk_ids:
        raise ValueError("Tidak ada produk valid")
        
    placeholders = ", ".join(f":p_{i}" for i in range(len(produk_ids)))
    params = {f"p_{i}": pid for i, pid in enumerate(produk_ids)}
    
    # Ambil stok total per produk
    stok_query = f"""
        SELECT p.id, p.nama, COALESCE(SUM(pb.qty_sisa), 0) as stok_total
        FROM produk p
        LEFT JOIN produk_batch pb ON p.id = pb.produk_id
        WHERE p.id IN ({placeholders})
        GROUP BY p.id, p.nama
    """
    stok_result = db.execute(text(stok_query), params).fetchall()
    stok_map = {row.id: {"nama": row.nama, "stok": int(row.stok_total)} for row in stok_result}
    
    # 2. Validasi stok sebelum dipotong (Fail-fast)
    # Akumulasi qty per produk_id (karena bisa saja item sama ada yang non-bonus dan bonus beda warna/baris)
    qty_needed = {}
    for item in req.items:
        qty_needed[item.produk_id] = qty_needed.get(item.produk_id, 0) + item.qty
        
    for pid, qty in qty_needed.items():
        if pid not in stok_map:
            raise ValueError(f"Produk ID {pid} tidak ditemukan")
        if qty > stok_map[pid]["stok"]:
            raise InsufficientStockException(pid, stok_map[pid]["nama"], qty, stok_map[pid]["stok"])
            
    # 3. Hitung total dan lakukan potong FIFO per batch dalam satu transaksi
    total_omzet = 0.0
    total_profit = 0.0
    total_hpp_seluruh_item = 0.0
    total_tinta_seluruh_item = 0.0
    
    transaksi_kode = generate_transaksi_kode()
    
    # Simpan header transaksi (sementara total/profit 0, di-update setelah loop)
    insert_trx_query = text("""
        INSERT INTO transaksi (kode, total, profit, pelanggan_id, kasir_id, metode_bayar, kasir_nama)
        VALUES (:kode, 0, 0, :pelanggan_id, :kasir_id, :metode_bayar, :kasir_nama)
        RETURNING id, tanggal
    """)
    trx_row = db.execute(insert_trx_query, {
        "kode": transaksi_kode,
        "pelanggan_id": req.pelanggan_id,
        "kasir_id": kasir_id,
        "metode_bayar": req.metode_bayar,
        "kasir_nama": kasir_nama
    }).fetchone()
    trx_id = trx_row.id
    trx_tanggal = trx_row.tanggal
    
    # Potong FIFO
    for item in req.items:
        # Ambil batch terlama yang masih punya qty > 0
        batches = db.execute(
            text("SELECT id, qty_sisa, harga_beli FROM produk_batch WHERE produk_id = :pid AND qty_sisa > 0 ORDER BY tanggal_masuk ASC"),
            {"pid": item.produk_id}
        ).fetchall()
        
        sisa_yg_harus_dipotong = item.qty
        hpp_aktual_item_ini = 0.0
        
        for batch in batches:
            if sisa_yg_harus_dipotong <= 0:
                break
                
            potong_qty = min(batch.qty_sisa, sisa_yg_harus_dipotong)
            
            # Update batch qty_sisa
            sisa_baru = batch.qty_sisa - potong_qty
            db.execute(
                text("UPDATE produk_batch SET qty_sisa = :sisa_baru WHERE id = :bid"),
                {"sisa_baru": sisa_baru, "bid": batch.id}
            )
            # Jika qty_sisa == 0, PRD §3.2 menyatakan baris dihapus otomatis (atau bisa biarkan update trigger, kita delete eksplisit)
            if sisa_baru == 0:
                db.execute(text("DELETE FROM produk_batch WHERE id = :bid"), {"bid": batch.id})
                
            hpp_aktual_item_ini += float(batch.harga_beli) * potong_qty
            sisa_yg_harus_dipotong -= potong_qty
            
        hpp_per_unit = hpp_aktual_item_ini / item.qty if item.qty > 0 else 0
        
        # Aturan bonus
        harga_jual = item.harga_jual
        harga_asli = item.harga_jual + item.diskon
        harga_tinta = item.harga_tinta
        hpp_efektif = hpp_per_unit
        
        if item.is_bonus:
            harga_jual = 0
            harga_tinta = 0
            hpp_efektif = 0
            
        # Simpan ke transaksi_detail
        db.execute(
            text("""
                INSERT INTO transaksi_detail 
                (transaksi_id, produk_id, qty, harga_jual, harga_beli, warna, harga_tinta, diskon, harga_asli, is_bonus)
                VALUES 
                (:trx_id, :pid, :qty, :hj, :hb, :warna, :tinta, :diskon, :ha, :is_bonus)
            """),
            {
                "trx_id": trx_id, "pid": item.produk_id, "qty": item.qty,
                "hj": harga_jual, "hb": hpp_efektif, "warna": item.warna,
                "tinta": harga_tinta, "diskon": item.diskon, "ha": harga_asli,
                "is_bonus": item.is_bonus
            }
        )
        
        if not item.is_bonus:
            total_omzet += (harga_jual * item.qty)
            total_hpp_seluruh_item += (hpp_efektif * item.qty)
            total_tinta_seluruh_item += (harga_tinta * item.qty)
            
    # Validasi pembayaran
    if req.uang_bayar < total_omzet:
        raise ValueError(f"Uang bayar (Rp {req.uang_bayar}) kurang dari total (Rp {total_omzet})")
        
    profit = total_omzet - total_hpp_seluruh_item - total_tinta_seluruh_item
    
    # Update transaksi
    db.execute(
        text("UPDATE transaksi SET total = :total, profit = :profit WHERE id = :trx_id"),
        {"total": total_omzet, "profit": profit, "trx_id": trx_id}
    )
    
    # Tulis Audit Log (Activity Log)
    db.execute(
        text("""
            INSERT INTO activity_log (user_id, username, role, aksi, modul, target_id, target_info)
            VALUES (:kasir_id, :kasir_nama, 'kasir', 'CREATE', 'transaksi', :trx_kode, :info)
        """),
        {
            "kasir_id": kasir_id, "kasir_nama": kasir_nama, 
            "trx_kode": transaksi_kode,
            "info": f"Checkout {len(req.items)} item. Total: {total_omzet}"
        }
    )

    db.commit()
    
    return {
        "id": trx_id,
        "kode": transaksi_kode,
        "tanggal": trx_tanggal,
        "total": total_omzet,
        "profit": profit,
        "kembalian": req.uang_bayar - total_omzet
    }
