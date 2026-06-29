import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) { setError('Username and password are required.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/auth/token/', { username: form.username, password: form.password });
      localStorage.setItem('ct_access_token', res.data.access);
      localStorage.setItem('ct_refresh_token', res.data.refresh);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Check username and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink)',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 12, padding: '40px 36px', width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
            BillerBay ClinicTraq
          </div>
          <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>
            Sign in to your billing workspace
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert danger" style={{ marginBottom: 16 }}>{error}</div>
          )}
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Username</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoFocus
              autoComplete="username"
              placeholder="billinguser"
            />
          </div>
          <div className="field" style={{ marginBottom: 20 }}>
            <label>Password</label>
            <input
              className="input"
              style={{ width: '100%' }}
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', padding: '10px 0', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
