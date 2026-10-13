/**
 * Puppertino v2 — Puppertino Glass.
 *
 * Real-time Liquid Glass for surfaces: .p-glass, .p-glass-clear, the
 * .p-tab-bar and its accessory circle, and the iOS nav bar buttons,
 * toolbar, and bar search field. The rendering is Glassworks
 * (github.com/codedgar/glassworks): it snapshots the page and refracts
 * that snapshot through a WebGL shader drawn under each surface. This
 * script is the Puppertino side. It reads each surface's recipe from
 * CSS custom properties, keeps the CSS material showing until the
 * first frame is ready, recaptures when the appearance changes, and
 * steps aside wherever the glass cannot or should not render.
 *
 * Load a capture engine and Glassworks before this script:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@zumer/snapdom/dist/snapdom.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@codedgar/glassworks@2.0.0/dist/glassworks.umd.min.js"></script>
 *   <script src="src/js/glass.js"></script>
 *
 * With a bundler, hand Glassworks over instead:
 *
 *   PuppertinoGlass.use(glassworks, { engine: createSnapdomEngine(snapdom) });
 *
 * Optional: without Glassworks, WebGL, or a capture engine, and with
 * reduced transparency, increased contrast, or forced colors on, every
 * surface keeps its CSS material. The styles live in materials.css.
 *
 * Surfaces present when the script runs are enhanced automatically.
 * Call PuppertinoGlass.enhance(root) for ones added later, and
 * PuppertinoGlass.refresh() after changing what sits behind the glass.
 * Mark the region the glass refracts with [data-p-glass-backdrop]; the
 * whole <body> is used otherwise, and a smaller region captures faster.
 *
 * With --p-glass-adaptive: 1, small Regular surfaces (64px or less
 * across) flip to dark glass over dark content and light glass over
 * light content, by setting data-p-theme on the surface. Off by
 * default: macOS 27 glass keeps the page's appearance over any
 * backdrop.
 *
 * The recipe is read from the surface's custom properties: the face
 * (how the frosted, bent backdrop is mapped before it shows through),
 * multipliers on the bend and the frost, and the slider that stands in
 * for the system's Liquid Glass setting. Sizes come from the surface's
 * shorter side, so a button and a panel bend and frost the way their
 * native counterparts do. Dark glass caps how bright a card can get
 * well below a button, so each surface gets data-p-glass-size="small"
 * or "large" by a 64px rule.
 */
(function () {
  'use strict';

  // The iOS bar controls are Regular glass too. Solid (prominent) ones
  // are not glass, so they are left out.
  var SELECTOR = '.p-glass, .p-glass-clear, .p-tab-bar, .p-tab-bar-accessory, ' +
    '.p-nav-bar__button:not(.p-nav-bar__button-prominent), ' +
    '.p-toolbar-touch:not(.p-toolbar-touch-prominent), .p-bar-search';
  var BACKDROP = '[data-p-glass-backdrop]';

  // The rim bend, measured from NSGlassEffectView on macOS 27 (Liquid
  // Glass slider at its Clear end) and from SwiftUI glassEffect on iOS
  // 27 over gray ramps: content shifts toward the centre by
  // edge * exp(-d / edgeFalloff) + broad * exp(-d / broadFalloff) px, d
  // being the distance in from the rim. On macOS Regular the edge term
  // only folds the sides facing the top left. Rows are [shorter side
  // px, edge, edgeFalloff, broad, broadFalloff]; a surface reads its
  // row by interpolation and the ends hold. The frost is a Gaussian
  // sigma in px from the same controls over bar patterns: [shorter
  // side px, sigma px]. --p-glass-platform picks the set.
  var PROFILES = {
    ios: {
      regularBend: [[44, 11.8, 3, 0, 1], [74, 21, 3.5, 0, 1], [200, 38, 4, 0, 1]],
      clearBend: [[44, 30.1, 3.8, 0, 1], [74, 48.6, 4.8, 0, 1], [200, 72.5, 4.2, 0, 1]],
      regularFrost: [[44, 8], [74, 10], [200, 16]],
      clearFrost: [[44, 1], [200, 1]]
    }
  };

  // Small Regular surfaces (buttons, bars) may flip between light and
  // dark to suit what is behind them. Bigger ones keep the page's
  // appearance: a flip over that much area would be distracting. The
  // same line splits the small and large caps.
  var ADAPT_MAX = 64;
  var TO_DARK = 0.35; // backdrop luminance below which light glass turns dark
  var TO_LIGHT = 0.85; // and above which dark glass turns light

  var library = null; // set by use()
  var engine; // set by use()
  var count = 0;
  var surfaces = []; // { el, style, lens }
  var warned = {};

  function warn(key, message) {
    if (warned[key]) return;
    warned[key] = true;
    console.warn('Puppertino Glass: ' + message);
  }

  // Glassworks' script build sets window.glassworks, and keeps the
  // liquidGL name it inherited from its upstream as an alias.
  function glassworks() {
    return library || window.glassworks || window.liquidGL || null;
  }

  function renderer() {
    return window.__liquidGLRenderer__ || null;
  }

  function hasEngine(lib) {
    if (engine) return true;
    if (lib.resolveEngine) {
      try {
        return !!lib.resolveEngine('snapdom');
      } catch (e) {
        return false;
      }
    }
    return !!(window.snapdom || window.html2canvas);
  }

  var webgl;
  function hasWebGL() {
    if (webgl === undefined) {
      var canvas = document.createElement('canvas');
      webgl = !!(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      );
    }
    return webgl;
  }

  var declineQueries = [
    '(prefers-reduced-transparency: reduce)',
    '(prefers-contrast: more)',
    '(forced-colors: active)'
  ].map(function (query) { return window.matchMedia(query); });

  // Glass over a busy backdrop is exactly the contrast problem these
  // settings exist to solve, so the material stays opaque.
  function declined() {
    return declineQueries.some(function (query) { return query.matches; });
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Glassworks draws every surface on one canvas appended to <body>,
  // stacked just under the highest surface. An ancestor that forms its
  // own stacking context paints as a unit, so it lands either wholly
  // over that canvas (hiding the glass) or wholly under it (hiding the
  // surface's content). Either way the surface is better off as a
  // material.
  function trapped(el) {
    for (var node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      var s = getComputedStyle(node);
      if (
        s.transform !== 'none' ||
        (s.translate && s.translate !== 'none') ||
        (s.scale && s.scale !== 'none') ||
        (s.rotate && s.rotate !== 'none') ||
        s.filter !== 'none' ||
        s.perspective !== 'none' ||
        s.isolation === 'isolate' ||
        s.mixBlendMode !== 'normal' ||
        parseFloat(s.opacity) < 1 ||
        (s.clipPath && s.clipPath !== 'none') ||
        (s.backdropFilter && s.backdropFilter !== 'none') ||
        (s.position !== 'static' && s.zIndex !== 'auto') ||
        /paint|layout|strict|content/.test(s.contain || '') ||
        /transform|opacity|filter/.test(s.willChange || '')
      ) {
        return node;
      }
    }
    return null;
  }

  function number(style, name, fallback) {
    var value = parseFloat(style.getPropertyValue(name));
    return isNaN(value) ? fallback : value;
  }

  function recipe(el) {
    var style = getComputedStyle(el);
    return {
      bend: number(style, '--p-glass-bend', 1),
      reach: number(style, '--p-glass-bend-reach', 1),
      frost: number(style, '--p-glass-frost', 1),
      slider: number(style, '--p-glass-slider', 0),
      light: number(style, '--p-glass-light', 0) > 0,
      magnify: number(style, '--p-glass-magnify', 1),
      // Glassworks 2 draws two fixed rim highlights (+45° and -135°);
      // they don't move, so reduced motion leaves them alone.
      specular: number(style, '--p-glass-specular', 0) > 0,
      adaptive: number(style, '--p-glass-adaptive', 0) > 0
    };
  }

  // The soft ceiling on what shows through, read after the surface
  // knows its size and tone, because dark glass caps small and large
  // surfaces differently and a small surface may flip tone.
  function cap(el) {
    var style = getComputedStyle(el);
    var large = el.getAttribute('data-p-glass-size') === 'large';
    var value = number(style, large ? '--p-glass-cap-large' : '--p-glass-cap', 1);
    return Math.max(0, Math.min(1, value));
  }

  // The face: what the backdrop is mapped through once blurred and bent,
  // read from the surface's tokens so light, dark and Clear differ in
  // CSS only. Dark Regular's luma ceiling depends on size.
  function face(el, side, slider) {
    var style = getComputedStyle(el);
    var fill = color(style.getPropertyValue('--p-glass-face-fill')) || [1, 1, 1, 0];
    var fillAlpha = number(style, '--p-glass-face-fill-alpha', 0);
    var fillSlider = number(style, '--p-glass-face-fill-slider', 0);
    var lumaSmall = number(style, '--p-glass-face-max-luma', 1);
    var lumaLarge = number(style, '--p-glass-face-max-luma-large', lumaSmall);
    var t = Math.max(0, Math.min(1, (side - 64) / 40));
    return {
      white: number(style, '--p-glass-face-white', 1),
      black: number(style, '--p-glass-face-black', 0),
      saturation: number(style, '--p-glass-face-saturation', 1),
      fill: [fill[0], fill[1], fill[2], Math.min(1, fillAlpha + fillSlider * slider)],
      maxLuma: lumaSmall + (lumaLarge - lumaSmall) * t
    };
  }

  function color(value) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(value || '');
    if (!m) return null;
    var a = m[4] === undefined ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255, a];
  }

  // Pointer glass. The rim shift and the band it fades over grow with
  // the shorter side and stop growing at 120px and 80px (Clear: 92px
  // and 55px), whatever the corner radius or aspect; the shift profile
  // is the bend model's sharp term plus its broad term. Regular frost
  // grows from about 6.5px on small surfaces to 10px from 160px up;
  // Clear is frosted twice as much and keeps growing with size. With
  // --p-glass-light the sharp term only folds the sides facing the top
  // left, the way macOS 27 lights its glass; the default folds every
  // side alike.
  function pointerGlass(el, side, values, clear) {
    var amount = clear ? Math.min(0.65 * side, 60) : Math.min(0.5 * side, 60);
    var height = clear ? Math.min(0.36 * side, 20) : Math.min(0.25 * side, 20);
    var grow = Math.max(0, Math.min(1, (side - 64) / 96));
    var frost = clear ? Math.min(20, 10 + 0.12 * Math.max(0, side - 44)) : 10.5 * Math.sqrt(0.4 + 0.4 * grow);
    return {
      bend: {
        edge: 0.5 * amount * values.bend,
        falloff: 0.12 * height * values.reach,
        tail: 0.38 * amount * values.bend,
        tailFalloff: 0.45 * height * values.reach,
        direction: values.light && !clear ? [-1, -1] : null
      },
      glass: { blurMix: 1, face: face(el, side, values.slider) },
      frost: frost * values.frost
    };
  }

  function lookup(table, side) {
    if (side <= table[0][0]) return table[0].slice(1);
    var last = table[table.length - 1];
    if (side >= last[0]) return last.slice(1);
    for (var i = 1; i < table.length; i++) {
      if (side <= table[i][0]) {
        var a = table[i - 1], b = table[i];
        var t = (side - a[0]) / (b[0] - a[0]);
        var out = [];
        for (var j = 1; j < a.length; j++) out.push(a[j] + (b[j] - a[j]) * t);
        return out;
      }
    }
    return last.slice(1);
  }

  function shortSide(el) {
    var rect = el.getBoundingClientRect();
    return Math.min(rect.width, rect.height) || 1;
  }

  // Marks the surface small (64px or less across) or large, which picks
  // --p-glass-tint or --p-glass-tint-large in materials.css. A surface
  // that isn't laid out yet (0 across) is left as it was.
  function sizeClass(el, side) {
    if (!side) return;
    var size = side <= ADAPT_MAX ? 'small' : 'large';
    if (el.getAttribute('data-p-glass-size') !== size) el.setAttribute('data-p-glass-size', size);
  }

  // The bend and frost for a surface at its current size.
  function tuned(el, values) {
    var clear = el.classList.contains('p-glass-clear');
    var side = shortSide(el);
    sizeClass(el, side);
    var platform = (getComputedStyle(el).getPropertyValue('--p-glass-platform') || '').trim();
    if (platform !== 'ios') return pointerGlass(el, side, values, clear);
    var profile = PROFILES.ios;
    var bend = lookup(clear ? profile.clearBend : profile.regularBend, side);
    var frost = lookup(clear ? profile.clearFrost : profile.regularFrost, side)[0];
    return {
      bend: {
        edge: bend[0] * values.bend,
        falloff: bend[1] * values.reach,
        tail: bend[2] * values.bend,
        tailFalloff: bend[3] * values.reach,
        direction: clear ? null : profile.regularDirection || null
      },
      frost: frost * values.frost
    };
  }

  function retune() {
    for (var i = 0; i < surfaces.length; i++) {
      var surface = surfaces[i];
      if (!surface.lens || !surface.lens.options) continue;
      var t = tuned(surface.el, surface.recipe);
      surface.lens.options.bend = t.bend || null;
      surface.lens.options.glass = t.glass || null;
      surface.lens.options.frost = t.frost;
      surface.lens.options.cap = t.glass ? 1 : cap(surface.el);
    }
    adaptSoon();
  }

  // ── Adaptive appearance ──────────────────────────────────────────────
  // Reads the snapshot under each small Regular surface and flips it to
  // dark glass over dark content, or light glass over light content,
  // with hysteresis so it doesn't flicker at the boundary. The flip is
  // data-p-theme on the surface, so its labels follow the glass.

  var probe = null;
  function luminance(r, el) {
    var canvas = r.staticSnapshotCanvas;
    if (!canvas || !canvas.width || !r.snapshotTarget) return null;
    var base = r.snapshotTarget.getBoundingClientRect();
    var rect = el.getBoundingClientRect();
    var f = r.scaleFactor || 1;
    var x = Math.max(0, (rect.left - base.left) * f);
    var y = Math.max(0, (rect.top - base.top) * f);
    var w = Math.min(canvas.width - x, rect.width * f);
    var h = Math.min(canvas.height - y, rect.height * f);
    if (w < 1 || h < 1) return null;
    if (!probe) {
      probe = document.createElement('canvas');
      probe.width = probe.height = 8;
    }
    try {
      var ctx = probe.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 8, 8);
      ctx.drawImage(canvas, x, y, w, h, 0, 0, 8, 8);
      var data = ctx.getImageData(0, 0, 8, 8).data;
      var sum = 0, n = 0;
      for (var i = 0; i < data.length; i += 4) {
        if (!data[i + 3]) continue;
        sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        n++;
      }
      return n ? sum / n : null;
    } catch (e) {
      return null; // a tainted snapshot can't be read
    }
  }

  // The appearance the surface would have without adapting: light when
  // its parent's large glass tint is light. (The small dark tint is a
  // clear light gray, so it can't tell the two apart.)
  function inherited(el) {
    var style = getComputedStyle(el.parentElement || document.documentElement);
    var tint = style.getPropertyValue('--p-glass-tint-large') || style.getPropertyValue('--p-glass-tint');
    var rgb = tint.match(/[\d.]+/g);
    if (!rgb) return 'light';
    return (+rgb[0] + +rgb[1] + +rgb[2]) / 3 > 127 ? 'light' : 'dark';
  }

  function adapt() {
    var r = renderer();
    if (!r) return;
    for (var i = 0; i < surfaces.length; i++) {
      var surface = surfaces[i];
      if (!surface.adaptive || surface.el.getAttribute('data-p-glass') !== 'live') continue;
      var rect = surface.el.getBoundingClientRect();
      var small = Math.min(rect.width, rect.height) <= ADAPT_MAX;
      var base = inherited(surface.el);
      if (base !== surface.base) {
        surface.base = base;
        surface.tone = base;
      }
      var tone = surface.tone || base;
      var lum = small ? luminance(r, surface.el) : null;
      if (lum === null) tone = base;
      else if (tone === 'light' && lum < TO_DARK) tone = 'dark';
      else if (tone === 'dark' && lum > TO_LIGHT) tone = 'light';
      surface.tone = tone;
      if (tone === base) surface.el.removeAttribute('data-p-theme');
      else surface.el.setAttribute('data-p-theme', tone + 'mode');
      if (surface.lens && surface.lens.options) {
        var tt = tuned(surface.el, surface.recipe);
        surface.lens.options.glass = tt.glass || null;
        surface.lens.options.cap = tt.glass ? 1 : cap(surface.el);
      }
    }
  }

  var adaptFrame = 0;
  function adaptSoon() {
    if (adaptFrame) return;
    adaptFrame = requestAnimationFrame(function () {
      adaptFrame = 0;
      adapt();
    });
  }

  function find(el) {
    for (var i = 0; i < surfaces.length; i++) {
      if (surfaces[i].el === el) return i;
    }
    return -1;
  }

  // Glassworks has no way to remove a lens, so this undoes one by hand:
  // stop drawing it and put back the inline styles it replaced.
  function release(el) {
    var index = find(el);
    if (index === -1) return;
    var surface = surfaces.splice(index, 1)[0];
    var r = renderer();
    if (r && surface.lens) {
      var at = r.lenses.indexOf(surface.lens);
      if (at !== -1) r.lenses.splice(at, 1);
      if (surface.lens._sizeObs) surface.lens._sizeObs.disconnect();
      if (surface.lens._shadowEl) surface.lens._shadowEl.remove();
    }
    if (surface.style === null) el.removeAttribute('style');
    else el.setAttribute('style', surface.style);
    if (surface.adaptive) el.removeAttribute('data-p-theme');
    el.removeAttribute('data-p-glass');
    el.removeAttribute('data-p-glass-size');
    el.removeAttribute('data-p-glass-id');
  }

  function releaseAll() {
    while (surfaces.length) release(surfaces[0].el);
  }

  function live(el) {
    var surface = surfaces[find(el)];
    if (!surface) return;
    var r = renderer();
    // Glassworks reveals a lens even when the capture failed. Without a
    // texture there is nothing under the surface but the tint.
    if (!r || !r.textureWidth) {
      release(el);
      return;
    }
    // A reveal leaves opacity: 1 inline, which would override the CSS.
    el.style.opacity = surface.opacity;
    el.setAttribute('data-p-glass', 'live');
    retune();
  }

  function enhanceOne(lib, el) {
    if (el.hasAttribute('data-p-glass')) return false;

    var cage = trapped(el);
    if (cage) {
      warn('trapped', 'a surface sits inside an element that forms its own stacking context ' +
        '(transform, filter, opacity, z-index, or similar), so it stays a plain material.');
      el.setAttribute('data-p-glass', 'off');
      return false;
    }

    var id = String(++count);
    var surface = {
      el: el,
      style: el.getAttribute('style'),
      opacity: el.style.opacity,
      transition: el.style.transition,
      lens: null
    };
    surfaces.push(surface);
    el.setAttribute('data-p-glass-id', id);
    el.setAttribute('data-p-glass', 'pending');

    // The lens needs a stacking position of its own, and every surface
    // must share the same one (see --p-glass-z).
    var style = getComputedStyle(el);
    if (style.position === 'static') el.style.position = 'relative';
    if (style.zIndex === 'auto') el.style.zIndex = 'var(--p-glass-z, 1)';

    var options = recipe(el);
    surface.recipe = { bend: options.bend, reach: options.reach, frost: options.frost, slider: options.slider, light: options.light };
    // Clear glass never adapts (Apple's doesn't either), and a surface
    // the author has pinned to an appearance keeps it.
    surface.adaptive = options.adaptive &&
      !el.classList.contains('p-glass-clear') &&
      !el.hasAttribute('data-p-theme');
    delete options.adaptive;
    delete options.reach;
    var t = tuned(el, surface.recipe);
    options.bend = t.bend || null;
    options.glass = t.glass || null;
    options.frost = t.frost;
    options.cap = t.glass ? 1 : cap(el);
    options.target = '[data-p-glass-id="' + id + '"]';
    options.snapshot = document.querySelector(BACKDROP) ? BACKDROP : 'body';
    options.resolution = Math.min(2, window.devicePixelRatio || 1);
    options.shadow = false; // components bring their own
    options.tilt = false;
    options.reveal = 'none';
    options.on = {
      init: function () { live(el); }
    };
    if (engine) options.engine = engine;

    try {
      surface.lens = lib(options) || null;
    } catch (error) {
      release(el);
      warn('failed', 'Glassworks could not start (' + (error && error.message) + ').');
      return false;
    }

    // Glassworks hides the element until the first frame and turns off
    // its transitions. The ::before material covers the wait instead.
    if (surface.lens && surface.lens.el === el) {
      el.style.opacity = surface.opacity;
      el.style.transition = surface.transition;
    } else {
      release(el);
      return false;
    }
    return true;
  }

  function checkLayers() {
    var z = null;
    for (var i = 0; i < surfaces.length; i++) {
      var value = getComputedStyle(surfaces[i].el).zIndex;
      if (z === null) z = value;
      else if (value !== z) {
        warn('layers', 'glass surfaces on this page sit at different z-index values. ' +
          'They share one canvas, placed under the highest, so the lower ones lose their content. ' +
          'Give them the same z-index.');
        return;
      }
    }
  }

  function enhance(root) {
    if (declined()) return;
    var lib = glassworks();
    if (!lib) return;
    if (!hasWebGL()) return;
    if (!hasEngine(lib)) {
      warn('engine', 'no capture engine found. Load snapdom before Glassworks, ' +
        'or pass one with PuppertinoGlass.use(glassworks, { engine }).');
      return;
    }

    var scope = root || document;
    var nodes = Array.prototype.slice.call(scope.querySelectorAll(SELECTOR));
    if (scope.matches && scope.matches(SELECTOR)) nodes.unshift(scope);

    var hadTexture = !!(renderer() && renderer().textureWidth);
    var added = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (enhanceOne(lib, nodes[i])) added++;
    }
    if (!added) return;
    checkLayers();

    // The existing snapshot was taken with these surfaces still in it.
    if (hadTexture) refresh();
  }

  function refresh() {
    var r = renderer();
    if (!r || !r.captureSnapshot) return;
    var run = r.captureSnapshot();
    if (run && run.then) run.then(adaptSoon, function () {});
  }

  var refreshTimer = null;
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 60);
  }

  // Appearance changes repaint what is behind the glass.
  var THEME = /(^|\s)p-(dark|light|auto-dark)-mode(\s|$)/g;
  function themeTokens(value) {
    return (String(value || '').match(THEME) || []).map(function (t) { return t.trim(); }).sort().join(' ');
  }

  function watch() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshSoon);

    declineQueries.forEach(function (query) {
      query.addEventListener('change', function () {
        if (declined()) releaseAll();
        else enhance();
      });
    });

    reducedMotion.addEventListener('change', function () {
      for (var i = 0; i < surfaces.length; i++) {
        var lens = surfaces[i].lens;
        if (lens && lens.options) lens.options.specular = recipe(surfaces[i].el).specular;
      }
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(retune, 150);
    }, { passive: true });

    // Scrolling moves content under fixed bars, so adapt again.
    window.addEventListener('scroll', adaptSoon, { passive: true, capture: true });

    if (typeof MutationObserver === 'undefined') return;
    new MutationObserver(function (records) {
      if (!surfaces.length) return;
      for (var i = 0; i < records.length; i++) {
        var record = records[i];
        // The adaptive flip on a surface doesn't change what is behind it.
        if (record.attributeName === 'data-p-theme' && record.target.hasAttribute('data-p-glass-id')) continue;
        var now = record.target.getAttribute(record.attributeName);
        var changed = record.attributeName === 'class'
          ? themeTokens(record.oldValue) !== themeTokens(now)
          : record.oldValue !== now;
        if (changed) return refreshSoon();
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class', 'data-p-theme'],
      subtree: true
    });
  }

  function use(lib, options) {
    library = lib || null;
    engine = options && options.engine;
    enhance();
    return window.PuppertinoGlass;
  }

  function start() {
    watch();
    enhance();
  }

  // After the current task, so scripts that load in the same pass
  // (a bundled entry that sets window.snapdom, say) are in place.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 0);
  }

  window.PuppertinoGlass = {
    enhance: enhance,
    refresh: refresh,
    release: release,
    use: use
  };
})();
