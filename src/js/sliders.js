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
    var pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty('--p-slider-fill', pct + '%');
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
