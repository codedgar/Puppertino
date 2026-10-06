/**
 * Puppertino v2 — page controls.
 *
 * Two jobs. It keeps the current dot in step with a scrolling pager,
 * and it shrinks the dots nearest the ends of a long set the way iOS
 * does, which is the one part of the control that cannot be CSS.
 *
 * Link a control to its pager with data-p-pages:
 *
 *   <div class="p-pager" id="gallery"> … pages … </div>
 *   <nav class="p-page-control" data-p-pages="#gallery"> … dots … </nav>
 *
 * Without data-p-pages the dots still shrink and still respond to
 * clicks; only the scroll sync is skipped. A set of 7 or fewer keeps
 * every dot at full size. No dependencies.
 */
(function () {
  'use strict';

  var FULL_SIZE_MAX = 7; /* at or below this, no shrinking */
  var WINDOW = 3; /* dots at full size either side of the current one */

  function dots(control) {
    return Array.prototype.slice.call(control.querySelectorAll('.p-page-dot'));
  }

  function currentIndex(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].hasAttribute('aria-current') || list[i].classList.contains('p-is-active')) return i;
    }
    return 0;
  }

  /* iOS keeps a window of full-size dots around the current page and
     steps the rest down as they approach the ends. */
  function resize(control) {
    var list = dots(control);
    if (!list.length) return;
    var index = currentIndex(list);

    for (var i = 0; i < list.length; i++) {
      list[i].classList.remove('p-page-dot-sm', 'p-page-dot-xs');
      if (list.length <= FULL_SIZE_MAX) continue;
      var distance = Math.abs(i - index);
      var fromEnd = Math.min(i, list.length - 1 - i);
      /* Only shrink dots that are both far from the current page and
         near an end, so the middle of a long set stays readable. */
      if (distance > WINDOW && fromEnd === 0) list[i].classList.add('p-page-dot-xs');
      else if (distance > WINDOW && fromEnd === 1) list[i].classList.add('p-page-dot-sm');
    }
  }

  function select(control, index) {
    var list = dots(control);
    for (var i = 0; i < list.length; i++) {
      var on = i === index;
      list[i].classList.toggle('p-is-active', on);
      if (on) list[i].setAttribute('aria-current', 'true');
      else list[i].removeAttribute('aria-current');
    }
    resize(control);
    control.dispatchEvent(new CustomEvent('p-page-change', { bubbles: true, detail: { index: index } }));
  }

  function pagerFor(control) {
    var selector = control.getAttribute('data-p-pages');
    if (!selector) return null;
    try { return document.querySelector(selector); } catch (e) { return null; }
  }

  document.addEventListener('click', function (event) {
    var dot = event.target.closest ? event.target.closest('.p-page-dot') : null;
    if (!dot) return;
    var control = dot.closest('.p-page-control');
    if (!control) return;
    var index = dots(control).indexOf(dot);
    if (index < 0) return;

    var pager = pagerFor(control);
    if (pager) {
      event.preventDefault();
      pager.scrollTo({ left: index * pager.clientWidth, behavior: 'smooth' });
    }
    select(control, index);
  });

  function watch(control) {
    var pager = pagerFor(control);
    if (!pager) return;
    var frame = null;
    pager.addEventListener(
      'scroll',
      function () {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          var width = pager.clientWidth || 1;
          var index = Math.round(pager.scrollLeft / width);
          var list = dots(control);
          index = Math.max(0, Math.min(index, list.length - 1));
          if (index !== currentIndex(list)) select(control, index);
        });
      },
      { passive: true }
    );
  }

  function init() {
    var controls = document.querySelectorAll('.p-page-control');
    for (var i = 0; i < controls.length; i++) {
      resize(controls[i]);
      watch(controls[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PuppertinoPageControls = { init: init, select: select, resize: resize };
})();
