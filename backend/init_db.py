import os
import glob
from app.database import engine
from app.auth.security import hash_password
from sqlalchemy import text

def init_db():
    print("Mengecek dan membuat tabel database (jika belum ada)...")
    
    # Run migrations
    migrations_dir = os.path.join("..", "migrations")
    if not os.path.exists(migrations_dir):
        print(f"Directory {migrations_dir} tidak ditemukan!")
        return
        
    sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
    
    with engine.connect() as conn:
        for sql_file in sql_files:
            print(f"Menjalankan migrasi: {os.path.basename(sql_file)}")
            with open(sql_file, "r", encoding="utf-8") as f:
                sql = f.read()
            # Execute multiple statements using raw dbapi connection if necessary, 
            # or split by ';' if sqlite
            # SQLAlchemy conn.execute text() might only run one statement at a time in sqlite,
            # so let's use the underlying dbapi connection executescript for sqlite
            if engine.url.drivername.startswith("sqlite"):
                raw_conn = engine.raw_connection()
                try:
                    cursor = raw_conn.cursor()
                    try:
                        sql = sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                        cursor.executescript(sql)
                        raw_conn.commit()
                    except Exception as e:
                        print(f"Warning saat migrasi (diabaikan untuk SQLite): {e}")
                        raw_conn.rollback()
                finally:
                    raw_conn.close()
            else:
                conn.execute(text(sql))
                conn.commit()
                
        print("Selesai menjalankan migrasi!")
        
        # Seed admin
        try:
            admin = conn.execute(text("SELECT id FROM users WHERE username = 'admin'")).fetchone()
            if not admin:
                print("Membuat akun admin default...")
                conn.execute(
                    text("INSERT INTO users (username, password_hash, nama_lengkap, role, is_active) VALUES (:u, :p, :n, :r, :a)"),
                    {"u": "admin", "p": hash_password("Admin@2025!"), "n": "Administrator", "r": "admin", "a": 1}
                )
                conn.commit()
                print("Akun admin default berhasil dibuat!")
        except Exception as e:
            print(f"Gagal membuat akun admin: {e}")

if __name__ == "__main__":
    init_db()
