import React, { useState, useEffect } from 'react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiredWarning, setExpiredWarning] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('auth_expired')) {
      setExpiredWarning(true);
      sessionStorage.removeItem('auth_expired');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMsg(data.detail || 'Login gagal.');
      } else {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to dashboard or appropriate page
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a2a', // Deep Navy background
      color: '#e2e8f0',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: '#11113a',
        padding: '2.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>◈ SUPER APP</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>Masuk untuk melanjutkan</p>
        </div>
        
        {expiredWarning && (
          <div style={{
            backgroundColor: '#2e1d0d', border: '1px solid #78350f', color: '#fb923c',
            padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <span>⚠</span>
            <span>Sesi habis atau tidak valid. Silakan login ulang.</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
            <input 
              type="text" 
              placeholder="Masukkan username..." 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1e1e4a',
                border: '1px solid #2d2d5f',
                borderRadius: '4px',
                color: 'white',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password..." 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  backgroundColor: '#1e1e4a',
                  border: '1px solid #2d2d5f',
                  borderRadius: '4px',
                  color: 'white',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          
          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          Hubungi admin jika lupa password
        </div>
      </div>
    </div>
  );
};

export default Login;
