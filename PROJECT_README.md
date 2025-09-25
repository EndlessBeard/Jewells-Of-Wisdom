# Jewells-Of-Wisdom

This repository contains the Jewells of Wisdom React app.

Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Notes

- Toolbar settings persist to localStorage under `jow.*` keys.
- CSS variables control theming and effects.

Exporting and applying current running settings
---------------------------------------------

1. In the browser running your local dev server, open DevTools Console and run:

```js
// copy the jow.* localStorage keys into one JSON object and copy-paste the result to a file
const keys = Object.keys(localStorage).filter(k => k.startsWith('jow.'));
const obj = {};
keys.forEach(k => obj[k] = localStorage.getItem(k));
console.log(JSON.stringify(obj, null, 2));
```

2. Save the printed JSON into a file, e.g. `my-jow-settings.json`.

3. From the project root, run:

```bash
node tools/applyDefaults.js my-jow-settings.json
```

This writes `src/styles/generated-defaults.css` with CSS variable declarations derived from your live settings.
The app already imports `src/styles/defaults.css` on load; the generated file will be committed so those values become the project defaults.

