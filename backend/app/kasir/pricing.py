def hitung_total_dan_profit(harga_jual: float, harga_beli: float, harga_tinta: float, qty: int, is_bonus: bool = False) -> tuple[float, float]:
    """
    Menghitung total (omzet) dan profit untuk satu baris item transaksi.
    
    Aturan:
    - Jika is_bonus == True: total = 0, profit = 0
    - Jika is_bonus == False:
        total = harga_jual * qty  (omzet kotor, tidak termasuk tinta karena tinta adalah beban/bahan)
        profit = (harga_jual - harga_beli - harga_tinta) * qty
        
    Returns:
        (total_omzet, profit)
    """
    if is_bonus:
        return 0.0, 0.0
        
    total = float(harga_jual) * qty
    profit = (float(harga_jual) - float(harga_beli) - float(harga_tinta)) * qty
    
    return total, profit
