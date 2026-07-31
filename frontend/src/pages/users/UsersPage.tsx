import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/ToastContext';
import { apiFetch } from '../../lib/apiFetch';

interface User {
  id: number;
  username: string;
  nama_lengkap: string;
  role: string;
  is_active: number;
  created_at: string;
  last_login: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id: 0,
    username: '',
    nama_lengkap: '',
    role: 'kasir',
    password: '',
    is_active: 1
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [konfirmasiHapusId, setKonfirmasiHapusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const token = localStorage.getItem('token');
  // Need to parse current user ID from token to prevent self-deletion
  let currentUserId = 0;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.sub ? parseInt(payload.sub, 10) : 0;
    }
  } catch (e) {
    console.error("Gagal parsing token", e);
  }


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/users/');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.id && formData.password.length < 6) {
      setErrorMsg('Password user baru minimal 6 karakter');
      return;
    }
    if (formData.id && formData.password && formData.password.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter');
      return;
    }

    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/users/${formData.id}` : '/users/';
      
      const payload: any = { ...formData };
      if (formData.id && !formData.password) {
        delete payload.password; // Kosong = tidak ganti password
      }

      const res = await apiFetch(url, {
        method, body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Gagal menyimpan user');
      }
    } catch (e: any) {
      setErrorMsg('Terjadi kesalahan koneksi');
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUserId) {
      showToast('Tidak dapat menghapus akun yang sedang digunakan (diri sendiri).', 'warning');
      return;
    }
    setKonfirmasiHapusId(user.id);
  };

  const confirmDelete = async (userId: number) => {
    setDeletingId(userId);
    try {
      const res = await apiFetch(`/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Berhasil: ${data.message}`, 'success');
        setKonfirmasiHapusId(null);
        fetchUsers();
      } else {
        showToast(`Gagal: ${data.detail}`, 'error');
        setKonfirmasiHapusId(null);
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = () => {
    setFormData({ id: 0, username: '', nama_lengkap: '', role: 'kasir', password: '', is_active: 1 });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setFormData({
      id: u.id, username: u.username, nama_lengkap: u.nama_lengkap,
      role: u.role, password: '', is_active: u.is_active
    });
    setErrorMsg('');
    setShowModal(true);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a2a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Manajemen User</h1>
        <button onClick={openAdd}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Tambah User
        </button>
      </div>

      <div style={{ backgroundColor: '#11113a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d2d5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e1e4a' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Username</th>
              <th style={{ padding: '1rem' }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Terakhir Login</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Data kosong</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e1e4a' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  {u.username}
                  {u.id === currentUserId && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: '#1e3a5f', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#93c5fd' }}>(Anda)</span>}
                </td>
                <td style={{ padding: '1rem' }}>{u.nama_lengkap}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: u.role === 'admin' ? '#312e81' : (u.role === 'kasir' ? '#064e3b' : '#78350f'),
                    color: u.role === 'admin' ? '#c4b5fd' : (u.role === 'kasir' ? '#6ee7b7' : '#fcd34d')
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{ color: u.is_active ? '#4ade80' : '#fb7185', fontWeight: 'bold' }}>
                    {u.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum pernah'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => openEdit(u)}
                      style={{ padding: '0.4rem 0.75rem', backgroundColor: '#38bdf8', border: 'none', color: '#0f172a', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Edit
                    </button>
                    {u.id !== currentUserId && (
                      konfirmasiHapusId === u.id ? (
                        <>
                          <button onClick={() => confirmDelete(u.id)} disabled={!!deletingId}
                            style={{ padding: '0.4rem 0.75rem', backgroundColor: '#dc2626', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {deletingId === u.id ? '...' : 'Ya, Hapus'}
                          </button>
                          <button onClick={() => setKonfirmasiHapusId(null)}
                            style={{ padding: '0.4rem 0.75rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Batal
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleDelete(u)}
                          style={{ padding: '0.4rem 0.75rem', backgroundColor: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          Hapus
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: '#0d0d2e', border: '1px solid #2d2d5f', borderRadius: '12px', padding: '2rem', width: '400px', maxWidth: '90vw' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{formData.id ? 'Edit User' : 'Tambah User Baru'}</h2>
            
            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                  disabled={formData.id > 0} required minLength={3}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: formData.id ? '#1e1e4a' : '#11113a', border: '1px solid #2d2d5f', color: formData.id ? '#64748b' : 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Nama Lengkap</label>
                <input type="text" value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
                  required minLength={1}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                  Password {formData.id ? '(Kosongkan jika tidak diganti)' : ''}
                </label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!formData.id} minLength={formData.id && !formData.password ? 0 : 6}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#11113a', border: '1px solid #2d2d5f', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option value="kasir">Kasir</option>
                  <option value="gudang">Gudang</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={formData.is_active === 1} onChange={e => setFormData({...formData, is_active: e.target.checked ? 1 : 0})} 
                  disabled={formData.id === currentUserId}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: '#4f46e5' }} />
                <span style={{ color: formData.id === currentUserId ? '#64748b' : '#e2e8f0' }}>Akun Aktif (Bisa Login)</span>
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit"
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#4f46e5', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Simpan
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #2d2d5f', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
