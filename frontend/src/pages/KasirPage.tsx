import React, { useState, useEffect, useCallback, useRef } from 'react';
import AddToCartDialog, { Product, CartItem } from '../components/kasir/AddToCartDialog';
import StrukDialog from '../components/kasir/StrukDialog';
import PilihPelangganDialog from '../components/kasir/PilihPelangganDialog';
import { useToast } from '../components/ui/ToastContext';
import { apiFetch } from '../lib/apiFetch';

/** Info transaksi yang dikembalikan backend setelah checkout berhasil */
interface TransaksiResult {
  kode: string;
  tanggal: string;
  kasir_nama: string;
}

const KasirPage: React.FC = () => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pelangganInfo, setPelangganInfo] = useState({ id: 1, nama: 'Umum' });
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [uangBayar, setUangBayar] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // UI-016

  // UI-001: State untuk StrukDialog
  const [strukInfo, setStrukInfo] = useState<{
    kode: string; tanggal: string; total: number;
    uangBayar: number; kembalian: number;
    kasir_nama: string; pelanggan_nama: string;
  } | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]);

  // UI-002: State untuk PilihPelangganDialog
  const [showPilihPelanggan, setShowPilihPelanggan] = useState(false);

  // UI-004: State konfirmasi kosongkan keranjang
  const [showKonfirmasiKosong, setShowKonfirmasiKosong] = useState(false);

  // UI-017: Debounce untuk searchQuery
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch(`/kasir/produk?q=${encodeURIComponent(debouncedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      } else {
        setFetchError('Gagal memuat daftar produk. Coba refresh halaman.');
      }
    } catch {
      setFetchError('Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      if (item.is_bonus) return [...prev, item];

      const existingIndex = prev.findIndex(
        p => p.kode === item.kode && p.warna === item.warna && !p.is_bonus
          && p.harga_jual_efektif === item.harga_jual_efektif
          && p.harga_tinta === item.harga_tinta
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        const existing = newCart[existingIndex];
        const newQty = existing.qty + item.qty;
        newCart[existingIndex] = {
          ...existing,
          qty: newQty,
          subtotal: (existing.harga_jual_efektif + existing.harga_tinta) * newQty,
        };
        return newCart;
      }

      return [...prev, item];
    });
    setSelectedProduct(null);
  };

  // UI-013: Ubah qty item di keranjang langsung
  const handleChangeQty = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.qty + delta;
      if (newQty < 1) return prev; // jangan kurangi di bawah 1
      // Validasi terhadap stok
      if (newQty > item.stok_total) {
        showToast(`Stok ${item.nama} hanya ${item.stok_total}`, 'warning');
        return prev;
      }
      newCart[index] = {
        ...item,
        qty: newQty,
        subtotal: item.is_bonus ? 0 : (item.harga_jual_efektif + item.harga_tinta) * newQty,
      };
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalBelanja = cart.reduce((acc, c) => acc + (c.is_bonus ? 0 : c.subtotal), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const bayar = Number(uangBayar);
    if (metodeBayar === 'Tunai' && bayar < totalBelanja) {
      showToast(`Uang bayar (Rp ${bayar.toLocaleString('id-ID')}) kurang dari total belanja (Rp ${totalBelanja.toLocaleString('id-ID')})!`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        pelanggan_id: pelangganInfo.id === 1 ? null : pelangganInfo.id,
        metode_bayar: metodeBayar,
        uang_bayar: metodeBayar === 'Tunai' ? bayar : totalBelanja,
        items: cart.map(c => ({
          produk_id: c.id,
          qty: c.qty,
          harga_jual: c.harga_jual_efektif,
          diskon: c.diskon,
          harga_tinta: c.harga_tinta,
          warna: c.warna,
          is_bonus: c.is_bonus,
        })),
      };

      const res = await apiFetch('/kasir/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        const txData: TransaksiResult = data.data;
        const kembalian = metodeBayar === 'Tunai' ? bayar - totalBelanja : 0;
        const uangBayarFinal = metodeBayar === 'Tunai' ? bayar : totalBelanja;

        // UI-001: Tampilkan StrukDialog setelah checkout berhasil
        setCartSnapshot([...cart]);
        setStrukInfo({
          kode: txData.kode,
          tanggal: txData.tanggal,
          total: totalBelanja,
          uangBayar: uangBayarFinal,
          kembalian,
          kasir_nama: txData.kasir_nama,
          pelanggan_nama: pelangganInfo.nama,
        });

        // Reset keranjang
        setCart([]);
        setUangBayar('');
        setMetodeBayar('Tunai');
        fetchProducts();
      } else {
        showToast(data.detail || 'Transaksi gagal. Coba lagi.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan. Periksa koneksi server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI-004: handler kosongkan dengan konfirmasi
  const handleKosongkan = () => {
    if (cart.length <= 1) {
      // Kalau hanya 0-1 item, langsung kosongkan tanpa konfirmasi
      setCart([]);
      setUangBayar('');
    } else {
      setShowKonfirmasiKosong(true);
    }
  };

  const confirmKosongkan = () => {
    setCart([]);
    setUangBayar('');
    setShowKonfirmasiKosong(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0a2a', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      {/* KIRI: Daftar Produk */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e4a', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Daftar Produk</h2>
          <button
            onClick={fetchProducts}
            aria-label="Refresh daftar produk"
            style={{ padding: '0.5rem 1rem', backgroundColor: '#1e1e4a', color: 'white', border: '1px solid #2d2d5f', borderRadius: '4px', cursor: 'pointer' }}
          >
            ↺ Refresh
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari nama atau kode produk..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', outline: 'none' }}
        />

        {/* UI-016: Tampilkan error fetch produk di UI */}
        {fetchError && (
          <div style={{
            backgroundColor: '#2e0d0d', border: '1px solid #7f1d1d', color: '#f87171',
            padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{fetchError}</span>
            <button
              onClick={fetchProducts}
              style={{ background: 'none', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: '4px', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Coba lagi
            </button>
          </div>
        )}

        <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {isLoading ? (
            <p style={{ color: '#94a3b8' }}>Memuat produk...</p>
          ) : !fetchError && products.length === 0 ? (
            <p style={{ color: '#64748b' }}>Tidak ada produk ditemukan.</p>
          ) : products.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              role="button"
              tabIndex={0}
              aria-label={`Pilih produk ${p.nama}, stok ${p.stok_total}`}
              onKeyDown={e => e.key === 'Enter' && setSelectedProduct(p)}
              style={{
                backgroundColor: '#11113a', border: '1px solid #2d2d5f', borderRadius: '8px',
                padding: '1rem', cursor: 'pointer', transition: 'transform 0.1s',
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{p.nama}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{p.kode} | Stok: {p.stok_total}</div>
              <div style={{ color: '#4ade80', fontWeight: 'bold' }}>Rp {p.harga_jual.toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: Keranjang */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: '#05051a' }}>
        <h2 style={{ margin: 0, marginBottom: '1rem' }}>Keranjang</h2>

        {/* UI-002: Tombol Ganti pelanggan dengan handler */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#11113a', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <div>Pelanggan: <strong>{pelangganInfo.nama}</strong></div>
          <button
            onClick={() => setShowPilihPelanggan(true)}
            aria-label="Ganti pelanggan"
            style={{ padding: '0.25rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: '4px', cursor: 'pointer' }}
          >
            Ganti
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#11113a', borderRadius: '4px', padding: '0.5rem' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Keranjang kosong</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d5f', textAlign: 'left', fontSize: '0.875rem', color: '#94a3b8' }}>
                  <th style={{ padding: '0.5rem' }}>Item</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.5rem' }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e1e4a', backgroundColor: c.is_bonus ? '#0d2e1a' : 'transparent' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{c.nama}</div>
                      {c.warna && <div style={{ fontSize: '0.75rem' }}>Warna: {c.warna}</div>}
                      {c.is_bonus && <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold' }}>BONUS/GRATIS</div>}
                      {!c.is_bonus && c.diskon > 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Diskon: Rp {c.diskon.toLocaleString('id-ID')}</div>}
                      {!c.is_bonus && c.harga_tinta > 0 && <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Tinta: Rp {c.harga_tinta.toLocaleString('id-ID')}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {/* UI-013: Qty editable dengan tombol +/- */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleChangeQty(i, -1)}
                          aria-label={`Kurangi qty ${c.nama}`}
                          disabled={c.qty <= 1}
                          style={{
                            width: '24px', height: '24px', padding: 0,
                            backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f',
                            color: c.qty <= 1 ? '#475569' : 'white', borderRadius: '3px',
                            cursor: c.qty <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 'bold' }}>{c.qty}</span>
                        <button
                          onClick={() => handleChangeQty(i, 1)}
                          aria-label={`Tambah qty ${c.nama}`}
                          disabled={c.qty >= c.stok_total}
                          style={{
                            width: '24px', height: '24px', padding: 0,
                            backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f',
                            color: c.qty >= c.stok_total ? '#475569' : 'white', borderRadius: '3px',
                            cursor: c.qty >= c.stok_total ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {c.is_bonus
                        ? <span style={{ color: '#4ade80' }}>Rp 0</span>
                        : <span>Rp {c.subtotal.toLocaleString('id-ID')}</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <button
                        onClick={() => removeFromCart(i)}
                        aria-label={`Hapus ${c.nama} dari keranjang`}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ backgroundColor: '#11113a', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Total Belanja:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Rp {totalBelanja.toLocaleString('id-ID')}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Metode Bayar</label>
              <select
                value={metodeBayar}
                onChange={e => setMetodeBayar(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            {metodeBayar === 'Tunai' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Uang Bayar (Rp)</label>
                <input
                  type="number"
                  value={uangBayar}
                  onChange={e => setUangBayar(Number(e.target.value))}
                  min={totalBelanja}
                  placeholder="Masukkan nominal..."
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          {/* UI-004: Konfirmasi kosongkan keranjang */}
          {showKonfirmasiKosong ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', backgroundColor: '#2e0d0d', border: '1px solid #7f1d1d', borderRadius: '4px', padding: '0.75rem', alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: '0.875rem', color: '#fca5a5' }}>Kosongkan {cart.length} item dari keranjang?</span>
              <button onClick={confirmKosongkan} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Ya, Kosongkan</button>
              <button onClick={() => setShowKonfirmasiKosong(false)} style={{ padding: '0.4rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Batal</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleKosongkan}
                disabled={cart.length === 0}
                aria-label="Kosongkan keranjang"
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
              >
                Kosongkan
              </button>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                aria-label="Proses pembayaran"
                style={{
                  flex: 2, padding: '0.75rem',
                  backgroundColor: cart.length === 0 ? '#334155' : '#4f46e5',
                  color: 'white', border: 'none', borderRadius: '4px',
                  cursor: (cart.length === 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isSubmitting ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal AddToCart */}
      {selectedProduct && (
        <AddToCartDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      )}

      {/* UI-001: StrukDialog setelah checkout berhasil */}
      {strukInfo && (
        <StrukDialog
          cart={cartSnapshot}
          info={strukInfo}
          onClose={() => setStrukInfo(null)}
        />
      )}

      {/* UI-002: PilihPelangganDialog */}
      {showPilihPelanggan && (
        <PilihPelangganDialog
          onPilih={p => { setPelangganInfo(p); setShowPilihPelanggan(false); }}
          onClose={() => setShowPilihPelanggan(false)}
        />
      )}
    </div>
  );
};

export default KasirPage;
