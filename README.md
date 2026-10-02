
![Puppertino Stars](https://img.shields.io/github/stars/codedgar/puppertino?style=for-the-badge) ![Puppertino's contributors](https://img.shields.io/github/contributors/codedgar/puppertino?style=for-the-badge) [![npm version](https://img.shields.io/npm/v/@codedgar/puppertino?style=for-the-badge)](https://www.npmjs.com/package/@codedgar/puppertino) [![Follow Puppertino_css](https://img.shields.io/twitter/follow/Puppertino_css?style=for-the-badge)](https://twitter.com/Puppertino_css) [![Follow Codedgar_dev](https://img.shields.io/twitter/follow/codedgar_dev?style=for-the-badge)](https://twitter.com/codedgar_dev) [![Visit the creator's Website](https://img.shields.io/badge/Visit%20the%20Creator's%20Website-blue?style=for-the-badge&logo=undertale&logoColor=white)](https://codedgar.com/)
![Puppertino Logo](https://i.imgur.com/r81X3Yj.png)

# Puppertino Dachshund

Puppertino Dachshund is version 2.0 of Puppertino.

Puppertino brings the look of macOS and iOS to the web. It is a CSS framework that follows Apple's Human Interface Guidelines, with components for both pointer and touch.

It is plain CSS. There is no build step and there are no dependencies. Some components come with a small vanilla JavaScript helper, and each one is optional.

**[Read the documentation](https://codedgar.github.io/Puppertino/)**

## Quick start

Add one stylesheet to the `<head>` of your page.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@codedgar/puppertino@2.0.0/dist/css/puppertino.min.css">
```

Then write markup.

```html
<body class="p-type p-auto-dark-mode">
  <h1>Hello from Puppertino</h1>
  <button class="p-button p-button-primary">Get started</button>
</body>
```

`p-type` applies the type scale to headings and paragraphs. `p-auto-dark-mode` follows the system appearance.

## Install

### CDN

Three bundles ship. Each one includes the foundations: colors, typography, materials, and dark mode.

| Bundle | File | Contents |
|---|---|---|
| Full | `puppertino.min.css` | Every component |
| Desktop | `puppertino-desktop.min.css` | The macOS component set |
| Mobile | `puppertino-mobile.min.css` | The iOS and iPadOS component set |

All three live in the same folder.

```
https://cdn.jsdelivr.net/npm/@codedgar/puppertino@2.0.0/dist/css/
```

Pin the version in the URL, as above. A pinned link keeps rendering the same way when a new release ships.

### npm

```bash
npm install @codedgar/puppertino
```

```javascript
// Everything
import '@codedgar/puppertino'

// One platform
import '@codedgar/puppertino/desktop'
import '@codedgar/puppertino/mobile'

// One component, plus the colors it reads from
import '@codedgar/puppertino/colors'
import '@codedgar/puppertino/buttons'
```

The same paths work with `@import` in CSS.

### JavaScript helpers

The CSS works without JavaScript. Components that open, float, or drag have a helper in `src/js/`: menus, popovers, modals, sheets, sliders, date pickers, the Dock, and more. Each component page in the docs names the helper it needs.

```javascript
import '@codedgar/puppertino/js/menus.js'
import '@codedgar/puppertino/js/modals.js'
```

```html
<script src="https://cdn.jsdelivr.net/npm/@codedgar/puppertino@2.0.0/src/js/menus.js"></script>
```

## What's included

### Foundations

- **Colors.** Thirteen system accents, six text levels, five fills, and semantic backgrounds, each with light and dark values.
- **Typography.** Apple's text styles from Large Title to Caption 2, with weights and tracking.
- **Materials.** Five thicknesses of blur and translucency, elevation shadows, and Liquid Glass.
- **Layout.** Size classes, split views, containers, and readable width.

### Desktop components

Buttons, forms (text fields, selects, steppers, search fields, pop-up and pull-down buttons, combo boxes, checkboxes, radios, switches), segmented controls, sliders, disclosure controls, color wells, image wells, date pickers, menus, popovers, tooltips, modals, dialogs and sheets, notifications, windows, sidebars, toolbars, the menu bar and Dock, lists and tables, progress indicators, and scrollbars.

### Mobile components

Buttons, forms, color pickers, modals, action sheets, tab bars, navigation bars and toolbars, menus and popovers, sidebars, lists with swipe actions, notifications, empty states, and date pickers.

## Dark mode

| Class | What it does |
|---|---|
| `.p-auto-dark-mode` | Follows the system appearance |
| `.p-dark-mode` | Forces dark |
| `.p-light-mode` | Pins a region to light inside a dark page |

Put the class on `<body>`, or on any element to scope it. For a toggle that remembers the choice and syncs across tabs, load `darkmode_manager.js`.

```html
<script src="https://cdn.jsdelivr.net/npm/@codedgar/puppertino@2.0.0/src/js/darkmode_manager.js"></script>
<script>
  puppertinoThemeMan.init({ autoDetect: true });
</script>
```

## Accessibility

Puppertino responds to the system accessibility settings. Reduced motion turns off animated movement. Reduced transparency swaps blurred materials for opaque surfaces. Increased contrast strengthens borders and fills. Keyboard focus stays visible.

Materials fall back to an opaque surface in browsers without `backdrop-filter`.

## Coming from version 1

Every version 1 class still works. The version 2 stylesheets include the version 1 classes alongside the new ones, so upgrading does not require changes to your markup.

Pages that link `newfull.css` keep working too. That file is frozen as the complete version 1 stylesheet and will not change. For new work, use `puppertino.css` or `puppertino.min.css`.

The dark mode script was renamed from `dakmode_manager.js` to `darkmode_manager.js`. The old name still loads and will be removed in a future major version.

## For AI tools

The docs are also published as plain text, generated from the same sources as the site.

- [`llms.txt`](https://codedgar.github.io/Puppertino/llms.txt) is an index of every page.
- [`llms-full.txt`](https://codedgar.github.io/Puppertino/llms-full.txt) is the full documentation in one file, with an index of every class.

## Contributing

Contributions are welcome. Read the [contribution guidelines](https://github.com/codedgar/Puppertino/blob/master/CONTRIBUTING.md) first.

The CSS in `dist/css/` is written by hand, so edit those files directly. The three `.min.css` bundles are generated. Rebuild them with:

```bash
npm install
npm run build:css
```

To run the docs site locally:

```bash
cd docs-src
npm install
npm run dev
```

Found a bug, or missing a component? [Open an issue](https://github.com/codedgar/Puppertino/issues/new/choose).

## License

Puppertino is available under the [MIT license](https://github.com/codedgar/Puppertino/blob/master/LICENSE).

## About the creator

Puppertino is made by [Codedgar](https://codedgar.com/).
