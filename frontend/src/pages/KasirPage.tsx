import React, { useState, useEffect } from 'react';
import AddToCartDialog, { Product, CartItem } from '../components/kasir/AddToCartDialog';

const KasirPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pelangganInfo, setPelangganInfo] = useState({ id: 1, nama: 'Umum' });
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [uangBayar, setUangBayar] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/kasir/produk?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      // Jika bonus, jangan di-merge
      if (item.is_bonus) {
        return [...prev, item];
      }
      
      // Jika bukan bonus, cari item yang sama (kode dan warna sama)
      const existingIndex = prev.findIndex(
        p => p.kode === item.kode && p.warna === item.warna && !p.is_bonus && p.harga_jual_efektif === item.harga_jual_efektif && p.harga_tinta === item.harga_tinta
      );
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        const existingItem = newCart[existingIndex];
        const newQty = existingItem.qty + item.qty;
        newCart[existingIndex] = {
          ...existingItem,
          qty: newQty,
          subtotal: (existingItem.harga_jual_efektif + existingItem.harga_tinta) * newQty
        };
        return newCart;
      }
      
      return [...prev, item];
    });
    setSelectedProduct(null);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalBelanja = cart.reduce((acc, c) => acc + (c.is_bonus ? 0 : c.subtotal), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const bayar = Number(uangBayar);
    if (metodeBayar === 'Tunai' && bayar < totalBelanja) {
      alert(`Uang bayar (Rp ${bayar}) kurang dari total belanja (Rp ${totalBelanja})!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        pelanggan_id: pelangganInfo.id === 1 ? null : pelangganInfo.id,
        metode_bayar: metodeBayar,
        uang_bayar: metodeBayar === 'Tunai' ? bayar : totalBelanja, // Jika non-tunai, anggap lunas pas
        items: cart.map(c => ({
          produk_id: c.id,
          qty: c.qty,
          harga_jual: c.harga_jual_efektif,
          diskon: c.diskon,
          harga_tinta: c.harga_tinta,
          warna: c.warna,
          is_bonus: c.is_bonus
        }))
      };

      const res = await fetch(`http://localhost:8000/kasir/checkout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Transaksi Berhasil!\nKode: ${data.data?.kode}\nKembalian: Rp ${(metodeBayar === 'Tunai' ? bayar - totalBelanja : 0).toLocaleString('id-ID')}`);
        setCart([]);
        setUangBayar('');
        setMetodeBayar('Tunai');
        fetchProducts(); // Refresh stok
      } else {
        alert(data.detail || 'Transaksi Gagal');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0a2a', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      {/* KIRI: Daftar Produk */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e4a', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Daftar Produk</h2>
          <button onClick={fetchProducts} style={{ padding: '0.5rem 1rem', backgroundColor: '#1e1e4a', color: 'white', border: '1px solid #2d2d5f', borderRadius: '4px', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="Cari nama atau kode produk..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        
        <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {isLoading ? (
            <p>Loading...</p>
          ) : products.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedProduct(p)}
              style={{
                backgroundColor: '#11113a', border: '1px solid #2d2d5f', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'transform 0.1s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#11113a', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <div>Pelanggan: <strong>{pelangganInfo.nama}</strong></div>
          <button style={{ padding: '0.25rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: '4px', cursor: 'pointer' }}>Ganti</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#11113a', borderRadius: '4px', padding: '0.5rem' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>Keranjang kosong</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d5f', textAlign: 'left', fontSize: '0.875rem', color: '#94a3b8' }}>
                  <th style={{ padding: '0.5rem' }}>Item</th>
                  <th style={{ padding: '0.5rem' }}>Qty</th>
                  <th style={{ padding: '0.5rem' }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((c, i) => (
                  <tr key={i} style={{ 
                    borderBottom: '1px solid #1e1e4a',
                    backgroundColor: c.is_bonus ? '#0d2e1a' : 'transparent' 
                  }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{c.nama}</div>
                      {c.warna && <div style={{ fontSize: '0.75rem' }}>Warna: {c.warna}</div>}
                      {c.is_bonus && <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold' }}>🎁 BONUS/GRATIS</div>}
                      {!c.is_bonus && c.diskon > 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Diskon: Rp {c.diskon.toLocaleString('id-ID')}</div>}
                      {!c.is_bonus && c.harga_tinta > 0 && <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Tinta: Rp {c.harga_tinta.toLocaleString('id-ID')}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={c.qty} 
                        readOnly 
                        style={{ width: '40px', padding: '0.25rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', textAlign: 'center' }} 
                      />
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {c.is_bonus ? (
                        <span style={{ color: '#4ade80' }}>Rp 0</span>
                      ) : (
                        <span>Rp {c.subtotal.toLocaleString('id-ID')}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
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
              <select value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}>
                <option value="Tunai">Tunai</option>
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            {metodeBayar === 'Tunai' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Uang Bayar (Rp)</label>
                <input type="number" value={uangBayar} onChange={e => setUangBayar(Number(e.target.value))} min={totalBelanja} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} placeholder="Masukkan nominal..." />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => {setCart([]); setUangBayar('');}} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}>Kosongkan</button>
            <button onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting} style={{ flex: 2, padding: '0.75rem', backgroundColor: cart.length === 0 ? '#334155' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: cart.length === 0 || isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isSubmitting ? 'Memproses...' : '💳 Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <AddToCartDialog 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAdd={handleAddToCart} 
        />
      )}
    </div>
  );
};

export default KasirPage;
