/**
 * Puppertino v2 — date pickers.
 *
 * Builds the .p-calendar month grid (Monday-first, like the native
 * graphical NSDatePicker), wires prev/today/next navigation and day
 * selection, and dispatches a bubbling "p-change" CustomEvent with
 * {date} on selection. A .p-calendar-touch calendar is built the iOS
 * way instead: Sunday-first, full month name, SUN–SAT headers, no
 * days from the neighbouring months and only as many rows as the
 * month needs. No dependencies.
 */
(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS_TOUCH = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function isTouch(cal) {
    return cal.classList.contains('p-calendar-touch');
  }

  function build(cal) {
    var shown = cal._shown;
    var selected = cal._selected;
    var today = new Date();

    var touch = isTouch(cal);

    var title = cal.querySelector('.p-calendar-title');
    title.textContent = (touch ? MONTHS_LONG : MONTHS)[shown.getMonth()] + ' ' + shown.getFullYear();

    var grid = cal.querySelector('.p-calendar-grid');
    grid.textContent = '';

    var first = new Date(shown.getFullYear(), shown.getMonth(), 1);
    // Monday-first on macOS, Sunday-first on iOS.
    var lead = touch ? first.getDay() : (first.getDay() + 6) % 7;
    var start = new Date(first);
    start.setDate(1 - lead);
    var inMonth = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
    // iOS shows only the rows the month needs.
    var cells = touch ? Math.ceil((lead + inMonth) / 7) * 7 : 42;

    for (var i = 0; i < cells; i++) {
      var day = new Date(start);
      day.setDate(start.getDate() + i);
      var outside = day.getMonth() !== shown.getMonth();
      if (touch && outside) {
        var blank = document.createElement('span');
        blank.className = 'p-calendar-day p-calendar-blank';
        blank.setAttribute('aria-hidden', 'true');
        grid.appendChild(blank);
        continue;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'p-calendar-day';
      btn.textContent = day.getDate();
      if (touch) {
        btn.setAttribute('aria-label', WEEKDAYS_FULL[day.getDay()] + ', ' +
          MONTHS_LONG[day.getMonth()] + ' ' + day.getDate() + ', ' + day.getFullYear());
      }
      if (outside) btn.classList.add('p-outside');
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
    // A bare YYYY-MM-DD is read as a local date, not UTC midnight, so
    // the selected day doesn't slip back a day west of Greenwich.
    var ymd = initial && /^(\d{4})-(\d{2})-(\d{2})$/.exec(initial);
    var date = ymd ? new Date(+ymd[1], ymd[2] - 1, +ymd[3]) : initial ? new Date(initial) : new Date();
    if (isNaN(date)) date = new Date();
    cal._selected = initial ? date : null;
    cal._shown = new Date(date.getFullYear(), date.getMonth(), 1);

    if (!cal.querySelector('.p-calendar-header')) {
      var touch = isTouch(cal);
      cal.insertAdjacentHTML(
        'afterbegin',
        '<div class="p-calendar-header">' +
          '<span class="p-calendar-title" aria-live="polite"></span>' +
          (touch
            ? '<button type="button" class="p-calendar-nav" data-p-cal="prev" aria-label="Previous month"></button>' +
              '<button type="button" class="p-calendar-nav" data-p-cal="next" aria-label="Next month"></button>'
            : '<button type="button" class="p-calendar-nav" data-p-cal="prev" aria-label="Previous month">◀</button>' +
              '<button type="button" class="p-calendar-nav" data-p-cal="today" aria-label="Go to today">●</button>' +
              '<button type="button" class="p-calendar-nav" data-p-cal="next" aria-label="Next month">▶</button>') +
        '</div>' +
        '<div class="p-calendar-weekdays">' +
          (touch
            ? WEEKDAYS_TOUCH.map(function (d, n) {
                return '<abbr title="' + WEEKDAYS_FULL[n] + '">' + d + '</abbr>';
              }).join('')
            : WEEKDAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('')) +
        '</div>' +
        '<div class="p-calendar-grid"></div>'
      );
    }
    build(cal);
  }

  document.addEventListener('click', function (event) {
    var nav = event.target.closest('.p-calendar-nav');
    if (nav) {
      var cal = nav.closest('.p-calendar');
      var kind = nav.getAttribute('data-p-cal') ||
        (nav.hasAttribute('data-p-cal-prev') ? 'prev' : nav.hasAttribute('data-p-cal-next') ? 'next' : 'today');
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

  function init() {
    document.querySelectorAll('.p-calendar').forEach(initCalendar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
