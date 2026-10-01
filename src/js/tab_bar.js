/**
 * Puppertino v2 — iOS tab bar behaviour.
 *
 * Optional. The tab bar (.p-tab-bar in tabs.css) is links and needs no
 * script. This adds the two things iOS does on top:
 *
 * 1. Minimize on scroll. Give the bar, or the .p-tab-bar-group around
 *    it, data-p-minimize="scroll". Scrolling down past 44px collapses
 *    it to a 48px circle holding the selected tab (.p-tab-bar-minimized);
 *    scrolling back up, tapping it, or tabbing into it expands it again.
 *    By default the page scroll is watched; point data-p-minimize-target
 *    at a selector to watch a scrolling pane instead.
 *
 * 2. In-page selection. When the tabs are <button>s rather than links,
 *    a click moves aria-current to the pressed tab, and a tab with
 *    aria-controls="panel-id" shows that panel and hides its siblings.
 *
 * The collapse is a layout change, not decoration, so it still happens
 * with reduced motion on; tabs.css drops its settle animation there.
 */
(function () {
  'use strict';

  var MINIMIZED = 'p-tab-bar-minimized';
  var THRESHOLD = 44; // px scrolled before the bar may collapse
  var DELTA = 8; // px of movement that counts as a direction

  function scrollTop(source) {
    return source === window
      ? window.pageYOffset || document.documentElement.scrollTop
      : source.scrollTop;
  }

  function watch(host) {
    if (host.__pTabBar) return;
    host.__pTabBar = true;

    var selector = host.getAttribute('data-p-minimize-target');
    var source = selector ? document.querySelector(selector) : window;
    if (!source) return;

    var last = scrollTop(source);
    var ticking = false;

    function set(minimized) {
      if (host.classList.contains(MINIMIZED) === minimized) return;
      host.classList.toggle(MINIMIZED, minimized);
    }

    function update() {
      ticking = false;
      var now = scrollTop(source);
      if (now <= THRESHOLD) set(false);
      else if (now - last > DELTA) set(true);
      else if (last - now > DELTA) set(false);
      else return; // too small to call a direction; keep the baseline
      last = now;
    }

    source.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    // A tap on the collapsed bar expands it instead of following the
    // selected tab's link, which is the page already open.
    host.addEventListener('click', function (event) {
      if (!host.classList.contains(MINIMIZED)) return;
      if (!event.target.closest('.p-tab-bar')) return;
      event.preventDefault();
      set(false);
    }, true);

    // Keyboard users land on a bar with every tab showing. A tap also
    // focuses the tab before its click, so only keyboard focus counts.
    host.addEventListener('focusin', function (event) {
      var keyboard = true;
      try { keyboard = event.target.matches(':focus-visible'); } catch (e) {}
      if (keyboard) set(false);
    });
  }

  function select(tab) {
    var bar = tab.closest('.p-tab-bar');
    if (!bar) return;
    var tabs = bar.querySelectorAll('.p-tab-bar__tab');
    for (var i = 0; i < tabs.length; i++) {
      var other = tabs[i];
      var on = other === tab;
      if (on) other.setAttribute('aria-current', 'page');
      else other.removeAttribute('aria-current');
      var id = other.getAttribute('aria-controls');
      var panel = id && document.getElementById(id);
      if (panel) panel.hidden = !on;
    }
  }

  document.addEventListener('click', function (event) {
    var tab = event.target.closest && event.target.closest('button.p-tab-bar__tab');
    if (!tab || tab.closest('.' + MINIMIZED)) return;
    select(tab);
  });

  function init(root) {
    var hosts = (root || document).querySelectorAll('[data-p-minimize="scroll"]');
    for (var i = 0; i < hosts.length; i++) watch(hosts[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  window.PuppertinoTabBar = {
    init: init,
    minimize: function (host) { host.classList.add(MINIMIZED); },
    expand: function (host) { host.classList.remove(MINIMIZED); },
    select: select
  };
})();
