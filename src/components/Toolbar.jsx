import React, { useEffect, useState, useRef } from 'react';
import './Toolbar.css';
import pkg from '../../package.json';

const STORAGE_KEY = 'jow.selectedBackground';
const BG_SCALE_KEY = 'jow.selectedBackgroundScale';
const PANEL_COLORS_KEY = 'jow.panelColors';
const LAYOUT_KEYS = {
  cardPercent: 'jow.layout.cardPercent',
  logoPercent: 'jow.layout.logoPercent',
  logoPaddingPercent: 'jow.layout.logoPaddingPercent',
  edgePaddingPercent: 'jow.layout.edgePaddingPercent',
  toolbarGapPercent: 'jow.layout.toolbarGapPercent',
  logoPanelPaddingPercent: 'jow.layout.logoPanelPaddingPercent',
  bottomPadding: 'jow.layout.bottomPadding',
  cardarcToolbarGap: 'jow.layout.cardarcToolbarGap'
};

const SECTIONS = [
  { id: 'about-us', label: 'About Us' },
  { id: 'author', label: 'Author' },
  { id: 'services', label: 'Services' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'shop', label: 'Store' },
];

const Toolbar = () => {
  // top-level open state for the dropdown
  const [open, setOpen] = useState(false);

  // section collapses
  const [bgOpen, setBgOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  // effects UI removed

  const [currentBg, setCurrentBg] = useState(null);
  const [panelColors, setPanelColors] = useState({});
  const [logoSettings, setLogoSettings] = useState({
    baseSize: 120, verticalOffset: 0, innerScale: 1, baseMultiplier: 1.3, gap: -420, yAdjust: 0
  });

  // visibility controls (persisted)
  const [showCardArc, setShowCardArc] = useState(() => {
    try { const v = localStorage.getItem('jow.ui.showCardArc'); return v == null ? true : v === 'true'; } catch { return true; }
  });
  const [showInfoPanel, setShowInfoPanel] = useState(() => {
    try { const v = localStorage.getItem('jow.ui.showInfoPanel'); return v == null ? true : v === 'true'; } catch { return true; }
  });

  const menuRef = useRef(null);

  // CardArc toolbar gap (px)
  const [cardarcToolbarGap, setCardarcToolbarGap] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.cardarcToolbarGap');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--cardarc-toolbar-gap');
      if (cs) return Number(cs.replace('px','')) || 12;
    } catch {}
    return 12;
  });

  const setCardArcGap = (v) => {
    const n = Number(v) || 0;
    setCardarcToolbarGap(n);
    try { localStorage.setItem('jow.layout.cardarcToolbarGap', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--cardarc-toolbar-gap', `${n}px`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const buildDefaultsObject = () => {
    const pc = (() => { try { return JSON.parse(localStorage.getItem(PANEL_COLORS_KEY) || '{}'); } catch { return {}; } })();
    const logo = (() => { try { return JSON.parse(localStorage.getItem('jow.logoSettings') || '{}'); } catch { return {}; } })();
    const selectedBg = (() => { try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; } })();
    const bgScale = (() => { try { return localStorage.getItem(BG_SCALE_KEY) || null; } catch { return null; } })();
    const layout = {
      cardPercent: localStorage.getItem(LAYOUT_KEYS.cardPercent) || getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent') || null,
      logoPercent: localStorage.getItem(LAYOUT_KEYS.logoPercent) || getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent') || null,
      logoPaddingPercent: localStorage.getItem(LAYOUT_KEYS.logoPaddingPercent) || getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent') || null,
      edgePaddingPercent: localStorage.getItem(LAYOUT_KEYS.edgePaddingPercent) || getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent') || null,
      toolbarGapPercent: localStorage.getItem(LAYOUT_KEYS.toolbarGapPercent) || getComputedStyle(document.documentElement).getPropertyValue('--layout-toolbar-gap-percent') || null,
      bottomPadding: localStorage.getItem(LAYOUT_KEYS.bottomPadding) || getComputedStyle(document.documentElement).getPropertyValue('--cardarc-bottom-padding') || null,
    };
    // normalize values to numbers where appropriate
    Object.keys(layout).forEach(k => { if (layout[k] != null) { const n = Number(layout[k]); if (!Number.isNaN(n)) layout[k] = n; } });

    return {
      panelColors: pc,
      logoSettings: logo,
      selectedBackground: selectedBg,
      backgroundScale: bgScale ? Number(bgScale) : undefined,
      layout
    };
  };

  const exportDefaults = () => {
    try {
      const obj = buildDefaultsObject();
      // Force the exported selectedBackground to the stable public asset
      try { obj.selectedBackground = '/assets/19.png'; } catch {}
      const data = JSON.stringify(obj, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'layout-defaults.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // noop
    }
  };

  // Hydrate state and CSS vars from localStorage on mount
  useEffect(() => {
    try {
      // Force background #19 as the site default (stable public asset)
      const bg = '/assets/19.png';
      try { document.documentElement.style.setProperty('--page-bg', `url('${bg}')`); } catch {}
      try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, bg); } catch {}
      setCurrentBg(bg);
    } catch {}

    try {
      const pc = JSON.parse(localStorage.getItem(PANEL_COLORS_KEY) || '{}');
      setPanelColors(pc);
      if (pc._parent) document.documentElement.style.setProperty('--panel-bg', pc._parent);
      if (pc._toolbar) document.documentElement.style.setProperty('--toolbar-bg', pc._toolbar);
      if (pc._logo) document.documentElement.style.setProperty('--logo-bg', pc._logo);
      Object.keys(pc).forEach(k => {
        if (!k.startsWith('_')) document.documentElement.style.setProperty(`--panel-bg-${k}`, pc[k]);
      });
    } catch {}

    try {
      const ls = JSON.parse(localStorage.getItem('jow.logoSettings') || '{}');
      const merged = {
        baseSize: typeof ls.baseSize === 'number' ? ls.baseSize : 120,
        verticalOffset: typeof ls.verticalOffset === 'number' ? ls.verticalOffset : 0,
        innerScale: typeof ls.innerScale === 'number' ? ls.innerScale : 1,
        baseMultiplier: typeof ls.baseMultiplier === 'number' ? ls.baseMultiplier : 1.3,
        gap: typeof ls.gap === 'number' ? ls.gap : -420,
        yAdjust: typeof ls.yAdjust === 'number' ? ls.yAdjust : 0,
      };
      setLogoSettings(merged);
      document.documentElement.style.setProperty('--logo-base-size', `${merged.baseSize}px`);
      document.documentElement.style.setProperty('--logo-vertical-offset', `${merged.verticalOffset}px`);
      document.documentElement.style.setProperty('--logo-inner-scale', `${merged.innerScale}`);
      document.documentElement.style.setProperty('--base-logo-base-multiplier', String(merged.baseMultiplier));
      document.documentElement.style.setProperty('--base-logo-gap', `${merged.gap}px`);
      document.documentElement.style.setProperty('--base-logo-y-adjust', `${merged.yAdjust}px`);
    } catch {}

    // ensure layout defaults exist and migrate legacy toolbarGap
    try {
      const lp = localStorage.getItem(LAYOUT_KEYS.cardPercent);
      if (lp) document.documentElement.style.setProperty('--layout-card-percent', lp);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent')) document.documentElement.style.setProperty('--layout-card-percent', '22');
    } catch {}

    try {
      const lp2 = localStorage.getItem(LAYOUT_KEYS.logoPercent);
      if (lp2) document.documentElement.style.setProperty('--layout-logo-percent', lp2);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent')) document.documentElement.style.setProperty('--layout-logo-percent', '8');
    } catch {}

    try {
      const lp3 = localStorage.getItem(LAYOUT_KEYS.logoPaddingPercent);
      if (lp3) document.documentElement.style.setProperty('--layout-logo-padding-percent', lp3);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent')) document.documentElement.style.setProperty('--layout-logo-padding-percent', '6');
    } catch {}

    try {
      const lp4 = localStorage.getItem(LAYOUT_KEYS.edgePaddingPercent);
      if (lp4) document.documentElement.style.setProperty('--layout-edge-padding-percent', lp4);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent')) document.documentElement.style.setProperty('--layout-edge-padding-percent', '4');
    } catch {}

    // toolbar gap percent fallback handling
    try {
      const tgPercent = localStorage.getItem(LAYOUT_KEYS.toolbarGapPercent);
      if (tgPercent) document.documentElement.style.setProperty('--layout-toolbar-gap-percent', tgPercent);
      else {
        const legacyTg = localStorage.getItem('jow.layout.toolbarGap');
        if (legacyTg) document.documentElement.style.setProperty('--cardarc-toolbar-gap', legacyTg);
        else if (!getComputedStyle(document.documentElement).getPropertyValue('--cardarc-toolbar-gap')) document.documentElement.style.setProperty('--cardarc-toolbar-gap', '8');
      }
    } catch {}

    try {
      const bp = localStorage.getItem(LAYOUT_KEYS.bottomPadding);
      if (bp) document.documentElement.style.setProperty('--cardarc-bottom-padding', bp);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--cardarc-bottom-padding')) document.documentElement.style.setProperty('--cardarc-bottom-padding', '12');
    } catch {}
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (ev) => {
      if (menuRef.current && !menuRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggleMenu = () => setOpen(o => !o);

  const selectBackground = (_src) => {
    // background is hard-coded to /assets/19.png; ignore attempts to change it
    const bg = '/assets/19.png';
    try { document.documentElement.style.setProperty('--page-bg', `url('${bg}')`); } catch {}
    try { localStorage.setItem(STORAGE_KEY, bg); } catch {}
    setCurrentBg(bg);
    setOpen(false);
  };

  const setColorFor = (id, color) => {
    const next = { ...panelColors, [id]: color };
    setPanelColors(next);
    try { localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next)); } catch {}
    try { document.documentElement.style.setProperty(`--panel-bg-${id}`, color); } catch {}
  };

  const setToolbarColor = (color) => {
    const next = { ...panelColors, _toolbar: color };
    setPanelColors(next);
    try { localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next)); } catch {}
    try { document.documentElement.style.setProperty('--toolbar-bg', color); } catch {}
  };

  const setLogoColor = (color) => {
    const next = { ...panelColors, _logo: color };
    setPanelColors(next);
    try { localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next)); } catch {}
    try { document.documentElement.style.setProperty('--logo-bg', color); } catch {}
  };

  const setParentColor = (color) => {
    const next = { ...panelColors, _parent: color };
    setPanelColors(next);
    try { localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next)); } catch {}
    try { document.documentElement.style.setProperty('--panel-bg', color); } catch {}
  };

  const saveLogoSettings = (next) => {
    setLogoSettings(next);
    try { localStorage.setItem('jow.logoSettings', JSON.stringify(next)); } catch {}
    try { document.documentElement.style.setProperty('--logo-base-size', `${next.baseSize}px`); } catch {}
    try { document.documentElement.style.setProperty('--logo-vertical-offset', `${next.verticalOffset}px`); } catch {}
    try { document.documentElement.style.setProperty('--logo-inner-scale', `${next.innerScale}`); } catch {}
    if (typeof next.baseMultiplier === 'number') try { document.documentElement.style.setProperty('--base-logo-base-multiplier', String(next.baseMultiplier)); } catch {}
    if (typeof next.gap === 'number') try { document.documentElement.style.setProperty('--base-logo-gap', `${next.gap}px`); } catch {}
    if (typeof next.yAdjust === 'number') try { document.documentElement.style.setProperty('--base-logo-y-adjust', `${next.yAdjust}px`); } catch {}
  };
  

  const toggleShowCardArc = (v) => {
    try { localStorage.setItem('jow.ui.showCardArc', String(v)); } catch {}
    setShowCardArc(v);
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const toggleShowInfoPanel = (v) => {
    try { localStorage.setItem('jow.ui.showInfoPanel', String(v)); } catch {}
    setShowInfoPanel(v);
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  return (
    <header className="toolbar">
      <div className="toolbar-inner">
  <div className="toolbar-title">Jewells of Wisdom <span className="toolbar-version">v{pkg.version}</span></div>
        <nav className="toolbar-menu" ref={menuRef}>
          <button className="menu-icon" aria-label="Open menu" onClick={toggleMenu}>
            <span></span><span></span><span></span>
          </button>

          {open && (
            <div className="toolbar-dropdown" role="menu" aria-label="Toolbar controls">

              {/* Backgrounds removed — background #19 is hard-coded */}

              {/* Panel colors */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setColorsOpen(v => !v)} aria-expanded={colorsOpen}>
                  <div className="dropdown-title">Panel colors</div>
                  <div className={`chev ${colorsOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${colorsOpen ? 'open' : ''}`}>
                  <div className="panel-color-grid">
                    <label className="panel-color-row">
                      <span className="panel-color-label">Parent panel</span>
                      <input type="color" value={panelColors._parent || '#ffffff'} onChange={(e) => setParentColor(e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Toolbar</span>
                      <input type="color" value={panelColors._toolbar || '#ffffff'} onChange={(e) => setToolbarColor(e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Logo</span>
                      <input type="color" value={panelColors._logo || '#ffffff'} onChange={(e) => setLogoColor(e.target.value)} />
                    </label>
                    {SECTIONS.map(s => (
                      <label key={s.id} className="panel-color-row">
                        <span className="panel-color-label">{s.label}</span>
                        <input type="color" value={panelColors[s.id] || '#ffffff'} onChange={(e) => setColorFor(s.id, e.target.value)} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shop controls (subset) */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setShopOpen(v => !v)} aria-expanded={shopOpen}>
                  <div className="dropdown-title">Shop controls</div>
                  <div className={`chev ${shopOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${shopOpen ? 'open' : ''}`}>
                  <div className="panel-color-grid">
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Books button</span>
                      <input type="color" value={panelColors['shop-cat-books'] || '#ffffff'} onChange={(e) => setColorFor('shop-cat-books', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - T-Shirts button</span>
                      <input type="color" value={panelColors['shop-cat-shirts'] || '#ffffff'} onChange={(e) => setColorFor('shop-cat-shirts', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Stickers button</span>
                      <input type="color" value={panelColors['shop-cat-stickers'] || '#ffffff'} onChange={(e) => setColorFor('shop-cat-stickers', e.target.value)} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo controls removed — positioning is handled by CSS and layout code. */}

              {/* Toolbar visibility toggles (CardArc / InfoPanel) */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setToolbarOpen(v => !v)} aria-expanded={toolbarOpen}>
                  <div className="dropdown-title">Toolbar</div>
                  <div className={`chev ${toolbarOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${toolbarOpen ? 'open' : ''}`}>
                  <div className="toolbar-controls-grid">
                    <label className="toolbar-control-row">
                      <input type="checkbox" checked={showCardArc} onChange={(e) => toggleShowCardArc(e.target.checked)} />
                      <span style={{marginLeft:'0.5rem'}}>Show Card Arc</span>
                    </label>
                    <label className="toolbar-control-row">
                      <input type="checkbox" checked={showInfoPanel} onChange={(e) => toggleShowInfoPanel(e.target.checked)} />
                      <span style={{marginLeft:'0.5rem'}}>Show Info Panel</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card Arc controls */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setCardOpen(v => !v)} aria-expanded={cardOpen}>
                  <div className="dropdown-title">Card Arc</div>
                  <div className={`chev ${cardOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${cardOpen ? 'open' : ''}`}>
                  <div className="logo-controls-grid">
                    <div className="cardarc-control-label">Toolbar gap (px)</div>
                    <label className="cardarc-control-row">
                      <input type="range" min="0" max="200" value={cardarcToolbarGap} onChange={(e) => setCardArcGap(e.target.value)} />
                      <div className="logo-control-value">{cardarcToolbarGap}px</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card controls removed — size and padding are controlled by styles and defaults. */}

              {/* Effects menu removed — functionality deprecated */}

                {/* Export / Defaults */}
                <div className="dropdown-section">
                  <div className="collapsible-content open">
                    <div style={{display:'flex',gap:'0.5rem',padding:'0.5rem'}}>
                      <button onClick={exportDefaults} className="export-btn">Export defaults</button>
                      <a className="hint" href="/layout-defaults.json" target="_blank" rel="noopener noreferrer">Open deployed defaults</a>
                    </div>
                  </div>
                </div>

            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Toolbar;

