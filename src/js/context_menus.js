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
 * The menu is positioned near the press and clamped to the viewport.
 * Escape, an outside tap, or choosing an item closes it. Right-click
 * opens it too, since a pointer has no long press. No dependencies.
 */
(function () {
  'use strict';

  var HOLD_MS = 500;
  var MOVE_TOLERANCE = 10; /* a scroll must not open a menu */
  var GAP = 8;

  var timer = null;
  var pending = null;
  var open = null;
  var lastTrigger = null;

  function menuFor(host) {
    var selector = host.getAttribute('data-p-context-menu');
    if (!selector) return null;
    try { return document.querySelector(selector); } catch (e) { return null; }
  }

  function place(menu, x, y) {
    menu.hidden = false;
    menu.style.position = 'fixed';
    menu.style.margin = '0';
    var rect = menu.getBoundingClientRect();
    var left = Math.min(Math.max(GAP, x), window.innerWidth - rect.width - GAP);
    var top = y + GAP;
    if (top + rect.height > window.innerHeight - GAP) {
      top = Math.max(GAP, y - rect.height - GAP);
    }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.zIndex = '100';
  }

  function show(host, x, y) {
    var menu = menuFor(host);
    if (!menu) return;
    hide();
    lastTrigger = document.activeElement;
    place(menu, x, y);
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
    if (event.pointerType === 'mouse') return; /* mouse uses contextmenu */

    pending = { host: host, x: event.clientX, y: event.clientY };
    timer = setTimeout(function () {
      if (!pending) return;
      show(pending.host, pending.x, pending.y);
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
      var r = host.getBoundingClientRect();
      show(host, r.left, r.top + r.height / 2);
    }
  });

  /* Choosing an item closes the menu. */
  document.addEventListener('click', function (event) {
    if (!open) return;
    if (event.target.closest('.p-menu__item')) hide();
    else if (!event.target.closest('.p-menu-touch')) hide();
  });

  window.PuppertinoContextMenus = { show: show, hide: hide };
})();
