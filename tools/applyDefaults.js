#!/usr/bin/env node
// tools/applyDefaults.js
// Usage: node tools/applyDefaults.js exported-settings.json
// Reads a JSON file exported from the browser (localStorage entries like jow.*)
// and writes src/styles/generated-defaults.css with matching :root declarations.

const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node tools/applyDefaults.js <exported-localstorage.json>');
  process.exit(2);
}

const outFile = path.join(__dirname, '..', 'src', 'styles', 'generated-defaults.css');

let raw;
try {
  raw = fs.readFileSync(input, 'utf8');
} catch (e) {
  console.error('Failed to read input file:', e.message);
  process.exit(2);
}

let data;
try { data = JSON.parse(raw); } catch (e) { console.error('Invalid JSON:', e.message); process.exit(2); }

// data expected to be an object of key->value pairs from localStorage
const varLines = [];

// Helper: if value looks like JSON, try to parse
const tryParseJSON = (v) => {
  if (typeof v !== 'string') return v;
  v = v.trim();
  if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
}

// Map known jow.* keys to CSS vars
const mapping = {
  'jow.selectedBackground': (v) => `--page-bg: url('${v.replace(/'/g, "\\'")}');`,
  'jow.selectedBackgroundScale': (v) => `--page-bg-scale: ${v};`,
  'jow.panelColors': (v) => {
    const obj = tryParseJSON(v);
    if (typeof obj === 'object') {
      const lines = [];
      if (obj._parent) lines.push(`--panel-bg: ${obj._parent};`);
      if (obj._toolbar) lines.push(`--toolbar-bg: ${obj._toolbar};`);
      if (obj._logo) lines.push(`--logo-bg: ${obj._logo};`);
      Object.keys(obj).forEach(k => {
        if (k.startsWith('_')) return;
        lines.push(`--panel-bg-${k}: ${obj[k]};`);
      });
      return lines.join('\n');
    }
    return '';
  },
  'jow.logoSettings': (v) => {
    const obj = tryParseJSON(v);
    if (typeof obj === 'object') {
      const lines = [];
      if (obj.baseSize) lines.push(`--logo-base-size: ${obj.baseSize}px;`);
      if (obj.verticalOffset) lines.push(`--logo-vertical-offset: ${obj.verticalOffset}px;`);
      if (obj.innerScale) lines.push(`--logo-inner-scale: ${obj.innerScale};`);
      if (obj.baseMultiplier) lines.push(`--base-logo-base-multiplier: ${obj.baseMultiplier};`);
      if (obj.gap) lines.push(`--base-logo-gap: ${obj.gap}px;`);
      if (obj.yAdjust) lines.push(`--base-logo-y-adjust: ${obj.yAdjust}px;`);
      return lines.join('\n');
    }
    return '';
  },
  'jow.desiredLogoPanelPadding': (v) => `--desired-logo-panel-padding: ${v};`,
  // card-shadow mapping removed
};

Object.keys(data).forEach(k => {
  if (mapping[k]) {
    const res = mapping[k](data[k]);
    if (res) {
      if (Array.isArray(res)) res.forEach(r => varLines.push(r));
      else varLines.push(res);
    }
  }
});

const out = `/* GENERATED - applyDefaults.js */\n:root {\n${varLines.map(l => '  ' + l).join('\n')}\n}\n`;

fs.writeFileSync(outFile, out, 'utf8');
console.log('Wrote generated defaults to', outFile);
