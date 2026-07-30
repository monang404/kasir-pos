import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface Stats {
  omzet: number;
  laba_kotor: number;
  pengeluaran: number;
  laba_bersih: number;
  jumlah_transaksi: number;
}

interface Growth {
  omzet: number | null;
  profit: number | null;
  transaksi: number | null;
}

interface RecentTrx {
  id: number;
  kode: string;
  tanggal: string;
  total: number;
  kasir_nama: string;
}

interface LowStock {
  id: number;
  kode: string;
  nama: string;
  stok: number;
}

const COLORS = {
  pie: {
    laba_bersih: '#22c55e',
    hpp: '#3b82f6',
    tinta: '#f59e0b',
    pengeluaran: '#f43f5e'
  },
  bar: {
    omzet: '#6366f1',
    profit: '#10b981'
  }
};

const DashboardPage: React.FC = () => {
  const [bulanFilter, setBulanFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [statsData, setStatsData] = useState<{ stats: Stats; growth: Growth; recent_transaksi: RecentTrx[]; low_stock: LowStock[] } | null>(null);
  const [chartsData, setChartsData] = useState<{ chart_12_bulan: any[]; pie_komposisi: any; chart_7_hari: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        fetch(`http://localhost:8000/dashboard/stats?bulan=${bulanFilter}`, { headers }),
        fetch(`http://localhost:8000/dashboard/charts`, { headers })
      ]);

      if (statsRes.ok && chartsRes.ok) {
        setStatsData(await statsRes.json());
        setChartsData(await chartsRes.json());
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [bulanFilter]);

  const renderGrowth = (value: number | null) => {
    if (value === null) return <span style={{ color: '#94a3b8' }}>-</span>;
    if (value > 0) return <span style={{ color: '#4ade80' }}>↑ {value.toFixed(1)}%</span>;
    if (value < 0) return <span style={{ color: '#f87171' }}>↓ {Math.abs(value).toFixed(1)}%</span>;
    return <span style={{ color: '#94a3b8' }}>= 0%</span>;
  };

  const getPieData = () => {
    if (!chartsData) return [];
    const p = chartsData.pie_komposisi;
    if (p.laba_bersih === 0 && p.hpp === 0 && p.tinta === 0 && p.pengeluaran === 0) {
      return [{ name: 'Data Kosong', value: 1, fill: '#374151' }];
    }
    return [
      { name: 'Laba Bersih', value: p.laba_bersih, fill: COLORS.pie.laba_bersih },
      { name: 'HPP', value: p.hpp, fill: COLORS.pie.hpp },
      { name: 'Tinta', value: p.tinta, fill: COLORS.pie.tinta },
      { name: 'Pengeluaran', value: p.pengeluaran, fill: COLORS.pie.pengeluaran },
    ].filter(d => d.value > 0);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Update terakhir: {lastRefreshed.toLocaleTimeString('id-ID')}
          </div>
        </div>
        <input
          type="month"
          value={bulanFilter}
          onChange={e => setBulanFilter(e.target.value)}
          style={{ padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px' }}
        />
      </div>

      {isLoading && (!statsData || !chartsData) ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Dashboard...</div>
      ) : (
        <>
          {/* STAT CARDS */}
          {statsData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Omzet ({bulanFilter})</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', margin: '0.5rem 0' }}>
                  Rp {statsData.stats.omzet.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  vs bln lalu: {renderGrowth(statsData.growth.omzet)}
                </div>
              </div>
              
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Laba Bersih ({bulanFilter})</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', margin: '0.5rem 0' }}>
                  Rp {statsData.stats.laba_bersih.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  vs bln lalu: {renderGrowth(statsData.growth.profit)}
                </div>
              </div>

              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f43f5e' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Pengeluaran</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fb7185', margin: '0.5rem 0' }}>
                  Rp {statsData.stats.pengeluaran.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.75rem' }}>&nbsp;</div>
              </div>

              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Transaksi</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  {statsData.stats.jumlah_transaksi}
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  vs bln lalu: {renderGrowth(statsData.growth.transaksi)}
                </div>
              </div>
            </div>
          )}

          {/* CHARTS */}
          {chartsData && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Omzet vs Profit (12 Bulan Terakhir)</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.chart_12_bulan} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d5f" vertical={false} />
                      <XAxis dataKey="bulan" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={v => `Rp ${v.toLocaleString('id-ID')}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0d0d2e', borderColor: '#2d2d5f' }} />
                      <Legend />
                      <Bar dataKey="omzet" name="Omzet" fill={COLORS.bar.omzet} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit_bersih" name="Laba Bersih" fill={COLORS.bar.profit} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Komposisi Bulan Ini</h3>
                <div style={{ flex: 1, minHeight: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={getPieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0d0d2e', borderColor: '#2d2d5f' }} formatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* LOWER PANELS */}
          {statsData && chartsData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              
              {/* OMZET 7 HARI TERAKHIR */}
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Omzet 7 Hari Terakhir</h3>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartsData.chart_7_hari} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d5f" vertical={false} />
                      <XAxis dataKey="tanggal" stroke="#94a3b8" tickFormatter={t => t.substring(5)} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#0d0d2e', borderColor: '#2d2d5f' }} />
                      <Line type="monotone" dataKey="omzet" name="Omzet" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* TRANSAKSI TERBARU */}
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Transaksi Terbaru</h3>
                {statsData.recent_transaksi.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Belum ada transaksi.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {statsData.recent_transaksi.map(trx => (
                      <li key={trx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #1e1e4a' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{trx.kode}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{trx.kasir_nama} • {new Date(trx.tanggal).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#4ade80' }}>
                          Rp {trx.total.toLocaleString('id-ID')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* STOK HAMPIR HABIS */}
              <div style={{ backgroundColor: '#11113a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2d2d5f' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Stok Hampir Habis</h3>
                {statsData.low_stock.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Semua stok aman.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {statsData.low_stock.map(p => (
                      <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #1e1e4a' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{p.nama}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.kode}</div>
                        </div>
                        <div style={{ 
                          fontWeight: 'bold',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: p.stok <= 5 ? '#7f1d1d' : '#92400e',
                          color: p.stok <= 5 ? '#fca5a5' : '#fcd34d',
                          alignSelf: 'center'
                        }}>
                          {p.stok}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
