/**
 * Puppertino v2 — slider fill helper.
 *
 * Paints the accent fill left of the thumb by publishing the value as
 * --p-slider-fill on every .p-slider. Optional: without it the track
 * renders all gray on WebKit (Firefox fills natively) and the control
 * keeps working. No dependencies.
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
    // --p-slider-thumb-w resolves per variant (20px pointer, 28px touch).
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAll);
  } else {
    syncAll();
  }

  // Re-sync programmatic value changes on demand.
  window.PuppertinoSliders = { sync: sync, syncAll: syncAll };
})();
