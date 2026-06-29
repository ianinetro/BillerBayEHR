import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ToastProvider } from './components/Toast.jsx';

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
  return (
    <div style={{ padding: '48px 32px', color: 'var(--slate)' }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<PageFallback />}><Dashboard /></Suspense>
          } />
          <Route path="patients" element={
            <Suspense fallback={<PageFallback />}><Patients /></Suspense>
          } />
          <Route path="patients/:id" element={
            <Suspense fallback={<PageFallback />}><PatientDetail /></Suspense>
          } />
          <Route path="visits" element={
            <Suspense fallback={<PageFallback />}><Visits /></Suspense>
          } />
          <Route path="visits/:id" element={
            <Suspense fallback={<PageFallback />}><VisitDetail /></Suspense>
          } />
          <Route path="claims" element={
            <Suspense fallback={<PageFallback />}><Claims /></Suspense>
          } />
          <Route path="claims/:id" element={
            <Suspense fallback={<PageFallback />}><ClaimDetail /></Suspense>
          } />
          <Route path="billing" element={
            <Suspense fallback={<PageFallback />}><Billing /></Suspense>
          } />
          <Route path="payments" element={
            <Suspense fallback={<PageFallback />}><Payments /></Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<PageFallback />}><Settings /></Suspense>
          } />
          <Route path="audit" element={
            <Suspense fallback={<PageFallback />}><Audit /></Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
