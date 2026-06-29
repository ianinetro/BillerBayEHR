import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client.js';

const FEATURES = [
  'Full-cycle medical billing from charge entry to remittance posting.',
  'ERA auto-post, claim validation, and 837P EDI generation built in.',
  'Role-based access with full audit logs on every action.',
];

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00CBDE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BABACE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';
  const reason = searchParams.get('reason');
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ username, password }) => {
    setServerError('');
    try {
      const { data } = await client.post('/auth/token/', { username, password });
      localStorage.setItem('ct_access_token', data.access);
      localStorage.setItem('ct_refresh_token', data.refresh);
      navigate(from, { replace: true });
    } catch (e) {
      setServerError(e.response?.data?.detail || 'Invalid credentials. Check username and password.');
    }
  };

  return (
    <div style={{ display: 'grid', minHeight: '100dvh', gridTemplateColumns: 'clamp(0px, 45vw, 520px) 1fr' }}>
      {/* Left — brand panel */}
      <aside style={{
        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden', background: '#12122C', padding: 40, color: 'white',
      }}>
        <div style={{
          pointerEvents: 'none', position: 'absolute', right: -96, top: -96,
          width: 420, height: 420, borderRadius: '50%', opacity: 0.2,
          filter: 'blur(64px)', background: 'radial-gradient(circle, #3F4CFF 0%, transparent 70%)',
        }} aria-hidden="true" />
        <div style={{
          pointerEvents: 'none', position: 'absolute', bottom: -128, left: -64,
          width: 360, height: 360, borderRadius: '50%', opacity: 0.15,
          filter: 'blur(64px)', background: 'radial-gradient(circle, #00CBDE 0%, transparent 70%)',
        }} aria-hidden="true" />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3F4CFF, #00CBDE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: 'white',
          }}>B</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>BillerBay</span>
        </div>

        <div style={{ position: 'relative', maxWidth: 400 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#00CBDE', margin: 0 }}>
            ClinicTraq EHR
          </p>
          <h1 style={{ marginTop: 12, fontSize: 30, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px', margin: '12px 0 0' }}>
            Billing-first practice management for independent practices.
          </h1>
          <ul style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, padding: 0, listStyle: 'none' }}>
            {FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ marginTop: 1, flexShrink: 0 }}><ShieldIcon /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Access is restricted to authorized users. All sessions and actions are logged.
        </p>
      </aside>

      {/* Right — form panel */}
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F2F2F8', padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 24, fontWeight: 650, letterSpacing: '-0.3px', color: '#12122C', margin: '0 0 6px' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: '#676687', margin: '0 0 28px' }}>
            Use your ClinicTraq account to access the billing dashboard.
          </p>

          <div style={{
            borderRadius: 12, border: '1px solid #E3E3F1', background: 'white',
            padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
          }}>
            {reason === 'timeout' && (
              <div style={{ fontSize: 14, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                You were signed out due to inactivity.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="username" style={{ fontSize: 13, fontWeight: 500, color: '#12122C' }}>Username</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="billinguser"
                  style={{
                    width: '100%', borderRadius: 4, border: `1px solid ${errors.username ? '#DC2626' : '#BABACE'}`,
                    background: 'white', padding: '8px 12px', fontSize: 14, color: '#12122C',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  {...register('username', { required: 'Username is required.' })}
                />
                {errors.username && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{errors.username.message}</p>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: '#12122C' }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 12, display: 'flex', pointerEvents: 'none' }}><LockIcon /></span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    style={{
                      width: '100%', borderRadius: 4, border: `1px solid ${errors.password ? '#DC2626' : '#BABACE'}`,
                      background: 'white', padding: '8px 40px 8px 36px', fontSize: 14, color: '#12122C',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    {...register('password', { required: 'Password is required.' })}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#BABACE', display: 'flex', padding: 0 }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{errors.password.message}</p>}
              </div>

              {serverError && (
                <div style={{ fontSize: 14, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px' }}>
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 44, width: '100%', borderRadius: 8, border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  background: isSubmitting ? '#9fa0bd' : 'linear-gradient(135deg, #3F4CFF, #2d3bef)',
                  color: 'white', fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
                  transition: 'opacity 0.15s',
                }}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9FA0BD' }}>
            Trouble signing in? Email{' '}
            <span style={{ fontWeight: 500, color: '#676687', userSelect: 'all' }}>support@billerbay.com</span>
          </p>
        </div>
      </main>
    </div>
  );
}
