from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from app.database import get_db
from app.auth.require_role import RequireModule

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
check_access = RequireModule("dashboard")

@router.get("/charts", dependencies=[Depends(check_access)])
def get_dashboard_charts(db: Session = Depends(get_db)):
    now = datetime.now()
    
    # ─── 1. Chart 12 Bulan Terakhir ───
    # Generate 12 months list (from 11 months ago up to current)
    months_12 = []
    for i in range(11, -1, -1):
        # Calculate year and month correctly using simple math
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        months_12.append(f"{y:04d}-{m:02d}")
    
    # Query transaksi per month
    trx_monthly = db.execute(text("""
        SELECT strftime('%Y-%m', tanggal) as bulan, 
               SUM(total) as omzet, SUM(profit) as laba_kotor
        FROM transaksi
        WHERE tanggal >= date('now', 'start of month', '-11 months')
        GROUP BY strftime('%Y-%m', tanggal)
    """)).fetchall()
    
    # Query pengeluaran per month
    peng_monthly = db.execute(text("""
        SELECT strftime('%Y-%m', tanggal) as bulan, 
               SUM(jumlah) as pengeluaran
        FROM pengeluaran
        WHERE tanggal >= date('now', 'start of month', '-11 months')
        GROUP BY strftime('%Y-%m', tanggal)
    """)).fetchall()

    trx_dict = {r.bulan: {"omzet": r.omzet, "laba_kotor": r.laba_kotor} for r in trx_monthly}
    peng_dict = {r.bulan: r.pengeluaran for r in peng_monthly}

    chart_12_bulan = []
    for bulan in months_12:
        omzet = trx_dict.get(bulan, {}).get("omzet", 0) or 0
        laba_kotor = trx_dict.get(bulan, {}).get("laba_kotor", 0) or 0
        peng = peng_dict.get(bulan, 0) or 0
        chart_12_bulan.append({
            "bulan": bulan,
            "omzet": float(omzet),
            "profit_bersih": float(laba_kotor - peng)
        })

    # ─── 2. Pie Komposisi Bulan Ini ───
    curr_month_str = now.strftime("%Y-%m")
    
    komp = db.execute(text("""
        SELECT 
            COALESCE(SUM(td.harga_beli * td.qty), 0) as hpp,
            COALESCE(SUM(td.harga_tinta * td.qty), 0) as tinta,
            COALESCE(SUM(t.profit), 0) as laba_kotor
        FROM transaksi t
        JOIN transaksi_detail td ON t.id = td.transaksi_id
        WHERE strftime('%Y-%m', t.tanggal) = :bulan
    """), {"bulan": curr_month_str}).fetchone()
    
    peng_curr = db.execute(text("""
        SELECT COALESCE(SUM(jumlah), 0) FROM pengeluaran WHERE strftime('%Y-%m', tanggal) = :bulan
    """), {"bulan": curr_month_str}).scalar() or 0

    hpp = float(komp.hpp) if komp else 0
    tinta = float(komp.tinta) if komp else 0
    laba_kotor = float(komp.laba_kotor) if komp else 0
    pengeluaran = float(peng_curr)
    
    # Perbaiki Laba Bersih untuk pie: Laba kotor - pengeluaran
    laba_bersih = laba_kotor - pengeluaran
    # Jika laba bersih negatif, di pie chart kita tampilkan 0 (karena tidak bisa slice negatif)
    if laba_bersih < 0:
        laba_bersih = 0

    pie_komposisi = {
        "laba_bersih": laba_bersih,
        "hpp": hpp,
        "tinta": tinta,
        "pengeluaran": pengeluaran
    }

    # ─── 3. Mini Bar 7 Hari Terakhir ───
    days_7 = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        days_7.append(d)
        
    trx_7_days = db.execute(text("""
        SELECT date(tanggal) as tgl, SUM(total) as omzet
        FROM transaksi
        WHERE date(tanggal) >= date('now', '-6 days')
        GROUP BY date(tanggal)
    """)).fetchall()

    trx_7_dict = {r.tgl: r.omzet for r in trx_7_days}

    chart_7_hari = []
    for d in days_7:
        chart_7_hari.append({
            "tanggal": d,
            "omzet": float(trx_7_dict.get(d, 0) or 0)
        })

    return {
        "chart_12_bulan": chart_12_bulan,
        "pie_komposisi": pie_komposisi,
        "chart_7_hari": chart_7_hari
    }
