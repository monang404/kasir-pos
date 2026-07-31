import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch';

interface Pelanggan {
  id: number;
  nama: string;
  no_hp: string;
}

interface PilihPelangganDialogProps {
  onPilih: (pelanggan: { id: number; nama: string }) => void;
  onClose: () => void;
}

const PELANGGAN_UMUM = { id: 1, nama: 'Umum' };

const PilihPelangganDialog: React.FC<PilihPelangganDialogProps> = ({ onPilih, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pelanggan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPelanggan = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await apiFetch(`/pelanggan/${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => fetchPelanggan(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchPelanggan]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih Pelanggan"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div style={{
        backgroundColor: '#11113a', color: '#e2e8f0', padding: '1.5rem',
        borderRadius: '8px', width: '100%', maxWidth: '480px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pilih Pelanggan</h3>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari nama atau no HP..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            padding: '0.75rem', marginBottom: '0.75rem',
            backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f',
            color: 'white', borderRadius: '4px', outline: 'none',
          }}
        />

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Opsi Umum selalu di atas */}
          <div
            onClick={() => onPilih(PELANGGAN_UMUM)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onPilih(PELANGGAN_UMUM)}
            style={{
              padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '4px',
              borderBottom: '1px solid #2d2d5f', marginBottom: '0.25rem',
              backgroundColor: '#1e1e4a',
              transition: 'background-color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#2d2d5f')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1e1e4a')}
          >
            <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>Umum</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pelanggan tanpa akun</div>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Mencari...</p>
          ) : results.length === 0 && query !== '' ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>Tidak ada pelanggan ditemukan</p>
          ) : (
            results.map(p => (
              <div
                key={p.id}
                onClick={() => onPilih({ id: p.id, nama: p.nama })}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onPilih({ id: p.id, nama: p.nama })}
                style={{
                  padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '4px',
                  borderBottom: '1px solid #1e1e4a',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#1e1e4a')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ fontWeight: 'bold' }}>{p.nama}</div>
                {p.no_hp && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.no_hp}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PilihPelangganDialog;
