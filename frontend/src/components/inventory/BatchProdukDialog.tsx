import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';

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
  const [newQty, setNewQty] = useState('');
  const [newHargaBeli, setNewHargaBeli] = useState('');
  const [newTgl, setNewTgl] = useState(new Date().toISOString().split('T')[0]);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);
  const [alasanHapus, setAlasanHapus] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');



  const fetchBatch = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(`/inventory/batch/${produkId}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const errText = await res.text();
        setErrorMsg(`Gagal memuat batch (HTTP ${res.status}): ${errText}`);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Kesalahan jaringan: ${e.message}`);
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
      const res = await apiFetch('/inventory/batch/', {
        method: 'POST',
        body: JSON.stringify({
          produk_id: produkId,
          qty: parseInt(newQty),
          harga_beli: parseFloat(newHargaBeli),
          tanggal_masuk: new Date(newTgl).toISOString()
        })
      });
      const result = await res.json();
      if (!res.ok) { setErrorMsg(result.detail || 'Gagal tambah batch'); return; }
      setNewQty(''); setNewHargaBeli('');
      fetchBatch();
      onChanged?.();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleHapus = async (batchId: number, qtySisa: number) => {
    if (qtySisa > 0 && (!alasanHapus || alasanHapus.length < 5)) {
      setErrorMsg('Alasan hapus wajib diisi minimal 5 karakter karena stok masih ada');
      return;
    }
    setSubmitLoading(true);
    try {
      const body = qtySisa > 0 ? JSON.stringify({ alasan: alasanHapus }) : undefined;
      const res = await apiFetch(`/inventory/batch/${batchId}`, { 
        method: 'DELETE', 
        body
      });
      if (res.ok) {
        setKonfirmasiHapusId(null);
        setAlasanHapus('');
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
    <div role="dialog" aria-modal="true" aria-label="Riwayat Batch Stok" style={overlayStyle}>
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
        ) : (
          <>
            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}
            
            {data && (
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
            )}

            {/* FORM TAMBAH BATCH */}
            <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #2d2d5f', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: '0', fontSize: '1rem', color: '#e2e8f0' }}>Tambah Stok (Batch Baru)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={handleTambah} disabled={submitLoading}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {submitLoading ? 'Menyimpan...' : 'Simpan Stok / Batch'}
                </button>
              </div>
            </div>

            {/* DAFTAR BATCH */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {!data || data.batches.length === 0 ? (
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                              {b.qty_sisa > 0 && (
                                <input type="text" placeholder="Alasan hapus (min 5 char)..." 
                                  value={alasanHapus} onChange={(e) => setAlasanHapus(e.target.value)}
                                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #2d2d5f', backgroundColor: '#0d0d2e', color: 'white', fontSize: '0.75rem', width: '200px' }} />
                              )}
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleHapus(b.id, b.qty_sisa)} disabled={submitLoading}
                                  style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                  Konfirmasi Hapus
                                </button>
                                <button onClick={() => { setKonfirmasiHapusId(null); setAlasanHapus(''); }}
                                  style={{ padding: '0.25rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                  Batal
                                </button>
                              </div>
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
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #2d2d5f', textAlign: 'right' }}>
              <button onClick={onClose}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BatchProdukDialog;
