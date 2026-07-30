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

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "kasir-pos-backend"}

