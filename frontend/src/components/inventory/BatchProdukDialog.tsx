import React, { useState, useEffect } from 'react';

interface Batch {
  id: number;
  qty_sisa: number;
  harga_beli: number;
  tanggal_masuk: string;
}

interface BatchData {
  produk: { id: number; kode: string; nama: string };
  total_stok: number;
  total_batch: number;
  batches: Batch[];
}

interface Props {
  produkId: number;
  onClose: () => void;
  onChanged?: () => void;
}

const BatchProdukDialog: React.FC<Props> = ({ produkId, onClose, onChanged }) => {
  const [data, setData] = useState<BatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTambah, setShowTambah] = useState(false);
  const [newQty, setNewQty] = useState('');
  const [newHargaBeli, setNewHargaBeli] = useState('');
  const [newTgl, setNewTgl] = useState(new Date().toISOString().split('T')[0]);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchBatch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/inventory/batch/${produkId}`, { headers });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBatch(); }, [produkId]);

  const handleTambah = async () => {
    setErrorMsg('');
    if (!newQty || !newHargaBeli) { setErrorMsg('Qty dan Harga Beli wajib diisi'); return; }
    setSubmitLoading(true);
    try {
      const res = await fetch('http://localhost:8000/inventory/batch/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          produk_id: produkId,
          qty: parseInt(newQty),
          harga_beli: parseFloat(newHargaBeli),
          tanggal_masuk: new Date(newTgl).toISOString()
        })
      });
      const result = await res.json();
      if (!res.ok) { setErrorMsg(result.detail || 'Gagal tambah batch'); return; }
      setShowTambah(false);
      setNewQty(''); setNewHargaBeli('');
      fetchBatch();
      onChanged?.();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleHapus = async (batchId: number) => {
    setSubmitLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/inventory/batch/${batchId}`, { method: 'DELETE', headers });
      if (res.ok) {
        setKonfirmasiHapusId(null);
        fetchBatch();
        onChanged?.();
      } else {
        const result = await res.json();
        setErrorMsg(result.detail || 'Gagal hapus batch');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', borderRadius: '12px',
    padding: '2rem', width: '640px', maxWidth: '95vw', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'sans-serif'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Riwayat Batch Stok</h2>
            {data && (
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {data.produk.kode} — {data.produk.nama}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center' }}>Loading...</p>
        ) : data ? (
          <>
            {/* SUMMARY */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #4f46e5' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Batch</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.total_batch}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Stok Sisa</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>{data.total_stok}</div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {/* FORM TAMBAH BATCH */}
            {showTambah && (
              <div style={{ backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #2d2d5f' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Tambah Batch Baru</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Qty</label>
                    <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} min={1}
                      style={{ display: 'block', width: '100%', padding: '0.5rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Harga Beli (Rp)</label>
                    <input type="number" value={newHargaBeli} onChange={e => setNewHargaBeli(e.target.value)} min={0}
                      style={{ display: 'block', width: '100%', padding: '0.5rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tanggal Masuk</label>
                    <input type="date" value={newTgl} onChange={e => setNewTgl(e.target.value)}
                      style={{ display: 'block', width: '100%', padding: '0.5rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleTambah} disabled={submitLoading}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                    {submitLoading ? 'Menyimpan...' : 'Simpan Batch'}
                  </button>
                  <button onClick={() => setShowTambah(false)}
                    style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* DAFTAR BATCH */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {data.batches.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Belum ada data batch</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2d2d5f', color: '#94a3b8', fontSize: '0.875rem' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tgl Masuk</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Harga Beli</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stok Sisa</th>
                      <th style={{ padding: '0.75rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                        <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                          {new Date(b.tanggal_masuk).toLocaleDateString('id-ID')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          Rp {b.harga_beli.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '999px',
                            backgroundColor: b.qty_sisa > 0 ? '#064e3b' : '#374151',
                            color: b.qty_sisa > 0 ? '#34d399' : '#94a3b8',
                            fontWeight: 'bold', fontSize: '0.875rem'
                          }}>
                            {b.qty_sisa}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {konfirmasiHapusId === b.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              {b.qty_sisa > 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', alignSelf: 'center' }}>
                                  ⚠️ Stok {b.qty_sisa} akan hilang!
                                </span>
                              )}
                              <button onClick={() => handleHapus(b.id)} disabled={submitLoading}
                                style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                Ya, Hapus
                              </button>
                              <button onClick={() => setKonfirmasiHapusId(null)}
                                style={{ padding: '0.25rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setKonfirmasiHapusId(b.id)}
                              style={{ padding: '0.25rem 0.75rem', backgroundColor: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '4px', cursor: 'pointer' }}>
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #2d2d5f' }}>
              <button onClick={() => { setShowTambah(true); setErrorMsg(''); }}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Tambah Batch Baru
              </button>
            </div>
          </>
        ) : (
          <p>Data tidak ditemukan</p>
        )}
      </div>
    </div>
  );
};

export default BatchProdukDialog;
