/**
 * Puppertino v2 — stepper.
 *
 * Wires .p-stepper buttons to their number input: click steps once,
 * press-and-hold repeats (400ms delay, then every 80ms), and every step
 * dispatches input + change events. The input is found inside the same
 * .p-stepper-field wrapper, or via data-p-stepper-for="input-id".
 * No dependencies.
 */
(function () {
  'use strict';

  var HOLD_DELAY = 400;
  var HOLD_RATE = 80;
  var holdTimeout = null;
  var holdInterval = null;

  function findInput(button) {
    var stepper = button.closest('.p-stepper');
    if (!stepper) return null;
    var forId = stepper.getAttribute('data-p-stepper-for');
    if (forId) return document.getElementById(forId);
    var wrapper = stepper.closest('.p-stepper-field');
    return wrapper ? wrapper.querySelector('input') : null;
  }

  function step(button) {
    var input = findInput(button);
    if (!input || input.disabled) return;
    if (button.getAttribute('data-p-step') === 'up') {
      input.stepUp();
    } else {
      input.stepDown();
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function stopHold() {
    clearTimeout(holdTimeout);
    clearInterval(holdInterval);
    holdTimeout = null;
    holdInterval = null;
  }

  document.addEventListener('pointerdown', function (event) {
    var button = event.target.closest('.p-stepper > button[data-p-step]');
    if (!button || button.disabled) return;
    step(button);
    holdTimeout = setTimeout(function () {
      holdInterval = setInterval(function () {
        step(button);
      }, HOLD_RATE);
    }, HOLD_DELAY);
  });

  document.addEventListener('pointerup', stopHold);
  document.addEventListener('pointercancel', stopHold);

  // Keyboard activation (Enter/Space) fires click without pointer events.
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var button = event.target.closest ? event.target.closest('.p-stepper > button[data-p-step]') : null;
    if (!button || button.disabled) return;
    event.preventDefault();
    step(button);
  });
})();
