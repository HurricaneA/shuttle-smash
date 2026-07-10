# public/ — static assets

Anything in this folder is served from the site root as-is (no bundling).
For example, `public/logo.png` is available at `/logo.png`.

## Add your logo

Drop the tournament logo here as **`logo.png`**:

```
public/logo.png
```

It's used in two places automatically:

- The navbar + hero + login (via the `Logo` component in `src/components/Logo.tsx`)
- The browser tab icon (favicon), set in `index.html`

Until `logo.png` exists, the app shows a navy "SSC" text badge as a fallback — so
nothing looks broken while you're setting up.

A square image (e.g. 512×512 or 1024×1024) with a transparent or white background
works best. To use a different filename, update the `src="/logo.png"` reference in
`src/components/Logo.tsx` and the `<link rel="icon">` in `index.html`.
