/**
 * Puppertino v2 — Liquid Glass for switches and slider thumbs.
 *
 * Adapted from Jhey Tompkins' liquid glass toggle. Press a .p-switch
 * and its knob lifts into a glass lens you can drag across the track;
 * drag a .p-slider and its thumb does the same. The styles live in
 * materials.css (the lens), forms.css, and sliders.css.
 *
 * Optional: without this script switches keep their CSS morph and
 * sliders keep a plain thumb. No dependencies.
 *
 * Switches present when the script runs are enhanced automatically.
 * Call PuppertinoLiquidGlass.enhance(root) for ones added later.
 * Sliders need no setup.
 */
(function () {
  'use strict';

  var SLIDE = 350; // ms, matches --p-lens-duration
  var SETTLE = 60; // ms, hold the lift a beat after the slide lands
  var TAP_SLOP = 6; // px, below this a press is a tap

  // The reference lens is 50px tall. Its goo blur (2px) and aberration
  // offset (0.8px) are absolute SVG values, so on a smaller lens they
  // must shrink with it or the thin colored rim at the glass edge blurs
  // below the alpha threshold and vanishes. Each lens gets filters scaled
  // to its own height, built once per size.
  var REFERENCE_H = 50;

  function gooFilter(id, k) {
    // Goo: blur, then crush alpha so the blurred shapes re-harden and
    // fuse where they meet.
    return '<filter id="' + id + '">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="' + 2 * k + '" result="blur"/>' +
      '<feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -10"/>' +
      '</filter>';
  }

  function aberrationFilter(id, k) {
    // Chromatic aberration: red and blue nudged sub-pixel apart and
    // screened back together, then alpha re-keyed to the source so the
    // shadow cannot thicken. Only the hue shifts.
    return '<filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>' +
      '<feOffset in="r" dx="' + 0.8 * k + '" dy="0" result="r"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>' +
      '<feOffset in="b" dx="' + -0.8 * k + '" dy="0" result="b"/>' +
      '<feBlend in="r" in2="g" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="b" mode="screen" result="rgb"/>' +
      '<feColorMatrix in="rgb" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="opaque"/>' +
      '<feComposite in="opaque" in2="SourceGraphic" operator="in"/>' +
      '</filter>';
  }

  function supported() {
    return !!(
      window.CSS &&
      CSS.supports &&
      CSS.supports('mask-composite', 'exclude') &&
      CSS.supports('scale', '1') &&
      CSS.supports('width', 'max(1px, calc(1px * 2))') &&
      CSS.supports('width', 'round(down, 3px, 2px)') &&
      CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')
    );
  }

  // Reduced motion or transparency: the controls still work, the knob
  // simply never turns into glass.
  function calm() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    );
  }

  function filterDefs() {
    var svg = document.getElementById('p-lens-filters');
    if (!svg) {
      var holder = document.createElement('div');
      holder.innerHTML =
        '<svg id="p-lens-filters" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"' +
        ' style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none"><defs>' +
        gooFilter('p-lens-goo', 1) + aberrationFilter('p-lens-aberration', 1) +
        '</defs></svg>';
      svg = holder.firstChild;
      document.body.appendChild(svg);
    }
    return svg.querySelector('defs');
  }

  function injectFilters() {
    filterDefs();
  }

  // Computed height ignores the lift scale and keeps fractions
  // (offsetHeight rounds), so it is the exact resting height. Zero while
  // the control is not rendered.
  function restingHeight(lens) {
    return parseFloat(getComputedStyle(lens).height) || 0;
  }

  // Point a lens at filters sized for its resting height.
  function scaleFilters(lens, height) {
    if (!height) return false;
    var k = Math.round((height / REFERENCE_H) * 1000) / 1000;
    var key = String(k).replace('.', '_');
    var defs = filterDefs();
    var goo = 'p-lens-goo-' + key;
    var aberration = 'p-lens-aberration-' + key;
    if (!document.getElementById(goo)) {
      var holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      holder.innerHTML = gooFilter(goo, k) + aberrationFilter(aberration, k);
      while (holder.firstChild) defs.appendChild(holder.firstChild);
    }
    lens.querySelector('.p-lens-liquid').style.filter = 'url(#' + goo + ')';
    lens.querySelector('.p-lens-rim').style.filter = 'url(#' + aberration + ')';
    return true;
  }

  function part(className, parent) {
    var node = document.createElement('span');
    node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  function buildLens() {
    var lens = part('p-lens');
    lens.setAttribute('aria-hidden', 'true');
    part('p-lens-rim', lens);
    var liquid = part('p-lens-liquid', part('p-lens-body', lens));
    part('p-lens-edge', liquid);
    part('p-lens-track', liquid);
    part('p-lens-cover', lens);
    return lens;
  }

  /* ─── Switches ─────────────────────────────────────────────────── */

  function enhanceSwitch(label) {
    if (label.hasAttribute('data-p-liquid')) return;
    var input = label.querySelector('input[type="checkbox"]');
    var track = input && input.nextElementSibling;
    if (!track) return;

    label.setAttribute('data-p-liquid', '');
    label.classList.add('p-switch-liquid');
    var knockout = part('p-switch-knockout', track);
    knockout.setAttribute('aria-hidden', 'true');
    var lens = buildLens();
    track.appendChild(lens);
    scaleFilters(lens, restingHeight(lens));

    var pointerId = null;
    var startX = 0;
    var startOn = false;
    var state = false;
    var moved = false;
    var timer = null;

    function lift() {
      if (calm()) return;
      // Re-sized on every lift, so a switch resized after load stays right.
      scaleFilters(lens, restingHeight(lens));
      clearTimeout(timer);
      label.setAttribute('data-p-lift', '');
    }

    // Let the slide finish, then set the glass down.
    function drop() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        label.removeAttribute('data-p-lift');
      }, SLIDE + SETTLE);
    }

    function commit(on) {
      label.removeAttribute('data-p-state');
      if (input.checked === on) return;
      input.checked = on;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    label.addEventListener('pointerdown', function (event) {
      if (input.disabled || event.button !== 0) return;
      pointerId = event.pointerId;
      try { label.setPointerCapture(pointerId); } catch (_) {}
      startX = event.clientX;
      startOn = input.checked;
      state = startOn;
      moved = false;
      lift();
    });

    label.addEventListener('pointermove', function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      if (Math.abs(event.clientX - startX) > TAP_SLOP) moved = true;
      if (!moved) return;
      // Which side of the track's center is the pointer on? A small dead
      // zone stops it flickering on the line. Crossing back and forth
      // slides the knob as many times as you like.
      var rect = track.getBoundingClientRect();
      var center = rect.left + rect.width / 2;
      var dead = rect.width * 0.06;
      var desired = state;
      if (event.clientX > center + dead) desired = true;
      else if (event.clientX < center - dead) desired = false;
      if (desired !== state) {
        state = desired;
        label.setAttribute('data-p-state', state ? 'on' : 'off');
      }
    });

    function end() {
      if (pointerId === null) return;
      try { label.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
      // A tap is left to the native label click, which toggles the input.
      if (moved) commit(state);
      drop();
    }

    label.addEventListener('pointerup', end);
    label.addEventListener('pointercancel', function () {
      moved = true; // no click follows a cancel; keep what the drag showed
      end();
    });

    // A drag already committed its own state; the click the browser fires
    // after it must not toggle the input back. Keyboard activation targets
    // the input itself, and scripted clicks carry detail 0.
    label.addEventListener('click', function (event) {
      if (moved && event.target !== input && event.detail > 0) event.preventDefault();
    }, true);

    // Keyboard and taps: lift for the length of the slide.
    input.addEventListener('change', function () {
      if (pointerId !== null) return;
      lift();
      drop();
    });
  }

  function enhance(root) {
    if (!supported()) return;
    injectFilters();
    var scope = root || document;
    var switches = scope.querySelectorAll('label.p-switch');
    for (var i = 0; i < switches.length; i++) enhanceSwitch(switches[i]);
  }

  /* ─── Slider thumbs ────────────────────────────────────────────── */

  var active = null; // { input, lens, timer }

  function resolved(style, name, fallback) {
    var value = style.getPropertyValue(name).trim();
    return value || fallback;
  }

  function placeLens() {
    if (!active) return;
    var input = active.input;
    var lens = active.lens;
    var style = getComputedStyle(input);
    var touch = input.classList.contains('p-slider-touch');
    var rect = input.getBoundingClientRect();

    var thumbW = parseFloat(resolved(style, '--p-slider-thumb-w', '20')) || 20;
    var thumbH = touch ? thumbW : 16;
    var trackH = touch ? parseFloat(resolved(style, '--p-slider-touch-h', '6')) || 6 : 4;

    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max);
    if (isNaN(max)) max = 100;
    var value = parseFloat(input.value) || 0;
    var ratio = max === min ? 0 : (value - min) / (max - min);
    var offset = thumbW / 2 + ratio * (rect.width - thumbW);

    lens.style.left = rect.left + offset + 'px';
    lens.style.top = rect.top + rect.height / 2 + 'px';
    lens.style.setProperty('--p-slider-lens-thumb-w', thumbW + 'px');
    lens.style.setProperty('--p-slider-lens-thumb-h', thumbH + 'px');
    lens.style.setProperty('--p-slider-lens-track-w', rect.width + 'px');
    lens.style.setProperty('--p-slider-lens-track-h', trackH + 'px');
    lens.style.setProperty('--p-slider-lens-offset', offset + 'px');
  }

  function openLens(input) {
    if (active && active.input !== input) closeLens(true);

    if (!active) {
      var style = getComputedStyle(input);
      var touch = input.classList.contains('p-slider-touch');
      var lens = buildLens();
      lens.classList.add('p-slider-lens');
      if (touch) lens.classList.add('p-slider-lens-touch');

      // The lens sits on <body>, outside any appearance scope or tint
      // class, so it carries the colors the input resolved.
      lens.style.setProperty('--p-slider-lens-fill', touch
        ? resolved(style, '--p-slider-touch-fill', '#0088ff')
        : resolved(style, '--p-slider-accent', '#0D6FFF'));
      lens.style.setProperty('--p-slider-lens-rest', touch
        ? resolved(style, '--p-slider-touch-lens-track', '#e4e4e4')
        : resolved(style, '--p-slider-lens-track', '#e0e0e0'));
      lens.style.setProperty('--p-lens-knob', touch
        ? resolved(style, '--p-slider-touch-thumb', '#ffffff')
        : resolved(style, '--p-control-knob', '#ffffff'));

      injectFilters();
      document.body.appendChild(lens);
      active = { input: input, lens: lens, timer: null };
      placeLens();
      scaleFilters(lens, restingHeight(lens));
      input.setAttribute('data-p-lens', '');
      lens.getBoundingClientRect(); // commit lift 0 so the lift transitions
    }

    clearTimeout(active.timer);
    active.lens.setAttribute('data-p-lift', '');
  }

  function closeLens(now) {
    if (!active) return;
    var current = active;
    function remove() {
      current.lens.remove();
      current.input.removeAttribute('data-p-lens');
      if (active === current) active = null;
    }
    clearTimeout(current.timer);
    if (now) return remove();
    current.lens.removeAttribute('data-p-lift');
    current.timer = setTimeout(remove, SLIDE + SETTLE);
  }

  document.addEventListener('pointerdown', function (event) {
    var input = event.target && event.target.closest && event.target.closest('input.p-slider');
    if (!input || input.disabled || event.button !== 0) return;
    if (!supported() || calm()) return;
    openLens(input);
  });

  document.addEventListener('pointerup', function () { closeLens(false); });
  document.addEventListener('pointercancel', function () { closeLens(false); });

  document.addEventListener('input', function (event) {
    if (active && event.target === active.input) placeLens();
  });

  window.addEventListener('scroll', placeLens, { capture: true, passive: true });
  window.addEventListener('resize', placeLens);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(); });
  } else {
    enhance();
  }

  window.PuppertinoLiquidGlass = { enhance: enhance };
})();
