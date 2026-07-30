"""
backend/scripts/seed.py — seed data dummy untuk development lokal (task 0.4).

CATATAN PENTING:
  Skema resmi (produk, produk_batch, users, dst. sesuai docs/PRD.md §3) dibangun via
  Alembic migration di task 1 (implementasi_plan/02_task-1-skema-database.yaml).
  Script ini HANYA bootstrap sangat minimal (bikin tabel kalau belum ada + isi contoh
  data) supaya task 2 dst. sudah punya user/produk untuk development sebelum migration
  resmi task 1 selesai ditulis. Setelah task 1 selesai, ganti/rewrite script ini agar
  memakai model SQLAlchemy resmi, jangan dipertahankan sebagai sumber kebenaran skema.

Cara pakai (dari root project, dengan DATABASE_URL sudah di-set / docker compose up):
    python backend/scripts/seed.py
"""
from __future__ import annotations

import hashlib
import os
import secrets

import psycopg2

DATABASE_DSN = os.environ.get(
    "DATABASE_URL_PSYCOPG2",
    "dbname=kasir_pos user=kasir password=kasir host=localhost port=5432",
)

BOOTSTRAP_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir', 'gudang')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS produk (
    id SERIAL PRIMARY KEY,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    harga_beli NUMERIC NOT NULL DEFAULT 0,
    harga_jual NUMERIC NOT NULL
);
"""

SEED_USERS = [
    # (username, password, nama_lengkap, role)
    ("admin", "Admin@2025!", "Administrator", "admin"),
    ("kasir1", "Kasir@2025!", "Kasir Satu", "kasir"),
    ("gudang1", "Gudang@2025!", "Petugas Gudang", "gudang"),
]

SEED_PRODUK = [
    # (kode, nama, harga_beli, harga_jual)
    ("PRD-001", "Kertas A4 80gsm", 35000, 45000),
    ("PRD-002", "Tinta Sablon Hitam 1L", 60000, 85000),
    ("PRD-003", "Kaos Polos Combed 30s", 25000, 40000),
]


def hash_password(password: str) -> str:
    """Placeholder hashing dev-only. Task 2.1 akan pakai implementasi resmi
    (PBKDF2-HMAC-SHA256 310k iterasi atau setara), sesuai docs/PRD.md §2."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 310_000)
    return f"{salt}:{digest.hex()}"


def main() -> None:
    conn = psycopg2.connect(DATABASE_DSN)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(BOOTSTRAP_SCHEMA)

        for username, password, nama, role in SEED_USERS:
            cur.execute(
                """
                INSERT INTO users (username, password_hash, nama_lengkap, role)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING
                """,
                (username, hash_password(password), nama, role),
            )

        for kode, nama, harga_beli, harga_jual in SEED_PRODUK:
            cur.execute(
                """
                INSERT INTO produk (kode, nama, harga_beli, harga_jual)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (kode) DO NOTHING
                """,
                (kode, nama, harga_beli, harga_jual),
            )

    conn.close()
    print(f"[seed] {len(SEED_USERS)} user & {len(SEED_PRODUK)} produk contoh siap (skip jika sudah ada).")


if __name__ == "__main__":
    main()
