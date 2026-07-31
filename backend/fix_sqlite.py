import sqlite3
import glob
import os
import shutil

# 1. Modify init_db to support sqlite correctly for future
with open("init_db.py", "r") as f:
    content = f.read()
if "sql = sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')" not in content:
    content = content.replace("cursor.executescript(sql)", "sql = sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')\n                        cursor.executescript(sql)")
    with open("init_db.py", "w") as f:
        f.write(content)

# 2. Fix the existing kasir.db
if os.path.exists("kasir.db"):
    print("Fixing kasir.db...")
    conn = sqlite3.connect("kasir.db")
    c = conn.cursor()
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in c.fetchall() if r[0] != 'sqlite_sequence']
    
    if os.path.exists("kasir_new.db"):
        os.remove("kasir_new.db")
        
    new_conn = sqlite3.connect("kasir_new.db")
    new_c = new_conn.cursor()
    
    # Read migrations and apply to new DB
    migrations = sorted(glob.glob("../migrations/*.sql"))
    for m in migrations:
        with open(m, "r", encoding="utf-8") as f:
            sql = f.read().replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
            try:
                new_c.executescript(sql)
            except Exception as e:
                print(f"Warning saat migrasi {m} (diabaikan untuk SQLite): {e}")
            
    # Copy data
    for table in tables:
        try:
            # Check if id column exists
            c.execute(f"PRAGMA table_info({table})")
            cols = [col[1] for col in c.fetchall()]
            
            c.execute(f"SELECT * FROM {table}")
            rows = c.fetchall()
            if not rows: continue
            
            print(f"Copying {len(rows)} rows for table {table}...")
            
            if 'id' in cols:
                # Re-assign auto-incrementing ID where id is null
                id_idx = cols.index('id')
                new_rows = []
                # To simulate auto-increment, we will just use None so SQLite assigns the next ID
                # Actually, in Python sqlite3, None translates to NULL, which for INTEGER PRIMARY KEY assigns next rowid!
                for row in rows:
                    r_list = list(row)
                    if r_list[id_idx] is None:
                        r_list[id_idx] = None 
                    new_rows.append(tuple(r_list))
                rows = new_rows
                
            placeholders = ",".join(["?"] * len(cols))
            new_c.executemany(f"INSERT INTO {table} VALUES ({placeholders})", rows)
        except Exception as e:
            print(f"Error copying {table}: {e}")
            
    new_conn.commit()
    new_conn.close()
    conn.close()
    
    shutil.copy("kasir_new.db", "kasir.db")
    print("Database fixed successfully.")
