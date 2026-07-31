import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';

const TABS = [
  { id: 'prediksi-stok', label: 'Prediksi Stok' },
  { id: 'prediksi-omzet', label: 'Prediksi Omzet' },
  { id: 'prediksi-demand', label: 'Demand Produk' },
  { id: 'bonus-kasir', label: 'Bonus Kasir' },
  { id: 'promo-recommendation', label: 'Promo & Bundling' }
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Kritis':        { bg: '#7f1d1d', text: '#fca5a5' },
  'Rendah':        { bg: '#78350f', text: '#fcd34d' },
  'Normal':        { bg: '#1e3a5f', text: '#93c5fd' },
  'Aman':          { bg: '#14532d', text: '#86efac' },
  'Tidak Bergerak':{ bg: '#374151', text: '#d1d5db' }
};

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  'Platinum':                   { bg: '#312e81', text: '#c4b5fd' },
  'Gold':                       { bg: '#78350f', text: '#fcd34d' },
  'Silver':                     { bg: '#374151', text: '#d1d5db' },
  'Tidak Memenuhi Syarat':      { bg: '#1e1e4a', text: '#64748b' }
};

const MlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('prediksi-stok');
  const [tabData, setTabData]     = useState<Record<string, any>>({});
  const [loadingTab, setLoadingTab] = useState<string | null>(null);


  const fetchTab = async (tabId: string, force = false) => {
    setLoadingTab(tabId);
    try {
      const url = `/ml/${tabId}${force ? '?force_refresh=true' : ''}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        setTabData(prev => ({ ...prev, [tabId]: json }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTab(null);
    }
  };

  useEffect(() => {
    if (!tabData[activeTab]) fetchTab(activeTab);
  }, [activeTab]);

  const d = tabData[activeTab];
  const isLoading = loadingTab === activeTab;
  const isTraining = d?.is_training;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, background: 'linear-gradient(90deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Intelligence & ML
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Akses eksklusif: Admin — Hasil diperbarui otomatis setiap 24 jam
          </div>
        </div>
        <button onClick={() => fetchTab(activeTab, true)} disabled={!!loadingTab}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loadingTab ? '⏳ Memproses...' : '🔄 Refresh & Latih Ulang'}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '2px solid #1e1e4a', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.875rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === tab.id ? '#818cf8' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '-2px', fontSize: '0.9rem'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* STATUS BANNER */}
      {isTraining && (
        <div style={{ backgroundColor: '#312e81', color: '#c4b5fd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #4f46e5' }}>
          ⏳ Model sedang dilatih di background. Data yang ditampilkan adalah hasil training sebelumnya. Refresh sebentar lagi untuk hasil terbaru.
        </div>
      )}

      {/* BODY */}
      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', border: '1px solid #2d2d5f', padding: '1.5rem', minHeight: '400px' }}>
        {isLoading && !d ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
            Memuat model ML...
          </div>
        ) : !d || d.is_empty ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            Belum ada data. Klik "Refresh & Latih Ulang" untuk memulai training.
          </div>
        ) : (
          <>
            {/* ──── PREDIKSI STOK ──── */}
            {activeTab === 'prediksi-stok' && d.data?.prediksi_stok && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Prediksi Stok (Moving Average 90 Hari)</h3>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Update: {d.last_updated ? new Date(d.last_updated).toLocaleString('id-ID') : '-'}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#1e1e4a' }}>
                      <tr>
                        {['Kode', 'Nama', 'Stok', 'Jual/Hari', 'Sisa Hari', 'Reorder Qty', 'Status', 'Confidence'].map(h => (
                          <th key={h} style={{ padding: '0.75rem', textAlign: h === 'Nama' ? 'left' : 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.data.prediksi_stok.map((p: any, i: number) => {
                        const sc = STATUS_COLORS[p.status] || STATUS_COLORS['Tidak Bergerak'];
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #1e1e4a' }}>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', color: '#94a3b8' }}>{p.kode}</td>
                            <td style={{ padding: '0.75rem' }}>{p.nama}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{p.stok_sekarang}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.avg_daily}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.sisa_hari}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>{p.reorder_qty}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: sc.bg, color: sc.text, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{p.confidence}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──── PREDIKSI OMZET ──── */}
            {activeTab === 'prediksi-omzet' && d.data && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>Prediksi Omzet 7 Hari ke Depan</h3>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Update: {d.last_updated ? new Date(d.last_updated).toLocaleString('id-ID') : '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Model Terpilih</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#818cf8' }}>{d.data.model_used}</div>
                  </div>
                  <div style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>RMSE Test-set</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Rp {Number(d.data.rmse).toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #2d2d5f', flex: 1 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Info</div>
                    <div style={{ fontSize: '0.85rem' }}>{d.data.eval_info}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                  {d.data.predictions?.map((p: any, i: number) => (
                    <div key={i} style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #2d2d5f', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        {new Date(p.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '0.95rem' }}>
                        Rp {Number(p.prediksi_omzet).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem' }}>
                        {p.confidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──── DEMAND PRODUK ──── */}
            {activeTab === 'prediksi-demand' && d.data?.top_demand && (
              <div>
                <h3 style={{ marginTop: 0 }}>Peringkat Demand Produk (30 Hari)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#1e1e4a' }}>
                      <tr>
                        {['#', 'Kode', 'Nama', 'Qty 30H', 'Qty 30H Sebelumnya', 'Trend', 'Demand Score'].map(h => (
                          <th key={h} style={{ padding: '0.75rem', textAlign: h === 'Nama' ? 'left' : 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.data.top_demand.map((p: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1e1e4a' }}>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{i + 1}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', color: '#94a3b8' }}>{p.kode}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.nama}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.qty_30_hari}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{p.qty_prev_30_hari}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: p.trend_multiplier >= 1 ? '#4ade80' : '#fb7185' }}>
                            {p.trend_multiplier >= 1 ? '↑' : '↓'} {p.trend_multiplier}x
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#818cf8' }}>{p.demand_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ──── BONUS KASIR ──── */}
            {activeTab === 'bonus-kasir' && d.data?.kasir && (
              <div>
                <h3 style={{ marginTop: 0 }}>Skor & Tier Bonus Kasir (30 Hari)</h3>
                <div style={{ backgroundColor: '#1e1e4a', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  🏆 Skor: 50% Omzet + maks 30 poin Growth + 20% Avg Transaksi — Silver butuh omzet top-⅓ & min 5 transaksi
                </div>
                {d.data.kasir.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Belum ada transaksi 30 hari terakhir.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {d.data.kasir.map((k: any, i: number) => {
                      const tc = TIER_COLORS[k.tier] || TIER_COLORS['Tidak Memenuhi Syarat'];
                      return (
                        <div key={i} style={{ backgroundColor: '#0d0d2e', borderRadius: '8px', padding: '1.25rem', border: '1px solid #2d2d5f', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: '120px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{k.kasir_nama}</div>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: tc.bg, color: tc.text, fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {k.tier}
                            </span>
                          </div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                            {[
                              { label: 'Omzet', value: `Rp ${k.omzet.toLocaleString('id-ID')}`, color: '#60a5fa' },
                              { label: 'Avg Trx', value: `Rp ${k.avg_trx.toLocaleString('id-ID')}` , color: '#34d399' },
                              { label: 'Jml Trx', value: k.jml_trx, color: '#e2e8f0' },
                              { label: 'Growth', value: `${k.growth_pct > 0 ? '+' : ''}${k.growth_pct}%`, color: k.growth_pct >= 0 ? '#4ade80' : '#fb7185' },
                              { label: 'Skor', value: `${k.skor_total}/100`, color: '#818cf8' },
                            ].map(stat => (
                              <div key={stat.label}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stat.label}</div>
                                <div style={{ fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ──── PROMO & BUNDLING ──── */}
            {activeTab === 'promo-recommendation' && d.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Promo / Tebus Murah */}
                <div>
                  <h3 style={{ marginTop: 0, color: '#fb7185' }}>🏷️ Kandidat Promo / Tebus Murah</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '-0.5rem' }}>Produk dengan stok menumpuk dan tren penjualan lemah (&gt;45 hari estimasi habis, tren &lt;80%).</p>
                  {d.data.rekomendasi_promo.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Tidak ada kandidat promo saat ini.</p>
                  ) : d.data.rekomendasi_promo.map((p: any, i: number) => (
                    <div key={i} style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #7f1d1d', marginBottom: '0.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '180px' }}><b>{p.nama}</b> <span style={{ color: '#94a3b8' }}>({p.kode})</span></div>
                      <div style={{ color: '#94a3b8' }}>Stok: <b style={{ color: '#e2e8f0' }}>{p.stok}</b></div>
                      <div style={{ color: '#94a3b8' }}>Habis dalam: <b style={{ color: '#fca5a5' }}>{p.estimasi_habis_hari} hari</b></div>
                      <div style={{ color: '#94a3b8' }}>Tren: <b style={{ color: '#fb7185' }}>{(p.trend * 100).toFixed(0)}%</b></div>
                    </div>
                  ))}
                </div>

                {/* Upselling */}
                <div>
                  <h3 style={{ marginTop: 0, color: '#4ade80' }}>🚀 Kandidat Upselling</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '-0.5rem' }}>Produk fast-moving dengan tren penjualan naik ≥20%.</p>
                  {d.data.rekomendasi_upsell.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Tidak ada kandidat upsell saat ini.</p>
                  ) : d.data.rekomendasi_upsell.map((p: any, i: number) => (
                    <div key={i} style={{ backgroundColor: '#0d0d2e', padding: '1rem', borderRadius: '8px', border: '1px solid #14532d', marginBottom: '0.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '180px' }}><b>{p.nama}</b> <span style={{ color: '#94a3b8' }}>({p.kode})</span></div>
                      <div style={{ color: '#94a3b8' }}>Stok: <b style={{ color: '#e2e8f0' }}>{p.stok}</b></div>
                      <div style={{ color: '#94a3b8' }}>Tren: <b style={{ color: '#4ade80' }}>+{((p.trend - 1) * 100).toFixed(0)}%</b></div>
                    </div>
                  ))}
                </div>

                {/* Apriori Bundling */}
                <div>
                  <h3 style={{ marginTop: 0, color: '#818cf8' }}>📦 Rekomendasi Bundling (Apriori)</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '-0.5rem' }}>Pasangan produk yang sering dibeli bersamaan dalam 90 hari terakhir.</p>
                  {d.data.bundling_apriori.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Belum ada data bundling yang signifikan.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#1e1e4a' }}>
                          <tr>
                            {['Produk A', 'Produk B', 'Support %', 'Conf A→B %', 'Conf B→A %', 'Frekuensi'].map(h => (
                              <th key={h} style={{ padding: '0.75rem', textAlign: 'center' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.data.bundling_apriori.map((b: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1e1e4a' }}>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{b.produk_a}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{b.produk_b}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', color: '#818cf8' }}>{b.support}%</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{b.confidence_ab}%</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{b.confidence_ba}%</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{b.frekuensi}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MlPage;
