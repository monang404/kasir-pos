import json
from collections.abc import Callable
from datetime import datetime
from typing import Any

from fastapi import BackgroundTasks
from sqlalchemy import text
from sqlalchemy.orm import Session


# Init table cache
def init_ml_cache_table(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS ml_cache (
            key VARCHAR(50) PRIMARY KEY,
            data TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'ready'
        )
    """))
    db.commit()

class MLCacheManager:
    def __init__(self, db: Session):
        self.db = db
        init_ml_cache_table(db)

    def get_cache(self, key: str) -> dict[str, Any] | None:
        row = self.db.execute(
            text("SELECT data, last_updated, status FROM ml_cache WHERE key = :key"),
            {"key": key}
        ).fetchone()
        
        if not row:
            return None
        
        return {
            "data": json.loads(row.data) if row.data else None,
            "last_updated": row.last_updated,
            "status": row.status
        }

    def set_status(self, key: str, status: str):
        self.db.execute(
            text("""
                INSERT INTO ml_cache (key, status) VALUES (:key, :status)
                ON CONFLICT(key) DO UPDATE SET status = :status
            """),
            {"key": key, "status": status}
        )
        self.db.commit()

    def save_cache(self, key: str, data: Any):
        data_json = json.dumps(data)
        self.db.execute(
            text("""
                INSERT INTO ml_cache (key, data, last_updated, status) 
                VALUES (:key, :data, CURRENT_TIMESTAMP, 'ready')
                ON CONFLICT(key) DO UPDATE SET 
                    data = :data, last_updated = CURRENT_TIMESTAMP, status = 'ready'
            """),
            {"key": key, "data": data_json}
        )
        self.db.commit()


def run_ml_job(key: str, compute_func: Callable, db_factory: Callable):
    """
    Fungsi yang akan dijalankan sebagai Background Task.
    Mendapatkan koneksi DB sendiri (karena thread terpisah).
    """
    db: Session = db_factory()
    manager = None
    try:
        manager = MLCacheManager(db)
        manager.set_status(key, "training")
        
        # Eksekusi komputasi berat
        result = compute_func(db)
        
        # Simpan ke cache
        manager.save_cache(key, result)
    except Exception as e:
        import logging
        logging.exception(f"ML Job failed for {key}: {e}")
        if manager is not None:
            try:
                manager.set_status(key, "error")
            except:
                pass
        else:
            try:
                db.execute(text("UPDATE ml_cache SET status = 'error' WHERE key = :key"), {"key": key})
                db.commit()
            except:
                pass
    finally:
        db.close()


def get_or_trigger_ml_task(
    key: str, 
    compute_func: Callable, 
    db: Session, 
    bg_tasks: BackgroundTasks, 
    db_factory: Callable,
    max_age_hours: int = 24,
    force_refresh: bool = False
) -> dict[str, Any]:
    """
    Helper untuk controller.
    1. Cek cache, jika valid -> return
    2. Jika kadaluarsa atau kosong atau force_refresh -> trigger background job, kembalikan data lama + status training
    """
    manager = MLCacheManager(db)
    cache = manager.get_cache(key)
    
    needs_refresh = False
    if force_refresh or not cache:
        needs_refresh = True
    else:
        # Cek umur cache
        if cache["last_updated"]:
            if isinstance(cache["last_updated"], str):
                try:
                    # Parse timestamp string from sqlite if needed
                    dt = datetime.fromisoformat(cache["last_updated"])
                except:
                    dt = datetime.strptime(cache["last_updated"], "%Y-%m-%d %H:%M:%S")
            else:
                dt = cache["last_updated"]
                
            age = datetime.now() - dt
            if age.total_seconds() > (max_age_hours * 3600):
                needs_refresh = True

    # Jika butuh refresh dan sedang tidak di-training
    is_training = (cache and cache["status"] == "training")
    
    if needs_refresh and not is_training:
        result = db.execute(text("""
            INSERT INTO ml_cache (key, status) VALUES (:key, 'training')
            ON CONFLICT(key) DO UPDATE SET status = 'training'
            WHERE ml_cache.status != 'training'
            RETURNING key
        """), {"key": key})
        db.commit()
        
        if result.fetchone() is not None:
            bg_tasks.add_task(run_ml_job, key, compute_func, db_factory)
            is_training = True

    return {
        "data": cache["data"] if cache and cache["data"] else None,
        "last_updated": cache["last_updated"] if cache else None,
        "is_training": is_training,
        "is_empty": not bool(cache and cache["data"])
    }
