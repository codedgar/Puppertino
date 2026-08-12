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
          { label: 'Getting Started', slug: 'docs/getting-started/', icon: 'ph-rocket-launch' },
          { label: 'Materials', slug: 'docs/materials/', icon: 'ph-drop' },
          { label: 'Colors', slug: 'docs/colors/', icon: 'ph-palette' },
          { label: 'Typography', slug: 'docs/typography/', icon: 'ph-text-aa' },
          { label: 'Dark Mode', slug: 'docs/dark-mode/', icon: 'ph-moon' },
          { label: 'Icons', slug: 'docs/icons/', icon: 'ph-smiley' },
        ],
      },
    ],
  },
  {
    heading: 'Mobile Components',
    hub: 'docs/mobile/',
    tint: 'tile-mobile',
    icon: 'ph-device-mobile',
    groups: [
      {
        heading: 'Controls & Input',
        note: 'The controls that collect decisions, sized for fingers.',
        items: [
          { label: 'Buttons', slug: 'docs/mobile/buttons/', icon: 'ph-hand-tap' },
          { label: 'Forms', slug: 'docs/mobile/forms/', icon: 'ph-textbox' },
        ],
      },
      {
        heading: 'Presentation & Navigation',
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
    heading: 'Desktop Components',
    hub: 'docs/desktop/',
    tint: 'tile-desktop',
    icon: 'ph-monitor',
    groups: [
      {
        heading: 'Controls & Input',
        note: 'The controls that collect decisions: press, type, pick, and adjust.',
        items: [
          { label: 'Buttons', slug: 'docs/desktop/buttons/', icon: 'ph-cursor-click' },
          {
            label: 'Forms',
            slug: 'docs/desktop/forms/',
            icon: 'ph-text-indent',
            children: [
              { label: 'Text Fields', anchor: '#text-field' },
              { label: 'Search Fields', anchor: '#search-field' },
              { label: 'Combo Boxes', anchor: '#combo-box' },
              { label: 'Pop-up & Pull-down', anchor: '#pop-up-and-pull-down-buttons' },
              { label: 'Toggles', anchor: '#switch' },
              { label: 'Steppers', anchor: '#stepper' },
            ],
          },
          { label: 'Segmented Controls', slug: 'docs/desktop/segmented-controls/', icon: 'ph-squares-four' },
          { label: 'Sliders', slug: 'docs/desktop/sliders/', icon: 'ph-sliders-horizontal' },
          { label: 'Disclosure Controls', slug: 'docs/desktop/disclosure-controls/', icon: 'ph-caret-circle-down' },
          { label: 'Color Wells', slug: 'docs/desktop/color-wells/', icon: 'ph-palette' },
          { label: 'Image Wells', slug: 'docs/desktop/image-wells/', icon: 'ph-image-square' },
          { label: 'Date Pickers', slug: 'docs/desktop/date-pickers/', icon: 'ph-calendar' },
        ],
      },
      {
        heading: 'Menus & Overlays',
        note: 'Surfaces that appear above the page: menus, popovers, dialogs, and alerts.',
        items: [
          { label: 'Menus', slug: 'docs/desktop/menus/', icon: 'ph-list' },
          { label: 'Popovers', slug: 'docs/desktop/popovers/', icon: 'ph-chat-centered' },
          { label: 'Tooltips', slug: 'docs/desktop/tooltips/', icon: 'ph-cursor' },
          { label: 'Modals', slug: 'docs/desktop/modals/', icon: 'ph-app-window' },
          { label: 'Dialogs & Sheets', slug: 'docs/desktop/dialogs/', icon: 'ph-frame-corners' },
          { label: 'Notifications', slug: 'docs/desktop/notifications/', icon: 'ph-bell' },
        ],
      },
      {
        heading: 'App Structure',
        note: 'The chrome of a macOS-style app: windows, sidebars, toolbars, and the menu bar and dock.',
        items: [
          { label: 'Windows', slug: 'docs/desktop/windows/', icon: 'ph-browser' },
          { label: 'Sidebars', slug: 'docs/desktop/sidebars/', icon: 'ph-sidebar' },
          { label: 'Toolbars', slug: 'docs/desktop/toolbars/', icon: 'ph-wrench' },
          { label: 'Menu Bar & Dock', slug: 'docs/desktop/menu-bar-dock/', icon: 'ph-rows-plus-bottom' },
        ],
      },
      {
        heading: 'Content & Status',
        note: 'Presenting data and communicating what the app is doing.',
        items: [
          { label: 'Lists & Tables', slug: 'docs/desktop/lists-tables/', icon: 'ph-table' },
          { label: 'Progress Indicators', slug: 'docs/desktop/progress-indicators/', icon: 'ph-spinner-gap' },
          { label: 'Scrollbars', slug: 'docs/desktop/scrollbars/', icon: 'ph-mouse-scroll' },
        ],
      },
    ],
  },
];
