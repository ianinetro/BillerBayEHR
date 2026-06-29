import React from 'react';

/**
 * Reusable page header + content wrapper.
 *
 * Props:
 *   eyebrow  - small label above the title (e.g. "EHR / PM")
 *   title    - page heading
 *   desc     - optional subtitle / description
 *   actions  - React node rendered in the top-right action area
 *   children - page body content
 *   noPad    - if true, removes padding from the body (e.g. full-bleed tables)
 */
export default function PageShell({ eyebrow, title, desc, actions, children, noPad }) {
  return (
    <>
      <header className="page-shell-header">
        <div className="page-shell-top-row">
          <div>
            {eyebrow && (
              <p className="page-shell-eyebrow">{eyebrow}</p>
            )}
            <h1 className="page-shell-title">{title}</h1>
            {desc && (
              <p className="page-shell-desc">{desc}</p>
            )}
          </div>
          {actions && (
            <div className="page-shell-actions">{actions}</div>
          )}
        </div>
      </header>
      <div className={noPad ? '' : undefined}>
        {children}
      </div>
    </>
  );
}
