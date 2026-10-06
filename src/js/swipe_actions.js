/**
 * Puppertino v2 — swipe actions.
 *
 * Slides a .p-list-swipe row sideways to show the buttons behind it, the
 * way an iOS list row does. Drag the row toward the leading edge for its
 * trailing actions, toward the trailing edge for its leading ones. Past
 * halfway (or on a quick flick) it stays open; otherwise it springs back.
 * One row is open at a time. A tap on the open row, a tap anywhere else,
 * or choosing an action closes it.
 *
 * A swipe is invisible until someone tries it, so the actions never
 * depend on the gesture:
 *   - They stay in the tab order and the reading order. Focusing one
 *     (Tab, or a screen reader moving onto it) opens its side.
 *   - With focus in the row, ArrowLeft and ArrowRight open the side the
 *     matching swipe would, and move focus to its first action. Escape
 *     closes the row and returns focus to where it was.
 * Offer the same commands somewhere visible as well: a toolbar, an Edit
 * mode, or the detail screen.
 *
 * Markup contract:
 *   <li class="p-list-row p-list-swipe">
 *     <div class="p-list-swipe__content"> …the row's slots… </div>
 *     <div class="p-list-swipe__actions" data-p-swipe-side="leading"
 *          aria-label="Actions for Inbox"> …buttons… </div>
 *     <div class="p-list-swipe__actions" data-p-swipe-side="trailing"
 *          aria-label="Actions for Inbox"> …buttons… </div>
 *   </li>
 *
 * Either side is optional. Buttons are .p-swipe-action. Choosing one
 * fires a bubbling "p-swipe-action" event on the row, with the button in
 * event.detail.action, after the button's own click handlers run.
 * No dependencies.
 */
(function () {
  'use strict';

  var SLOP = 8;          /* px of travel before a drag is decided */
  var GAP = 10;          /* between the slid row and the nearest action */
  var FLICK = 0.45;      /* px/ms that opens a side regardless of distance */
  var RUBBER = 0.25;     /* resistance past the fully open position */

  var openRow = null;
  var drag = null;
  var swallowClick = false;

  function rowOf(el) {
    return el && el.closest ? el.closest('.p-list-swipe') : null;
  }

  function sideEl(row, side) {
    var sides = row.querySelectorAll('.p-list-swipe__actions');
    for (var i = 0; i < sides.length; i++) {
      if (sides[i].parentNode === row && sides[i].getAttribute('data-p-swipe-side') === side) {
        return sides[i];
      }
    }
    return null;
  }

  function isRtl(row) {
    return getComputedStyle(row).direction === 'rtl';
  }

  /* Signed offset that fully reveals a side: the actions, their 16px
     inset from the row edge, and the 10px gap to the slid row. */
  function openOffset(row, side) {
    var el = sideEl(row, side);
    if (!el) return 0;
    var r = row.getBoundingClientRect();
    var a = el.getBoundingClientRect();
    var leftEdge = a.left - r.left;
    var rightEdge = r.right - a.right;
    var fromRight = r.right - a.left + GAP;
    var fromLeft = a.right - r.left + GAP;
    /* Actions sitting against the right edge are revealed by sliding left. */
    return rightEdge <= leftEdge ? -fromRight : fromLeft;
  }

  /* Which side a given direction of travel reveals. */
  function sideFor(row, dx) {
    var towardLeft = dx < 0;
    var rtl = isRtl(row);
    return towardLeft !== rtl ? 'trailing' : 'leading';
  }

  function setOffset(row, px) {
    row.style.setProperty('--p-list-swipe-offset', px + 'px');
  }

  function open(row, side, focusFirst) {
    if (!sideEl(row, side)) return;
    if (openRow && openRow !== row) close(openRow);
    setOffset(row, openOffset(row, side));
    row.setAttribute('data-p-swipe-open', side);
    openRow = row;
    if (focusFirst) {
      var first = sideEl(row, side).querySelector('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (first) first.focus();
    }
  }

  function close(row, focusContent) {
    if (!row) return;
    setOffset(row, 0);
    row.removeAttribute('data-p-swipe-open');
    if (openRow === row) openRow = null;
    if (focusContent) {
      var content = row.querySelector('.p-list-swipe__content');
      var target = content && (content.matches('[tabindex]') ? content :
        content.querySelector('a[href], button, [tabindex]:not([tabindex="-1"])'));
      if (!target && content) {
        /* Nothing focusable in the row: focus the content itself so
           focus does not stay on an action that just slid out of view. */
        if (!content.hasAttribute('tabindex')) content.setAttribute('tabindex', '-1');
        target = content;
      }
      if (target) target.focus();
    }
  }

  /* ─── Gesture ─── */

  document.addEventListener('pointerdown', function (event) {
    if (openRow && !openRow.contains(event.target)) close(openRow);

    if (event.button !== 0) return;
    var content = event.target.closest ? event.target.closest('.p-list-swipe__content') : null;
    var row = rowOf(content);
    if (!row || content.parentNode !== row) return;

    var current = parseFloat(row.style.getPropertyValue('--p-list-swipe-offset')) || 0;
    drag = {
      row: row,
      content: content,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      base: current,
      offset: current,
      decided: false,
      active: false,
      lastX: event.clientX,
      lastT: event.timeStamp,
      vx: 0
    };
  });

  document.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dx = event.clientX - drag.x;
    var dy = event.clientY - drag.y;

    if (!drag.decided) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      drag.decided = true;
      /* Mostly vertical: a scroll, not a swipe. */
      if (Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }
      drag.active = true;
      drag.row.classList.add('is-swiping');
      try { drag.content.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
    }
    if (!drag.active) return;

    var min = Math.min(0, openOffset(drag.row, 'trailing'), openOffset(drag.row, 'leading'));
    var max = Math.max(0, openOffset(drag.row, 'trailing'), openOffset(drag.row, 'leading'));
    var next = drag.base + dx;
    if (next < min) next = min + (next - min) * RUBBER;
    if (next > max) next = max + (next - max) * RUBBER;

    var dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.vx = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;

    drag.offset = next;
    setOffset(drag.row, next);
    event.preventDefault();
  }, { passive: false });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    var d = drag;
    drag = null;

    if (!d.active) {
      /* A tap on an open row closes it instead of activating it. */
      if (d.row === openRow && event.type === 'pointerup') {
        close(d.row);
        swallowClick = true;
      }
      return;
    }

    d.row.classList.remove('is-swiping');
    swallowClick = true;

    var off = d.offset;
    var flick = Math.abs(d.vx) > FLICK;
    var side = off === 0 ? null : sideFor(d.row, off);
    var full = side ? openOffset(d.row, side) : 0;
    var movingOut = side && (d.vx === 0 || (d.vx < 0) === (off < 0));

    if (side && full && (Math.abs(off) > Math.abs(full) / 2 || (flick && movingOut))) {
      open(d.row, side);
    } else {
      close(d.row);
    }
  }

  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* The click that ends a drag, or the tap that closed a row, must not
     also follow the row's link. */
  document.addEventListener('click', function (event) {
    if (swallowClick) {
      swallowClick = false;
      if (rowOf(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, true);

  /* Choosing an action: let its own handlers run, announce it, close. */
  document.addEventListener('click', function (event) {
    var action = event.target.closest ? event.target.closest('.p-list-swipe__actions .p-swipe-action') : null;
    if (!action) return;
    var row = rowOf(action);
    if (!row) return;
    row.dispatchEvent(new CustomEvent('p-swipe-action', {
      bubbles: true,
      detail: { action: action, side: action.closest('.p-list-swipe__actions').getAttribute('data-p-swipe-side') }
    }));
    close(row, true);
  });

  /* ─── Keyboard and assistive technology ─── */

  /* Focus landing on a hidden action opens its side, so what has focus
     is always on screen. */
  document.addEventListener('focusin', function (event) {
    var actions = event.target.closest ? event.target.closest('.p-list-swipe__actions') : null;
    if (actions) {
      var row = rowOf(actions);
      var side = actions.getAttribute('data-p-swipe-side');
      if (row && row.getAttribute('data-p-swipe-open') !== side) open(row, side);
      return;
    }
    if (openRow && !openRow.contains(event.target)) close(openRow);
  });

  document.addEventListener('keydown', function (event) {
    var row = rowOf(event.target);
    if (!row) return;

    if (event.key === 'Escape' && row.hasAttribute('data-p-swipe-open')) {
      event.preventDefault();
      close(row, true);
      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    /* Leave arrow keys to anything that edits or has its own arrows. */
    if (event.target.closest('input, textarea, select, [contenteditable], [role="slider"], [role="tablist"]')) return;
    if (!event.target.closest('.p-list-swipe__content')) return;

    var side = sideFor(row, event.key === 'ArrowLeft' ? -1 : 1);
    if (row.getAttribute('data-p-swipe-open') && row.getAttribute('data-p-swipe-open') !== side) {
      event.preventDefault();
      close(row);
      return;
    }
    if (sideEl(row, side)) {
      event.preventDefault();
      open(row, side, true);
    }
  });

  /* Name each unlabeled action group so a screen reader announces it. */
  function label(root) {
    var groups = (root || document).querySelectorAll('.p-list-swipe__actions');
    for (var i = 0; i < groups.length; i++) {
      if (!groups[i].hasAttribute('role')) groups[i].setAttribute('role', 'group');
      if (!groups[i].hasAttribute('aria-label') && !groups[i].hasAttribute('aria-labelledby')) {
        groups[i].setAttribute('aria-label', 'Actions');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { label(); });
  } else {
    label();
  }

  /* A resize changes the open offset; keep an open row flush. */
  window.addEventListener('resize', function () {
    if (openRow) setOffset(openRow, openOffset(openRow, openRow.getAttribute('data-p-swipe-open')));
  });

  window.PuppertinoSwipeActions = { open: open, close: close, label: label };
})();
