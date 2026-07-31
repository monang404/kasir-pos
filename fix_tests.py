import os
import re

files = [
    'tests/backend/app/inventory/test_fifo.py',
    'tests/backend/app/kasir/test_checkout_service.py',
    'tests/backend/app/transaksi/test_retur_stok.py'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # fix schema
    content = content.replace(
        "produk_id INTEGER,\n            qty_sisa INTEGER,",
        "produk_id INTEGER,\n            qty_masuk INTEGER,\n            qty_sisa INTEGER,"
    )
    
    # fix insert values with hardcoded strings like (1, 10, 1000, ...) -> (1, 10, 10, 1000, ...)
    content = re.sub(
        r"INSERT INTO produk_batch \(produk_id, qty_sisa, harga_beli, tanggal_masuk\) VALUES \((\d+),\s*(\d+),\s*(\d+),\s*('[^']+')\)",
        r"INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (\1, \2, \2, \3, \4)",
        content
    )
    
    # fix insert values with id like (1, 1, 5, 1000, '...') -> (1, 1, 5, 5, 1000, '...')
    content = re.sub(
        r"INSERT INTO produk_batch \(id, produk_id, qty_sisa, harga_beli, tanggal_masuk\) VALUES \((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*('[^']+')\)",
        r"INSERT INTO produk_batch (id, produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (\1, \2, \3, \3, \4, \5)",
        content
    )

    # fix insert values with bind params (:pid, :qty, :hb, CURRENT_TIMESTAMP)
    content = re.sub(
        r"INSERT INTO produk_batch \(produk_id, qty_sisa, harga_beli, tanggal_masuk\) VALUES \(:pid, :qty, :hb, CURRENT_TIMESTAMP\)",
        r"INSERT INTO produk_batch (produk_id, qty_masuk, qty_sisa, harga_beli, tanggal_masuk) VALUES (:pid, :qty, :qty, :hb, CURRENT_TIMESTAMP)",
        content
    )

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f"Fixed {f}")
