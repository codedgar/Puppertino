/**
 * Puppertino v2 — colour picker.
 *
 * Wires .p-color-picker: switches between the Grid, Spectrum, and
 * Sliders panels, fills Apple's 12 x 10 colour grid, reads a colour out
 * of the spectrum field, keeps the channel sliders and their value
 * fields in step, saves the current colour from the "+" swatch, and
 * publishes the result on the preview and every swatch.
 *
 * Markup contract:
 *   .p-color-picker                     the panel
 *     [data-p-color-panel="grid"]       a panel, shown when its mode
 *                                       radio is checked
 *     .p-segment > input[value="grid"]  the mode control
 *     .p-color-picker__palette          the 12 x 10 grid; filled with
 *                                       .p-color-cell buttons when empty
 *     .p-color-swatch[data-p-color]     picks that colour
 *     .p-color-swatch-add               saves the current colour
 *     .p-color-picker__spectrum         click or drag to pick
 *     .p-color-slider[data-p-channel]   r | g | b | a
 *     .p-color-picker__value[data-p-channel]
 *     .p-color-picker__preview
 *
 * Emits a `p-color-change` CustomEvent on the panel, with
 * detail = { r, g, b, a, hex, rgba }. No dependencies.
 */
(function () {
  'use strict';

  function clamp(n, lo, hi) {
    return n < lo ? lo : n > hi ? hi : n;
  }

  function toHex(n) {
    var s = Math.round(clamp(n, 0, 255)).toString(16);
    return s.length === 1 ? '0' + s : s;
  }

  /* HSV in, RGB out. Hue 0-360, saturation and value 0-1. */
  function hsvToRgb(h, s, v) {
    var c = v * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = v - c;
    var p = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][
      Math.floor((h % 360) / 60)
    ];
    return { r: (p[0] + m) * 255, g: (p[1] + m) * 255, b: (p[2] + m) * 255 };
  }

  function parse(value) {
    if (!value) return null;
    var v = value.trim();
    var m = v.match(/^#?([0-9a-f]{6})$/i);
    if (m) {
      var n = parseInt(m[1], 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    m = v.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      var parts = m[1].split(',').map(parseFloat);
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }
    return null;
  }

  function css(c) {
    return 'rgba(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ', ' + c.a + ')';
  }

  /* Apple's grid: a white-to-black ramp, then eleven hue columns (plus a
     green) from dark to light. Row-major, 12 per row. */
  var PALETTE = [
    'FEFFFE', 'EBEBEB', 'D6D6D6', 'C2C2C2', 'ADADAD', '999999', '858585', '707070', '5C5C5C', '474747', '333333', '000000',
    '00374A', '011D57', '11053B', '2E063D', '3C071B', '5C0701', '5A1C00', '583300', '563D00', '666100', '4F5504', '263E0F',
    '004D65', '012F7B', '1A0A52', '450D59', '551029', '831100', '7B2900', '7A4A00', '785800', '8D8602', '6F760A', '38571A',
    '016E8F', '0042A9', '2C0977', '61187C', '791A3D', 'B51A00', 'AD3E00', 'A96800', 'A67B01', 'C4BC00', '9BA50E', '4E7A27',
    '008CB4', '0056D6', '371A94', '7A219E', '99244F', 'E22400', 'DA5100', 'D38301', 'D19D01', 'F5EC00', 'C3D117', '669D34',
    '00A1D8', '0061FD', '4D22B2', '982ABC', 'B92D5D', 'FF4015', 'FF6A00', 'FFAB01', 'FCC700', 'FEFB41', 'D9EC37', '76BB40',
    '01C7FC', '3A87FD', '5E30EB', 'BE38F3', 'E63B7A', 'FE6250', 'FE8648', 'FEB43F', 'FECB3E', 'FFF76B', 'E4EF65', '96D35F',
    '52D6FC', '74A7FF', '864FFD', 'D357FE', 'EE719E', 'FF8C82', 'FEA57D', 'FEC777', 'FED977', 'FFF994', 'EAF28F', 'B1DD8B',
    '93E3FC', 'A7C6FF', 'B18CFE', 'E292FE', 'F4A4C0', 'FFB5AF', 'FFC5AB', 'FED9A8', 'FDE4A8', 'FFFBB9', 'F1F7B7', 'CDE8B5',
    'CBF0FF', 'D2E2FE', 'D8C9FE', 'EFCAFE', 'F9D3E0', 'FFDAD8', 'FFE2D6', 'FEECD4', 'FEF1D5', 'FDFBDD', 'F6FADB', 'DEEED4'
  ];
  var COLUMNS = 12;

  function fillPalette(palette) {
    if (palette.children.length) return;
    palette.setAttribute('role', 'listbox');
    if (!palette.hasAttribute('aria-label')) palette.setAttribute('aria-label', 'Colors');
    for (var i = 0; i < PALETTE.length; i++) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'p-color-cell';
      cell.setAttribute('role', 'option');
      cell.setAttribute('aria-selected', 'false');
      cell.setAttribute('aria-label', '#' + PALETTE[i]);
      cell.setAttribute('data-p-color', '#' + PALETTE[i]);
      cell.style.setProperty('--p-color-swatch', '#' + PALETTE[i]);
      cell.tabIndex = i === 0 ? 0 : -1;
      palette.appendChild(cell);
    }
  }

  /* One tab stop for the whole grid: arrows move between cells. */
  function rove(palette, cell) {
    var cells = palette.querySelectorAll('.p-color-cell');
    for (var i = 0; i < cells.length; i++) cells[i].tabIndex = cells[i] === cell ? 0 : -1;
  }

  /* Current colour per panel, so a picker can be read back later. */
  var state = new WeakMap();

  function current(panel) {
    return state.get(panel) || { r: 0, g: 136, b: 255, a: 1 };
  }

  function publish(panel, colour) {
    state.set(panel, colour);
    var value = css(colour);
    var hex = '#' + toHex(colour.r) + toHex(colour.g) + toHex(colour.b);

    var preview = panel.querySelector('.p-color-picker__preview');
    if (preview) preview.style.setProperty('--p-color-swatch', value);

    var dot = panel.querySelector('.p-color-picker__dot');
    if (dot) dot.style.setProperty('--p-color-swatch', value);

    /* Sliders and their readouts, unless the person is typing in one. */
    var channels = { r: colour.r, g: colour.g, b: colour.b, a: colour.a };
    var inputs = panel.querySelectorAll('[data-p-channel]');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var ch = el.getAttribute('data-p-channel');
      if (!(ch in channels)) continue;
      if (el === document.activeElement) continue;
      if (el.classList.contains('p-color-slider')) {
        el.value = ch === 'a' ? Math.round(channels.a * 100) : Math.round(channels[ch]);
      } else {
        el.value = ch === 'a' ? Math.round(channels.a * 100) + '%' : String(Math.round(channels[ch]));
      }
    }

    /* The opacity track ramps to the opaque colour. */
    var alpha = panel.querySelector('.p-color-slider[data-p-channel="a"]');
    if (alpha) {
      alpha.style.setProperty(
        '--p-color-track',
        'transparent 12%, rgb(' + Math.round(colour.r) + ',' + Math.round(colour.g) + ',' + Math.round(colour.b) + ') 88%'
      );
    }

    panel.dispatchEvent(
      new CustomEvent('p-color-change', {
        bubbles: true,
        detail: { r: Math.round(colour.r), g: Math.round(colour.g), b: Math.round(colour.b), a: colour.a, hex: hex, rgba: value }
      })
    );
  }

  /* Swatches are toggle buttons, so aria-pressed is set on all of them
     rather than only on the ones that already carried the attribute.
     Otherwise selecting a swatch that had no attribute leaves the whole
     group with nothing pressed. */
  function markSelected(panel, swatch) {
    var all = panel.querySelectorAll('.p-color-swatch:not(.p-color-swatch-add), .p-color-cell');
    for (var i = 0; i < all.length; i++) {
      var on = all[i] === swatch;
      all[i].classList.toggle('p-selected', on);
      if (all[i].getAttribute('role') !== 'option') {
        all[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      } else {
        all[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }
  }

  /* ─── Mode switching ─────────────────────────────────────────────── */

  function showPanel(picker, mode) {
    var panels = picker.querySelectorAll('[data-p-color-panel]');
    for (var i = 0; i < panels.length; i++) {
      panels[i].hidden = panels[i].getAttribute('data-p-color-panel') !== mode;
    }
  }

  document.addEventListener('change', function (event) {
    var input = event.target;
    if (!input || !input.closest) return;
    var picker = input.closest('.p-color-picker');
    if (!picker) return;
    if (input.matches('.p-segment > input[type="radio"]')) {
      showPanel(picker, input.value);
    }
  });

  /* ─── Swatches ───────────────────────────────────────────────────── */

  document.addEventListener('click', function (event) {
    if (!event.target.closest) return;

    /* "+" saves the current colour as a new swatch before it. */
    var add = event.target.closest('.p-color-swatch-add');
    if (add) {
      var host = add.closest('.p-color-picker');
      if (!host) return;
      var c = current(host);
      var saved = document.createElement('button');
      saved.type = 'button';
      saved.className = 'p-color-swatch';
      saved.setAttribute('data-p-color', css(c));
      saved.setAttribute('aria-label', 'Saved color ' + css(c));
      saved.style.setProperty('--p-color-swatch', css(c));
      add.parentNode.insertBefore(saved, add);
      markSelected(host, saved);
      return;
    }

    var swatch = event.target.closest('.p-color-swatch, .p-color-cell');
    if (!swatch) return;
    var picker = swatch.closest('.p-color-picker');
    if (swatch.classList.contains('p-color-cell')) {
      var pal = swatch.closest('.p-color-picker__palette');
      if (pal) rove(pal, swatch);
    }
    var colour = parse(swatch.getAttribute('data-p-color')) ||
      parse(getComputedStyle(swatch).getPropertyValue('--p-color-swatch'));
    if (!colour) return;
    if (picker) {
      markSelected(picker, swatch);
      publish(picker, colour);
    }
  });

  document.addEventListener('keydown', function (event) {
    var cell = event.target.closest ? event.target.closest('.p-color-cell') : null;
    if (!cell) return;
    var palette = cell.closest('.p-color-picker__palette');
    if (!palette) return;
    var cells = Array.prototype.slice.call(palette.querySelectorAll('.p-color-cell'));
    var i = cells.indexOf(cell);
    var next = i;
    switch (event.key) {
      case 'ArrowRight': next = i + 1; break;
      case 'ArrowLeft': next = i - 1; break;
      case 'ArrowDown': next = i + COLUMNS; break;
      case 'ArrowUp': next = i - COLUMNS; break;
      case 'Home': next = i - (i % COLUMNS); break;
      case 'End': next = i - (i % COLUMNS) + COLUMNS - 1; break;
      default: return;
    }
    if (next < 0 || next >= cells.length) return;
    event.preventDefault();
    rove(palette, cells[next]);
    cells[next].focus();
  });

  /* ─── Spectrum ───────────────────────────────────────────────────── */
  /* Hue runs across, and the vertical axis is white at the top through
     the pure hue at the middle to black at the bottom, matching how the
     field is painted in CSS. */

  function pickFromSpectrum(field, clientX, clientY) {
    var rect = field.getBoundingClientRect();
    var x = clamp((clientX - rect.left) / rect.width, 0, 1);
    var y = clamp((clientY - rect.top) / rect.height, 0, 1);
    var hue = x * 360;
    var colour;
    if (y <= 0.5) {
      colour = hsvToRgb(hue, y * 2, 1);
    } else {
      colour = hsvToRgb(hue, 1, 1 - (y - 0.5) * 2);
    }
    var picker = field.closest('.p-color-picker');
    var alpha = picker ? current(picker).a : 1;
    colour.a = alpha;

    var dot = field.querySelector('.p-color-picker__dot');
    if (dot) {
      dot.style.setProperty('--p-color-x', x * 100 + '%');
      dot.style.setProperty('--p-color-y', y * 100 + '%');
    }
    if (picker) publish(picker, colour);
  }

  var dragging = null;

  document.addEventListener('pointerdown', function (event) {
    var field = event.target.closest ? event.target.closest('.p-color-picker__spectrum') : null;
    if (!field) return;
    dragging = field;
    field.setPointerCapture && field.setPointerCapture(event.pointerId);
    pickFromSpectrum(field, event.clientX, event.clientY);
  });

  document.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    event.preventDefault();
    pickFromSpectrum(dragging, event.clientX, event.clientY);
  });

  document.addEventListener('pointerup', function () {
    dragging = null;
  });

  document.addEventListener('pointercancel', function () {
    dragging = null;
  });

  /* ─── Channel sliders and value fields ───────────────────────────── */

  function readChannels(picker) {
    var colour = { r: current(picker).r, g: current(picker).g, b: current(picker).b, a: current(picker).a };
    var sliders = picker.querySelectorAll('.p-color-slider[data-p-channel]');
    for (var i = 0; i < sliders.length; i++) {
      var ch = sliders[i].getAttribute('data-p-channel');
      var n = parseFloat(sliders[i].value);
      if (isNaN(n)) continue;
      colour[ch] = ch === 'a' ? clamp(n / 100, 0, 1) : clamp(n, 0, 255);
    }
    return colour;
  }

  document.addEventListener('input', function (event) {
    var el = event.target;
    if (!el || !el.closest) return;
    var picker = el.closest('.p-color-picker');
    if (!picker) return;

    if (el.matches('.p-color-slider[data-p-channel]')) {
      publish(picker, readChannels(picker));
      return;
    }

    if (el.matches('.p-color-picker__value[data-p-channel]')) {
      var ch = el.getAttribute('data-p-channel');
      var n = parseFloat(String(el.value).replace('%', ''));
      if (isNaN(n)) return;
      var colour = current(picker);
      var next = { r: colour.r, g: colour.g, b: colour.b, a: colour.a };
      next[ch] = ch === 'a' ? clamp(n / 100, 0, 1) : clamp(n, 0, 255);
      publish(picker, next);
    }
  });

  /* ─── Start ──────────────────────────────────────────────────────── */

  function init() {
    var pickers = document.querySelectorAll('.p-color-picker');
    var palettes = document.querySelectorAll('.p-color-picker__palette');
    for (var p = 0; p < palettes.length; p++) fillPalette(palettes[p]);

    for (var i = 0; i < pickers.length; i++) {
      var picker = pickers[i];
      var checked = picker.querySelector('.p-segment > input[type="radio"]:checked');
      if (checked) showPanel(picker, checked.value);
      var selected = picker.querySelector(
        '.p-color-cell.p-selected, .p-color-swatch.p-selected, .p-color-swatch[aria-pressed="true"]'
      );
      /* A picker can name its starting grid colour: data-p-color="#BE38F3". */
      var named = picker.getAttribute('data-p-color');
      if (!selected && named) {
        var match = picker.querySelector('.p-color-cell[data-p-color="' + named.toUpperCase() + '"]');
        if (match) {
          selected = match;
          markSelected(picker, match);
          rove(match.parentNode, match);
        }
      }
      var start =
        (selected && (parse(selected.getAttribute('data-p-color')) ||
          parse(getComputedStyle(selected).getPropertyValue('--p-color-swatch')))) ||
        parse(getComputedStyle(picker.querySelector('.p-color-picker__preview') || picker)
          .getPropertyValue('--p-color-swatch'));
      if (start) publish(picker, start);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PuppertinoColorPickers = {
    init: init,
    get: function (picker) { return current(picker); },
    set: function (picker, value) {
      var colour = parse(value);
      if (colour) publish(picker, colour);
    }
  };
})();
