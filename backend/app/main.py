"""
kasir-POS backend — scaffold awal (task 0.3).

Entry point FastAPI. Modul bisnis (auth, kasir, inventory, dll.) ditambahkan
di task 2-9 sesuai implementasi_plan/. File ini sengaja minimal: hanya health
check untuk memverifikasi CI (lint + test) berjalan di atas scaffold kosong.
"""
from fastapi import FastAPI

app = FastAPI(title="kasir-POS API", version="0.0.1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "kasir-pos-backend"}
