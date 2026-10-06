/**
 * Puppertino v2 — menus.
 *
 * Opens .p-menu[data-p-menu-float] surfaces from trigger elements marked
 * data-p-menu="#menu-id". The menu is positioned under the trigger (flips
 * above when it would overflow, clamps to the viewport). Containers marked
 * data-p-context-menu="#menu-id" replace the native right-click menu with
 * theirs, opened at the pointer. One menu open at a time. Escape or an
 * outside click closes it; arrow keys move through items; activating an
 * item flashes it macOS-style, then closes. No dependencies.
 */
(function () {
  'use strict';

  var openMenu = null;
  var openTrigger = null;

  function items(menu) {
    return Array.prototype.filter.call(
      menu.querySelectorAll('.p-menu__item'),
      function (item) {
        return (
          !item.disabled &&
          item.getAttribute('aria-disabled') !== 'true' &&
          item.closest('.p-menu') === menu
        );
      }
    );
  }

  function measure(menu) {
    menu.style.visibility = 'hidden';
    menu.classList.add('active');
    var menuRect = menu.getBoundingClientRect();
    menu.classList.remove('active');
    menu.style.visibility = '';
    return menuRect;
  }

  function position(menu, trigger) {
    var rect = trigger.getBoundingClientRect();
    var menuRect = measure(menu);

    var top = rect.bottom + 4;
    if (top + menuRect.height > window.innerHeight - 8 && rect.top - 4 - menuRect.height > 8) {
      top = rect.top - 4 - menuRect.height;
    }
    var left = Math.min(rect.left, window.innerWidth - menuRect.width - 8);
    menu.style.top = Math.max(8, top) + 'px';
    menu.style.left = Math.max(8, left) + 'px';
  }

  function positionAt(menu, x, y) {
    var menuRect = measure(menu);
    var top = y;
    if (top + menuRect.height > window.innerHeight - 8) {
      top = y - menuRect.height;
    }
    var left = Math.min(x, window.innerWidth - menuRect.width - 8);
    menu.style.top = Math.max(8, top) + 'px';
    menu.style.left = Math.max(8, left) + 'px';
  }

  function show(menu, trigger) {
    menu.classList.add('active');
    if (trigger && trigger.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', 'true');
    }
    openMenu = menu;
    openTrigger = trigger || null;
    // Focus the surface, not the first item — macOS opens menus with
    // nothing preselected. Arrow keys highlight from there.
    if (!menu.hasAttribute('tabindex')) {
      menu.setAttribute('tabindex', '-1');
    }
    menu.focus({ preventScroll: true });
  }

  function open(menu, trigger) {
    if (openMenu === menu) return;
    close();
    position(menu, trigger);
    show(menu, trigger);
  }

  function openAt(menu, x, y, trigger) {
    close();
    positionAt(menu, x, y);
    show(menu, trigger);
  }

  function close(restoreFocus) {
    if (!openMenu) return;
    openMenu.classList.remove('active');
    openMenu.querySelectorAll('.p-menu.active').forEach(function (sub) {
      sub.classList.remove('active');
    });
    if (openTrigger) {
      if (openTrigger.hasAttribute('aria-expanded')) {
        openTrigger.setAttribute('aria-expanded', 'false');
      }
      if (restoreFocus && typeof openTrigger.focus === 'function') openTrigger.focus();
    }
    openMenu = null;
    openTrigger = null;
  }

  function activate(item) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      close();
      return;
    }
    // macOS selection blink: flash off, back on, then close.
    item.classList.add('is-pressed');
    setTimeout(function () {
      item.classList.remove('is-pressed');
      setTimeout(function () {
        close();
      }, 70);
    }, 70);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-p-menu]');
    if (trigger) {
      event.preventDefault();
      var menu = document.querySelector(trigger.getAttribute('data-p-menu'));
      if (!menu) return;
      if (openMenu === menu) {
        close(true);
      } else {
        open(menu, trigger);
      }
      return;
    }

    var item = event.target.closest('.p-menu__item');
    if (item && openMenu && openMenu.contains(item)) {
      if (item.disabled || item.getAttribute('aria-disabled') === 'true') return;
      if (item.closest('.p-menu__subwrap') && item.parentElement.querySelector('.p-menu')) {
        return; // submenu triggers only reveal their submenu
      }
      activate(item);
      return;
    }

    if (openMenu && !openMenu.contains(event.target)) {
      close();
    }
  });

  document.addEventListener('contextmenu', function (event) {
    if (openMenu && openMenu.contains(event.target)) {
      event.preventDefault();
      return;
    }
    var host = event.target.closest('[data-p-context-menu]');
    if (!host) return;
    var menu = document.querySelector(host.getAttribute('data-p-context-menu'));
    if (!menu) return;
    event.preventDefault();
    openAt(menu, event.clientX, event.clientY, host);
  });

  document.addEventListener('keydown', function (event) {
    if (!openMenu) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }

    var list = items(openMenu);
    if (list.length === 0) return;
    var index = list.indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      list[(index + 1) % list.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      list[index <= 0 ? list.length - 1 : index - 1].focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      list[0].focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      list[list.length - 1].focus();
    } else if (event.key === 'Tab') {
      close();
    }
  });

  window.addEventListener('resize', function () {
    close();
  });

  // The menu is fixed-positioned; page scroll would detach it from its
  // trigger. macOS closes menus on scroll, so do the same. Scrolling inside
  // the menu itself stays allowed.
  window.addEventListener(
    'scroll',
    function (event) {
      if (openMenu && !(event.target instanceof Node && openMenu.contains(event.target))) {
        close();
      }
    },
    true
  );
})();
