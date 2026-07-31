import React, { useState, useEffect, useMemo, useRef } from 'react';
import DetailTransaksiDialog from '../components/transaksi/DetailTransaksiDialog';
import { apiFetch } from '../lib/apiFetch';

interface Transaksi {
  id: number;
  kode: string;
  tanggal: string;
  total: number;
  profit: number;
  pelanggan_id: number;
  kasir_nama: string;
  metode_bayar: string;
}

interface Stats {
  total_transaksi: number;
  total_omzet: number;
  total_profit: number;
  ditampilkan: number;
}

const TransaksiPage: React.FC = () => {
  const [data, setData] = useState<Transaksi[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bulanFilter, setBulanFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrxId, setSelectedTrxId] = useState<number | null>(null);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // UI-017: debounce searchQuery 300ms
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bulanFilter) params.set('bulan', bulanFilter);
      if (debouncedSearch) params.set('q', debouncedSearch);

      const res = await apiFetch(`/transaksi/?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
        setStats(result.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [bulanFilter, debouncedSearch]);

  const handleHapus = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await apiFetch(`/transaksi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKonfirmasiHapusId(null);
        fetchData();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Riwayat Transaksi</h1>

      {/* STAT CARDS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Transaksi</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_transaksi}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>seluruh periode</div>
          </div>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Omzet</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>
              Rp {stats.total_omzet.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Profit</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>
              Rp {stats.total_profit.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Ditampilkan</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.ditampilkan}</div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Cari kode/kasir..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        <input
          type="month"
          value={bulanFilter}
          onChange={e => setBulanFilter(e.target.value)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        <button onClick={() => { setBulanFilter(''); setSearchQuery(''); }}
          style={{ padding: '0.75rem 1rem', backgroundColor: '#374151', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Kode</th>
              <th style={{ padding: '1rem' }}>Tanggal</th>
              <th style={{ padding: '1rem' }}>Kasir</th>
              <th style={{ padding: '1rem' }}>Metode Bayar</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Profit</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>📋</div>
                <div style={{ marginBottom: '0.5rem' }}>Belum ada transaksi</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Transaksi akan muncul di sini setelah kasir melakukan checkout</div>
              </td></tr>
            ) : data.map(trx => (
              <tr key={trx.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#94a3b8' }}>{trx.kode}</td>
                <td style={{ padding: '1rem' }}>{new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '1rem' }}>{trx.kasir_nama}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: '#1e1e4a', fontSize: '0.75rem' }}>
                    {trx.metode_bayar || 'Tunai'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                  Rp {trx.total.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: '#4ade80' }}>
                  Rp {trx.profit.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => setSelectedTrxId(trx.id)}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                      Detail/Edit
                    </button>
                    {konfirmasiHapusId === trx.id ? (
                      <>
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', alignSelf: 'center' }}>⚠️ Stok dikembalikan!</span>
                        <button onClick={() => handleHapus(trx.id)} disabled={!!deletingId}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                          {deletingId === trx.id ? '...' : 'Ya, Hapus'}
                        </button>
                        <button onClick={() => setKonfirmasiHapusId(null)}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                          Batal
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setKonfirmasiHapusId(trx.id)}
                        style={{ padding: '0.25rem 0.75rem', backgroundColor: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '4px', cursor: 'pointer' }}>
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DIALOG DETAIL */}
      {selectedTrxId && (
        <DetailTransaksiDialog
          transaksiId={selectedTrxId}
          onClose={() => setSelectedTrxId(null)}
          onChanged={fetchData}
        />
      )}
    </div>
  );
};

export default TransaksiPage;
