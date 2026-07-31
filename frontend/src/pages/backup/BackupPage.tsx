import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';

interface BackupFile {
  filename: string;
  size: string;
  size_bytes: number;
  created_at: string;
}

const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; filename: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string; warning?: string } | null>(null);


  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/backup/list');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const url = `/backup/create${label ? `?label=${encodeURIComponent(label)}` : ''}`;
      const res = await apiFetch(url, { method: 'POST' });
      if (res.ok) {
        const r = await res.json();
        setActionResult({ success: true, message: r.message + ` (${r.filename}, ${r.size})` });
        setLabel('');
        fetchBackups();
      } else {
        const r = await res.json();
        setActionResult({ success: false, message: r.detail || 'Gagal membuat backup' });
      }
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setActionResult(null);
    try {
      if (confirmAction.type === 'delete') {
        const res = await apiFetch(`/backup/delete/${confirmAction.filename}`, { method: 'DELETE' });
        const r = await res.json();
        setActionResult({ success: res.ok, message: r.message || r.detail });
        if (res.ok) fetchBackups();
      } else if (confirmAction.type === 'restore') {
        const res = await apiFetch(`/backup/restore/${confirmAction.filename}`, { method: 'POST' });
        const r = await res.json();
        setActionResult({ success: res.ok, message: r.message || r.detail, warning: r.warning });
      }
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Backup & Restore</h1>

      {/* DISCLAIMER PERMANEN */}
      <div style={{ backgroundColor: '#78350f', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ fontWeight: 'bold', color: '#fcd34d', marginBottom: '0.5rem' }}>⚠️ Peringatan Penting</div>
        <div style={{ color: '#fde68a', fontSize: '0.9rem' }}>
          Operasi <strong>Restore</strong> akan menimpa seluruh data database aktif dengan isi backup. Sistem akan secara otomatis membuat 
          <em> safety backup</em> sebelum restore dilakukan. Setelah restore berhasil, Anda <strong>wajib me-restart service backend</strong> agar 
          koneksi database di-reset.
        </div>
      </div>

      {/* ACTION RESULT */}
      {actionResult && (
        <div style={{
          backgroundColor: actionResult.success ? '#14532d' : '#7f1d1d',
          border: `1px solid ${actionResult.success ? '#22c55e' : '#dc2626'}`,
          borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem'
        }}>
          <div style={{ color: actionResult.success ? '#86efac' : '#fca5a5', fontWeight: 'bold' }}>
            {actionResult.success ? '✅' : '❌'} {actionResult.message}
          </div>
          {actionResult.warning && (
            <div style={{ color: '#fcd34d', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              ⚠️ {actionResult.warning}
            </div>
          )}
          <button onClick={() => setActionResult(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Tutup
          </button>
        </div>
      )}

      {/* CREATE BACKUP */}
      <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Buat Backup Baru</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input type="text" placeholder="Catatan/label (opsional)" value={label}
            onChange={e => setLabel(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }} />
          <button onClick={handleCreateBackup} disabled={creatingBackup}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#22c55e', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {creatingBackup ? '⏳ Membuat...' : '💾 Buat Backup'}
          </button>
        </div>
      </div>

      {/* BACKUP TABLE */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #2d2d5f', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Daftar Backup ({backups.length} file)</h3>
          <button onClick={fetchBackups}
            style={{ padding: '0.4rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Nama File</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Ukuran</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Dibuat</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : backups.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada file backup</td></tr>
            ) : backups.map(b => (
              <tr key={b.filename} style={{ borderBottom: '1px solid #1e1e4a' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem', color: '#94a3b8' }}>{b.filename}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{b.size}</td>
                <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{b.created_at}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <a href={`http://localhost:8000/backup/download/${b.filename}`}
                      style={{ padding: '0.3rem 0.75rem', backgroundColor: '#1e3a5f', color: '#93c5fd', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}>
                      ⬇ Download
                    </a>
                    <button onClick={() => setConfirmAction({ type: 'restore', filename: b.filename })}
                      style={{ padding: '0.3rem 0.75rem', backgroundColor: '#78350f', border: 'none', color: '#fcd34d', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      🔄 Restore
                    </button>
                    <button onClick={() => setConfirmAction({ type: 'delete', filename: b.filename })}
                      style={{ padding: '0.3rem 0.75rem', backgroundColor: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      🗑 Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CONFIRM DIALOG */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: '#0d0d2e', border: `1px solid ${confirmAction.type === 'restore' ? '#f59e0b' : '#dc2626'}`, borderRadius: '12px', padding: '2rem', maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              {confirmAction.type === 'restore' ? '⚠️' : '🗑️'}
            </div>
            <h3 style={{ margin: '0 0 0.75rem' }}>
              {confirmAction.type === 'restore' ? 'Konfirmasi Restore Database' : 'Konfirmasi Hapus Backup'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#e2e8f0' }}>{confirmAction.filename}</strong>
            </p>
            {confirmAction.type === 'restore' && (
              <div style={{ backgroundColor: '#78350f', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#fde68a', marginBottom: '1rem', textAlign: 'left' }}>
                Safety backup akan dibuat otomatis sebelum restore. Jika gagal membuat safety backup, restore akan dibatalkan. Setelah restore, backend perlu di-restart.
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button onClick={handleConfirm} disabled={actionLoading}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: confirmAction.type === 'restore' ? '#b45309' : '#dc2626', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {actionLoading ? '⏳ Proses...' : (confirmAction.type === 'restore' ? 'Ya, Restore' : 'Ya, Hapus')}
              </button>
              <button onClick={() => setConfirmAction(null)} disabled={actionLoading}
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

export default BackupPage;
