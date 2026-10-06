/**
 * Puppertino v2 — slider fill helper and dials.
 *
 * Sliders: paints the accent fill by publishing the value as
 * --p-slider-fill on every .p-slider. Optional: without it the track
 * renders all gray on WebKit (Firefox fills natively) and the control
 * keeps working.
 *
 * Dials: turns every .p-dial[role="slider"]. Drag around the center,
 * or focus it and use the arrow keys, Page Up/Down and Home/End. The
 * value lives in aria-valuenow (min/max from aria-valuemin/-max,
 * default 0–360, step from data-step, default 1); the angle is
 * published as --p-dial-angle, and input/change events fire on the
 * dial. No dependencies.
 */
(function () {
  'use strict';

  function sync(input) {
    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max);
    if (isNaN(max)) max = 100;
    var value = parseFloat(input.value) || 0;
    var ratio = max === min ? 0 : (value - min) / (max - min);
    // The thumb center does not travel the full track: it starts half a
    // thumb in and stops half a thumb short. Offsetting the fill by that
    // half keeps the edge of the accent under the thumb at every value.
    // --p-slider-thumb-w resolves per size (16–24px pointer, 28px touch).
    input.style.setProperty('--p-slider-ratio', String(ratio));
    input.style.setProperty(
      '--p-slider-fill',
      'calc(var(--p-slider-thumb-w) / 2 + ' + ratio + ' * (100% - var(--p-slider-thumb-w)))'
    );
  }

  function syncAll() {
    var sliders = document.querySelectorAll('input.p-slider');
    for (var i = 0; i < sliders.length; i++) sync(sliders[i]);
  }

  document.addEventListener('input', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('p-slider')) {
      sync(event.target);
    }
  });

  /* ─── Dials ────────────────────────────────────────────────────── */

  function number(dial, name, fallback) {
    var value = parseFloat(dial.getAttribute(name));
    return isNaN(value) ? fallback : value;
  }

  function range(dial) {
    var min = number(dial, 'aria-valuemin', 0);
    var max = number(dial, 'aria-valuemax', 360);
    var step = number(dial, 'data-step', 1) || 1;
    return { min: min, max: max > min ? max : min + 1, step: step };
  }

  function disabled(dial) {
    return dial.getAttribute('aria-disabled') === 'true';
  }

  // Paint the value: minimum at 12 o'clock, clockwise through one turn.
  function paint(dial) {
    var r = range(dial);
    var value = number(dial, 'aria-valuenow', r.min);
    var turn = (value - r.min) / (r.max - r.min);
    dial.style.setProperty('--p-dial-angle', turn * 360 + 'deg');
  }

  function set(dial, value, commit) {
    var r = range(dial);
    value = Math.round((value - r.min) / r.step) * r.step + r.min;
    value = Math.min(r.max, Math.max(r.min, value));
    value = parseFloat(value.toFixed(6));
    var changed = value !== number(dial, 'aria-valuenow', NaN);
    dial.setAttribute('aria-valuenow', String(value));
    paint(dial);
    if (changed) dial.dispatchEvent(new Event('input', { bubbles: true }));
    if (commit && (changed || dial.hasAttribute('data-p-moved'))) {
      dial.removeAttribute('data-p-moved');
      dial.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (changed) {
      dial.setAttribute('data-p-moved', '');
    }
  }

  // Pointer position → value. atan2 measured from 12 o'clock, clockwise.
  function valueAt(dial, event) {
    var rect = dial.getBoundingClientRect();
    var dx = event.clientX - (rect.left + rect.width / 2);
    var dy = event.clientY - (rect.top + rect.height / 2);
    var turn = Math.atan2(dx, -dy) / (2 * Math.PI);
    if (turn < 0) turn += 1;
    var r = range(dial);
    return r.min + turn * (r.max - r.min);
  }

  function enhanceDial(dial) {
    if (dial.hasAttribute('data-p-dial')) return;
    dial.setAttribute('data-p-dial', '');
    if (!dial.hasAttribute('tabindex')) dial.tabIndex = 0;
    paint(dial);

    var pointerId = null;

    dial.addEventListener('pointerdown', function (event) {
      if (disabled(dial) || event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      try { dial.setPointerCapture(pointerId); } catch (_) {}
      dial.setAttribute('data-p-dragging', '');
      dial.focus({ preventScroll: true });
      set(dial, valueAt(dial, event), false);
    });

    dial.addEventListener('pointermove', function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      set(dial, valueAt(dial, event), false);
    });

    function end() {
      if (pointerId === null) return;
      try { dial.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
      dial.removeAttribute('data-p-dragging');
      set(dial, number(dial, 'aria-valuenow', 0), true);
    }

    dial.addEventListener('pointerup', end);
    dial.addEventListener('pointercancel', end);

    dial.addEventListener('keydown', function (event) {
      if (disabled(dial)) return;
      var r = range(dial);
      var value = number(dial, 'aria-valuenow', r.min);
      var big = Math.max(r.step, (r.max - r.min) / 10);
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp': value += r.step; break;
        case 'ArrowLeft':
        case 'ArrowDown': value -= r.step; break;
        case 'PageUp': value += big; break;
        case 'PageDown': value -= big; break;
        case 'Home': value = r.min; break;
        case 'End': value = r.max; break;
        default: return;
      }
      event.preventDefault();
      set(dial, value, true);
    });
  }

  function enhanceDials(root) {
    var dials = (root || document).querySelectorAll('.p-dial[role="slider"]');
    for (var i = 0; i < dials.length; i++) enhanceDial(dials[i]);
  }

  function init() {
    syncAll();
    enhanceDials();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-sync programmatic value changes on demand; enhance dials added
  // after load. Setting aria-valuenow yourself? Call paintDial(dial).
  window.PuppertinoSliders = {
    sync: sync,
    syncAll: syncAll,
    enhanceDials: enhanceDials,
    paintDial: paint
  };
})();
