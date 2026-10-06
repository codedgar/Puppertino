/**
 * Puppertino v2 — notification stack.
 *
 * Expands a .p-notification-stack on tap, so the cards behind the top
 * one fan into a list, and swipes a .p-notification-touch sideways to
 * dismiss it.
 *
 * Dismissing removes the card from the DOM after its transition and
 * fires a `p-notification-dismiss` CustomEvent on the parent first, so
 * an app can cancel with preventDefault() or record the dismissal.
 * No dependencies.
 */
(function () {
  'use strict';

  var SWIPE_THRESHOLD = 0.35; /* of the card's width */
  var FLICK_VELOCITY = 0.4; /* px per ms */

  /* ─── Expand and collapse ────────────────────────────────────────── */

  function setExpanded(stack, on) {
    stack.classList.toggle('p-notification-stack-expanded', on);
    stack.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  document.addEventListener('click', function (event) {
    var stack = event.target.closest ? event.target.closest('.p-notification-stack') : null;
    if (!stack) return;
    /* A control inside a card keeps its own behaviour. */
    if (event.target.closest('button, a, input')) return;
    if (swiped) { swiped = false; return; }
    setExpanded(stack, !stack.classList.contains('p-notification-stack-expanded'));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var stack = event.target.closest ? event.target.closest('.p-notification-stack') : null;
    if (!stack || event.target.closest('button, a, input')) return;
    event.preventDefault();
    setExpanded(stack, !stack.classList.contains('p-notification-stack-expanded'));
  });

  /* ─── Swipe to dismiss ───────────────────────────────────────────── */

  var drag = null;
  var swiped = false;

  function dismiss(card) {
    var parent = card.parentNode;
    var event = new CustomEvent('p-notification-dismiss', { bubbles: true, cancelable: true });
    if (!card.dispatchEvent(event)) {
      card.style.transition = '';
      card.style.translate = '';
      card.style.opacity = '';
      return;
    }
    card.style.transition = 'translate 0.25s ease-out, opacity 0.25s ease-out';
    card.style.translate = (drag && drag.dx < 0 ? '-120%' : '120%') + ' 0';
    card.style.opacity = '0';
    setTimeout(function () {
      if (card.parentNode) card.parentNode.removeChild(card);
      if (parent && parent.classList.contains('p-notification-stack') &&
          !parent.querySelector('.p-notification-touch')) {
        parent.remove();
      }
    }, 260);
  }

  document.addEventListener('pointerdown', function (event) {
    var card = event.target.closest ? event.target.closest('.p-notification-touch') : null;
    if (!card) return;
    if (event.target.closest('button, a, input')) return;
    drag = { card: card, startX: event.clientX, startY: event.clientY, startTime: event.timeStamp, dx: 0, axis: null };
    card.setPointerCapture && card.setPointerCapture(event.pointerId);
  });

  document.addEventListener('pointermove', function (event) {
    if (!drag) return;
    var dx = event.clientX - drag.startX;
    var dy = event.clientY - drag.startY;

    /* Decide once whether this is a horizontal swipe or a scroll. */
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'x') drag.card.style.transition = 'none';
    }
    if (drag.axis !== 'x') return;

    event.preventDefault();
    drag.dx = dx;
    drag.card.style.translate = dx + 'px 0';
    drag.card.style.opacity = String(Math.max(0.25, 1 - Math.abs(dx) / (drag.card.offsetWidth || 320)));
  });

  function endDrag(event) {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (d.axis !== 'x') { d.card.style.transition = ''; return; }

    swiped = true;
    setTimeout(function () { swiped = false; }, 0);

    var width = d.card.offsetWidth || 320;
    var elapsed = Math.max(event.timeStamp - d.startTime, 1);
    var velocity = Math.abs(d.dx) / elapsed;

    if (Math.abs(d.dx) > width * SWIPE_THRESHOLD || velocity > FLICK_VELOCITY) {
      drag = d; /* dismiss() reads the direction from it */
      dismiss(d.card);
      drag = null;
      return;
    }
    d.card.style.transition = 'translate 0.2s ease-out, opacity 0.2s ease-out';
    d.card.style.translate = '';
    d.card.style.opacity = '';
  }

  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  window.PuppertinoNotifications = {
    dismiss: dismiss,
    expand: function (stack) { setExpanded(stack, true); },
    collapse: function (stack) { setExpanded(stack, false); }
  };
})();
