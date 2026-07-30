import React, { useState, useEffect } from 'react';

interface Item {
  id: number;
  produk_id: number;
  produk_nama: string;
  produk_kode: string;
  qty: number;
  harga_jual: number;
  harga_beli: number;
  warna: string;
  harga_tinta: number;
  diskon: number;
  is_bonus: boolean;
}

interface TransaksiDetail {
  transaksi: {
    id: number; kode: string; tanggal: string;
    total: number; profit: number;
    kasir_nama: string; metode_bayar: string;
  };
  items: Item[];
}

interface Props {
  transaksiId: number;
  onClose: () => void;
  onChanged?: () => void;
}

const DetailTransaksiDialog: React.FC<Props> = ({ transaksiId, onClose, onChanged }) => {
  const [detail, setDetail] = useState<TransaksiDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState('');
  const [konfirmasiHapusItemId, setKonfirmasiHapusItemId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/transaksi/${transaksiId}`, { headers });
      if (res.ok) setDetail(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [transaksiId]);

  const handleEditQty = async (itemId: number) => {
    if (!newQty || parseInt(newQty) <= 0) { setErrorMsg('Qty harus lebih dari 0'); return; }
    setSaving(true); setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:8000/transaksi/${transaksiId}/item/${itemId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ qty_baru: parseInt(newQty) })
      });
      const result = await res.json();
      if (!res.ok) { setErrorMsg(result.detail || 'Gagal edit'); return; }
      setEditingItemId(null);
      fetchDetail();
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', borderRadius: '12px',
    padding: '2rem', width: '780px', maxWidth: '95vw', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'sans-serif'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              Detail Transaksi — <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{detail?.transaksi.kode}</span>
            </h2>
            {detail && (
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {new Date(detail.transaksi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                {' — Kasir: '}{detail.transaksi.kasir_nama}
                {' — '}{detail.transaksi.metode_bayar || 'Tunai'}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {isLoading ? <p style={{ textAlign: 'center' }}>Loading...</p> : detail ? (
          <>
            {/* SUMMARY */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Omzet</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Rp {detail.transaksi.total.toLocaleString('id-ID')}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Profit</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>Rp {detail.transaksi.profit.toLocaleString('id-ID')}</div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {/* ITEM TABLE */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d2d5f', color: '#94a3b8', fontSize: '0.875rem' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Produk</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Harga Jual</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>HPP</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e1e4a', backgroundColor: item.is_bonus ? '#0d2e1a' : 'transparent' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.produk_nama}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {item.produk_kode}{item.warna ? ` | ${item.warna}` : ''}
                          {item.is_bonus && <span style={{ color: '#4ade80', marginLeft: '0.5rem' }}>🎁 BONUS</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {editingItemId === item.id ? (
                          <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} min={1}
                            style={{ width: '60px', padding: '0.25rem', backgroundColor: '#1e1e4a', border: '1px solid #4f46e5', color: 'white', textAlign: 'center', borderRadius: '4px' }}
                          />
                        ) : item.qty}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {item.is_bonus ? <span style={{ color: '#4ade80' }}>GRATIS</span> : `Rp ${item.harga_jual.toLocaleString('id-ID')}`}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem' }}>
                        {item.is_bonus ? '-' : `Rp ${item.harga_beli.toLocaleString('id-ID')}`}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {editingItemId === item.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button onClick={() => handleEditQty(item.id)} disabled={saving}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                              {saving ? '...' : 'Simpan'}
                            </button>
                            <button onClick={() => setEditingItemId(null)}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingItemId(item.id); setNewQty(String(item.qty)); setErrorMsg(''); }}
                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            Edit Qty
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <p>Data tidak ditemukan</p>}
      </div>
    </div>
  );
};

export default DetailTransaksiDialog;
