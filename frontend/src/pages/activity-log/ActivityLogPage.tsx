import React, { useState, useEffect } from 'react';

const AKSI_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE:      { bg: '#14532d', text: '#86efac' },
  UPDATE:      { bg: '#1e3a5f', text: '#93c5fd' },
  DELETE:      { bg: '#7f1d1d', text: '#fca5a5' },
  SOFT_DELETE: { bg: '#78350f', text: '#fcd34d' },
  HARD_DELETE: { bg: '#7f1d1d', text: '#fca5a5' },
};

const MODULS = ['produk', 'transaksi', 'pelanggan', 'pengeluaran', 'users', 'activity_log', 'inventory', 'backup', 'kasir'];
const AKSIS = ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'HARD_DELETE'];

interface LogEntry {
  id: number;
  waktu: string;
  username: string;
  role: string;
  aksi: string;
  modul: string;
  target_id: string;
  target_info: string;
  detail: string | null;
}

const ActivityLogPage: React.FC = () => {
  const [data, setData] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [modulFilter, setModulFilter] = useState('');
  const [aksiFilter, setAksiFilter] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (modulFilter) params.set('modul', modulFilter);
    if (aksiFilter) params.set('aksi', aksiFilter);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    try {
      const res = await fetch(`http://localhost:8000/activity-log/?${params}`, { headers });
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
        setStats(result.stats || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [modulFilter, aksiFilter, startDate, endDate]);

  const handlePurge = async () => {
    const res = await fetch('http://localhost:8000/activity-log/purge', { method: 'DELETE', headers });
    if (res.ok) {
      const r = await res.json();
      alert(r.message);
      setShowPurgeConfirm(false);
      fetchData();
    }
  };

  // Client-side search
  const filtered = searchQuery
    ? data.filter(r =>
        r.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.modul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.target_info?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  const renderJson = (raw: string | null) => {
    if (!raw) return <span style={{ color: '#64748b' }}>—</span>;
    try {
      const parsed = JSON.parse(raw);
      return (
        <pre style={{
          backgroundColor: '#0a0a2a', padding: '1rem', borderRadius: '6px',
          fontSize: '0.8rem', overflowX: 'auto', maxHeight: '300px',
          color: '#93c5fd', border: '1px solid #2d2d5f', margin: 0
        }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span style={{ color: '#e2e8f0' }}>{raw}</span>;
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Activity Log</h1>
        <button onClick={() => setShowPurgeConfirm(true)}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#7f1d1d', border: '1px solid #dc2626', color: '#fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          🗑 Hapus Log &gt;90 Hari
        </button>
      </div>

      {/* STAT CARDS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Log (Filter)', val: stats.total, color: '#6366f1' },
            { label: 'Log Hari Ini', val: stats.hari_ini, color: '#38bdf8' },
            { label: 'Aksi Hapus (Filter)', val: stats.jumlah_hapus, color: '#f43f5e' },
            { label: 'Aksi Edit (Filter)', val: stats.jumlah_edit, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#11113a', padding: '1.25rem', borderRadius: '8px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div style={{ backgroundColor: '#11113a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #2d2d5f', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Cari username / modul / info..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.6rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
        <select value={modulFilter} onChange={e => setModulFilter(e.target.value)}
          style={{ padding: '0.6rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}>
          <option value="">— Semua Modul —</option>
          {MODULS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={aksiFilter} onChange={e => setAksiFilter(e.target.value)}
          style={{ padding: '0.6rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}>
          <option value="">— Semua Aksi —</option>
          {AKSIS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          style={{ padding: '0.6rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          style={{ padding: '0.6rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a' }}>
            <tr>
              {['Waktu', 'User', 'Aksi', 'Modul', 'Target Info', 'Detail'].map(h => (
                <th key={h} style={{ padding: '0.875rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tidak ada log untuk filter ini</td></tr>
            ) : filtered.map(r => {
              const ac = AKSI_COLORS[r.aksi] || { bg: '#374151', text: '#d1d5db' };
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {new Date(r.waktu).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{r.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.role}</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: ac.bg, color: ac.text, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {r.aksi}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{r.modul}</td>
                  <td style={{ padding: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.target_info || r.target_id || '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {r.detail ? (
                      <button onClick={() => setSelectedLog(r)}
                        style={{ padding: '0.25rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Lihat JSON
                      </button>
                    ) : <span style={{ color: '#64748b' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', textAlign: 'center', backgroundColor: '#0d0d2e' }}>
          Menampilkan {filtered.length} dari {data.length} entri (maks 100 per permintaan)
        </div>
      </div>

      {/* DETAIL DIALOG */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}
          onClick={() => setSelectedLog(null)}>
          <div style={{ backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', borderRadius: '12px', padding: '2rem', width: '600px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Detail Log</h3>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(selectedLog.waktu).toLocaleString('id-ID')} · {selectedLog.username}</div>
              </div>
              <button onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>Info:</span>
              <span>{selectedLog.target_info || '—'}</span>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Data Before / After:</div>
              {renderJson(selectedLog.detail)}
            </div>
          </div>
        </div>
      )}

      {/* PURGE CONFIRM */}
      {showPurgeConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: '#0d0d2e', border: '1px solid #7f1d1d', borderRadius: '12px', padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <h3>Hapus Log Lama?</h3>
            <p style={{ color: '#94a3b8' }}>Semua log yang lebih dari 90 hari akan dihapus permanen. Tindakan ini tidak dapat diurungkan.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button onClick={handlePurge}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Ya, Hapus
              </button>
              <button onClick={() => setShowPurgeConfirm(false)}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
