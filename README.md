# Dai Dang — Portfolio

Brutalist Swiss-editorial portfolio. Static site — no build step, no framework.

**Live:** deployed to GitHub Pages automatically on every push to `main` (see `.github/workflows/deploy.yml`).

## Structure

```
index.html      — all content (bio, work, experience, certifications, contact)
css/main.css    — all styling; theme variables at the top
js/main.js      — behavior: loader, decrypt effects, reveals, nav rail, cursor
assets/         — portrait + work screenshots
```

The original Claude Design handoff bundle (`chats/`, `project/`) is kept for reference;
the deploy workflow publishes only `index.html`, `css/`, `js/`, and `assets/`.

## Editing content

Everything lives in `index.html`, marked with `═══` section comments:

- **Stats (GPA, experience, cert year)** — the `STATS BAND` section. Numbers animate
  via `data-count-*` attributes; also update the fallback text inside the element.
- **Selected work** — one `.dd-work-row` block per project. Copy an existing row to
  add a project; screenshots go in `assets/work/` and are linked from the row's
  `.dd-work-shot` anchor.
- **Experience** — one `.dd-exp-row` per entry (keep `dd-exp-row--last` on the final one).
- **Certifications** — the two `.dd-cert` cards in the Focus section. A full accent bar
  = certified; add `dd-progress-fill--scan` to the bar for "in progress".
- **Contact links** — the three `.dd-contact-link` anchors near the bottom.

## Theming

- **Accent color:** `--dd-accent` in `css/main.css` (`:root` block).
- **Glitch feel:** on the `<html>` tag in `index.html` —
  `data-glitch-charset="hex | binary | glitch | alpha"` and
  `data-glitch-intensity="calm | balanced | intense"`.

`prefers-reduced-motion` is respected: all decrypt/scroll effects fall back to a plain fade.
