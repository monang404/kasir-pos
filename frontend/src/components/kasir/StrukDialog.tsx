import React, { useRef } from 'react';
import { CartItem } from './AddToCartDialog';

interface TransaksiInfo {
  kode: string;
  tanggal: string;
  total: number;
  uangBayar: number;
  kembalian: number;
  kasir_nama: string;
  pelanggan_nama: string;
}

interface StrukDialogProps {
  cart: CartItem[];
  info: TransaksiInfo;
  onClose: () => void;
}

const StrukDialog: React.FC<StrukDialogProps> = ({ cart, info, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const win = window.open('', '_blank');
      win?.document.write(`
        <html>
          <head>
            <title>Cetak Struk - ${info.kode}</title>
            <style>
              body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; }
              .center { text-align: center; }
              .right { text-align: right; }
              .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 2px 0; vertical-align: top; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      win?.document.close();
    }
  };

  const handleCopyWA = () => {
    const d = new Date(info.tanggal);
    const tgl = d.toLocaleString('id-ID');

    let waText = `*KASIR POS SUPER APP*\n`;
    waText += `Jl. Contoh Alamat No. 123\n`;
    waText += `--------------------------------\n`;
    waText += `No : ${info.kode}\n`;
    waText += `Tgl: ${tgl}\n`;
    waText += `Ksr: ${info.kasir_nama}\n`;
    waText += `Plg: ${info.pelanggan_nama}\n`;
    waText += `--------------------------------\n`;

    cart.forEach(c => {
      waText += `*${c.nama}*\n`;
      if (c.warna) waText += `_Warna: ${c.warna}_\n`;
      
      if (c.is_bonus) {
        waText += `${c.qty} x Rp 0 = Rp 0 (BONUS)\n`;
      } else {
        waText += `${c.qty} x Rp ${c.harga_jual.toLocaleString('id-ID')}\n`;
        if (c.diskon > 0) {
          waText += `  Diskon: -Rp ${c.diskon.toLocaleString('id-ID')}\n`;
        }
        if (c.harga_tinta > 0) {
          waText += `  Tinta: +Rp ${c.harga_tinta.toLocaleString('id-ID')}\n`;
        }
        waText += `  *Subtotal: Rp ${c.subtotal.toLocaleString('id-ID')}*\n`;
      }
    });

    waText += `--------------------------------\n`;
    waText += `*TOTAL     : Rp ${info.total.toLocaleString('id-ID')}*\n`;
    waText += `BAYAR      : Rp ${info.uangBayar.toLocaleString('id-ID')}\n`;
    waText += `KEMBALI    : Rp ${info.kembalian.toLocaleString('id-ID')}\n`;
    waText += `--------------------------------\n`;
    waText += `Terima kasih atas kunjungannya!\n`;

    navigator.clipboard.writeText(waText).then(() => {
      alert("Format WhatsApp berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error("Gagal copy", err);
      alert("Gagal menyalin teks.");
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#11113a', color: '#e2e8f0',
        padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Area Struk untuk Preview dan Print */}
        <div style={{
          backgroundColor: 'white', color: 'black', padding: '1rem',
          borderRadius: '4px', height: '400px', overflowY: 'auto', marginBottom: '1rem',
          fontFamily: 'monospace', fontSize: '14px'
        }}>
          <div ref={printRef}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>KASIR POS SUPER APP</div>
            <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>Jl. Contoh Alamat No. 123</div>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
            
            <table style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}>
              <tbody>
                <tr><td>No</td><td>: {info.kode}</td></tr>
                <tr><td>Tgl</td><td>: {new Date(info.tanggal).toLocaleString('id-ID')}</td></tr>
                <tr><td>Ksr</td><td>: {info.kasir_nama}</td></tr>
                <tr><td>Plg</td><td>: {info.pelanggan_nama}</td></tr>
              </tbody>
            </table>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
            
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                {cart.map((c, i) => (
                  <React.Fragment key={i}>
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 'bold', paddingTop: '4px' }}>{c.nama} {c.is_bonus && '(BONUS)'}</td>
                    </tr>
                    {c.warna && <tr><td colSpan={3} style={{ fontStyle: 'italic', fontSize: '10px' }}>Warna: {c.warna}</td></tr>}
                    <tr>
                      <td style={{ width: '10%' }}>{c.qty}x</td>
                      <td style={{ width: '45%' }}>{c.is_bonus ? 0 : c.harga_jual.toLocaleString('id-ID')}</td>
                      <td style={{ width: '45%', textAlign: 'right' }}>{c.is_bonus ? 0 : (c.harga_jual * c.qty).toLocaleString('id-ID')}</td>
                    </tr>
                    {!c.is_bonus && c.diskon > 0 && (
                      <tr>
                        <td></td>
                        <td style={{ fontSize: '10px' }}>Diskon</td>
                        <td style={{ textAlign: 'right', fontSize: '10px' }}>-{c.diskon.toLocaleString('id-ID')}</td>
                      </tr>
                    )}
                    {!c.is_bonus && c.harga_tinta > 0 && (
                      <tr>
                        <td></td>
                        <td style={{ fontSize: '10px' }}>Tinta</td>
                        <td style={{ textAlign: 'right', fontSize: '10px' }}>+{c.harga_tinta.toLocaleString('id-ID')}</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
            
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp {info.total.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td>BAYAR</td>
                  <td style={{ textAlign: 'right' }}>Rp {info.uangBayar.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td>KEMBALI</td>
                  <td style={{ textAlign: 'right' }}>Rp {info.kembalian.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
            <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px' }}>
              Terima kasih atas kunjungannya!
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handlePrint}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🖨️ Cetak Printer
            </button>
            <button 
              onClick={handleCopyWA}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#22c55e', color: '#0f172a', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              💬 Copy WA
            </button>
          </div>
          <button 
            onClick={onClose}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #94a3b8', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default StrukDialog;
