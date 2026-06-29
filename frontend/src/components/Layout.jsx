import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/* ---- SVG icon primitives --------------------------------- */
function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
         strokeLinejoin="round" aria-hidden="true">
      {Array.isArray(d)
        ? d.map((p, i) => <path key={i} d={p} />)
        : <path d={d} />}
    </svg>
  );
}

const ICONS = {
  dashboard: ['M3 10.5L10 3l7 7.5', 'M5 9v8h4v-4h2v4h4V9'],
  patients:  'M13 7a3 3 0 11-6 0 3 3 0 016 0zM4 17c0-3.314 2.686-6 6-6s6 2.686 6 6',
  visits:    ['M6 2v4', 'M14 2v4', 'M3 8h14', 'M3 5.5h14a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1v-11a1 1 0 011-1z'],
  claims:    ['M14 2H6a1 1 0 00-1 1v14a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z', 'M8 7h4M8 11h4M8 15h2'],
  billing:   ['M12 2H8a1 1 0 00-1 1v14a1 1 0 001 1h9a1 1 0 001-1V7z', 'M12 2v5h5', 'M9 12h6M9 16h4'],
  payments:  ['M3 10h14', 'M3 6.5h14a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1z', 'M6 13.5h2'],
  settings:  ['M10 13a3 3 0 100-6 3 3 0 000 6z',
              'M17.7 10c0-.34-.03-.67-.07-1l1.53-1.37-1.5-2.6-1.95.66a7 7 0 00-1.73-1L13.5 3h-3l-.48 1.69a7 7 0 00-1.73 1L6.34 5.03l-1.5 2.6 1.53 1.37A7.5 7.5 0 006.3 10c0 .34.03.67.07 1L4.84 12.37l1.5 2.6 1.95-.66a7 7 0 001.73 1L10.5 17h3l.48-1.69a7 7 0 001.73-1l1.95.66 1.5-2.6-1.53-1.37c.04-.33.07-.66.07-1z'],
  audit:     ['M9 5H7a1 1 0 00-1 1v11a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1h-2',
              'M9 5a1 1 0 001 1h4a1 1 0 001-1V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v2z',
              'M9 12h6M9 16h4'],
  search:    ['M17 17l-4-4', 'M11 6a5 5 0 100 10A5 5 0 0011 6z'],
  command:   ['M5 5a1 1 0 011-1h2a1 1 0 010 2H7v2a1 1 0 01-2 0V6a1 1 0 010-1z',
              'M15 5a1 1 0 00-1-1h-2a1 1 0 000 2h1v2a1 1 0 002 0V6a1 1 0 000-1z',
              'M5 15a1 1 0 001 1h2a1 1 0 000-2H7v-2a1 1 0 00-2 0v2a1 1 0 000 1z',
              'M15 15a1 1 0 01-1 1h-2a1 1 0 010-2h1v-2a1 1 0 012 0v2a1 1 0 010 1z'],
  help:      ['M10 18a8 8 0 100-16 8 8 0 000 16z', 'M10 14v.01', 'M10 11a2 2 0 10-2-2 2 2 0 012 2 .4.4 0 010 .8'],
  ia:        ['M10 3L3 8.5V17h5v-5h4v5h5V8.5z'],
  close:     'M6 6l8 8M14 6l-8 8',
};

function NavIcon({ name }) {
  const d = ICONS[name] || ICONS.dashboard;
  return (
    <span className="nav-icon">
      <Icon d={d} size={17} />
    </span>
  );
}

/* ---- Topbar logo mark ------------------------------------ */
function LogoMark() {
  return (
    <div className="topbar-logo" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" opacity="0.7" />
        <rect x="2" y="9" width="5" height="5" rx="1" opacity="0.7" />
        <rect x="9" y="9" width="5" height="5" rx="1" opacity="0.4" />
      </svg>
    </div>
  );
}

/* ---- Nav item helper ------------------------------------- */
function SideNavItem({ to, icon, label, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}
      end={to === '/'}
    >
      <NavIcon name={icon} />
      {label}
      {count != null && <span className="nav-badge">{count}</span>}
    </NavLink>
  );
}

/* ---- Layout ---------------------------------------------- */
export default function Layout() {
  const navigate = useNavigate();

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate('/patients?q=' + encodeURIComponent(e.target.value.trim()));
    }
  }

  return (
    <div className="layout">
      {/* ---- Topbar ---- */}
      <header className="topbar" role="banner">
        <div className="topbar-brand">
          <LogoMark />
          <span className="topbar-appname">ClinicTraq</span>
        </div>

        <div className="topbar-workspace" title="Workspace · Environment">
          <span className="topbar-workspace-dot" aria-hidden="true" />
          Apex Family Care &middot; Production
        </div>

        <div className="topbar-search" role="search">
          <span className="topbar-search-icon">
            <Icon d={ICONS.search} size={14} />
          </span>
          <input
            type="search"
            placeholder="Search patients, claims, visits…"
            aria-label="Global search"
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div className="topbar-actions">
          <button className="btn ghost sm" aria-label="Command palette" title="Command palette (⌘K)">
            <Icon d={ICONS.command} size={14} />
            Command
          </button>
          <button className="btn-icon" aria-label="Help">
            <Icon d={ICONS.help} size={16} />
          </button>
          <button className="btn-icon" aria-label="AI Assistant">
            <Icon d={ICONS.ia} size={16} />
          </button>
        </div>
      </header>

      {/* ---- Sidebar ---- */}
      <nav className="side" aria-label="Main navigation">
        <div className="side-section">
          <SideNavItem to="/"          icon="dashboard" label="Dashboard" />
          <SideNavItem to="/patients"  icon="patients"  label="Patients" />
          <SideNavItem to="/visits"    icon="visits"    label="Visits" />
          <SideNavItem to="/claims"    icon="claims"    label="Claims" />
          <SideNavItem to="/billing"   icon="billing"   label="Billing" />
          <SideNavItem to="/payments"  icon="payments"  label="Payments" />
        </div>

        <div className="side-divider" />

        <div className="side-bottom">
          <SideNavItem to="/settings"  icon="settings"  label="Settings" />
          <SideNavItem to="/audit"     icon="audit"     label="Audit log" />
        </div>
      </nav>

      {/* ---- Main content ---- */}
      <main className="main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
