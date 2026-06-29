import React from 'react';

/* ---- Status → badge variant mapping --------------------- */
const STATUS_MAP = {
  // success
  'active':               'success',
  'paid':                 'success',
  'accepted':             'success',
  'passed':               'success',
  'reconciled':           'success',
  'ready for billing':    'success',
  'posted':               'success',

  // warn
  'needs review':             'warn',
  'missing diagnosis':        'warn',
  'missing insurance':        'warn',
  'partially paid':           'warn',
  'posted with warnings':     'warn',
  'awaiting batch':           'warn',

  // danger
  'rejected':            'dangerB',
  'validation failed':   'dangerB',
  'blocking':            'dangerB',
  'inactive':            'dangerB',
  'failed':              'dangerB',
  'overdue':             'dangerB',
  'unmatched':           'dangerB',

  // info
  'submitted':                   'infoB',
  'in progress':                 'infoB',
  'primary claim submitted':     'infoB',
  'ready to submit':             'infoB',

  // neutral
  'draft':         'neutral',
  'needs run':     'neutral',
  'not submitted': 'neutral',

  // blue
  'billed':        'blueB',
  'voided':        'neutral',
};

/**
 * <Badge status="Paid" />
 * <Badge status="Rejected" />
 *
 * Falls back to neutral for unknown statuses.
 */
export default function Badge({ status, className = '' }) {
  const key = (status || '').toLowerCase().trim();
  const variant = STATUS_MAP[key] || 'neutral';
  return (
    <span
      className={['badge', variant, className].filter(Boolean).join(' ')}
      title={status}
    >
      {status}
    </span>
  );
}

/** Convenience: returns just the CSS class name for a status string */
export function badgeVariant(status) {
  const key = (status || '').toLowerCase().trim();
  return STATUS_MAP[key] || 'neutral';
}
