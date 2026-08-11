/**
 * Puppertino v2 — menu bar session behavior.
 *
 * Menu opening/closing itself is menus.js (bar items are ordinary
 * data-p-menu triggers; menus.js keeps aria-expanded in sync, which is
 * what the capsule highlight styles against). This adds the macOS
 * "menu session": while one bar menu is open, hovering another item
 * switches to its menu, and Left/Right arrows walk the bar. Implemented
 * by forwarding a click to the hovered/target trigger so menus.js stays
 * the single owner of open state. No dependencies.
 */
(function () {
  'use strict';

  function barItems(bar) {
    return Array.prototype.slice.call(
      bar.querySelectorAll('.p-menubar-item[data-p-menu]')
    );
  }

  function openItem(bar) {
    return bar.querySelector('.p-menubar-item[aria-expanded="true"]');
  }

  document.addEventListener(
    'mouseover',
    function (event) {
      var item = event.target.closest('.p-menubar-item[data-p-menu]');
      if (!item) return;
      var bar = item.closest('.p-menubar');
      if (!bar) return;
      var current = openItem(bar);
      if (current && current !== item) {
        item.click();
      }
    },
    true
  );

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var bars = document.querySelectorAll('.p-menubar');
    for (var i = 0; i < bars.length; i++) {
      var current = openItem(bars[i]);
      if (!current) continue;
      var list = barItems(bars[i]);
      var index = list.indexOf(current);
      if (index === -1) continue;
      event.preventDefault();
      var next =
        event.key === 'ArrowRight'
          ? list[(index + 1) % list.length]
          : list[index <= 0 ? list.length - 1 : index - 1];
      next.click();
      return;
    }
  });
})();
