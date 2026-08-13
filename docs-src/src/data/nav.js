/* Single source of truth for the docs information architecture.
   The sidebar (Doc.astro), the docs index, and the three hub pages
   all render from this structure — edit here, everything follows.
   Slugs are relative to the site base; anchor children point at
   sections inside a parent page. */

export const nav = [
  {
    heading: 'Foundations',
    hub: 'docs/foundations/',
    tint: 'tile-foundations',
    icon: 'ph-stack',
    groups: [
      {
        items: [
          { label: 'Getting started', slug: 'docs/getting-started/', icon: 'ph-rocket-launch' },
          { label: 'Materials', slug: 'docs/materials/', icon: 'ph-drop' },
          { label: 'Colors', slug: 'docs/colors/', icon: 'ph-palette' },
          { label: 'Typography', slug: 'docs/typography/', icon: 'ph-text-aa' },
          { label: 'Dark mode', slug: 'docs/dark-mode/', icon: 'ph-moon' },
          { label: 'Icons', slug: 'docs/icons/', icon: 'ph-smiley' },
        ],
      },
    ],
  },
  {
    heading: 'Mobile components',
    hub: 'docs/mobile/',
    tint: 'tile-mobile',
    icon: 'ph-device-mobile',
    groups: [
      {
        heading: 'Controls & input',
        note: 'The controls that collect decisions, sized for fingers.',
        items: [
          { label: 'Buttons', slug: 'docs/mobile/buttons/', icon: 'ph-hand-tap' },
          { label: 'Forms', slug: 'docs/mobile/forms/', icon: 'ph-textbox' },
        ],
      },
      {
        heading: 'Presentation & navigation',
        note: 'Surfaces that take over the screen and the tabs that move between them.',
        items: [
          { label: 'Modals', slug: 'docs/mobile/modals/', icon: 'ph-browser' },
          { label: 'Actions', slug: 'docs/mobile/actions/', icon: 'ph-list' },
          { label: 'Tabs', slug: 'docs/mobile/tabs/', icon: 'ph-tabs' },
        ],
      },
    ],
  },
  {
    heading: 'Desktop components',
    hub: 'docs/desktop/',
    tint: 'tile-desktop',
    icon: 'ph-monitor',
    groups: [
      {
        heading: 'Controls & input',
        note: 'The controls that collect decisions: press, type, pick, and adjust.',
        items: [
          { label: 'Buttons', slug: 'docs/desktop/buttons/', icon: 'ph-cursor-click' },
          {
            label: 'Forms',
            slug: 'docs/desktop/forms/',
            icon: 'ph-text-indent',
            children: [
              { label: 'Text fields', anchor: '#text-field', icon: 'ph-textbox' },
              { label: 'Search fields', anchor: '#search-field', icon: 'ph-magnifying-glass' },
              { label: 'Combo boxes', anchor: '#combo-box', icon: 'ph-caret-circle-down' },
              { label: 'Pop-up & pull-down', anchor: '#pop-up-and-pull-down-buttons', icon: 'ph-caret-up-down' },
              { label: 'Toggles', anchor: '#switch', icon: 'ph-toggle-right' },
              { label: 'Steppers', anchor: '#stepper', icon: 'ph-caret-up-down' },
            ],
          },
          { label: 'Segmented controls', slug: 'docs/desktop/segmented-controls/', icon: 'ph-squares-four' },
          { label: 'Sliders', slug: 'docs/desktop/sliders/', icon: 'ph-sliders-horizontal' },
          { label: 'Disclosure controls', slug: 'docs/desktop/disclosure-controls/', icon: 'ph-caret-circle-down' },
          { label: 'Color wells', slug: 'docs/desktop/color-wells/', icon: 'ph-palette' },
          { label: 'Image wells', slug: 'docs/desktop/image-wells/', icon: 'ph-image-square' },
          { label: 'Date pickers', slug: 'docs/desktop/date-pickers/', icon: 'ph-calendar' },
        ],
      },
      {
        heading: 'Menus & overlays',
        note: 'Surfaces that appear above the page: menus, popovers, dialogs, and alerts.',
        items: [
          { label: 'Menus', slug: 'docs/desktop/menus/', icon: 'ph-list' },
          { label: 'Popovers', slug: 'docs/desktop/popovers/', icon: 'ph-chat-centered' },
          { label: 'Tooltips', slug: 'docs/desktop/tooltips/', icon: 'ph-cursor' },
          { label: 'Modals', slug: 'docs/desktop/modals/', icon: 'ph-app-window' },
          {
            label: 'Dialogs & sheets',
            slug: 'docs/desktop/dialogs/',
            icon: 'ph-frame-corners',
            children: [
              { label: 'Sheets', anchor: '#sheets' },
            ],
          },
          { label: 'Notifications', slug: 'docs/desktop/notifications/', icon: 'ph-bell' },
        ],
      },
      {
        heading: 'App structure',
        note: 'The chrome of a macOS-style app: windows, sidebars, toolbars, and the menu bar and dock.',
        items: [
          { label: 'Windows', slug: 'docs/desktop/windows/', icon: 'ph-browser' },
          { label: 'Sidebars', slug: 'docs/desktop/sidebars/', icon: 'ph-sidebar' },
          { label: 'Toolbars', slug: 'docs/desktop/toolbars/', icon: 'ph-wrench' },
          {
            label: 'Menu bar & Dock',
            slug: 'docs/desktop/menu-bar-dock/',
            icon: 'ph-rows-plus-bottom',
            children: [
              { label: 'Menu bar', anchor: '#anatomy-menu-bar' },
              { label: 'Dock', anchor: '#anatomy-dock' },
            ],
          },
        ],
      },
      {
        heading: 'Content & status',
        note: 'Presenting data and communicating what the app is doing.',
        items: [
          { label: 'Lists & tables', slug: 'docs/desktop/lists-tables/', icon: 'ph-table' },
          { label: 'Progress indicators', slug: 'docs/desktop/progress-indicators/', icon: 'ph-spinner-gap' },
          { label: 'Scrollbars', slug: 'docs/desktop/scrollbars/', icon: 'ph-mouse-scroll' },
        ],
      },
    ],
  },
];
