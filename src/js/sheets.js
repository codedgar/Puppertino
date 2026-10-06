/**
 * Puppertino v2 — bottom sheet gestures.
 *
 * Adds the two things .p-bottom-sheet cannot do in CSS: dragging the
 * grabber between detents, and swiping down to dismiss. Opening and
 * closing still belong to modals.js; this only handles the drag.
 *
 * Detents come from data-p-detents on the sheet, as a comma-separated
 * list of viewport percentages, largest last:
 *
 *   <div class="p-modal p-bottom-sheet" data-p-detents="50,92">
 *
 * Without the attribute the sheet uses whatever height the CSS gives
 * it and only swipe-to-dismiss applies. Dragging below the smallest
 * detent by more than a third closes the sheet. No dependencies.
 */
(function () {
  'use strict';

  var DISMISS_RATIO = 0.33; /* of the smallest detent */
  var FLICK_VELOCITY = 0.5; /* px per ms, downward, closes regardless */

  var drag = null;

  function detents(sheet) {
    var raw = sheet.getAttribute('data-p-detents');
    if (!raw) return null;
    var list = raw
      .split(',')
      .map(function (n) { return parseFloat(n); })
      .filter(function (n) { return !isNaN(n) && n > 0; })
      .sort(function (a, b) { return a - b; });
    return list.length ? list : null;
  }

  function heightFor(pct) {
    return (window.innerHeight * pct) / 100;
  }

  function nearest(list, height) {
    var best = list[0];
    var bestGap = Infinity;
    for (var i = 0; i < list.length; i++) {
      var gap = Math.abs(heightFor(list[i]) - height);
      if (gap < bestGap) { bestGap = gap; best = list[i]; }
    }
    return best;
  }

  function settle(sheet, pct) {
    sheet.style.transition = '';
    sheet.style.height = pct == null ? '' : pct + 'vh';
    sheet.style.translate = '';
  }

  function close(sheet) {
    sheet.style.transition = '';
    sheet.style.height = '';
    sheet.style.translate = '';
    var trigger = sheet.querySelector('[data-p-cancel]');
    if (trigger) {
      trigger.click();
      return;
    }
    /* Fall back to the manager's own close path. */
    sheet.classList.remove('active');
    sheet.setAttribute('aria-hidden', 'true');
    var background = document.querySelector('.p-modal-background');
    if (background && !document.querySelector('.p-modal.active')) {
      background.classList.remove('nowactive');
      document.body.classList.remove('p-modal-opened');
    }
  }

  document.addEventListener('pointerdown', function (event) {
    var handle = event.target.closest
      ? event.target.closest('.p-bottom-sheet__grabber, .p-bottom-sheet__header')
      : null;
    if (!handle) return;
    var sheet = handle.closest('.p-bottom-sheet');
    if (!sheet || !sheet.classList.contains('active')) return;
    /* A control in the header keeps its own behaviour. */
    if (event.target.closest('button, a, input, select, textarea')) return;

    drag = {
      sheet: sheet,
      startY: event.clientY,
      startHeight: sheet.getBoundingClientRect().height,
      startTime: event.timeStamp,
      list: detents(sheet),
      moved: false
    };
    sheet.style.transition = 'none';
    handle.setPointerCapture && handle.setPointerCapture(event.pointerId);
  });

  document.addEventListener('pointermove', function (event) {
    if (!drag) return;
    var delta = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(delta) < 3) return;
    drag.moved = true;
    event.preventDefault();

    var next = drag.startHeight - delta;
    var max = drag.list ? heightFor(drag.list[drag.list.length - 1]) : drag.startHeight;
    if (next > max) {
      /* Past the tallest detent, resist rather than stretch. */
      next = max + (next - max) * 0.15;
    }
    drag.sheet.style.height = Math.max(next, 0) + 'px';
  });

  function end(event) {
    if (!drag) return;
    var d = drag;
    drag = null;
    d.sheet.style.transition = '';
    if (!d.moved) { d.sheet.style.height = ''; return; }

    var height = d.sheet.getBoundingClientRect().height;
    var elapsed = Math.max(event.timeStamp - d.startTime, 1);
    var velocity = (event.clientY - d.startY) / elapsed;

    var smallest = d.list ? heightFor(d.list[0]) : d.startHeight;
    if (velocity > FLICK_VELOCITY || height < smallest * (1 - DISMISS_RATIO)) {
      close(d.sheet);
      return;
    }
    settle(d.sheet, d.list ? nearest(d.list, height) : null);
  }

  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', function (event) {
    if (!drag) return;
    var d = drag;
    drag = null;
    settle(d.sheet, d.list ? nearest(d.list, d.startHeight) : null);
  });

  /* Detents are a percentage of the viewport, so a rotation or a
     resize has to re-settle the sheet onto the nearest one. */
  window.addEventListener('resize', function () {
    var sheets = document.querySelectorAll('.p-bottom-sheet.active[style*="height"]');
    for (var i = 0; i < sheets.length; i++) {
      var list = detents(sheets[i]);
      if (list) settle(sheets[i], nearest(list, sheets[i].getBoundingClientRect().height));
    }
  });
})();
