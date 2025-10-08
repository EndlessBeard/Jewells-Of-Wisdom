import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/defaults.css'
import './styles/generated-defaults.css'
import './styles/generated-defaults-override.css'
import './index.css'
import App from './App.jsx'

async function applyDeployedDefaults() {
  try {
    const res = await fetch('/layout-defaults.json', { cache: 'no-store' });
    if (!res.ok) return;
    const def = await res.json();

    // panel colors
    const force = Boolean(def && def.force);
    if (def.panelColors) {
      const pc = def.panelColors;
      try { if (pc._parent) document.documentElement.style.setProperty('--panel-bg', pc._parent); } catch {}
      try { if (pc._toolbar) document.documentElement.style.setProperty('--toolbar-bg', pc._toolbar); } catch {}
      try { if (pc._logo) document.documentElement.style.setProperty('--logo-bg', pc._logo); } catch {}
      try { Object.keys(pc).forEach(k => { if (!k.startsWith('_')) document.documentElement.style.setProperty(`--panel-bg-${k}`, pc[k]); }); } catch {}
      try {
        if (force) localStorage.setItem('jow.panelColors', JSON.stringify(pc));
        else if (!localStorage.getItem('jow.panelColors')) localStorage.setItem('jow.panelColors', JSON.stringify(pc));
      } catch {}
    }

    // logo settings
    if (def.logoSettings) {
      const ls = def.logoSettings;
      try { if (force) localStorage.setItem('jow.logoSettings', JSON.stringify(ls)); else if (!localStorage.getItem('jow.logoSettings')) localStorage.setItem('jow.logoSettings', JSON.stringify(ls)); } catch {}
      try { if (typeof ls.baseSize === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--logo-base-size'))) document.documentElement.style.setProperty('--logo-base-size', `${ls.baseSize}px`); } catch {}
      try { if (typeof ls.verticalOffset === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--logo-vertical-offset'))) document.documentElement.style.setProperty('--logo-vertical-offset', `${ls.verticalOffset}px`); } catch {}
      try { if (typeof ls.innerScale === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--logo-inner-scale'))) document.documentElement.style.setProperty('--logo-inner-scale', `${ls.innerScale}`); } catch {}
      try { if (typeof ls.baseMultiplier === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--base-logo-base-multiplier'))) document.documentElement.style.setProperty('--base-logo-base-multiplier', String(ls.baseMultiplier)); } catch {}
      try { if (typeof ls.gap === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--base-logo-gap'))) document.documentElement.style.setProperty('--base-logo-gap', `${ls.gap}px`); } catch {}
      try { if (typeof ls.yAdjust === 'number' && (force || !getComputedStyle(document.documentElement).getPropertyValue('--base-logo-y-adjust'))) document.documentElement.style.setProperty('--base-logo-y-adjust', `${ls.yAdjust}px`); } catch {}
    }

    // selected background
    if (def.selectedBackground) {
      try { if (force) localStorage.setItem('jow.selectedBackground', def.selectedBackground); else if (!localStorage.getItem('jow.selectedBackground')) localStorage.setItem('jow.selectedBackground', def.selectedBackground); } catch {}
      try { if (force || !getComputedStyle(document.documentElement).getPropertyValue('--page-bg')) document.documentElement.style.setProperty('--page-bg', `url('${def.selectedBackground}')`); } catch {}
    }
    if (def.backgroundScale) {
      try { if (force) localStorage.setItem('jow.selectedBackgroundScale', String(def.backgroundScale)); else if (!localStorage.getItem('jow.selectedBackgroundScale')) localStorage.setItem('jow.selectedBackgroundScale', String(def.backgroundScale)); } catch {}
      try { if (force || !getComputedStyle(document.documentElement).getPropertyValue('--page-bg-scale')) document.documentElement.style.setProperty('--page-bg-scale', String(def.backgroundScale)); } catch {}
    }

    // layout values
    if (def.layout && typeof def.layout === 'object') {
      const layoutMap = {
        cardPercent: '--layout-card-percent',
        logoPercent: '--layout-logo-percent',
        logoPaddingPercent: '--layout-logo-padding-percent',
        edgePaddingPercent: '--layout-edge-padding-percent',
        toolbarGapPercent: '--layout-toolbar-gap-percent',
        bottomPadding: '--cardarc-bottom-padding'
      };
      Object.keys(def.layout).forEach(k => {
        const v = def.layout[k];
        const varName = layoutMap[k] || k;
        try { if (force) document.documentElement.style.setProperty(varName, String(v)); else if (!getComputedStyle(document.documentElement).getPropertyValue(varName)) document.documentElement.style.setProperty(varName, String(v)); } catch {}
        try { if (force) localStorage.setItem(`jow.layout.${k}`, String(v)); else if (!localStorage.getItem(`jow.layout.${k}`)) localStorage.setItem(`jow.layout.${k}`, String(v)); } catch {}
        // maintain px fallback for toolbar gap if provided
        if (k === 'toolbarGapPercent' && v != null) {
          try {
            const px = Math.round((Number(v) / 100) * window.innerHeight);
            if (force) document.documentElement.style.setProperty('--cardarc-toolbar-gap', String(px));
            else if (!getComputedStyle(document.documentElement).getPropertyValue('--cardarc-toolbar-gap')) document.documentElement.style.setProperty('--cardarc-toolbar-gap', String(px));
          } catch {}
        }
      });
    }
  } catch (e) {
    // ignore fetch/apply errors — defaults are optional
    // console.warn('Could not apply deployed layout defaults', e);
  }
}

(async function bootstrap() {
  await applyDeployedDefaults();
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
