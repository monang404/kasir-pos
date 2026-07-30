import React, { useState, useEffect, useMemo } from 'react';

interface Product {
  id: number;
  kode: string;
  nama: string;
  ukuran: string;
  harga_beli: number;
  harga_jual: number;
  stok_total: number;
}

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');
  const [sortBy, setSortBy] = useState('kode_asc');
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // For demo/scaffolding purposes, no actual API hit if not needed, but we will wire it up.
      const res = await fetch(`http://localhost:8000/inventory/produk/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      } else {
        // Fallback for UI demonstration if backend is down
        console.warn("Failed to fetch products");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hitung stats dari SELURUH data (sebelum difilter)
  const stats = useMemo(() => {
    return {
      total: products.length,
      normal: products.filter(p => p.stok_total >= 5).length,
      low: products.filter(p => p.stok_total > 0 && p.stok_total < 5).length,
      out: products.filter(p => p.stok_total <= 0).length,
    };
  }, [products]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q));
    }

    // Filter Stok
    if (stockFilter === 'NORMAL') result = result.filter(p => p.stok_total >= 5);
    else if (stockFilter === 'LOW') result = result.filter(p => p.stok_total > 0 && p.stok_total < 5);
    else if (stockFilter === 'OUT') result = result.filter(p => p.stok_total <= 0);

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'kode_asc': return a.kode.localeCompare(b.kode);
        case 'kode_desc': return b.kode.localeCompare(a.kode);
        case 'nama_asc': return a.nama.localeCompare(b.nama);
        case 'nama_desc': return b.nama.localeCompare(a.nama);
        case 'stok_asc': return a.stok_total - b.stok_total;
        case 'stok_desc': return b.stok_total - a.stok_total;
        case 'harga_desc': return b.harga_jual - a.harga_jual;
        default: return 0;
      }
    });

    return result;
  }, [products, searchQuery, stockFilter, sortBy]);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Gudang & Inventory</h1>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Produk</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stok Normal (≥ 5)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.normal}</div>
        </div>
        <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stok Rendah (1-4)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.low}</div>
        </div>
        <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stok Habis (0)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.out}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Cari kode/nama produk..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        
        <select 
          value={stockFilter} 
          onChange={e => setStockFilter(e.target.value as any)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        >
          <option value="ALL">Semua Stok</option>
          <option value="NORMAL">Normal (≥ 5)</option>
          <option value="LOW">Rendah (1-4)</option>
          <option value="OUT">Habis (0)</option>
        </select>

        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        >
          <option value="kode_asc">Kode (A-Z)</option>
          <option value="kode_desc">Kode (Z-A)</option>
          <option value="nama_asc">Nama (A-Z)</option>
          <option value="nama_desc">Nama (Z-A)</option>
          <option value="stok_asc">Stok Terkecil</option>
          <option value="stok_desc">Stok Terbanyak</option>
          <option value="harga_desc">Harga Termahal</option>
        </select>

        <button style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Tambah Produk
        </button>
      </div>

      <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
        Menampilkan {filteredProducts.length} produk
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Kode</th>
              <th style={{ padding: '1rem' }}>Nama Produk</th>
              <th style={{ padding: '1rem' }}>Ukuran</th>
              <th style={{ padding: '1rem' }}>Harga Beli</th>
              <th style={{ padding: '1rem' }}>Harga Jual</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Stok</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada produk ditemukan</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                  <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.kode}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.nama}</td>
                  <td style={{ padding: '1rem' }}>{p.ukuran || '-'}</td>
                  <td style={{ padding: '1rem' }}>Rp {p.harga_beli.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '1rem', color: '#4ade80' }}>Rp {p.harga_jual.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      backgroundColor: p.stok_total >= 5 ? '#064e3b' : p.stok_total > 0 ? '#78350f' : '#7f1d1d',
                      color: p.stok_total >= 5 ? '#34d399' : p.stok_total > 0 ? '#fbbf24' : '#f87171'
                    }}>
                      {p.stok_total}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#374151', border: 'none', color: '#38bdf8', borderRadius: '4px', cursor: 'pointer' }}>Batch / +Stok</button>
                    <button style={{ padding: '0.25rem 0.5rem', backgroundColor: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
