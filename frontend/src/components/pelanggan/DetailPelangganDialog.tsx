import React, { useState, useEffect } from 'react';
import DetailTransaksiDialog from '../transaksi/DetailTransaksiDialog';

interface Transaksi {
  id: number;
  kode: string;
  tanggal: string;
  total: number;
  profit: number;
  kasir_nama: string;
  metode_bayar: string;
}

interface Stats {
  total_transaksi: number;
  total_omzet: number;
  total_profit: number;
  ditampilkan: number;
}

interface Props {
  pelangganId: number;
  pelangganNama: string;
  onClose: () => void;
}

const DetailPelangganDialog: React.FC<Props> = ({ pelangganId, pelangganNama, onClose }) => {
  const [data, setData] = useState<Transaksi[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrxId, setSelectedTrxId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchRiwayat = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/transaksi/?pelanggan_id=${pelangganId}`, { headers });
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

  useEffect(() => { fetchRiwayat(); }, [pelangganId]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900
  };
  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', borderRadius: '12px',
    padding: '2rem', width: '800px', maxWidth: '95vw', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'sans-serif'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Riwayat Transaksi Pelanggan</h2>
            <div style={{ color: '#38bdf8', fontSize: '1rem', marginTop: '0.25rem', fontWeight: 'bold' }}>
              {pelangganNama}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* STATS */}
        {stats && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #4f46e5' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Transaksi</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.ditampilkan}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Omzet</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>Rp {stats.total_omzet.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#11113a', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Profit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>Rp {stats.total_profit.toLocaleString('id-ID')}</div>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div style={{ overflowY: 'auto', flex: 1, borderRadius: '8px', border: '1px solid #2d2d5f' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#1e1e4a', borderBottom: '1px solid #2d2d5f', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '0.75rem' }}>Kode</th>
                <th style={{ padding: '0.75rem' }}>Tanggal</th>
                <th style={{ padding: '0.75rem' }}>Total</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada riwayat transaksi</td></tr>
              ) : (
                data.map(trx => (
                  <tr key={trx.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>{trx.kode}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Rp {trx.total.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => setSelectedTrxId(trx.id)}
                        style={{ padding: '0.25rem 0.75rem', backgroundColor: '#374151', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* DIALOG DETAIL TRANSAKSI */}
        {selectedTrxId && (
          <DetailTransaksiDialog
            transaksiId={selectedTrxId}
            onClose={() => setSelectedTrxId(null)}
            onChanged={fetchRiwayat}
          />
        )}
      </div>
    </div>
  );
};

export default DetailPelangganDialog;
