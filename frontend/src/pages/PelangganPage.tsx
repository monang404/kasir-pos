import React, { useState, useEffect } from 'react';
import DetailPelangganDialog from '../components/pelanggan/DetailPelangganDialog';

interface Pelanggan {
  id: number;
  nama: string;
  no_hp: string;
  alamat: string;
}

const PelangganPage: React.FC = () => {
  const [data, setData] = useState<Pelanggan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState<{ id: number, nama: string } | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nama: '', no_hp: '', alamat: '', keterangan: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      const res = await fetch(`http://localhost:8000/pelanggan/?${params}`, { headers });
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);
    try {
      const url = editingId ? `http://localhost:8000/pelanggan/${editingId}` : 'http://localhost:8000/pelanggan/';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        const result = await res.json();
        setErrorMsg(result.detail || 'Gagal menyimpan pelanggan');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleHapus = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:8000/pelanggan/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setKonfirmasiHapusId(null);
        fetchData();
      } else {
        const result = await res.json();
        alert(result.detail || 'Gagal menghapus pelanggan');
        setKonfirmasiHapusId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Manajemen Pelanggan</h1>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <input
          type="text"
          placeholder="Cari nama atau no HP..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '300px', padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ nama: '', no_hp: '', alamat: '', keterangan: '' });
            setErrorMsg('');
            setShowForm(true);
          }}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Tambah Pelanggan
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
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
          {errorMsg && (
            <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Nama *</label>
              <input type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>No HP</label>
              <input type="text" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Alamat</label>
              <textarea value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} rows={2}
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
              <th style={{ padding: '1rem' }}>Nama</th>
              <th style={{ padding: '1rem' }}>No HP</th>
              <th style={{ padding: '1rem' }}>Alamat</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data pelanggan</td></tr>
            ) : data.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e1e4a', cursor: 'pointer' }} onDoubleClick={() => setSelectedPelanggan({ id: p.id, nama: p.nama })}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.nama}</td>
                <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.no_hp || '-'}</td>
                <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.alamat || '-'}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => setSelectedPelanggan({ id: p.id, nama: p.nama })}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: '#38bdf8', border: 'none', color: '#0f172a', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Riwayat
                    </button>
                    <button onClick={() => {
                      setEditingId(p.id);
                      setFormData({ nama: p.nama, no_hp: p.no_hp || '', alamat: p.alamat || '', keterangan: '' });
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
        <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#0d0d2e' }}>
          Tips: Double-click pada baris pelanggan untuk melihat riwayat transaksinya.
        </div>
      </div>

      {/* DIALOG RIWAYAT TRANSAKSI */}
      {selectedPelanggan && (
        <DetailPelangganDialog
          pelangganId={selectedPelanggan.id}
          pelangganNama={selectedPelanggan.nama}
          onClose={() => setSelectedPelanggan(null)}
        />
      )}
    </div>
  );
};

export default PelangganPage;
