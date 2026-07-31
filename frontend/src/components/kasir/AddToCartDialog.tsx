import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/ToastContext';

export interface Product {
  id: number;
  kode: string;
  nama: string;
  ukuran: string;
  harga_jual: number;
  stok_total: number;
}

export interface CartItem extends Product {
  qty: number;
  harga_jual_efektif: number;
  diskon: number;
  harga_tinta: number;
  warna: string;
  is_bonus: boolean;
  subtotal: number;
}

interface AddToCartDialogProps {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

const AddToCartDialog: React.FC<AddToCartDialogProps> = ({ product, onClose, onAdd }) => {
  const { showToast } = useToast();
  const [qty, setQty] = useState<number>(1);
  const [harga, setHarga] = useState<number>(product.harga_jual);
  const [diskonMode, setDiskonMode] = useState<'Rp' | '%'>('Rp');
  const [diskonVal, setDiskonVal] = useState<number>(0);
  const [hargaTinta, setHargaTinta] = useState<number>(0);
  const [warna, setWarna] = useState<string>('');
  const [isBonus, setIsBonus] = useState<boolean>(false);

  // Jika bonus di-klik, paksa harga, diskon, tinta jadi 0
  useEffect(() => {
    if (isBonus) {
      setHarga(0);
      setDiskonVal(0);
      setHargaTinta(0);
    } else {
      setHarga(product.harga_jual);
    }
  }, [isBonus, product.harga_jual]);

  const diskonRp = diskonMode === '%' ? (harga * (diskonVal / 100)) : diskonVal;
  const hargaEfektif = Math.max(0, harga - diskonRp);
  const subtotal = (hargaEfektif + hargaTinta) * qty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBonus && harga <= 0) {
      showToast('Harga jual harus lebih dari 0 jika bukan bonus. Gunakan opsi Bonus Gratis bila memang gratis.', 'warning');
      return;
    }
    
    onAdd({
      ...product,
      qty,
      harga_jual_efektif: isBonus ? 0 : hargaEfektif,
      diskon: isBonus ? 0 : diskonRp,
      harga_tinta: isBonus ? 0 : hargaTinta,
      warna,
      is_bonus: isBonus,
      subtotal: isBonus ? 0 : subtotal
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tambah ke Keranjang"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
    >
      <div style={{
        backgroundColor: '#11113a', color: '#e2e8f0',
        padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ marginTop: 0 }}>Tambah ke Keranjang</h2>
        <div style={{ marginBottom: '1rem', color: '#94a3b8' }}>
          <strong>{product.kode}</strong> - {product.nama} <br/>
          Stok Tersedia: {product.stok_total}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: '#0d2e1a', padding: '0.5rem', borderRadius: '4px', border: '1px solid #166534' }}>
            <input 
              type="checkbox" 
              checked={isBonus} 
              onChange={e => setIsBonus(e.target.checked)} 
            />
            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🎁 Berikan sebagai BONUS GRATIS</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Harga Jual (Rp)</label>
              <input 
                type="number" 
                value={harga} 
                onChange={e => setHarga(Number(e.target.value))}
                disabled={isBonus}
                min="0"
                style={{ width: '100%', padding: '0.5rem', backgroundColor: isBonus ? '#0f0f2a' : '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Qty (Maks: {product.stok_total})</label>
              <input 
                type="number" 
                value={qty} 
                onChange={e => setQty(Number(e.target.value))}
                min="1" max={product.stok_total}
                required
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Diskon</label>
              <div style={{ display: 'flex' }}>
                <select 
                  value={diskonMode} 
                  onChange={e => setDiskonMode(e.target.value as 'Rp' | '%')}
                  disabled={isBonus}
                  style={{ padding: '0.5rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white' }}
                >
                  <option value="Rp">Rp</option>
                  <option value="%">%</option>
                </select>
                <input 
                  type="number" 
                  value={diskonVal} 
                  onChange={e => setDiskonVal(Number(e.target.value))}
                  disabled={isBonus}
                  min="0"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: isBonus ? '#0f0f2a' : '#1e1e4a', border: '1px solid #2d2d5f', borderLeft: 'none', color: 'white', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Biaya Tinta (Rp)</label>
              <input 
                type="number" 
                value={hargaTinta} 
                onChange={e => setHargaTinta(Number(e.target.value))}
                disabled={isBonus}
                min="0"
                style={{ width: '100%', padding: '0.5rem', backgroundColor: isBonus ? '#0f0f2a' : '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Warna (Opsional)</label>
            <input 
              type="text" 
              value={warna} 
              onChange={e => setWarna(e.target.value)}
              placeholder="Contoh: Merah, Biru"
              style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1e1e4a', border: '1px solid #2d2d5f', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e1e4a', borderRadius: '4px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Subtotal:</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isBonus ? '#4ade80' : 'white' }}>
              {isBonus ? '🎁 Rp 0' : `Rp ${subtotal.toLocaleString('id-ID')}`}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: isBonus ? '#16a34a' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isBonus ? '🎁 Tambahkan Bonus' : '🛒 Tambahkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToCartDialog;
