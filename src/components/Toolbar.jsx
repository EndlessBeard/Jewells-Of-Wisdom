import React, { useEffect, useState, useRef } from 'react';
import './Toolbar.css';
import b19 from '../assets/backgrounds/19.png';
import defaultBg from '../assets/background.png';
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
  bottomPadding: 'jow.layout.bottomPadding',
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
  const [effectsOpen, setEffectsOpen] = useState(false);

  const [currentBg, setCurrentBg] = useState(null);
  const [panelColors, setPanelColors] = useState({});
  const [logoSettings, setLogoSettings] = useState({
    baseSize: 120, verticalOffset: 0, innerScale: 1, baseMultiplier: 1.3, gap: -420, yAdjust: 0
  });
  const [toolbarGap, setToolbarGap] = useState(() => {
    try {
      const v = localStorage.getItem(LAYOUT_KEYS.toolbarGapPercent);
      return v != null ? parseFloat(v) : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-toolbar-gap-percent') || '1');
    } catch (e) { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-toolbar-gap-percent') || '1'); }
  });
  const [bottomPad, setBottomPad] = useState(() => {
    try {
      const v = localStorage.getItem(LAYOUT_KEYS.bottomPadding);
      if (v != null) return parseFloat(v);
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cardarc-bottom-padding') || '12');
    } catch (e) { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cardarc-bottom-padding') || '12'); }
  });

  const menuRef = useRef(null);

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
      // Hard-code background #19 as the site default and persist unless user has explicitly set another
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        document.documentElement.style.setProperty('--page-bg', `url('${saved}')`);
        setCurrentBg(saved);
      } else {
        // use background 19 by default
        document.documentElement.style.setProperty('--page-bg', `url('${b19}')`);
        try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, b19); } catch {}
      }
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

  const selectBackground = (src) => {
    try { document.documentElement.style.setProperty('--page-bg', `url('${src}')`); } catch {}
    try { localStorage.setItem(STORAGE_KEY, src); } catch {}
    setCurrentBg(src);
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

  const setDesiredLogoPanelPadding = (v) => {
    try {
      const num = Number.isFinite(Number(v)) ? Number(v) : parseFloat(v);
      if (!Number.isFinite(num)) return;
      document.documentElement.style.setProperty('--desired-logo-panel-padding', String(num));
      localStorage.setItem('jow.desiredLogoPanelPadding', String(num));
    } catch (e) {}
  };

  const setToolbarGapPercent = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--layout-toolbar-gap-percent', asString); } catch {}
    // px fallback for older consumers: compute px from viewport height
    try {
      const px = Math.round((Number(p) / 100) * window.innerHeight);
      document.documentElement.style.setProperty('--cardarc-toolbar-gap', `${px}`);
    } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.toolbarGapPercent, asString); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setCardPercent = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--layout-card-percent', asString); } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.cardPercent, asString); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setLogoPercent = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--layout-logo-percent', asString); } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.logoPercent, asString); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setLogoPaddingPercent = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--layout-logo-padding-percent', asString); } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.logoPaddingPercent, asString); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setEdgePaddingPercent = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--layout-edge-padding-percent', asString); } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.edgePaddingPercent, asString); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setBottomPadding = (p) => {
    const asString = String(p);
    try { document.documentElement.style.setProperty('--cardarc-bottom-padding', asString); } catch {}
    try { localStorage.setItem(LAYOUT_KEYS.bottomPadding, asString); } catch {}
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

              {/* Logo controls */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setLogoOpen(v => !v)} aria-expanded={logoOpen}>
                  <div className="dropdown-title">Logo</div>
                  <div className={`chev ${logoOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${logoOpen ? 'open' : ''}`}>
                  <div className="logo-controls-grid">
                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent') || '8')}%</span>
                      <label className="logo-control-label">Logo size (% of viewport width)</label>
                      <input
                        type="range" min="4" max="100" step="0.5"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent') || '8')}
                        onChange={(e) => setLogoPercent(e.target.value)}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-yadjust-percent') || '0')}%</span>
                      <label className="logo-control-label">Logo Y adjust (% of card height)</label>
                      <input
                        type="range" min="-100" max="100" step="1"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-yadjust-percent') || '0')}
                        onChange={(e) => { document.documentElement.style.setProperty('--layout-logo-yadjust-percent', String(e.target.value)); localStorage.setItem('jow.layout.logoYAdjustPercent', String(e.target.value)); try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {} }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent') || '6')}%</span>
                      <label className="logo-control-label">Logo padding (% of viewport height)</label>
                      <input
                        type="range" min="0" max="100" step="0.5"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent') || '6')}
                        onChange={(e) => setLogoPaddingPercent(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar controls */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setToolbarOpen(v => !v)} aria-expanded={toolbarOpen}>
                  <div className="dropdown-title">Toolbar</div>
                  <div className={`chev ${toolbarOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${toolbarOpen ? 'open' : ''}`}>
                  <div className="toolbar-controls-grid">
                    <label className="toolbar-control-row">
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}>
                        <span>Toolbar gap (% of viewport height — negative lifts arc)</span>
                        <div style={{minWidth:'6.5rem',textAlign:'right',fontWeight:700}}>{toolbarGap}% ({Math.round((toolbarGap/100) * window.innerHeight)}px)</div>
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        step={0.25}
                        value={toolbarGap}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setToolbarGap(v);
                          setToolbarGapPercent(v);
                        }}
                      />
                    </label>
                    <label className="toolbar-control-row">
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}>
                        <span>Bottom padding (px — negative pulls arc lower)</span>
                        <div style={{minWidth:'6.5rem',textAlign:'right',fontWeight:700}}>{bottomPad}px</div>
                      </div>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        step={1}
                        value={bottomPad}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setBottomPad(v);
                          setBottomPadding(v);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card controls */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setCardOpen(v => !v)} aria-expanded={cardOpen}>
                  <div className="dropdown-title">Card</div>
                  <div className={`chev ${cardOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${cardOpen ? 'open' : ''}`}>
                  <div className="card-controls-grid">
                    <label>
                      Card size (% of viewport width)
                      <input type="range" min="8" max="80" step="0.5" defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent') || '22')} onChange={(e) => setCardPercent(e.target.value)} />
                    </label>
                    <label>
                      Edge padding (% of viewport width)
                      <input type="range" min="0" max="12" step="0.25" defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent') || '4')} onChange={(e) => setEdgePaddingPercent(e.target.value)} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Effects (placeholder) */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setEffectsOpen(v => !v)} aria-expanded={effectsOpen}>
                  <div className="dropdown-title">Effects</div>
                  <div className={`chev ${effectsOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${effectsOpen ? 'open' : ''}`}>
                  <div className="effects-grid">
                    <label><input type="checkbox" defaultChecked={false} onChange={() => { try { localStorage.setItem('jow.effects.showDropShadow', String(!JSON.parse(localStorage.getItem('jow.effects.showDropShadow') || 'false'))); } catch {} }} /> Drop shadows</label>
                  </div>
                </div>
              </div>

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

