import React, { useState, useEffect } from 'react';
import { CartItem } from './AddToCartDialog';

interface PembayaranDialogProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: (uangBayar: number) => void;
  isProcessing: boolean;
}

const getQuickNominals = (total: number): number[] => {
  const nominals = new Set<number>();
  nominals.add(total); // Uang pas

  const multiples = [5000, 10000, 50000, 100000];
  for (const m of multiples) {
    if (nominals.size >= 4) break;
    const rounded = Math.ceil(total / m) * m;
    if (rounded > total) {
      nominals.add(rounded);
    }
  }

  // Jika belum 4, tambahkan kelipatan 100k lagi
  let nextHigh = Math.ceil(total / 100000) * 100000;
  while (nominals.size < 4) {
    nextHigh += 100000;
    nominals.add(nextHigh);
  }

  return Array.from(nominals).sort((a, b) => a - b).slice(0, 4);
};

const PembayaranDialog: React.FC<PembayaranDialogProps> = ({ cart, total, onClose, onConfirm, isProcessing }) => {
  const [uangBayar, setUangBayar] = useState<number>(0);
  const [quickNominals, setQuickNominals] = useState<number[]>([]);

  useEffect(() => {
    setQuickNominals(getQuickNominals(total));
  }, [total]);

  const kembalian = uangBayar - total;
  const isCukup = uangBayar >= total;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCukup && !isProcessing) {
      onConfirm(uangBayar);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#11113a', color: '#e2e8f0',
        padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Pembayaran</h2>

        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', backgroundColor: '#05051a', borderRadius: '4px', padding: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d2d5f', textAlign: 'left', fontSize: '0.875rem', color: '#94a3b8' }}>
                <th style={{ padding: '0.5rem' }}>Item</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e1e4a' }}>
                  <td style={{ padding: '0.5rem' }}>{c.nama} {c.is_bonus && '🎁'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{c.qty}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {c.is_bonus ? 'Rp 0' : `Rp ${c.subtotal.toLocaleString('id-ID')}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          <span>Total Tagihan:</span>
          <span style={{ fontWeight: 'bold', color: '#f87171' }}>Rp {total.toLocaleString('id-ID')}</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Nominal Pembayaran Cepat</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {quickNominals.map((nom, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUangBayar(nom)}
                style={{
                  padding: '0.75rem', backgroundColor: '#1e1e4a', color: 'white',
                  border: '1px solid #38bdf8', borderRadius: '4px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.875rem'
                }}
              >
                {idx === 0 && nom === total ? 'UANG PAS' : `Rp ${(nom/1000)}k`}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Input Uang Bayar (Rp)</label>
            <input
              type="number"
              value={uangBayar || ''}
              onChange={e => setUangBayar(Number(e.target.value))}
              min={0}
              required
              style={{
                width: '100%', padding: '1rem', backgroundColor: '#1e1e4a', border: '2px solid #2d2d5f',
                color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'right', borderRadius: '4px', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', fontSize: '1.25rem', padding: '1rem', backgroundColor: isCukup ? '#0d2e1a' : '#2e0d0d', borderRadius: '4px', border: `1px solid ${isCukup ? '#166534' : '#7f1d1d'}` }}>
            <span>Kembalian:</span>
            <span style={{ fontWeight: 'bold', color: isCukup ? '#4ade80' : '#f87171' }}>
              {isCukup ? `Rp ${kembalian.toLocaleString('id-ID')}` : 'Uang Kurang'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{ flex: 1, padding: '1rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isCukup || isProcessing}
              style={{
                flex: 2, padding: '1rem', backgroundColor: isCukup ? '#4f46e5' : '#334155',
                color: 'white', border: 'none', borderRadius: '4px', cursor: (!isCukup || isProcessing) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold', fontSize: '1.125rem'
              }}
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PembayaranDialog;
