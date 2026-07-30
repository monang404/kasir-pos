"""
kasir-POS backend — scaffold awal (task 0.3).

Entry point FastAPI. Modul bisnis (auth, kasir, inventory, dll.) ditambahkan
di task 2-9 sesuai implementasi_plan/. File ini sengaja minimal: hanya health
check untuk memverifikasi CI (lint + test) berjalan di atas scaffold kosong.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.login import router as auth_router
from app.kasir.list_produk import router as list_produk_router
from app.kasir.checkout_endpoint import router as checkout_router
from app.inventory.produk_crud import router as inv_produk_router
from app.inventory.delete_produk import router as inv_delete_router
from app.inventory.stock_adjustment import router as inv_adjustment_router
from app.inventory.import_excel import router as inv_import_router
from app.inventory.batch_crud import router as inv_batch_router

app = FastAPI(title="kasir-POS API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(list_produk_router)
app.include_router(checkout_router)
# Inventory routers
app.include_router(inv_produk_router)
app.include_router(inv_delete_router)
app.include_router(inv_adjustment_router)
app.include_router(inv_import_router)
app.include_router(inv_batch_router)
# Transaksi routers
from app.transaksi.list_transaksi import router as trx_list_router
from app.transaksi.delete_transaksi import router as trx_delete_router
from app.transaksi.edit_item import router as trx_edit_router
from app.transaksi.ganti_pelanggan import router as trx_pelanggan_router
app.include_router(trx_list_router)
app.include_router(trx_delete_router)
app.include_router(trx_edit_router)
app.include_router(trx_pelanggan_router)

# Pelanggan & Pengeluaran routers
from app.pelanggan.crud import router as pelanggan_crud_router
from app.pelanggan.delete import router as pelanggan_delete_router
from app.pengeluaran.crud import router as pengeluaran_crud_router
app.include_router(pelanggan_crud_router)
app.include_router(pelanggan_delete_router)
app.include_router(pengeluaran_crud_router)

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "kasir-pos-backend"}

