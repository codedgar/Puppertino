/**
 * Puppertino v2 — color wells.
 *
 * A well starts as the spectrum disc; picking a color flips it to the
 * swatch state (.p-colorwell-set) and keeps the dot's
 * --p-colorwell-color in sync with the wrapped <input type="color">.
 * Wells the author pre-marks with .p-colorwell-set get their dot synced
 * on load. Capsule wells (.p-colorwell-capsule) always show a color, so
 * they sync on load and wear .p-active while the picker is open.
 * No dependencies.
 */
(function () {
  'use strict';

  function sync(input, select) {
    var well = input.closest('.p-colorwell');
    if (!well) return;
    var capsule = well.classList.contains('p-colorwell-capsule');
    if (select && !capsule) well.classList.add('p-colorwell-set');
    if (capsule || well.classList.contains('p-colorwell-set')) {
      well.style.setProperty('--p-colorwell-color', input.value);
    }
  }

  function isCapsuleInput(target) {
    return (
      target instanceof Element &&
      target.matches('.p-colorwell-capsule input[type="color"]')
    );
  }

  // Capsule wells: the body turns accent while the picker is open. The
  // native picker has no open/close events, so opening is the click and
  // closing is the change or blur that follows it.
  document.addEventListener('click', function (event) {
    if (isCapsuleInput(event.target) && !event.target.disabled) {
      event.target.closest('.p-colorwell').classList.add('p-active');
    }
  });

  function deactivate(event) {
    if (isCapsuleInput(event.target)) {
      event.target.closest('.p-colorwell').classList.remove('p-active');
    }
  }

  document.addEventListener('change', deactivate);
  document.addEventListener('focusout', deactivate);

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
