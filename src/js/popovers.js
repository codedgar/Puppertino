/**
 * Puppertino v2 — popovers.
 *
 * Opens .p-popover[data-p-popover-float] surfaces from trigger elements
 * marked data-p-popover="#popover-id". Placement comes from
 * data-p-popover-place on the popover (top | bottom | left | right,
 * default bottom = under the trigger), flips when it would overflow and
 * clamps to the viewport; the arrow tracks the trigger center. One
 * popover open at a time. Escape or an outside click closes it.
 * No dependencies.
 */
(function () {
  'use strict';

  // Arrow geometry per size. Pointer: a 35.44x10.5 arrow whose centre
  // stays 10px clear of the shoulder. Touch (.p-popover-touch): a 56x13
  // arrow whose centre never comes closer than 72px to a body edge,
  // which keeps it off the 38px corner.
  var POINTER = { arrow: 10.5, clamp: 17.72 + 10 };
  var TOUCH = { arrow: 13, clamp: 72 };
  var GAP = 6; // breathing room between the arrow tip and the trigger
  var MARGIN = 8; // viewport clamp inset
  var openPopover = null;
  var openTrigger = null;

  function measure(popover) {
    popover.style.visibility = 'hidden';
    popover.classList.add('active');
    var rect = popover.getBoundingClientRect();
    popover.classList.remove('active');
    popover.style.visibility = '';
    return rect;
  }

  // Keep the arrow centre `inset` from both ends of the edge; an edge
  // too short for that centres it.
  function clampArrow(pos, length, inset) {
    if (length < inset * 2) return length / 2;
    return Math.min(Math.max(pos, inset), length - inset);
  }

  function place(popover, trigger) {
    var rect = trigger.getBoundingClientRect();
    var size = measure(popover);
    var side = popover.getAttribute('data-p-popover-place') || 'bottom';
    var geo = popover.classList.contains('p-popover-touch') ? TOUCH : POINTER;
    var OFFSET = geo.arrow + GAP; // trigger edge to popover body edge

    // Flip when the preferred side has no room but the opposite does.
    if (side === 'bottom' && rect.bottom + OFFSET + size.height > window.innerHeight - MARGIN && rect.top - OFFSET - size.height > MARGIN) {
      side = 'top';
    } else if (side === 'top' && rect.top - OFFSET - size.height < MARGIN && rect.bottom + OFFSET + size.height < window.innerHeight - MARGIN) {
      side = 'bottom';
    } else if (side === 'right' && rect.right + OFFSET + size.width > window.innerWidth - MARGIN && rect.left - OFFSET - size.width > MARGIN) {
      side = 'left';
    } else if (side === 'left' && rect.left - OFFSET - size.width < MARGIN && rect.right + OFFSET + size.width < window.innerWidth - MARGIN) {
      side = 'right';
    }
    popover.setAttribute('data-p-popover-place', side);

    var top;
    var left;
    if (side === 'top' || side === 'bottom') {
      top = side === 'bottom' ? rect.bottom + OFFSET : rect.top - OFFSET - size.height;
      left = rect.left + rect.width / 2 - size.width / 2;
      left = Math.min(Math.max(left, MARGIN), window.innerWidth - size.width - MARGIN);
      var arrowX = rect.left + rect.width / 2 - left;
      arrowX = clampArrow(arrowX, size.width, geo.clamp);
      popover.style.setProperty('--p-popover-arrow-x', arrowX + 'px');
    } else {
      left = side === 'right' ? rect.right + OFFSET : rect.left - OFFSET - size.width;
      top = rect.top + rect.height / 2 - size.height / 2;
      top = Math.min(Math.max(top, MARGIN), window.innerHeight - size.height - MARGIN);
      var arrowY = rect.top + rect.height / 2 - top;
      arrowY = clampArrow(arrowY, size.height, geo.clamp);
      popover.style.setProperty('--p-popover-arrow-y', arrowY + 'px');
    }
    popover.style.top = Math.max(MARGIN, top) + 'px';
    popover.style.left = Math.max(MARGIN, left) + 'px';
  }

  function open(popover, trigger) {
    if (openPopover === popover) return;
    close();
    place(popover, trigger);
    popover.classList.add('active');
    if (trigger.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', 'true');
    }
    openPopover = popover;
    openTrigger = trigger;
    if (!popover.hasAttribute('tabindex')) {
      popover.setAttribute('tabindex', '-1');
    }
    popover.focus({ preventScroll: true });
  }

  function close(restoreFocus) {
    if (!openPopover) return;
    openPopover.classList.remove('active');
    if (openTrigger) {
      if (openTrigger.hasAttribute('aria-expanded')) {
        openTrigger.setAttribute('aria-expanded', 'false');
      }
      if (restoreFocus && typeof openTrigger.focus === 'function') openTrigger.focus();
    }
    openPopover = null;
    openTrigger = null;
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-p-popover]');
    if (trigger) {
      event.preventDefault();
      var popover = document.querySelector(trigger.getAttribute('data-p-popover'));
      if (!popover) return;
      if (openPopover === popover) {
        close(true);
      } else {
        open(popover, trigger);
      }
      return;
    }

    if (openPopover && !openPopover.contains(event.target)) {
      close();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!openPopover) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  });

  window.addEventListener('resize', function () {
    close();
  });

  // Fixed-positioned; page scroll would detach it from its trigger, so
  // close like menus do. Scrolling inside the popover stays allowed.
  window.addEventListener(
    'scroll',
    function (event) {
      if (openPopover && !(event.target instanceof Node && openPopover.contains(event.target))) {
        close();
      }
    },
    true
  );
})();
