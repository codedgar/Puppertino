/**
 * Puppertino v2 — dock.
 *
 * Magnification and launch bounce for .p-dock. Magnification is opt-in
 * via data-p-dock-magnify and uses Plank's curves (elementary OS) with
 * real box growth:
 *
 *   offset = min(|cursor - restCenter|, R)     R = zoomed icon size
 *   zoom   = 1 + (1 - (offset/R)^2) * (M - 1)  parabolic falloff
 *
 * Sizes are written as real box dimensions (--p-dock-icon per item)
 * rather than transform scale, so flex layout pushes neighbors, the
 * platter stretches, and everything repaints at true size (Chromium
 * stretches the cached rest-size raster, so scaled icons pixelate).
 * Distances are measured against STATIC rest centers (mapped through
 * the platter's center anchor), never live rects — live measurement
 * feeds layout back into the math and jitters. M ramps 0 -> full over
 * ~150ms on enter and back
 * on leave (Plank's zoom_in_progress), so nothing snaps. The launch
 * bounce animates the icon's child so both effects compose. Disabled
 * under prefers-reduced-motion. No dependencies.
 */
(function () {
  'use strict';

  var MAG = 2; // max zoom factor (36px -> 72px)
  var ZOOM_TIME = 150; // ms for the enter/leave ramp

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var docks = new WeakMap();

  function state(dock) {
    var s = docks.get(dock);
    if (!s) {
      s = {
        items: [],
        centers: [],
        restSize: 36,
        restWidth: 0,
        cursorClientX: 0,
        progress: 0,
        target: 0,
        lastTime: 0,
        raf: 0,
      };
      docks.set(dock, s);
    }
    return s;
  }

  // Rest geometry from layout offsets at true rest.
  function measure(dock, s) {
    s.items = Array.prototype.slice.call(dock.querySelectorAll('.p-dock-item'));
    s.centers = s.items.map(function (item) {
      return item.offsetLeft + item.offsetWidth / 2;
    });
    s.restSize = s.items.length ? s.items[0].offsetWidth : 36;
    s.restWidth = dock.offsetWidth;
  }

  function apply(dock, s) {
    var m = 1 + (MAG - 1) * s.progress;
    var range = s.restSize * MAG;
    // Map the live cursor into rest coordinates. The platter grows
    // around its center (centered flex / .p-dock-fixed), so the rest
    // origin is the live center minus half the rest width.
    var rect = dock.getBoundingClientRect();
    var restLeft = rect.left + rect.width / 2 - s.restWidth / 2;
    var cursorX = s.cursorClientX - restLeft;
    s.items.forEach(function (item, i) {
      if (m <= 1.001) {
        item.style.removeProperty('--p-dock-icon');
        return;
      }
      var offset = Math.min(Math.abs(cursorX - s.centers[i]), range);
      var op = offset / range;
      var zoom = 1 + (1 - op * op) * (m - 1);
      item.style.setProperty(
        '--p-dock-icon',
        Math.round(s.restSize * zoom) + 'px'
      );
    });
  }

  function tick(dock, now) {
    var s = state(dock);
    var dt = s.lastTime ? now - s.lastTime : 16;
    s.lastTime = now;
    var step = dt / ZOOM_TIME;
    if (s.progress < s.target) s.progress = Math.min(s.target, s.progress + step);
    else if (s.progress > s.target) s.progress = Math.max(s.target, s.progress - step);
    apply(dock, s);
    if (s.progress !== s.target) {
      s.raf = requestAnimationFrame(function (t) {
        tick(dock, t);
      });
    } else {
      s.raf = 0;
      s.lastTime = 0;
    }
  }

  function ramp(dock, target) {
    var s = state(dock);
    s.target = target;
    if (!s.raf) {
      s.raf = requestAnimationFrame(function (t) {
        tick(dock, t);
      });
    }
  }

  document.addEventListener('mouseenter', function (event) {
    var dock =
      event.target instanceof Element &&
      event.target.closest &&
      event.target.closest('.p-dock[data-p-dock-magnify]');
    if (!dock || event.target !== dock || reducedMotion()) return;
    var s = state(dock);
    // Only (re)measure at true rest — mid-ramp layout is grown and
    // would poison the rest geometry.
    if (s.progress === 0) measure(dock, s);
    ramp(dock, 1);
  }, true);

  document.addEventListener('mousemove', function (event) {
    var dock = event.target.closest && event.target.closest('.p-dock[data-p-dock-magnify]');
    if (!dock || reducedMotion()) return;
    var s = state(dock);
    if (!s.items.length) measure(dock, s);
    s.cursorClientX = event.clientX;
    s.target = 1;
    if (!s.raf) apply(dock, s);
    // Keep the label glued to the hovered item's (moving) center.
    var item = event.target.closest('.p-dock-item');
    var el = dock.querySelector('.p-dock-label.active');
    if (item && el) {
      var d = dock.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      el.style.left = r.left + r.width / 2 - d.left + 'px';
    }
  });

  document.addEventListener('mouseleave', function (event) {
    var dock =
      event.target instanceof Element &&
      event.target.closest &&
      event.target.closest('.p-dock[data-p-dock-magnify]');
    if (dock && event.target === dock) {
      ramp(dock, 0);
    }
  }, true);

  // App-name label (native dock behavior): one shared .p-dock-label per
  // platter, filled from the hovered item's aria-label and centered
  // above it. Positioning reads the live rect — fine here, the label
  // never feeds back into the magnification math.
  function label(dock) {
    var el = dock.querySelector('.p-dock-label');
    if (!el) {
      el = document.createElement('div');
      el.className = 'p-dock-label';
      el.setAttribute('aria-hidden', 'true');
      dock.appendChild(el);
    }
    return el;
  }

  document.addEventListener('mouseover', function (event) {
    var item = event.target.closest && event.target.closest('.p-dock .p-dock-item');
    if (!item) return;
    var dock = item.closest('.p-dock');
    var text = item.getAttribute('aria-label') || item.getAttribute('data-p-label');
    var el = label(dock);
    if (!text) {
      el.classList.remove('active');
      return;
    }
    el.textContent = text;
    var d = dock.getBoundingClientRect();
    var r = item.getBoundingClientRect();
    el.style.left = r.left + r.width / 2 - d.left + 'px';
    el.classList.add('active');
  });

  document.addEventListener('mouseout', function (event) {
    var item = event.target.closest && event.target.closest('.p-dock .p-dock-item');
    if (!item) return;
    if (item.contains(event.relatedTarget)) return;
    var el = item.closest('.p-dock').querySelector('.p-dock-label');
    if (el && !(event.relatedTarget && event.relatedTarget.closest('.p-dock-item'))) {
      el.classList.remove('active');
    }
  });

  document.addEventListener('click', function (event) {
    var item = event.target.closest('.p-dock .p-dock-item');
    if (!item || reducedMotion()) return;
    if (item.classList.contains('p-bouncing')) return;
    item.classList.add('p-bouncing');
    item.addEventListener(
      'animationend',
      function () {
        item.classList.remove('p-bouncing');
      },
      { once: true }
    );
  });
})();
