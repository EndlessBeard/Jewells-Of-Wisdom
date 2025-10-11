import React, { useEffect, useState, useRef } from 'react';
import './Toolbar.css';

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
  const [infoOpen, setInfoOpen] = useState(false);
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

  // Global radius percent (50-150)
  const [cardarcRadiusPercent, setCardarcRadiusPercent] = useState(() => {
    try { const v = localStorage.getItem('jow.layout.cardarcRadiusPercent'); if (v != null) return Number(v); const cs = getComputedStyle(document.documentElement).getPropertyValue('--cardarc-radius-percent'); if (cs) return Number(cs.replace('%','')) || 100; } catch {} return 100;
  });
  const setCardArcRadiusPercent = (v) => {
    const n = Number(v) || 100; setCardarcRadiusPercent(n); try { localStorage.setItem('jow.layout.cardarcRadiusPercent', String(n)); } catch {} try { document.documentElement.style.setProperty('--cardarc-radius-percent', `${n}`); } catch {} try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  // Logo size multiplier (percent, 50-200)
  const [logoSizeMultiplier, setLogoSizeMultiplier] = useState(() => {
    try { const v = localStorage.getItem('jow.layout.logoSizeMultiplier'); if (v != null) return Number(v); const cs = getComputedStyle(document.documentElement).getPropertyValue('--logo-size-multiplier'); if (cs) return Number(cs.replace('%','')) || 100; } catch {} return 100;
  });
  const setLogoSizeMult = (v) => { const n = Number(v) || 100; setLogoSizeMultiplier(n); try { localStorage.setItem('jow.layout.logoSizeMultiplier', String(n)); } catch {} try { document.documentElement.style.setProperty('--logo-size-multiplier', `${n}%`); } catch {} try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {} };

  // Card size multiplier (percent, 50-200)
  const [cardSizeMultiplier, setCardSizeMultiplier] = useState(() => {
    try { const v = localStorage.getItem('jow.layout.cardSizeMultiplier'); if (v != null) return Number(v); const cs = getComputedStyle(document.documentElement).getPropertyValue('--card-size-multiplier-percent'); if (cs) return Number(cs.replace('%','')) || 100; } catch {} return 100;
  });
  const setCardSizeMult = (v) => { const n = Number(v) || 100; setCardSizeMultiplier(n); try { localStorage.setItem('jow.layout.cardSizeMultiplier', String(n)); } catch {} try { document.documentElement.style.setProperty('--card-size-multiplier-percent', `${n}`); } catch {} try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {} };

  // per-card adjustments: degree and radius percent
  const NUM_CARDS = 5;
  const [cardDegAdjusts, setCardDegAdjusts] = useState(() => {
    try {
      const arr = Array.from({length: NUM_CARDS}, (_,i) => {
        const k = `jow.layout.cardDegAdjust.${i}`;
        const v = localStorage.getItem(k);
        if (v != null) return Number(v);
        const cs = getComputedStyle(document.documentElement).getPropertyValue(`--card-degree-adjust-${i}`) || '0deg';
        return Number(parseFloat(cs)) || 0;
      });
      return arr;
    } catch { return Array(NUM_CARDS).fill(0); }
  });
  const setCardDeg = (i, val) => {
    const next = [...cardDegAdjusts]; next[i] = Number(val) || 0; setCardDegAdjusts(next);
    try { localStorage.setItem(`jow.layout.cardDegAdjust.${i}`, String(next[i])); } catch {}
    try { document.documentElement.style.setProperty(`--card-degree-adjust-${i}`, `${next[i]}deg`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const [cardRadiusAdjusts, setCardRadiusAdjusts] = useState(() => {
    try {
      const arr = Array.from({length: NUM_CARDS}, (_,i) => {
        const k = `jow.layout.cardRadiusAdjust.${i}`;
        const v = localStorage.getItem(k);
        if (v != null) return Number(v);
        const cs = getComputedStyle(document.documentElement).getPropertyValue(`--card-radius-adjust-${i}`) || '100%';
        return Number(parseFloat(cs)) || 100;
      });
      return arr;
    } catch { return Array(NUM_CARDS).fill(100); }
  });
  const setCardRadius = (i, val) => {
    const next = [...cardRadiusAdjusts]; next[i] = Number(val) || 100; setCardRadiusAdjusts(next);
    try { localStorage.setItem(`jow.layout.cardRadiusAdjust.${i}`, String(next[i])); } catch {}
    try { document.documentElement.style.setProperty(`--card-radius-adjust-${i}`, `${next[i]}%`); } catch {}
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

    // shop card gap + size multiplier persistence
    try {
      const sg = localStorage.getItem('jow.layout.shopCardGap');
      if (sg != null) document.documentElement.style.setProperty('--shop-card-gap', `${Number(sg)}px`);
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--shop-card-gap')) document.documentElement.style.setProperty('--shop-card-gap', '12px');
    } catch {}
    try {
      const sm = localStorage.getItem('jow.layout.shopCardSizeMultiplier');
      if (sm != null) document.documentElement.style.setProperty('--shop-card-size-multiplier-percent', String(Number(sm)));
      else if (!getComputedStyle(document.documentElement).getPropertyValue('--shop-card-size-multiplier-percent')) document.documentElement.style.setProperty('--shop-card-size-multiplier-percent', '100');
    } catch {}

    // Initialize and persist CardArc related CSS vars (gap, radius, per-card tweaks)
    try {
      // toolbar gap
      try {
        const v = localStorage.getItem('jow.layout.cardarcToolbarGap');
        if (v != null) document.documentElement.style.setProperty('--cardarc-toolbar-gap', `${Number(v)}px`);
        else document.documentElement.style.setProperty('--cardarc-toolbar-gap', `${cardarcToolbarGap}px`);
      } catch {}

      // global radius percent
      try {
        const v = localStorage.getItem('jow.layout.cardarcRadiusPercent');
        if (v != null) document.documentElement.style.setProperty('--cardarc-radius-percent', String(Number(v)));
        else document.documentElement.style.setProperty('--cardarc-radius-percent', String(cardarcRadiusPercent));
      } catch {}

      // logo size multiplier
      try {
        const v = localStorage.getItem('jow.layout.logoSizeMultiplier');
        if (v != null) document.documentElement.style.setProperty('--logo-size-multiplier', `${Number(v)}%`);
        else document.documentElement.style.setProperty('--logo-size-multiplier', `${logoSizeMultiplier}%`);
      } catch {}

      // per-card degree and radius adjustments
      try {
        for (let i = 0; i < NUM_CARDS; i++) {
          const degKey = `jow.layout.cardDegAdjust.${i}`;
          const radKey = `jow.layout.cardRadiusAdjust.${i}`;
          const dv = localStorage.getItem(degKey);
          if (dv != null) document.documentElement.style.setProperty(`--card-degree-adjust-${i}`, `${Number(dv)}deg`);
          else document.documentElement.style.setProperty(`--card-degree-adjust-${i}`, getComputedStyle(document.documentElement).getPropertyValue(`--card-degree-adjust-${i}`) || '0deg');
          const rv = localStorage.getItem(radKey);
          if (rv != null) document.documentElement.style.setProperty(`--card-radius-adjust-${i}`, `${Number(rv)}%`);
          else document.documentElement.style.setProperty(`--card-radius-adjust-${i}`, getComputedStyle(document.documentElement).getPropertyValue(`--card-radius-adjust-${i}`) || '100%');
        }
      } catch {}
      // card size multiplier
      try {
        const v = localStorage.getItem('jow.layout.cardSizeMultiplier');
        if (v != null) document.documentElement.style.setProperty('--card-size-multiplier-percent', String(Number(v)));
        else document.documentElement.style.setProperty('--card-size-multiplier-percent', String(cardSizeMultiplier));
      } catch {}
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

  // Info panel bottom padding (px) control
  const [infoBottomPadding, setInfoBottomPadding] = useState(() => {
    try {
      const v = localStorage.getItem(LAYOUT_KEYS.bottomPadding);
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--cardarc-bottom-padding') || '';
      if (cs) return Number(cs.replace('px','')) || 12;
    } catch {}
    return 12;
  });

  const setInfoBottom = (v) => {
    const n = Number(v) || 0;
    setInfoBottomPadding(n);
    try { localStorage.setItem(LAYOUT_KEYS.bottomPadding, String(n)); } catch {}
    try { document.documentElement.style.setProperty('--cardarc-bottom-padding', `${n}px`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  // Edge padding (percent of viewport width per side) - controls panel & card edge padding
  const [edgePaddingPercent, setEdgePaddingPercent] = useState(() => {
    try {
      const v = localStorage.getItem(LAYOUT_KEYS.edgePaddingPercent);
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--layout-edge-padding-percent');
      if (cs) return Number(cs) || 4;
    } catch {}
    return 4;
  });
  const setEdgePadding = (v) => {
    const n = Number(v) || 0;
    setEdgePaddingPercent(n);
    try { localStorage.setItem(LAYOUT_KEYS.edgePaddingPercent, String(n)); } catch {}
    try { document.documentElement.style.setProperty('--layout-edge-padding-percent', String(n)); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  // Shop card controls (Info Panel) - gap (px) and size multiplier (%)
  const [shopCardGap, setShopCardGap] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopCardGap');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-card-gap');
      if (cs) return Number(cs.replace('px','')) || 12;
    } catch {}
    return 12;
  });
  const setShopGap = (v) => {
    const n = Number(v) || 0;
    setShopCardGap(n);
    try { localStorage.setItem('jow.layout.shopCardGap', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-card-gap', `${n}px`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const [shopCardSizeMultiplier, setShopCardSizeMultiplier] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopCardSizeMultiplier');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-card-size-multiplier-percent');
      if (cs) return Number(cs.replace('%','')) || 100;
    } catch {}
    return 100;
  });
  const setShopSizeMult = (v) => {
    const n = Number(v) || 100;
    setShopCardSizeMultiplier(n);
    try { localStorage.setItem('jow.layout.shopCardSizeMultiplier', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-card-size-multiplier-percent', `${n}`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  // Shop panel height multiplier (percent) - controls --shop-panel-height-percent
  const [shopPanelHeightPercent, setShopPanelHeightPercent] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopPanelHeightPercent');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-panel-height-percent');
      if (cs) return Number(cs) || 150;
    } catch {}
    return 150;
  });
  const setShopPanelHeight = (v) => {
    const n = Number(v) || 0;
    setShopPanelHeightPercent(n);
    try { localStorage.setItem('jow.layout.shopPanelHeightPercent', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-panel-height-percent', String(n)); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  return (
    <header className="toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-title">Jewells Of Wisdom Version 0.1.0.</div>
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

              {/* Info Panel controls */}
              <div className="dropdown-section">
                <button className="collapsible-header" onClick={() => setInfoOpen(v => !v)} aria-expanded={infoOpen}>
                  <div className="dropdown-title">Info Panel</div>
                  <div className={`chev ${infoOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                <div className={`collapsible-content ${infoOpen ? 'open' : ''}`}>
                  <div style={{padding:'0.5rem',display:'grid',gap:'0.5rem'}}>
                    <div style={{fontWeight:700}}>Info Panel spacing</div>
                    <label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <input type="range" min="0" max="120" value={infoBottomPadding} onChange={(e) => setInfoBottom(e.target.value)} />
                      <div style={{minWidth: '48px', textAlign:'right'}}>{infoBottomPadding}px</div>
                    </label>
                    <div style={{fontSize:'0.8rem',color:'#666'}}>Adjust extra breathing room below the cards before the Info Panel starts.</div>
                    <hr />
                    <div style={{fontWeight:700}}>Edge padding</div>
                    <label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{flex:1}}>Panel & card padding</div>
                      <input type="range" min="0" max="10" value={edgePaddingPercent} onChange={(e) => setEdgePadding(e.target.value)} />
                      <div style={{minWidth: '48px', textAlign:'right'}}>{edgePaddingPercent}%</div>
                    </label>
                    <div style={{fontSize:'0.8rem',color:'#666'}}>Controls padding at the edges of panels and inside card frames (percent of viewport width).</div>
                    <hr />
                    <div style={{fontWeight:700}}>Shop card controls</div>
                    <label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{flex:1}}>Card gap</div>
                      <input type="range" min="0" max="48" value={shopCardGap} onChange={(e) => setShopGap(e.target.value)} />
                      <div style={{minWidth: '48px', textAlign:'right'}}>{shopCardGap}px</div>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{flex:1}}>Card size</div>
                      <input type="range" min="50" max="200" value={shopCardSizeMultiplier} onChange={(e) => setShopSizeMult(e.target.value)} />
                      <div style={{minWidth: '48px', textAlign:'right'}}>{shopCardSizeMultiplier}%</div>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{flex:1}}>Panel height</div>
                      <input type="range" min="100" max="300" value={shopPanelHeightPercent} onChange={(e) => setShopPanelHeight(e.target.value)} />
                      <div style={{minWidth: '48px', textAlign:'right'}}>{shopPanelHeightPercent}%</div>
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

                    {/* Global radius percent control */}
                    <div className="cardarc-control-label">Arc radius scale (%)</div>
                    <label className="cardarc-control-row">
                      <input type="range" min="50" max="150" value={cardarcRadiusPercent} onChange={(e) => setCardArcRadiusPercent(e.target.value)} />
                      <div className="logo-control-value">{cardarcRadiusPercent}%</div>
                    </label>

                    {/* Logo size multiplier */}
                    <div className="cardarc-control-label">Logo size multiplier</div>
                    <label className="cardarc-control-row">
                      <input type="range" min="50" max="200" value={logoSizeMultiplier} onChange={(e) => setLogoSizeMult(e.target.value)} />
                      <div className="logo-control-value">{logoSizeMultiplier}%</div>
                    </label>

                    {/* Card size multiplier */}
                    <div className="cardarc-control-label">Card size multiplier</div>
                    <label className="cardarc-control-row">
                      <input type="range" min="50" max="200" value={cardSizeMultiplier} onChange={(e) => setCardSizeMult(e.target.value)} />
                      <div className="logo-control-value">{cardSizeMultiplier}%</div>
                    </label>

                    {/* Per-card fine tuning controls */}
                    <div style={{gridColumn: '1 / -1', marginTop: '0.5rem', fontWeight:700}}>Per-card fine adjustments</div>
                    {Array.from({length: NUM_CARDS}).map((_,i) => (
                      <div key={`card-tweak-${i}`} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',alignItems:'center'}}>
                        <input className="card-tweak-slider" type="range" min="-20" max="20" step="0.5" value={cardDegAdjusts[i]} onChange={(e) => setCardDeg(i, e.target.value)} aria-label={`card-${i+1}-angle`} />
                        <input className="card-tweak-slider" type="range" min="70" max="130" step="1" value={cardRadiusAdjusts[i]} onChange={(e) => setCardRadius(i, e.target.value)} aria-label={`card-${i+1}-radius`} />
                      </div>
                    ))}
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

