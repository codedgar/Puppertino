/**
 * Puppertino v2 — context menus.
 *
 * Opens a .p-menu-touch on a long press, and on the keyboard so the
 * commands are reachable without one. A long press has no visible
 * affordance, so every command in the menu should also live somewhere
 * people can see.
 *
 * Markup contract:
 *   <div data-p-context-menu="#file-menu"> … </div>
 *   <div class="p-menu p-menu-touch" id="file-menu" hidden> … </div>
 *
 * The menu floats beside the element that raised it, the way iOS places
 * a context menu against its preview: 16px below it, lined up with its
 * leading edge (or its trailing edge when the leading one would run off
 * screen). When there is no room below, it sits beside the element,
 * top edges aligned, then above it. Add data-p-context-menu-at="pointer"
 * to the element to open the menu at the press point instead, for large
 * surfaces like a canvas where the whole element is not a useful anchor.
 * Everything is clamped to the viewport.
 *
 * Escape, an outside tap, or choosing an item closes it. A held mouse
 * button opens it the same way a finger does, and right-click opens it
 * immediately, the macOS gesture. No dependencies.
 */
(function () {
  'use strict';

  var HOLD_MS = 500;
  var MOVE_TOLERANCE = 10; /* a scroll must not open a menu */
  var GAP = 16;    /* between the anchor and the menu (iOS 27) */
  var MARGIN = 8;  /* kept clear at the viewport edges */

  var timer = null;
  var pending = null;
  var open = null;
  var lastTrigger = null;
  var swallowClick = false; /* the click that ends a long press */

  function menuFor(host) {
    var selector = host.getAttribute('data-p-context-menu');
    if (!selector) return null;
    try { return document.querySelector(selector); } catch (e) { return null; }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  /* Anchored to a rect: below (leading, then trailing edge), beside
     (trailing side, then leading side), above, and last of all whatever
     fits once clamped. */
  function placeAgainst(menu, anchor, rtl) {
    var rect = menu.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var maxLeft = vw - w - MARGIN;
    var maxTop = vh - h - MARGIN;
    var lead = rtl ? anchor.right - w : anchor.left;
    var trail = rtl ? anchor.left : anchor.right - w;
    var alignedLeft = lead >= MARGIN && lead <= maxLeft ? lead : trail;
    var left;
    var top;

    if (anchor.bottom + GAP + h <= vh - MARGIN) {
      left = alignedLeft;
      top = anchor.bottom + GAP;
    } else {
      var after = rtl ? anchor.left - GAP - w : anchor.right + GAP;
      var before = rtl ? anchor.right + GAP : anchor.left - GAP - w;
      top = clamp(anchor.top, MARGIN, maxTop);
      if (after >= MARGIN && after <= maxLeft) {
        left = after;
      } else if (before >= MARGIN && before <= maxLeft) {
        left = before;
      } else {
        left = alignedLeft;
        top = anchor.top - GAP - h;
      }
    }

    return {
      left: clamp(left, MARGIN, Math.max(MARGIN, maxLeft)),
      top: clamp(top, MARGIN, Math.max(MARGIN, maxTop))
    };
  }

  /* At a point: just below it, flipping above when it would run off. */
  function placeAtPoint(menu, x, y) {
    var rect = menu.getBoundingClientRect();
    var left = Math.min(Math.max(MARGIN, x), window.innerWidth - rect.width - MARGIN);
    var top = y + MARGIN;
    if (top + rect.height > window.innerHeight - MARGIN) {
      top = Math.max(MARGIN, y - rect.height - MARGIN);
    }
    return { left: left, top: top };
  }

  function place(menu, host, x, y) {
    menu.hidden = false;
    menu.style.position = 'fixed';
    menu.style.margin = '0';
    menu.style.left = '0px';
    menu.style.top = '0px';
    var atPointer = host.getAttribute('data-p-context-menu-at') === 'pointer' && x != null;
    var rtl = getComputedStyle(host).direction === 'rtl';
    var pos = atPointer ? placeAtPoint(menu, x, y) : placeAgainst(menu, host.getBoundingClientRect(), rtl);
    menu.style.left = pos.left + 'px';
    menu.style.top = pos.top + 'px';
    menu.style.zIndex = '100';
  }

  function show(host, x, y) {
    var menu = menuFor(host);
    if (!menu) return;
    hide();
    lastTrigger = document.activeElement;
    place(menu, host, x, y);
    open = menu;
    var first = menu.querySelector('.p-menu__item:not([aria-disabled="true"])');
    if (first && first.focus) first.focus();
  }

  function hide() {
    if (!open) return;
    open.hidden = true;
    open = null;
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    lastTrigger = null;
  }

  function cancelHold() {
    if (timer) { clearTimeout(timer); timer = null; }
    pending = null;
  }

  document.addEventListener('pointerdown', function (event) {
    if (open && !event.target.closest('.p-menu-touch')) hide();

    var host = event.target.closest ? event.target.closest('[data-p-context-menu]') : null;
    if (!host) return;
    /* Primary button only. A right press already raises contextmenu, and
       arming the timer there would reopen the menu half a second later. */
    if (event.button !== 0) return;

    pending = { host: host, x: event.clientX, y: event.clientY };
    timer = setTimeout(function () {
      if (!pending) return;
      show(pending.host, pending.x, pending.y);
      /* A mouse press still emits click on release; that click would land
         outside the menu and close what the press just opened. */
      swallowClick = true;
      pending = null;
      timer = null;
    }, HOLD_MS);
  });

  document.addEventListener('pointermove', function (event) {
    if (!pending) return;
    if (
      Math.abs(event.clientX - pending.x) > MOVE_TOLERANCE ||
      Math.abs(event.clientY - pending.y) > MOVE_TOLERANCE
    ) {
      cancelHold();
    }
  });

  document.addEventListener('pointerup', cancelHold);
  document.addEventListener('pointercancel', cancelHold);
  document.addEventListener('scroll', cancelHold, true);

  /* A pointer has no long press, so right-click stands in. */
  document.addEventListener('contextmenu', function (event) {
    var host = event.target.closest ? event.target.closest('[data-p-context-menu]') : null;
    if (!host || !menuFor(host)) return;
    event.preventDefault();
    show(host, event.clientX, event.clientY);
  });

  /* Keyboard: the context-menu key, or Shift+F10, on a focused host. */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      hide();
      return;
    }
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      var host = event.target.closest ? event.target.closest('[data-p-context-menu]') : null;
      if (!host || !menuFor(host)) return;
      event.preventDefault();
      show(host, null, null);
    }
  });

  /* Choosing an item closes the menu. */
  document.addEventListener('click', function (event) {
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    if (!open) return;
    if (event.target.closest('.p-menu__item')) hide();
    else if (!event.target.closest('.p-menu-touch')) hide();
  });

  window.PuppertinoContextMenus = { show: show, hide: hide };
})();
