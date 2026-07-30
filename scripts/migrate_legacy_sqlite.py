import argparse
import sqlite3
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def get_args():
    parser = argparse.ArgumentParser(description="Migrasi data dari SQLite lama ke RDBMS baru.")
    parser.add_argument('--sqlite-db', type=str, default='toko.db', help='Path ke file toko.db (SQLite) lama')
    parser.add_argument('--target-db', type=str, help='Koneksi string DB target (hanya dipakai bila tidak dry-run)')
    parser.add_argument('--dry-run', action='store_true', help='Jalankan simulasi tanpa menulis ke DB baru')
    return parser.parse_args()

def map_kategori_pengeluaran(kategori_lama):
    kategori_lama = str(kategori_lama).lower().strip()
    mapping = {
        'listrik': 'Listrik & Air',
        'air': 'Listrik & Air',
        'sewa': 'Sewa Tempat',
        'lain-lain': 'Lainnya',
        'lainnya': 'Lainnya',
        'gaji': 'Gaji Karyawan',
        'operasional': 'Operasional',
        'transport': 'Transport',
        'pembelian peralatan': 'Pembelian Peralatan',
        'promosi & iklan': 'Promosi & Iklan'
    }
    for key, value in mapping.items():
        if key in kategori_lama:
            return value
    return 'Lainnya'

def migrate_data(args):
    try:
        conn_old = sqlite3.connect(args.sqlite_db)
        conn_old.row_factory = sqlite3.Row
        cur_old = conn_old.cursor()
    except Exception as e:
        logging.error(f"Gagal membaca SQLite lama: {e}")
        return

    logging.info(f"Mulai migrasi data dari {args.sqlite_db}...")
    if args.dry_run:
        logging.info("!!! DRY-RUN MODE AKTIF !!! (Tidak ada penulisan data)")
        
    tables_counts = {}

    # 1. Migrasi Pengguna (users)
    try:
        cur_old.execute("SELECT * FROM users")
        users = cur_old.fetchall()
        tables_counts['users'] = len(users)
        logging.info(f"[Users] Ditemukan {len(users)} data.")
    except Exception as e:
        logging.warning(f"Tabel users error: {e}")

    # 2. Migrasi Pelanggan
    try:
        cur_old.execute("SELECT * FROM pelanggan")
        pelanggan = cur_old.fetchall()
        tables_counts['pelanggan'] = len(pelanggan)
        logging.info(f"[Pelanggan] Ditemukan {len(pelanggan)} data.")
    except Exception as e:
        logging.warning(f"Tabel pelanggan error: {e}")

    # 3. Migrasi Produk
    try:
        cur_old.execute("SELECT * FROM produk")
        produk = cur_old.fetchall()
        tables_counts['produk'] = len(produk)
        logging.info(f"[Produk] Ditemukan {len(produk)} data.")
    except Exception as e:
        logging.warning(f"Tabel produk error: {e}")

    # 4. Migrasi Produk Batch
    try:
        cur_old.execute("SELECT * FROM produk_batch")
        produk_batch = cur_old.fetchall()
        tables_counts['produk_batch'] = len(produk_batch)
        logging.info(f"[Produk Batch] Ditemukan {len(produk_batch)} data.")
    except Exception as e:
        logging.warning(f"Tabel produk_batch error: {e}")

    # 5. Migrasi Pengeluaran (dengan transformasi kategori)
    try:
        cur_old.execute("SELECT * FROM pengeluaran")
        pengeluaran = cur_old.fetchall()
        tables_counts['pengeluaran'] = len(pengeluaran)
        if args.dry_run and pengeluaran:
            sample = pengeluaran[0]
            mapped_cat = map_kategori_pengeluaran(sample['kategori'])
            logging.info(f"[Pengeluaran] Transformasi contoh kategori: '{sample['kategori']}' -> '{mapped_cat}'")
        logging.info(f"[Pengeluaran] Ditemukan {len(pengeluaran)} data.")
    except Exception as e:
        logging.warning(f"Tabel pengeluaran error: {e}")

    # 6. Migrasi Transaksi & Transaksi Detail
    try:
        cur_old.execute("SELECT * FROM transaksi")
        transaksi = cur_old.fetchall()
        tables_counts['transaksi'] = len(transaksi)
        
        cur_old.execute("SELECT * FROM transaksi_detail")
        transaksi_detail = cur_old.fetchall()
        tables_counts['transaksi_detail'] = len(transaksi_detail)
        
        logging.info(f"[Transaksi] Ditemukan {len(transaksi)} header dan {len(transaksi_detail)} detail.")
        
        if args.dry_run and transaksi_detail:
            # Cari item bonus (harga_jual == 0)
            bonus_count = sum(1 for d in transaksi_detail if d['harga_jual'] == 0)
            logging.info(f"[Transaksi Detail] Transformasi is_bonus: ditemukan {bonus_count} item bonus berdasarkan harga_jual=0.")
            
    except Exception as e:
        logging.warning(f"Tabel transaksi error: {e}")

    # TODO: Logika penulisan ke RDBMS baru bila `not args.dry_run`
    if not args.dry_run:
        if not args.target_db:
            logging.error("Target DB tidak di-supply. Tidak bisa insert data.")
        else:
            logging.info("Simulasi penulisan data ke target-db (Membutuhkan SQLAlchemy/Driver spesifik) ...")
            # Implementasi insert
            
    logging.info("Validasi jumlah baris:")
    for t, c in tables_counts.items():
        logging.info(f" - {t}: {c} baris")

if __name__ == '__main__':
    args = get_args()
    migrate_data(args)
