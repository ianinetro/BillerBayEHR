import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ToastProvider } from './components/Toast.jsx';

const Login       = lazy(() => import('./pages/Login.jsx'));
const Dashboard   = lazy(() => import('./pages/Dashboard.jsx'));
const Patients    = lazy(() => import('./pages/Patients.jsx'));
const PatientDetail = lazy(() => import('./pages/PatientDetail.jsx'));
const Visits      = lazy(() => import('./pages/Visits.jsx'));
const VisitDetail = lazy(() => import('./pages/VisitDetail.jsx'));
const Claims      = lazy(() => import('./pages/Claims.jsx'));
const ClaimDetail = lazy(() => import('./pages/ClaimDetail.jsx'));
const Billing     = lazy(() => import('./pages/Billing.jsx'));
const Payments    = lazy(() => import('./pages/Payments.jsx'));
const Settings    = lazy(() => import('./pages/Settings.jsx'));
const Audit       = lazy(() => import('./pages/Audit.jsx'));

function PageFallback() {
  return <div style={{ padding: '48px 32px', color: 'var(--slate)' }}>Loading…</div>;
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('ct_access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function S(Component) {
  return (
    <RequireAuth>
      <Suspense fallback={<PageFallback />}>
        <Component />
      </Suspense>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageFallback />}><Login /></Suspense>
        } />
        <Route path="/" element={
          <RequireAuth><Layout /></RequireAuth>
        }>
          <Route index element={S(Dashboard)} />
          <Route path="patients" element={S(Patients)} />
          <Route path="patients/:id" element={S(PatientDetail)} />
          <Route path="visits" element={S(Visits)} />
          <Route path="visits/:id" element={S(VisitDetail)} />
          <Route path="claims" element={S(Claims)} />
          <Route path="claims/:id" element={S(ClaimDetail)} />
          <Route path="billing" element={S(Billing)} />
          <Route path="payments" element={S(Payments)} />
          <Route path="settings" element={S(Settings)} />
          <Route path="audit" element={S(Audit)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
