/**
 * Puppertino v2 — color wells.
 *
 * A well starts as the spectrum disc; picking a color flips it to the
 * swatch state (.p-colorwell-set) and keeps the dot's
 * --p-colorwell-color in sync with the wrapped <input type="color">.
 * Wells the author pre-marks with .p-colorwell-set get their dot synced
 * on load. No dependencies.
 */
(function () {
  'use strict';

  function sync(input, select) {
    var well = input.closest('.p-colorwell');
    if (!well) return;
    if (select) well.classList.add('p-colorwell-set');
    if (well.classList.contains('p-colorwell-set')) {
      well.style.setProperty('--p-colorwell-color', input.value);
    }
  }

  document.addEventListener('input', function (event) {
    if (
      event.target instanceof Element &&
      event.target.matches('.p-colorwell input[type="color"]')
    ) {
      sync(event.target, true);
    }
  });

  function init() {
    document
      .querySelectorAll('.p-colorwell input[type="color"]')
      .forEach(function (input) {
        sync(input, false);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
