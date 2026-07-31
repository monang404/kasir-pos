import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ui/ToastContext';
import { apiFetch } from '../lib/apiFetch';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'produk', label: 'Produk' },
  { id: 'pelanggan', label: 'Pelanggan' },
  { id: 'pengeluaran', label: 'Pengeluaran' },
  { id: 'stok', label: 'Stok (Real-time)' }
];

const LaporanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ringkasan');
  
  // Filter States
  const [filterMode, setFilterMode] = useState<'bulan' | 'rentang'>('bulan');
  const [bulanFilter, setBulanFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data States
  const [dataRingkasan, setDataRingkasan] = useState<any>(null);
  const [dataTransaksi, setDataTransaksi] = useState<any[]>([]);
  const [dataProduk, setDataProduk] = useState<any[]>([]);
  const [dataPelanggan, setDataPelanggan] = useState<any[]>([]);
  const [dataPengeluaran, setDataPengeluaran] = useState<any>(null);
  const [dataStok, setDataStok] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();
  const token = localStorage.getItem('token');
  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('mode', filterMode);
    if (filterMode === 'bulan' && bulanFilter) params.set('bulan', bulanFilter);
    if (filterMode === 'rentang' && startDate && endDate) {
      params.set('start_date', startDate);
      params.set('end_date', endDate);
    }
    return params.toString();
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    const q = buildQuery();
    try {
      const [resR, resT, resPr, resPe, resPeng, resS] = await Promise.all([
        apiFetch(`/laporan/ringkasan?${q}`),
        apiFetch(`/laporan/transaksi?${q}`),
        apiFetch(`/laporan/produk?${q}`),
        apiFetch(`/laporan/pelanggan?${q}`),
        apiFetch(`/laporan/pengeluaran?${q}`),
        apiFetch(`/laporan/stok`) // Stok always snapshot, no query
      ]);

      if (resR.ok) setDataRingkasan(await resR.json());
      if (resT.ok) setDataTransaksi((await resT.json()).data || []);
      if (resPr.ok) setDataProduk((await resPr.json()).data || []);
      if (resPe.ok) setDataPelanggan((await resPe.json()).data || []);
      if (resPeng.ok) setDataPengeluaran(await resPeng.json());
      if (resS.ok) setDataStok(await resS.json());
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []); // Initial load

  const handleExport = async () => {
    const q = buildQuery();
    try {
      const res = await apiFetch(`/laporan/export/${activeTab}?${q}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.detail || 'Gagal mengekspor data', 'error');
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_${activeTab}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat mengekspor laporan', 'error');
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Laporan</h1>

      {/* FILTER PANEL */}
      <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Mode Filter</label>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value as any)}
              style={{ padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}>
              <option value="bulan">Pilih Bulan</option>
              <option value="rentang">Rentang Tanggal</option>
            </select>
          </div>
          
          {filterMode === 'bulan' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Bulan</label>
              <input type="month" value={bulanFilter} onChange={e => setBulanFilter(e.target.value)}
                style={{ padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Dari Tanggal</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  style={{ padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Sampai Tanggal</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  style={{ padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
              </div>
            </>
          )}

          <button onClick={fetchAllData} disabled={isLoading}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLoading ? 'Memuat...' : 'Tampilkan Laporan'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '2px solid #1e1e4a', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-2px'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        {activeTab !== 'ringkasan' && (
          <button onClick={handleExport}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#22c55e', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⬇ Ekspor {TABS.find(t => t.id === activeTab)?.label} ke Excel
          </button>
        )}
      </div>

      {/* TAB CONTENT */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', border: '1px solid #2d2d5f', padding: '1.5rem', minHeight: '400px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Memuat data laporan...</div>
        ) : (
          <>
            {/* RINGKASAN */}
            {activeTab === 'ringkasan' && dataRingkasan && (
              <div>
                <h3 style={{ marginTop: 0 }}>Ringkasan Eksekutif</h3>
                <div style={{ backgroundColor: '#1e1e4a', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '4px solid #38bdf8', lineHeight: '1.6' }}>
                  {dataRingkasan.narasi}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#0d0d2e', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Omzet</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' }}>Rp {dataRingkasan.kpi.omzet.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#0d0d2e', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Laba Kotor</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>Rp {dataRingkasan.kpi.laba_kotor.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#0d0d2e', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pengeluaran</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fb7185' }}>Rp {dataRingkasan.kpi.pengeluaran.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#0d0d2e', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Laba Bersih</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>Rp {dataRingkasan.kpi.laba_bersih.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#0d0d2e', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Jml Transaksi</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dataRingkasan.kpi.jumlah_transaksi}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TRANSAKSI */}
            {activeTab === 'transaksi' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Kode</th>
                      <th style={{ padding: '1rem' }}>Tanggal</th>
                      <th style={{ padding: '1rem' }}>Pelanggan</th>
                      <th style={{ padding: '1rem' }}>Kasir</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataTransaksi.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
                    ) : dataTransaksi.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{t.kode}</td>
                        <td style={{ padding: '1rem' }}>{new Date(t.tanggal).toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem' }}>{t.pelanggan_nama}</td>
                        <td style={{ padding: '1rem' }}>{t.kasir_nama}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Rp {t.total.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#4ade80' }}>Rp {t.profit.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PRODUK */}
            {activeTab === 'produk' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Kode</th>
                      <th style={{ padding: '1rem' }}>Nama Produk</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Qty Terjual</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Omzet</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataProduk.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
                    ) : dataProduk.map(p => (
                      <tr key={p.kode} style={{ borderBottom: '1px solid #1e1e4a' }}>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#94a3b8' }}>{p.kode}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.nama}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{p.qty_terjual}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>Rp {p.omzet.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#4ade80' }}>Rp {p.profit.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PELANGGAN */}
            {activeTab === 'pelanggan' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Nama Pelanggan</th>
                      <th style={{ padding: '1rem' }}>No HP</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Jml Trx</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total Belanja</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Profit Dihasilkan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPelanggan.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
                    ) : dataPelanggan.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.nama}</td>
                        <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.no_hp || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{p.trx_count}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>Rp {p.total_belanja.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#4ade80' }}>Rp {p.profit_dihasilkan.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PENGELUARAN */}
            {activeTab === 'pengeluaran' && dataPengeluaran && (
              <div>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#1e1e4a', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ color: '#94a3b8', marginRight: '1rem' }}>Total Pengeluaran Periode Ini:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fb7185' }}>Rp {dataPengeluaran.total_pengeluaran.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', maxWidth: '600px' }}>
                    <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
                      <tr>
                        <th style={{ padding: '1rem' }}>Kategori</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Total Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataPengeluaran.data.length === 0 ? (
                        <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
                      ) : dataPengeluaran.data.map((p: any) => (
                        <tr key={p.kategori} style={{ borderBottom: '1px solid #1e1e4a' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.kategori}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#fb7185' }}>Rp {p.total.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STOK */}
            {activeTab === 'stok' && dataStok && (
              <div>
                <div style={{ backgroundColor: '#3b82f620', color: '#93c5fd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #3b82f650' }}>
                  ℹ️ {dataStok.metadata.note}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
                      <tr>
                        <th style={{ padding: '1rem' }}>Kode</th>
                        <th style={{ padding: '1rem' }}>Nama Produk</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Qty Sisa</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>HPP Default</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Harga Jual</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Valuasi (Qty × HPP Aktual)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataStok.data.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
                      ) : dataStok.data.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#94a3b8' }}>{s.kode}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.nama}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '0.2rem 0.5rem', borderRadius: '4px',
                              backgroundColor: s.qty_sisa <= 5 ? '#7f1d1d' : (s.qty_sisa < 20 ? '#92400e' : '#1e1e4a'),
                              color: s.qty_sisa <= 5 ? '#fca5a5' : (s.qty_sisa < 20 ? '#fcd34d' : '#e2e8f0')
                            }}>
                              {s.qty_sisa}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>Rp {s.hpp_default.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>Rp {s.harga_jual.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8' }}>Rp {s.valuasi.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LaporanPage;
