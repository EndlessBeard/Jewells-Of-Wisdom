import React, { useEffect, useState, useRef } from 'react';
import './Toolbar.css';
import backgrounds from '../assets/backgrounds';
import defaultBg from '../assets/background.png';

const STORAGE_KEY = 'jow.selectedBackground';
const BG_SCALE_KEY = 'jow.selectedBackgroundScale';
const PANEL_COLORS_KEY = 'jow.panelColors';
const SECTIONS = [
  { id: 'about-us', label: 'About Us' },
  { id: 'author', label: 'Author' },
  { id: 'services', label: 'Services' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'shop', label: 'Store' },
];

const Toolbar = () => {
  const [open, setOpen] = useState(false);
  const [currentBg, setCurrentBg] = useState(null);
  const [bgOpen, setBgOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [panelColors, setPanelColors] = useState({});
  const [logoSettings, setLogoSettings] = useState({
    baseSize: 120,
    verticalOffset: 0,
    innerScale: 1,
    animation: true,
    // CardArc-linked controls
    baseMultiplier: 1.3,
    gap: -420,
    yAdjust: 0,
  });
  const [logoOpen, setLogoOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    // load saved background from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // saved contains the src url
      document.documentElement.style.setProperty('--page-bg', `url('${saved}')`);
      setCurrentBg(saved);
    } else {
      // ensure default matches CSS fallback
      document.documentElement.style.setProperty('--page-bg', `url('${defaultBg}')`);
      setCurrentBg(null);
    }
    // load bg scale
    try {
      const savedScale = localStorage.getItem(BG_SCALE_KEY);
      const scale = savedScale ? parseFloat(savedScale) : 1;
      document.documentElement.style.setProperty('--page-bg-scale', String(scale));
    } catch {
      // ignore
    }
    // load panel colors
    try {
      const pc = JSON.parse(localStorage.getItem(PANEL_COLORS_KEY) || '{}');
      setPanelColors(pc);
      // apply to :root
      // also apply parent panel color if provided
      if (pc._parent) {
        document.documentElement.style.setProperty('--panel-bg', pc._parent);
      }
      // apply toolbar and logo colors if provided
      if (pc._toolbar) {
        document.documentElement.style.setProperty('--toolbar-bg', pc._toolbar);
      }
      if (pc._logo) {
        document.documentElement.style.setProperty('--logo-bg', pc._logo);
      }
      Object.keys(pc).forEach(id => {
        // skip special keys
        if (id.startsWith('_')) return;
        document.documentElement.style.setProperty(`--panel-bg-${id}`, pc[id]);
      });
    } catch {
      // ignore
    }
    // load logo settings (size/offset/inner-scale and animation on/off)
    try {
      const ls = JSON.parse(localStorage.getItem('jow.logoSettings') || '{}');
      const merged = {
        baseSize: typeof ls.baseSize === 'number' ? ls.baseSize : 120,
        verticalOffset: typeof ls.verticalOffset === 'number' ? ls.verticalOffset : 0,
        innerScale: typeof ls.innerScale === 'number' ? ls.innerScale : 1,
        animation: typeof ls.animation === 'boolean' ? ls.animation : true,
        baseMultiplier: typeof ls.baseMultiplier === 'number' ? ls.baseMultiplier : 1.3,
        gap: typeof ls.gap === 'number' ? ls.gap : -420,
        yAdjust: typeof ls.yAdjust === 'number' ? ls.yAdjust : 0,
      };
      setLogoSettings(merged);
      // apply css vars
  document.documentElement.style.setProperty('--logo-base-size', `${merged.baseSize}px`);
  document.documentElement.style.setProperty('--logo-vertical-offset', `${merged.verticalOffset}px`);
  document.documentElement.style.setProperty('--logo-inner-scale', `${merged.innerScale}`);
  // CardArc-linked css vars
  document.documentElement.style.setProperty('--base-logo-base-multiplier', String(merged.baseMultiplier));
  document.documentElement.style.setProperty('--base-logo-gap', `${merged.gap}px`);
  document.documentElement.style.setProperty('--base-logo-y-adjust', `${merged.yAdjust}px`);
      // ensure layout percent vars exist (defaults)
      try {
        const lp = localStorage.getItem('jow.layout.cardPercent');
        if (lp) document.documentElement.style.setProperty('--layout-card-percent', lp);
        else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent')) document.documentElement.style.setProperty('--layout-card-percent', '22');
      } catch {}
      try {
        const lp2 = localStorage.getItem('jow.layout.logoPercent');
        if (lp2) document.documentElement.style.setProperty('--layout-logo-percent', lp2);
        else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent')) document.documentElement.style.setProperty('--layout-logo-percent', '8');
      } catch {}
      try {
        const lp3 = localStorage.getItem('jow.layout.logoPaddingPercent');
        if (lp3) document.documentElement.style.setProperty('--layout-logo-padding-percent', lp3);
        else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent')) document.documentElement.style.setProperty('--layout-logo-padding-percent', '6');
      } catch {}
      try {
        const lp4 = localStorage.getItem('jow.layout.edgePaddingPercent');
        if (lp4) document.documentElement.style.setProperty('--layout-edge-padding-percent', lp4);
        else if (!getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent')) document.documentElement.style.setProperty('--layout-edge-padding-percent', '4');
      } catch {}
      if (!merged.animation) document.documentElement.classList.add('logo-anim-disabled');
      else document.documentElement.classList.remove('logo-anim-disabled');
    } catch {
      // ignore
    }
    // load desired logo-panel padding
    try {
      const savedPadding = localStorage.getItem('jow.desiredLogoPanelPadding');
      const pad = savedPadding ? parseFloat(savedPadding) : null;
      if (pad && Number.isFinite(pad)) {
        document.documentElement.style.setProperty('--desired-logo-panel-padding', String(pad));
      }
    } catch {}
    // load saved card shadow settings
    try {
      const cs = JSON.parse(localStorage.getItem('jow.cardShadow') || '{}');
      if (cs.offset != null) {
        // store numeric in localStorage but write CSS var with px unit so calc() works correctly
        const off = (typeof cs.offset === 'number') ? `${cs.offset}px` : String(cs.offset);
        document.documentElement.style.setProperty('--card-shadow-offset', off);
      }
      if (cs.blur != null) {
        const bl = (typeof cs.blur === 'number') ? `${cs.blur}px` : String(cs.blur);
        document.documentElement.style.setProperty('--card-shadow-blur', bl);
      }
      if (cs.opacity != null) document.documentElement.style.setProperty('--card-shadow-opacity', String(cs.opacity));
    } catch {}
  }, []);

  useEffect(() => {
    const onDocClick = (ev) => {
      if (menuRef.current && !menuRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggleMenu = () => setOpen(o => !o);

  const selectBackground = (src) => {
    document.documentElement.style.setProperty('--page-bg', `url('${src}')`);
    localStorage.setItem(STORAGE_KEY, src);
    setCurrentBg(src);
    setOpen(false);
  };

  const setColorFor = (id, color) => {
    const next = { ...panelColors, [id]: color };
    setPanelColors(next);
    localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next));
    // set css variable for that panel
    document.documentElement.style.setProperty(`--panel-bg-${id}`, color);
  };

  const setToolbarColor = (color) => {
    const next = { ...panelColors, _toolbar: color };
    setPanelColors(next);
    localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next));
    document.documentElement.style.setProperty('--toolbar-bg', color);
  };

  const setLogoColor = (color) => {
    const next = { ...panelColors, _logo: color };
    setPanelColors(next);
    localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next));
    document.documentElement.style.setProperty('--logo-bg', color);
  };

  const setParentColor = (color) => {
    const next = { ...panelColors, _parent: color };
    setPanelColors(next);
    localStorage.setItem(PANEL_COLORS_KEY, JSON.stringify(next));
    document.documentElement.style.setProperty('--panel-bg', color);
  };

  const saveLogoSettings = (next) => {
    setLogoSettings(next);
    localStorage.setItem('jow.logoSettings', JSON.stringify(next));
    document.documentElement.style.setProperty('--logo-base-size', `${next.baseSize}px`);
    document.documentElement.style.setProperty('--logo-vertical-offset', `${next.verticalOffset}px`);
    document.documentElement.style.setProperty('--logo-inner-scale', `${next.innerScale}`);
    // CardArc-linked css vars
    if (typeof next.baseMultiplier === 'number') document.documentElement.style.setProperty('--base-logo-base-multiplier', String(next.baseMultiplier));
    if (typeof next.gap === 'number') document.documentElement.style.setProperty('--base-logo-gap', `${next.gap}px`);
    if (typeof next.yAdjust === 'number') document.documentElement.style.setProperty('--base-logo-y-adjust', `${next.yAdjust}px`);
    if (!next.animation) document.documentElement.classList.add('logo-anim-disabled');
    else document.documentElement.classList.remove('logo-anim-disabled');
  };

  const setDesiredLogoPanelPadding = (v) => {
    try {
      const num = Number.isFinite(Number(v)) ? Number(v) : parseFloat(v);
      if (!Number.isFinite(num)) return;
      document.documentElement.style.setProperty('--desired-logo-panel-padding', String(num));
      localStorage.setItem('jow.desiredLogoPanelPadding', String(num));
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-title">Jewells of Wisdom</div>
        <nav className="toolbar-menu" ref={menuRef}>
          <button className="menu-icon" aria-label="Open menu" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          {open && (
            <div className="toolbar-dropdown" role="menu" aria-label="Backgrounds and panel colors">
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setBgOpen(b => !b)} aria-expanded={bgOpen}>
                  <div className="dropdown-title">Backgrounds</div>
                  <div className={`chev ${bgOpen ? 'open' : ''}`} aria-hidden="true"></div>
                </button>
                <div className={`collapsible-content ${bgOpen ? 'open' : ''}`}>
                  <div className="bg-dropdown-row">
                    <select value={currentBg || ''} onChange={(e) => selectBackground(e.target.value || defaultBg)}>
                      <option value="">Default</option>
                      {backgrounds.map(bg => (
                        <option key={bg.id} value={bg.src}>{bg.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-scale-row">
                    <label>Scale:</label>
                    {[1,2,4].map(s => (
                      <button
                        key={s}
                        className={`scale-btn ${String(s) === (localStorage.getItem(BG_SCALE_KEY) || '1') ? 'active' : ''}`}
                        onClick={() => {
                          document.documentElement.style.setProperty('--page-bg-scale', String(s));
                          try { localStorage.setItem(BG_SCALE_KEY, String(s)); } catch {};
                        }}
                      >{s}x</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setColorsOpen(v => !v)} aria-expanded={colorsOpen}>
                  <div className="dropdown-title">Panel colors</div>
                  <div className={`chev ${colorsOpen ? 'open' : ''}`} aria-hidden="true"></div>
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
                    {/* shop controls moved to their own dropdown-section */}
                  </div>
                </div>
              </div>

              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setShopOpen(s => !s)} aria-expanded={shopOpen}>
                  <div className="dropdown-title">Shop controls</div>
                  <div className={`chev ${shopOpen ? 'open' : ''}`} aria-hidden="true"></div>
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
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Crafts button</span>
                      <input type="color" value={panelColors['shop-cat-crafts'] || '#ffffff'} onChange={(e) => setColorFor('shop-cat-crafts', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Carousel - Prev button</span>
                      <input type="color" value={panelColors['shop-dir-prev'] || '#ffffff'} onChange={(e) => setColorFor('shop-dir-prev', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Carousel - Prev background</span>
                      <input type="color" value={panelColors['shop-dir-prev-bg'] || '#ffffff'} onChange={(e) => setColorFor('shop-dir-prev-bg', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Carousel - Next button</span>
                      <input type="color" value={panelColors['shop-dir-next'] || '#ffffff'} onChange={(e) => setColorFor('shop-dir-next', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Carousel - Next background</span>
                      <input type="color" value={panelColors['shop-dir-next-bg'] || '#ffffff'} onChange={(e) => setColorFor('shop-dir-next-bg', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Border color</span>
                      <input type="color" value={panelColors['shop-border'] || '#ffffff'} onChange={(e) => setColorFor('shop-border', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Buttons outline color</span>
                      <input type="color" value={panelColors['shop-btn-outline'] || '#000000'} onChange={(e) => setColorFor('shop-btn-outline', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Buttons text color</span>
                      <input type="color" value={panelColors['shop-btn-color'] || '#111111'} onChange={(e) => setColorFor('shop-btn-color', e.target.value)} />
                    </label>
                    <label className="panel-color-row">
                      <span className="panel-color-label">Shop - Outline width (px)</span>
                      <input type="number" min="0" max="8" step="1" value={parseInt(panelColors['shop-outline-width'] || '1', 10)} onChange={(e) => setColorFor('shop-outline-width', `${e.target.value}px`)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setLogoOpen(v => !v)} aria-expanded={logoOpen}>
                  <div className="dropdown-title">Logo controls</div>
                  <div className={`chev ${logoOpen ? 'open' : ''}`} aria-hidden="true"></div>
                </button>
                <div className={`collapsible-content ${logoOpen ? 'open' : ''}`}>
                  <div className="logo-controls-grid">
                    {/* Slider row: left readout label, slider to the right */}
                    <div className="logo-control-row">
                      <span className="logo-control-value">{(logoSettings.baseMultiplier ?? 1.3).toFixed(2)}</span>
                      <label className="logo-control-label">Base multiplier</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.01"
                        value={logoSettings.baseMultiplier ?? 1.3}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          const next = { ...logoSettings, baseMultiplier: v };
                          saveLogoSettings(next);
                          // apply CSS var used by CardArc
                          document.documentElement.style.setProperty('--base-logo-base-multiplier', String(v));
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{(logoSettings.gap ?? -420)}</span>
                      <label className="logo-control-label">Logo gap (px)</label>
                      <input
                        type="range"
                        min="-800"
                        max="0"
                        step="1"
                        value={logoSettings.gap ?? -420}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || '0', 10);
                          const next = { ...logoSettings, gap: v };
                          saveLogoSettings(next);
                          document.documentElement.style.setProperty('--base-logo-gap', `${v}px`);
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{(logoSettings.yAdjust ?? 0)}</span>
                      <label className="logo-control-label">Y adjust (px)</label>
                      <input
                        type="range"
                        min="-200"
                        max="200"
                        step="1"
                        value={logoSettings.yAdjust ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || '0', 10);
                          const next = { ...logoSettings, yAdjust: v };
                          saveLogoSettings(next);
                          document.documentElement.style.setProperty('--base-logo-y-adjust', `${v}px`);
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-label">Animation</span>
                      <input type="checkbox" checked={logoSettings.animation ?? true} onChange={(e) => saveLogoSettings({ ...logoSettings, animation: e.target.checked })} />
                    </div>

                    {/* Layout percentage controls (card size, logo size, paddings) */}
                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent') || '22')}%</span>
                      <label className="logo-control-label">Card width (% of viewport)</label>
                      <input
                        type="range"
                        min="8"
                        max="40"
                        step="1"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-card-percent') || '22')}
                        onChange={(e) => {
                          const v = String(parseFloat(e.target.value));
                          document.documentElement.style.setProperty('--layout-card-percent', v);
                          try { localStorage.setItem('jow.layout.cardPercent', v); } catch {}
                          try { window.dispatchEvent(new Event('resize')); } catch {}
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent') || '8')}%</span>
                      <label className="logo-control-label">Logo size (% of viewport width)</label>
                      <input
                        type="range"
                        min="4"
                        max="20"
                        step="0.5"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-percent') || '8')}
                        onChange={(e) => {
                          const v = String(parseFloat(e.target.value));
                          document.documentElement.style.setProperty('--layout-logo-percent', v);
                          try { localStorage.setItem('jow.layout.logoPercent', v); } catch {}
                          try { window.dispatchEvent(new Event('resize')); } catch {}
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent') || '6')}%</span>
                      <label className="logo-control-label">Logo padding (% of viewport height)</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-logo-padding-percent') || '6')}
                        onChange={(e) => {
                          const v = String(parseFloat(e.target.value));
                          document.documentElement.style.setProperty('--layout-logo-padding-percent', v);
                          try { localStorage.setItem('jow.layout.logoPaddingPercent', v); } catch {}
                          try { window.dispatchEvent(new Event('resize')); } catch {}
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent') || '4')}%</span>
                      <label className="logo-control-label">Edge padding (% of viewport width)</label>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent') || '4')}
                        onChange={(e) => {
                          const v = String(parseFloat(e.target.value));
                          document.documentElement.style.setProperty('--layout-edge-padding-percent', v);
                          try { localStorage.setItem('jow.layout.edgePaddingPercent', v); } catch {}
                          try { window.dispatchEvent(new Event('resize')); } catch {}
                        }}
                      />
                    </div>

                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--desired-logo-panel-padding') || '24')}</span>
                      <label className="logo-control-label">Panel padding from logo (px)</label>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="1"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--desired-logo-panel-padding') || '24')}
                        onChange={(e) => setDesiredLogoPanelPadding(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setEffectsOpen(e => !e)} aria-expanded={effectsOpen}>
                  <div className="dropdown-title">Effects</div>
                  <div className={`chev ${effectsOpen ? 'open' : ''}`} aria-hidden="true"></div>
                </button>
                <div className={`collapsible-content ${effectsOpen ? 'open' : ''}`}>
                  <div className="logo-controls-grid">
                    {/* Card shadow controls */}
                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-offset') || '8').replace(/px$/, ''))}</span>
                      <label className="logo-control-label">Shadow distance (px)</label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        defaultValue={parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-offset') || '8').replace(/px$/, ''))}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          // write CSS var with px unit so calc and fallbacks behave correctly
                          document.documentElement.style.setProperty('--card-shadow-offset', `${v}px`);
                          try { localStorage.setItem('jow.cardShadow', JSON.stringify({
                            offset: v,
                            blur: parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-blur') || '20').replace(/px$/, '')),
                            opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-opacity') || '0.08'),
                          })); } catch {}
                        }}
                      />
                    </div>
                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-blur') || '20').replace(/px$/, ''))}</span>
                      <label className="logo-control-label">Shadow blur (px)</label>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="1"
                        defaultValue={parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-blur') || '20').replace(/px$/, ''))}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          document.documentElement.style.setProperty('--card-shadow-blur', `${v}px`);
                          try { localStorage.setItem('jow.cardShadow', JSON.stringify({
                            offset: parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-offset') || '8').replace(/px$/, '')),
                            blur: v,
                            opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-opacity') || '0.08'),
                          })); } catch {}
                        }}
                      />
                    </div>
                    <div className="logo-control-row">
                      <span className="logo-control-value">{parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-opacity') || '0.08')}</span>
                      <label className="logo-control-label">Shadow strength (opacity)</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-opacity') || '0.08')}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          document.documentElement.style.setProperty('--card-shadow-opacity', String(v));
                          try { localStorage.setItem('jow.cardShadow', JSON.stringify({
                            offset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-offset') || '8'),
                            blur: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-shadow-blur') || '20'),
                            opacity: v,
                          })); } catch {}
                        }}
                      />
                    </div>
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
