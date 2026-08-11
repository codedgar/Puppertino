/**
 * Puppertino v2 — date pickers.
 *
 * Builds the .p-calendar month grid (Monday-first, like the native
 * graphical NSDatePicker), wires prev/today/next navigation and day
 * selection, and dispatches a bubbling "p-change" CustomEvent with
 * {date} on selection. Also drives .p-clock hands: static from
 * data-p-clock-time="9:41:00", or live with data-p-clock-live.
 * No dependencies.
 */
(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  function build(cal) {
    var shown = cal._shown;
    var selected = cal._selected;
    var today = new Date();

    var title = cal.querySelector('.p-calendar-title');
    title.textContent = MONTHS[shown.getMonth()] + ' ' + shown.getFullYear();

    var grid = cal.querySelector('.p-calendar-grid');
    grid.textContent = '';

    var first = new Date(shown.getFullYear(), shown.getMonth(), 1);
    var lead = (first.getDay() + 6) % 7; // Monday-first offset
    var start = new Date(first);
    start.setDate(1 - lead);

    for (var i = 0; i < 42; i++) {
      var day = new Date(start);
      day.setDate(start.getDate() + i);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'p-calendar-day';
      btn.textContent = day.getDate();
      if (day.getMonth() !== shown.getMonth()) btn.classList.add('p-outside');
      if (sameDay(day, today)) btn.classList.add('p-today');
      if (selected && sameDay(day, selected)) {
        btn.classList.remove('p-today');
        btn.classList.add('p-selected');
        btn.setAttribute('aria-pressed', 'true');
      }
      btn._date = day;
      grid.appendChild(btn);
    }
  }

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function initCalendar(cal) {
    if (cal._shown) return;
    var initial = cal.getAttribute('data-p-date');
    var date = initial ? new Date(initial) : new Date();
    if (isNaN(date)) date = new Date();
    cal._selected = initial ? date : null;
    cal._shown = new Date(date.getFullYear(), date.getMonth(), 1);

    if (!cal.querySelector('.p-calendar-header')) {
      cal.insertAdjacentHTML(
        'afterbegin',
        '<div class="p-calendar-header">' +
          '<span class="p-calendar-title"></span>' +
          '<button type="button" class="p-calendar-nav" data-p-cal="prev" aria-label="Previous month">◀</button>' +
          '<button type="button" class="p-calendar-nav" data-p-cal="today" aria-label="Go to today">●</button>' +
          '<button type="button" class="p-calendar-nav" data-p-cal="next" aria-label="Next month">▶</button>' +
        '</div>' +
        '<div class="p-calendar-weekdays">' +
          WEEKDAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('') +
        '</div>' +
        '<div class="p-calendar-grid" role="grid"></div>'
      );
    }
    build(cal);
  }

  document.addEventListener('click', function (event) {
    var nav = event.target.closest('.p-calendar-nav');
    if (nav) {
      var cal = nav.closest('.p-calendar');
      var kind = nav.getAttribute('data-p-cal');
      if (kind === 'prev') cal._shown.setMonth(cal._shown.getMonth() - 1);
      else if (kind === 'next') cal._shown.setMonth(cal._shown.getMonth() + 1);
      else {
        var now = new Date();
        cal._shown = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      build(cal);
      return;
    }
    var day = event.target.closest('.p-calendar-day');
    if (day && day._date) {
      var host = day.closest('.p-calendar');
      host._selected = day._date;
      build(host);
      host.dispatchEvent(
        new CustomEvent('p-change', { bubbles: true, detail: { date: day._date } })
      );
    }
  });

  // ---- clocks ----

  function setHands(clock, h, m, s) {
    clock.style.setProperty('--p-clock-h', ((h % 12) + m / 60) / 12);
    clock.style.setProperty('--p-clock-m', (m + s / 60) / 60);
    clock.style.setProperty('--p-clock-s', s / 60);
    var mer = clock.querySelector('.p-clock-meridiem');
    if (mer) mer.textContent = h < 12 ? 'AM' : 'PM';
  }

  function initClock(clock) {
    if (clock._init) return;
    clock._init = true;
    if (!clock.querySelector('.p-clock-num')) {
      var html = '';
      for (var n = 1; n <= 12; n++) {
        html += '<span class="p-clock-num" style="--p-clock-n:' + n + '">' + n + '</span>';
      }
      html +=
        '<span class="p-clock-meridiem">AM</span>' +
        '<span class="p-clock-hand p-hour"></span>' +
        '<span class="p-clock-hand p-minute"></span>' +
        '<span class="p-clock-hand p-second"></span>';
      clock.insertAdjacentHTML('beforeend', html);
    }
    var live = clock.hasAttribute('data-p-clock-live');
    if (live) {
      var tick = function () {
        var now = new Date();
        setHands(clock, now.getHours(), now.getMinutes(), now.getSeconds());
      };
      tick();
      setInterval(tick, 1000);
    } else {
      var parts = (clock.getAttribute('data-p-clock-time') || '10:09:30').split(':');
      setHands(clock, +parts[0] || 0, +parts[1] || 0, +parts[2] || 0);
    }
  }

  function init() {
    document.querySelectorAll('.p-calendar').forEach(initCalendar);
    document.querySelectorAll('.p-clock').forEach(initClock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
