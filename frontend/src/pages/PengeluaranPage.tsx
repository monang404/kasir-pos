import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface Pengeluaran {
  id: number;
  tanggal: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
}

interface Stats {
  jumlah_item: number;
  total: number;
}

const KATEGORI_ALLOWED = [
  'Operasional', 'Gaji Karyawan', 'Sewa Tempat', 'Listrik & Air',
  'Transport', 'Pembelian Peralatan', 'Promosi & Iklan', 'Lainnya'
];

const PengeluaranPage: React.FC = () => {
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [bulanFilter, setBulanFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: KATEGORI_ALLOWED[0],
    keterangan: '',
    jumlah: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);

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
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (bulanFilter) params.set('bulan', bulanFilter);
      if (kategoriFilter) params.set('kategori', kategoriFilter);

      const res = await apiFetch(`/pengeluaran/?${params}`);
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

  useEffect(() => { fetchData(); }, [debouncedSearch, bulanFilter, kategoriFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);
    try {
      const url = editingId ? `/pengeluaran/${editingId}` : '/pengeluaran/';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...formData,
        jumlah: parseFloat(formData.jumlah)
      };

      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        const result = await res.json();
        setErrorMsg(result.detail || 'Gagal menyimpan pengeluaran');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleHapus = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await apiFetch(`/pengeluaran/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKonfirmasiHapusId(null);
        fetchData();
      } else {
        const result = await res.json();
        setErrorMsg(result.detail || 'Gagal menghapus pengeluaran');
        setKonfirmasiHapusId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Data Pengeluaran</h1>

      {/* STAT CARDS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Item (Sesuai Filter)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.jumlah_item}</div>
          </div>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Pengeluaran (Sesuai Filter)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fb7185' }}>
              Rp {stats.total.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Ditampilkan di Tabel</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.length}</div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Cari keterangan/kategori..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '250px', padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        <input
          type="month"
          value={bulanFilter}
          onChange={e => setBulanFilter(e.target.value)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        <select
          value={kategoriFilter}
          onChange={e => setKategoriFilter(e.target.value)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        >
          <option value="">-- Semua Kategori --</option>
          {KATEGORI_ALLOWED.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <button onClick={() => { setBulanFilter(''); setSearchQuery(''); setKategoriFilter(''); }}
          style={{ padding: '0.75rem 1rem', backgroundColor: '#374151', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          Reset Filter
        </button>
        <div style={{ flex: 1 }}></div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              tanggal: new Date().toISOString().split('T')[0],
              kategori: KATEGORI_ALLOWED[0],
              keterangan: '',
              jumlah: ''
            });
            setErrorMsg('');
            setShowForm(true);
          }}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Tambah Pengeluaran
        </button>
      </div>

      {errorMsg && !showForm && (
        <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #2d2d5f' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</h3>
          {errorMsg && (
            <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Tanggal *</label>
              <input type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Kategori *</label>
              <select value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })} required
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }}>
                {KATEGORI_ALLOWED.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Jumlah (Rp) *</label>
              <input type="number" min={1} value={formData.jumlah} onChange={e => setFormData({ ...formData, jumlah: e.target.value })} required
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Keterangan</label>
              <input type="text" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" disabled={submitLoading}
                style={{ padding: '0.75rem 2rem', backgroundColor: '#22c55e', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {submitLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '0.75rem 2rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Tanggal</th>
              <th style={{ padding: '1rem' }}>Kategori</th>
              <th style={{ padding: '1rem' }}>Keterangan</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Jumlah</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data pengeluaran</td></tr>
            ) : data.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                <td style={{ padding: '1rem' }}>{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#1e1e4a', color: '#94a3b8', fontSize: '0.875rem' }}>
                    {p.kategori}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#cbd5e1' }}>{p.keterangan || '-'}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#fb7185' }}>
                  Rp {p.jumlah.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => {
                      setEditingId(p.id);
                      setFormData({
                        tanggal: p.tanggal,
                        kategori: p.kategori,
                        keterangan: p.keterangan || '',
                        jumlah: String(p.jumlah)
                      });
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                      Edit
                    </button>
                    {konfirmasiHapusId === p.id ? (
                      <>
                        <button onClick={() => handleHapus(p.id)} disabled={!!deletingId}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                          {deletingId === p.id ? '...' : 'Ya, Hapus'}
                        </button>
                        <button onClick={() => setKonfirmasiHapusId(null)}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                          Batal
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setKonfirmasiHapusId(p.id)}
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
    </div>
  );
};

export default PengeluaranPage;
