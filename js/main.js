/* ═══════════════════════════════════════════════════════════════
   DAI DANG — PORTFOLIO BEHAVIOR
   Theming: accent lives in css/main.css (--dd-accent).
   Glitch feel: <html data-glitch-charset="hex|binary|glitch|alpha"
                      data-glitch-intensity="calm|balanced|intense">
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    const root = document.getElementById('dd-root');
    if (!root) return;

    /* ---------- theme config ---------- */
    const ACCENT = (getComputedStyle(document.documentElement).getPropertyValue('--dd-accent').trim()) || '#C2410C';
    // RGB-split aberration palette derived from the accent (channel-swap mirror)
    const swapRB = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); if (h.length < 6) return '#22DDDD'; return '#' + h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2); };
    const ABER1 = ACCENT, ABER2 = swapRB(ACCENT), GLOW = ACCENT;
    const CHARSETS = {
      hex:    { decode: '0123456789ABCDEF<>/[]{}=+*-_!?#%&$@^~', name: '0123456789ABCDEF#%&$@/<>=+*' },
      binary: { decode: '01', name: '01' },
      glitch: { decode: '!<>/[]{}()=+*-_?#%&$@^~|;:.,§±¶', name: '!<>/[]{}=+*#%&$@^~|;:' },
      alpha:  { decode: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }
    };
    const htmlEl = document.documentElement;
    const GS = CHARSETS[htmlEl.getAttribute('data-glitch-charset')] || CHARSETS.hex;
    const INT = ({
      calm:     { flip: 82, durMul: 1.45 },
      balanced: { flip: 55, durMul: 1.0 },
      intense:  { flip: 30, durMul: 0.6 }
    })[htmlEl.getAttribute('data-glitch-intensity')] || { flip: 55, durMul: 1.0 };

    const nowMs = (window.performance && performance.now) ? () => performance.now() : () => Date.now();

    /* ---------- live Calgary clock ---------- */
    const clock = root.querySelector('#dd-clock');
    const dateEl = root.querySelector('#dd-date');
    const foot = root.querySelector('#dd-clock-foot');
    const footDate = root.querySelector('#dd-date-foot');
    const tz = 'America/Edmonton';
    const tick = () => {
      const now = new Date();
      let t;
      try {
        t = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
      } catch (e) { t = now.toTimeString().slice(0, 8); }
      let abbr = 'MT';
      try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now);
        const z = parts.find(p => p.type === 'timeZoneName');
        if (z) abbr = z.value;
      } catch (e) {}
      let d = '';
      try {
        d = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(now).toUpperCase();
      } catch (e) {}
      if (clock) clock.textContent = t + ' ' + abbr;
      if (dateEl) dateEl.textContent = d;
      if (foot) foot.textContent = t + ' ' + abbr;
      if (footDate) {
        let nd = '';
        try { nd = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(now); } catch (e) {}
        footDate.textContent = nd;
      }
    };
    tick();
    setInterval(tick, 1000);

    /* ---------- scroll reveal (fires once per element) ---------- */
    const items = [...root.querySelectorAll('[data-reveal]')];
    const arm = el => {
      const hasX = el.hasAttribute('data-reveal-x');
      const x = hasX ? parseFloat(el.getAttribute('data-reveal-x')) || 0 : 0;
      const y = el.hasAttribute('data-reveal-y') ? (parseFloat(el.getAttribute('data-reveal-y')) || 0) : (hasX ? 0 : 26);
      el.style.opacity = '0';
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      el.style.transition = 'opacity 1.6s cubic-bezier(.16,.84,.36,1), transform 1.6s cubic-bezier(.16,.84,.36,1)';
      el.style.willChange = 'opacity, transform';
    };
    const reveal = el => {
      const d = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      el.style.transitionDelay = d + 'ms';
      void el.offsetWidth;
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
    const forceShow = () => items.forEach(el => { el.style.transition = 'none'; el.style.transitionDelay = '0ms'; el.style.opacity = '1'; el.style.transform = 'none'; });
    const animateReveal = () => {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
        items.forEach(el => io.observe(el));
      } else {
        items.forEach(reveal);
      }
    };

    /* ---------- cybertext decode (scramble -> resolve, once on scroll-in) ---------- */
    const GLYPHS = GS.decode;
    const randGlyph = () => GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
    const isSpaceCh = (c) => c === ' ' || c === ' ' || c === '\n' || c === '\t';
    const makeDecoder = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const tnodes = []; let tn;
      while ((tn = walker.nextNode())) tnodes.push(tn);
      const originals = tnodes.map(n => n.nodeValue);
      const slots = [];
      originals.forEach((txt, ni) => { for (let i = 0; i < txt.length; i++) slots.push({ ni: ni, ch: txt.charAt(i) }); });
      const N = slots.length;
      const mode = el.getAttribute('data-decode-mode') || 'char';
      const dur = (parseFloat(el.getAttribute('data-decode-dur')) || 900) * INT.durMul;
      const lag = (parseFloat(el.getAttribute('data-decode-lag')) || 500) * INT.durMul;
      const typeMs = (mode === 'typedecode') ? (dur / Math.max(1, N)) : 0;
      if (mode === 'typedecode') { const _h = Math.ceil(el.getBoundingClientRect().height); if (_h) el.style.minHeight = _h + 'px'; }
      let raf = null;
      const wordOf = new Array(N);
      let _w = 0, _seen = false, _pending = false;
      for (let i = 0; i < N; i++) {
        if (isSpaceCh(slots[i].ch)) { wordOf[i] = _seen ? _w : 0; _pending = true; }
        else { if (_pending && _seen) { _w++; _pending = false; } wordOf[i] = _w; _seen = true; }
      }
      const totalWords = _w + 1;
      const paint = (resolved, scramble) => {
        const buf = originals.map(() => '');
        for (let i = 0; i < N; i++) {
          const s = slots[i];
          if (i < resolved || isSpaceCh(s.ch)) buf[s.ni] += s.ch;
          else buf[s.ni] += (scramble ? randGlyph() : s.ch);
        }
        for (let ni = 0; ni < tnodes.length; ni++) if (tnodes[ni].nodeValue !== buf[ni]) tnodes[ni].nodeValue = buf[ni];
      };
      const paintEmpty = () => { for (let ni = 0; ni < tnodes.length; ni++) if (tnodes[ni].nodeValue !== '') tnodes[ni].nodeValue = ''; };
      const paintType = (currentWord) => {
        const buf = originals.map(() => '');
        for (let i = 0; i < N; i++) {
          const s = slots[i]; const wn = wordOf[i];
          if (wn < currentWord) buf[s.ni] += s.ch;
          else if (wn === currentWord) buf[s.ni] += ((isSpaceCh(s.ch) || currentWord < 10) ? s.ch : randGlyph());
        }
        for (let ni = 0; ni < tnodes.length; ni++) if (tnodes[ni].nodeValue !== buf[ni]) tnodes[ni].nodeValue = buf[ni];
      };
      const snapWord = (resolved) => {
        if (resolved >= N) return N;
        let lastEnd = 0;
        for (let i = 0; i <= resolved && i < N; i++) { if (isSpaceCh(slots[i].ch)) lastEnd = i + 1; }
        return lastEnd;
      };
      const api = {
        el: el,
        stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } },
        showFinal() { api.stop(); paint(N, false); },
        scramble() { api.stop(); if (mode === 'typeword') paintType(0); else if (mode === 'typedecode') paintEmpty(); else paint(0, true); },
        /* typedecode: a type head streams chars in as cybertext L→R; a decode head trails `lag` ms behind */
        runTypeDecode() {
          api.stop();
          const t0 = nowMs();
          const glyphBuf = new Array(N).fill('');
          let lastFlip = 0;
          const totalMs = (N - 1) * typeMs + lag;
          const step = () => {
            const now = nowMs();
            const elapsed = now - t0;
            const flip = (now - lastFlip > INT.flip);
            if (flip) lastFlip = now;
            const buf = originals.map(() => '');
            for (let i = 0; i < N; i++) {
              const s = slots[i];
              const typeAt = i * typeMs;
              if (elapsed >= typeAt + lag) { buf[s.ni] += s.ch; }
              else if (elapsed >= typeAt) {
                if (isSpaceCh(s.ch)) buf[s.ni] += s.ch;
                else { if (flip || !glyphBuf[i]) glyphBuf[i] = randGlyph(); buf[s.ni] += glyphBuf[i]; }
              }
            }
            for (let ni = 0; ni < tnodes.length; ni++) if (tnodes[ni].nodeValue !== buf[ni]) tnodes[ni].nodeValue = buf[ni];
            if (elapsed < totalMs) raf = requestAnimationFrame(step);
            else { paint(N, false); raf = null; }
          };
          raf = requestAnimationFrame(step);
        },
        rescramble() {
          api.stop();
          const t0 = nowMs(); const rdur = 650; let lastFlip = 0;
          const tk = () => {
            const now = nowMs();
            let p = (now - t0) / rdur; if (p > 1) p = 1;
            const resolved = Math.floor((1 - p) * N);
            if (now - lastFlip > INT.flip) { paint(resolved, true); lastFlip = now; }
            if (p < 1) raf = requestAnimationFrame(tk); else { paint(0, true); raf = null; }
          };
          raf = requestAnimationFrame(tk);
        },
        run() {
          api.stop();
          if (mode === 'typedecode') { return api.runTypeDecode(); }
          const t0 = nowMs();
          let lastFlip = 0, lastResolved = -1;
          const tk = () => {
            const now = nowMs();
            let p = (now - t0) / dur; if (p > 1) p = 1;
            const e = 1 - Math.pow(1 - p, 2);
            if (mode === 'typeword') {
              const cw = Math.floor(e * totalWords);
              if (now - lastFlip > INT.flip || cw !== lastResolved) { paintType(cw); lastFlip = now; lastResolved = cw; }
              if (p < 1) { raf = requestAnimationFrame(tk); } else { paint(N, false); raf = null; }
              return;
            }
            let resolved = Math.floor(e * N);
            if (mode === 'word') resolved = snapWord(resolved);
            // throttle glyph churn so it reads as a calm decrypt, not noise
            if (now - lastFlip > INT.flip || resolved !== lastResolved) { paint(resolved, true); lastFlip = now; lastResolved = resolved; }
            if (p < 1) raf = requestAnimationFrame(tk);
            else { paint(N, false); raf = null; }
          };
          raf = requestAnimationFrame(tk);
        }
      };
      return api;
    };

    const decoders = [...root.querySelectorAll('[data-decode]')].map(makeDecoder);
    const maskers = [...root.querySelectorAll('[data-decode-mask]')].map(makeDecoder);
    const finePtr = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    // Hero name scramble/aberration only on desktop fine-pointer screens.
    // On phones/tablets the glyph-swap + JS-locked letter widths can collapse
    // the DAI layer into a solid block, so touch devices get a clean slide-in.
    const heroFx = finePtr;

    /* ================= HERO — signal decrypt centerpiece ================= */
    const huds = [...root.querySelectorAll('[data-hud]')];
    const eyebrow = root.querySelector('[data-seq="eyebrow"]');
    const nameWrap = root.querySelector('[data-name]');
    const subtitleEl = root.querySelector('[data-seq="subtitle"]');
    const cueEl = root.querySelector('[data-seq="cue"]');
    const daiLayer = root.querySelector('[data-dai-layer]');
    const dangLayer = root.querySelector('[data-dang-layer]');
    const chSpans = daiLayer ? [...daiLayer.querySelectorAll('[data-ch]')] : [];
    const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const BOXDRAW = '─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▚▞▙▟▛▜';
    const NAME_GLYPHS = (GS.name + '0123456789ABCDEF' + KATAKANA + BOXDRAW + '<>/\\[]{}=+*#%&$@?!').split('').filter((v, i, a) => a.indexOf(v) === i).join('');
    const rg = () => NAME_GLYPHS.charAt((Math.random() * NAME_GLYPHS.length) | 0);
    const ABER = ({ calm: 0.7, balanced: 1, intense: 1.6 })[htmlEl.getAttribute('data-glitch-intensity')] || 1;
    const chars = chSpans.map((el, i) => ({ el: el, final: el.textContent, i: i, locked: true, lockAt: 0, lastFlip: 0, w: 0 }));
    let nameRaf = null;
    // lock: snap to clean ink + a brief micro-bloom glow that fades out
    const lockChar = (c) => {
      c.locked = true;
      c.el.textContent = c.final;
      c.el.style.transition = 'none';
      c.el.style.color = '#0A0A0A';
      c.el.style.textShadow = '0 0 18px ' + GLOW + ', 0 0 6px ' + GLOW;
      requestAnimationFrame(() => {
        c.el.style.transition = 'text-shadow .45s ease, color .3s ease';
        c.el.style.textShadow = 'none';
      });
    };
    // unresolved: scramble glyph + RGB-split aberration ghosts
    const scrambleChar = (c, now) => {
      if (now - c.lastFlip > 58) { c.el.textContent = rg(); c.lastFlip = now; }
      const ax = (Math.random() * 5 - 2.5) * ABER;
      const ay = (Math.random() * 3 - 1.5) * ABER;
      c.el.style.transition = 'none';
      c.el.style.color = 'rgba(10,10,10,0.62)';
      c.el.style.textShadow = ax.toFixed(1) + 'px ' + ay.toFixed(1) + 'px 0 ' + ABER1 + ', ' + (-ax).toFixed(1) + 'px ' + (-ay).toFixed(1) + 'px 0 ' + ABER2;
    };
    const ensureNameLoop = () => {
      if (nameRaf) return;
      const loop = () => {
        const now = nowMs();
        let active = false;
        for (const c of chars) {
          if (c.locked) continue;
          if (now >= c.lockAt) lockChar(c);
          else { scrambleChar(c, now); active = true; }
        }
        nameRaf = active ? requestAnimationFrame(loop) : null;
      };
      nameRaf = requestAnimationFrame(loop);
    };
    const stopNameLoop = () => { if (nameRaf) { cancelAnimationFrame(nameRaf); nameRaf = null; } };
    const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const runWave = () => {
      const t0 = nowMs();
      const N = chars.length;
      chars.forEach((c, i) => { c.locked = false; c.lastFlip = 0; c.lockAt = t0 + easeInOut(N <= 1 ? 0 : i / (N - 1)) * (1600 * INT.durMul) + 320; });
      ensureNameLoop();
    };
    const corruptChar = (c, ms) => { c.locked = false; c.lockAt = nowMs() + (ms || 360); ensureNameLoop(); };
    const showNameFinal = () => { stopNameLoop(); chars.forEach(c => { c.locked = true; c.el.textContent = c.final; c.el.style.color = '#0A0A0A'; c.el.style.textShadow = 'none'; }); };

    /* DANG — outline letters that decrypt on hover (keep their stroke while scrambling) */
    const dangChars = dangLayer ? [...dangLayer.querySelectorAll('[data-dch]')].map(el => ({ el: el, final: el.textContent, locked: true, lockAt: 0, lastFlip: 0, w: 0 })) : [];
    let dangRaf = null;
    const dangLoop = () => {
      const now = nowMs();
      let active = false;
      for (const c of dangChars) {
        if (c.locked) continue;
        if (now >= c.lockAt) { c.locked = true; c.el.textContent = c.final; }
        else { if (now - c.lastFlip > 58) { c.el.textContent = rg(); c.lastFlip = now; } active = true; }
      }
      dangRaf = active ? requestAnimationFrame(dangLoop) : null;
    };
    const fixDangWidth = (c) => {
      if (!c.w) { const w = c.el.getBoundingClientRect().width; if (w) { c.w = w; c.el.style.width = w + 'px'; c.el.style.textAlign = 'center'; c.el.style.overflow = 'visible'; } }
    };
    const runDangWave = () => {
      const t0 = nowMs(); const N = dangChars.length;
      dangChars.forEach((c, i) => {
        fixDangWidth(c);
        c.locked = false; c.lastFlip = 0; c.lockAt = t0 + easeInOut(N <= 1 ? 0 : i / (N - 1)) * (1100 * INT.durMul) + 160;
      });
      if (!dangRaf) dangRaf = requestAnimationFrame(dangLoop);
    };
    const corruptDang = (c, ms) => {
      fixDangWidth(c);
      c.locked = false; c.lockAt = nowMs() + (ms || 420);
      if (!dangRaf) dangRaf = requestAnimationFrame(dangLoop);
    };
    if (finePtr) {
      // cursor across the name re-corrupts the characters it passes over
      chars.forEach(c => { c.el.addEventListener('mouseenter', () => corruptChar(c, 460 + Math.random() * 220)); });
      dangChars.forEach(c => { c.el.addEventListener('mouseenter', () => corruptDang(c, 420 + Math.random() * 200)); });
    }
    // click anywhere on the name → re-run the full staggered decrypt wave (desktop only)
    if (nameWrap && heroFx) {
      nameWrap.addEventListener('click', () => { runWave(); runDangWave(); });
    }

    const armHero = () => {
      huds.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(-8px)'; el.style.transition = 'opacity .8s ease, transform .8s ease'; });
      if (eyebrow) { eyebrow.style.opacity = '0'; eyebrow.style.transform = 'translateY(6px)'; eyebrow.style.transition = 'opacity .7s ease, transform .7s ease'; }
      if (subtitleEl) { subtitleEl.style.opacity = '0'; subtitleEl.style.transform = 'translateY(110%)'; subtitleEl.style.transition = 'opacity .9s cubic-bezier(.16,.84,.36,1), transform .9s cubic-bezier(.16,.84,.36,1)'; }
      if (cueEl) { cueEl.style.opacity = '0'; cueEl.style.transform = 'translateY(8px)'; cueEl.style.transition = 'opacity .7s ease, transform .7s ease'; }
      if (daiLayer) { daiLayer.style.opacity = '0'; daiLayer.style.transform = 'translateX(-64px)'; daiLayer.style.transition = 'opacity .7s cubic-bezier(.16,.84,.36,1), transform .7s cubic-bezier(.16,.84,.36,1)'; }
      if (dangLayer) { dangLayer.style.opacity = '0'; dangLayer.style.transform = 'translateX(-64px)'; dangLayer.style.transition = 'opacity .7s cubic-bezier(.16,.84,.36,1), transform .7s cubic-bezier(.16,.84,.36,1)'; }
      chars.forEach(c => {
        if (!heroFx) { c.locked = true; c.el.textContent = c.final; c.el.style.color = '#0A0A0A'; c.el.style.textShadow = 'none'; return; }
        if (!c.w) { const w = c.el.getBoundingClientRect().width; if (w) { c.w = w; c.el.style.width = w + 'px'; c.el.style.textAlign = 'center'; c.el.style.overflow = 'visible'; } }
        c.locked = false; c.el.style.color = 'rgba(10,10,10,0.45)'; c.el.style.textShadow = 'none'; c.el.textContent = rg();
      });
    };
    // re-measure letter widths once the display font is actually loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        chars.forEach(c => { if (c.locked && !nameRaf) { c.w = 0; const w = c.el.getBoundingClientRect().width; if (w) { c.w = w; c.el.style.width = w + 'px'; c.el.style.textAlign = 'center'; } } });
      }).catch(() => {});
    }
    let heroTOs = [];
    const runHeroSequence = () => {
      // each beat spaced ~0.5–0.7s so the viewer registers it
      huds.forEach((el, i) => heroTOs.push(setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, 160 + i * 150)));
      const tHud = 160 + huds.length * 150;
      const at = (fn, ms) => heroTOs.push(setTimeout(fn, ms));
      at(() => { if (eyebrow) { eyebrow.style.opacity = '1'; eyebrow.style.transform = 'none'; } }, tHud + 140);
      // DAI: slides in first as cybertext, then decrypts in place (scramble desktop-only)
      at(() => { if (daiLayer) { daiLayer.style.opacity = '1'; daiLayer.style.transform = 'none'; } if (heroFx) runWave(); else showNameFinal(); }, tHud + 660);
      // DANG: slides in later, already decrypted
      at(() => { if (dangLayer) { dangLayer.style.opacity = '1'; dangLayer.style.transform = 'none'; } if (heroFx) runDangWave(); }, tHud + 1360);
      at(() => { if (subtitleEl) { subtitleEl.style.opacity = '1'; subtitleEl.style.transform = 'none'; } }, tHud + 2020);
      at(() => { if (cueEl) { cueEl.style.opacity = '1'; cueEl.style.transform = 'none'; } }, tHud + 2620);
    };
    const fadeHero = () => { // prefers-reduced-motion: plain fade, no scramble
      showNameFinal();
      const fadeEls = [...huds, eyebrow, daiLayer, dangLayer, subtitleEl, cueEl].filter(Boolean);
      fadeEls.forEach(el => { el.style.transition = 'opacity .7s ease'; el.style.transform = 'none'; el.style.opacity = '0'; });
      requestAnimationFrame(() => fadeEls.forEach(el => { el.style.opacity = '1'; }));
      heroTOs.push(setTimeout(() => fadeEls.forEach(el => { el.style.opacity = '1'; }), 1000));
    };

    /* ---------- stats odometer count-up (fires once on scroll-in) ---------- */
    const counters = [...root.querySelectorAll('[data-countup]')].map(el => ({
      el: el,
      to: parseFloat(el.getAttribute('data-count-to')) || 0,
      from: parseFloat(el.getAttribute('data-count-from')) || 0,
      dec: parseInt(el.getAttribute('data-count-decimals') || '0', 10),
      pad: parseInt(el.getAttribute('data-count-pad') || '0', 10),
      oh: el.getAttribute('data-count-oh') === '1',
      dur: parseFloat(el.getAttribute('data-count-dur')) || 1100,
      finalText: el.textContent,
      raf: null
    }));
    const fmtCount = (c, val) => {
      let s = val.toFixed(c.dec);
      if (c.pad > 0) {
        const parts = s.split('.');
        let ip = parts[0];
        while (ip.length < c.pad) ip = '0' + ip;
        s = ip + (c.dec > 0 ? '.' + parts[1] : '');
      }
      if (c.oh) s = s.replace(/0/g, 'O');
      return s;
    };
    const armCount = (c) => { if (c.raf) { cancelAnimationFrame(c.raf); c.raf = null; } c.el.textContent = fmtCount(c, c.from); };
    const runCount = (c) => {
      if (c.raf) cancelAnimationFrame(c.raf);
      const t0 = nowMs(); const ease = (t) => 1 - Math.pow(1 - t, 3);
      const tk = () => {
        const p = Math.min((nowMs() - t0) / c.dur, 1);
        c.el.textContent = fmtCount(c, c.from + (c.to - c.from) * ease(p));
        if (p < 1) c.raf = requestAnimationFrame(tk); else { c.el.textContent = c.finalText; c.raf = null; }
      };
      c.raf = requestAnimationFrame(tk);
    };
    const setupCounters = (animate) => {
      if (!animate) { counters.forEach(c => { c.el.textContent = c.finalText; }); return; }
      counters.forEach(armCount);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(en => {
            const c = counters.find(x => x.el === en.target);
            if (!c) return;
            if (en.isIntersecting) { runCount(c); io.unobserve(en.target); }
          });
        }, { threshold: 0.6 });
        counters.forEach(c => io.observe(c.el));
      } else { counters.forEach(runCount); }
    };

    const setupDecode = (animate) => {
      if (!animate) {
        decoders.forEach(a => a.showFinal());
        maskers.forEach(a => a.showFinal());
        return;
      }
      decoders.forEach(a => a.scramble());
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(en => {
            const a = decoders.find(d => d.el === en.target);
            if (!a) return;
            if (en.isIntersecting) { a.run(); io.unobserve(en.target); }
          });
        }, { threshold: 0.3 });
        decoders.forEach(a => io.observe(a.el));
      } else {
        decoders.forEach(a => a.run());
      }
      if (finePtr) {
        // contact fields stay masked as cybertext until hovered/focused
        maskers.forEach(a => {
          a.scramble();
          const link = a.el.closest('[data-link]') || a.el;
          link.addEventListener('mouseenter', () => a.run());
          link.addEventListener('mouseleave', () => a.rescramble());
          link.addEventListener('focusin', () => a.run());
          link.addEventListener('focusout', () => a.rescramble());
        });
      } else {
        maskers.forEach(a => a.showFinal());
      }
    };

    /* ---------- loading screen: count 0 -> 100, then fade away slowly ---------- */
    const loader = root.querySelector('[data-loader]');
    const loadPct = root.querySelector('[data-load-pct]');
    const loadBar = root.querySelector('[data-load-bar]');
    const fmtPct = (n) => String(Math.max(0, Math.min(100, Math.round(n)))).padStart(3, '0').replace(/0/g, 'O');
    let loaderRaf = null;
    const hideLoader = (slow) => {
      if (!loader || !loader.parentNode) return;
      loader.style.transition = 'opacity ' + (slow ? '0.9s' : '0s') + ' cubic-bezier(.4,0,.2,1)';
      loader.style.pointerEvents = 'none';
      requestAnimationFrame(() => { loader.style.opacity = '0'; });
      setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, slow ? 1000 : 30);
    };
    let heroStarted = false;
    const startHero = () => { if (heroStarted) return; heroStarted = true; runHeroSequence(); };
    const runLoader = (onDone) => {
      if (!loader) { onDone && onDone(); return; }
      const dur = 2300;
      const t0 = nowMs();
      const tk = () => {
        const p = Math.min((nowMs() - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const pct = eased * 100;
        if (loadPct) loadPct.textContent = fmtPct(pct);
        if (loadBar) loadBar.style.width = pct + '%';
        if (p < 1) { loaderRaf = requestAnimationFrame(tk); }
        else { loaderRaf = null; if (loadPct) loadPct.textContent = '1OO'; if (loadBar) loadBar.style.width = '100%'; setTimeout(() => { hideLoader(true); onDone && onDone(); }, 320); }
      };
      loaderRaf = requestAnimationFrame(tk);
    };

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      forceShow();
      setupDecode(false);
      setupCounters(false);
      if (loadPct) loadPct.textContent = '1OO';
      if (loadBar) loadBar.style.width = '100%';
      hideLoader(true);
      fadeHero();
    } else {
      items.forEach(arm);
      armHero();
      animateReveal();
      setupDecode(true);
      setupCounters(true);
      runLoader(startHero);
      // safety: loader must never get stuck covering the page
      setTimeout(() => { hideLoader(true); startHero(); }, 5200);
    }

    /* ---------- expand-on-click work rows (accordion) ---------- */
    const rows = [...root.querySelectorAll('[data-work-row]')];
    const closeRow = (r) => {
      r.setAttribute('data-open', '0');
      const det = r.querySelector('[data-work-detail]');
      const mk = r.querySelector('[data-work-mark]');
      const hd = r.querySelector('[data-work-head]');
      if (det) { det.style.maxHeight = '0px'; det.style.opacity = '0'; }
      if (mk) { mk.style.transform = 'rotate(0deg)'; }
      if (hd) { hd.style.paddingLeft = '0px'; }
    };
    const openRow = (r) => {
      r.setAttribute('data-open', '1');
      const det = r.querySelector('[data-work-detail]');
      const mk = r.querySelector('[data-work-mark]');
      const hd = r.querySelector('[data-work-head]');
      if (det) { det.style.maxHeight = det.scrollHeight + 'px'; det.style.opacity = '1'; }
      if (mk) { mk.style.transform = 'rotate(45deg)'; }
      if (hd) { hd.style.paddingLeft = '14px'; }
    };
    rows.forEach(row => {
      const head = row.querySelector('[data-work-head]');
      if (!head) return;
      head.addEventListener('click', () => {
        const isOpen = row.getAttribute('data-open') === '1';
        rows.forEach(r => { if (r !== row) closeRow(r); });
        if (isOpen) closeRow(row); else openRow(row);
      });
      head.addEventListener('mouseenter', () => { if (row.getAttribute('data-open') !== '1') head.style.paddingLeft = '14px'; });
      head.addEventListener('mouseleave', () => { if (row.getAttribute('data-open') !== '1') head.style.paddingLeft = '0px'; });
    });
    // keep open row sized correctly on resize
    window.addEventListener('resize', () => {
      rows.forEach(r => {
        if (r.getAttribute('data-open') === '1') {
          const det = r.querySelector('[data-work-detail]');
          if (det) { det.style.maxHeight = 'none'; const h = det.scrollHeight; det.style.maxHeight = h + 'px'; }
        }
      });
    });

    /* ---------- contact link hover fill ---------- */
    root.querySelectorAll('[data-link]').forEach(a => {
      const spans = a.querySelectorAll('span');
      a.addEventListener('mouseenter', () => { a.style.background = '#0A0A0A'; a.style.color = '#F4F2ED'; spans.forEach(s => { if (s.dataset.oc === undefined) s.dataset.oc = s.style.color || ''; s.style.color = '#F4F2ED'; }); });
      a.addEventListener('mouseleave', () => { a.style.background = 'transparent'; a.style.color = '#0A0A0A'; spans.forEach(s => { s.style.color = s.dataset.oc || ''; }); });
    });

    /* ---------- side nav rail: scroll-tracked + click-to-jump ---------- */
    const rail = root.querySelector('[data-navrail]');
    if (rail) {
      const navBtns = [...rail.querySelectorAll('[data-nav]')];
      const sectionFor = (lab) => root.querySelector('[data-screen-label="' + lab + '"]');
      let activeLabel = navBtns.length ? navBtns[0].getAttribute('data-nav') : null;
      let hoverLabel = null;
      const paintNav = () => {
        navBtns.forEach(btn => {
          const lab = btn.getAttribute('data-nav');
          const isActive = lab === activeLabel;
          const isHover = lab === hoverLabel;
          const on = isActive || isHover;
          const labelEl = btn.querySelector('[data-nav-label]');
          const numEl = btn.querySelector('[data-nav-num]');
          const tickEl = btn.querySelector('[data-nav-tick]');
          if (labelEl) { labelEl.style.opacity = on ? '1' : '0'; labelEl.style.transform = on ? 'translateX(0)' : 'translateX(8px)'; labelEl.style.color = isActive ? '#0A0A0A' : 'rgba(10,10,10,0.6)'; }
          if (numEl) { numEl.style.color = isActive ? 'var(--dd-accent, #C2410C)' : (isHover ? '#0A0A0A' : 'rgba(10,10,10,0.4)'); }
          if (tickEl) { tickEl.style.width = isActive ? '40px' : (isHover ? '26px' : '16px'); tickEl.style.background = isActive ? 'var(--dd-accent, #C2410C)' : (isHover ? '#0A0A0A' : 'rgba(10,10,10,0.3)'); }
        });
      };
      paintNav();
      // rAF smooth-scroll (native behavior:'smooth' is unreliable in some embeds)
      const scroller = document.scrollingElement || document.documentElement;
      let navScrollRaf = null;
      const smoothScrollTo = (toY) => {
        const startY = window.scrollY || scroller.scrollTop || 0;
        const maxY = Math.max(0, scroller.scrollHeight - window.innerHeight);
        const endY = Math.max(0, Math.min(Math.round(toY), maxY));
        if (reduceMotion || Math.abs(endY - startY) < 2) { window.scrollTo(0, endY); return; }
        if (navScrollRaf) cancelAnimationFrame(navScrollRaf);
        const dist = endY - startY;
        const dur = Math.min(1100, Math.max(420, Math.abs(dist) * 0.5));
        const t0 = nowMs();
        const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const step = () => {
          const p = Math.min((nowMs() - t0) / dur, 1);
          window.scrollTo(0, Math.round(startY + dist * ease(p)));
          if (p < 1) navScrollRaf = requestAnimationFrame(step); else navScrollRaf = null;
        };
        navScrollRaf = requestAnimationFrame(step);
      };
      navBtns.forEach(btn => {
        const lab = btn.getAttribute('data-nav');
        btn.addEventListener('mouseenter', () => { hoverLabel = lab; paintNav(); });
        btn.addEventListener('mouseleave', () => { if (hoverLabel === lab) hoverLabel = null; paintNav(); });
        btn.addEventListener('click', () => {
          const sec = sectionFor(lab);
          if (!sec) return;
          activeLabel = lab; paintNav();
          smoothScrollTo(sec.getBoundingClientRect().top + (window.scrollY || scroller.scrollTop || 0));
        });
      });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(en => {
            if (en.isIntersecting) {
              const lab = en.target.getAttribute('data-screen-label');
              if (lab && navBtns.some(b => b.getAttribute('data-nav') === lab)) { activeLabel = lab; paintNav(); }
            }
          });
        }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
        navBtns.forEach(btn => { const s = sectionFor(btn.getAttribute('data-nav')); if (s) io.observe(s); });
      }
    }

    /* ---------- custom cursor (desktop fine-pointer only) ---------- */
    if (finePtr) {
      const cur = document.createElement('div');
      Object.assign(cur.style, {
        position: 'fixed', left: '0', top: '0', width: '12px', height: '12px',
        marginLeft: '-6px', marginTop: '-6px', border: '1.5px solid #ffffff',
        borderRadius: '50%', pointerEvents: 'none', zIndex: '99999',
        transition: 'width .22s ease, height .22s ease, margin .22s ease, background .22s ease, border-radius .22s ease, opacity .3s ease',
        opacity: '0', mixBlendMode: 'difference', background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      });
      const curLabel = document.createElement('span');
      curLabel.textContent = 'VISIT';
      Object.assign(curLabel.style, { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '10px', letterSpacing: '0.16em', color: '#ffffff', opacity: '0', transition: 'opacity .2s ease', userSelect: 'none', pointerEvents: 'none' });
      cur.appendChild(curLabel);
      document.body.appendChild(cur);
      let tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty;
      window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cur.style.opacity = '1'; });
      document.addEventListener('mouseleave', () => { cur.style.opacity = '0'; });
      const loop = () => {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
        requestAnimationFrame(loop);
      };
      loop();
      const grow = () => { cur.style.width = '46px'; cur.style.height = '46px'; cur.style.marginLeft = '-23px'; cur.style.marginTop = '-23px'; cur.style.background = 'rgba(255,255,255,0.12)'; };
      const shrink = () => { cur.style.width = '12px'; cur.style.height = '12px'; cur.style.marginLeft = '-6px'; cur.style.marginTop = '-6px'; cur.style.background = 'transparent'; };
      root.querySelectorAll('[data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', grow);
        el.addEventListener('mouseleave', shrink);
      });
      // labeled "VISIT" cursor box over the selected-work screenshots
      const visitGrow = () => { cur.style.width = '94px'; cur.style.height = '40px'; cur.style.marginLeft = '-47px'; cur.style.marginTop = '-20px'; cur.style.borderRadius = '5px'; cur.style.background = 'rgba(255,255,255,0.16)'; curLabel.style.opacity = '1'; };
      const visitShrink = () => { cur.style.borderRadius = '50%'; shrink(); curLabel.style.opacity = '0'; };
      root.querySelectorAll('[data-cursor-visit]').forEach(el => {
        el.addEventListener('mouseenter', visitGrow);
        el.addEventListener('mouseleave', visitShrink);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
